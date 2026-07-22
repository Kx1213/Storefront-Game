import { get, onValue, ref, serverTimestamp, set, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { db } from "./firebase.js";
import { getLevelCount, getMove, getMoves } from "./game-data.js?v=20260722-animation-perf2";
import {
  buildMonster,
  buildPlayer,
  createAttractSession,
  formatGameCode,
  getGameId,
  getLobbyEntries,
  getOrCreatePlayerId,
  getOrderedPlayers,
  hpPercent,
  listCharacters,
  sanitizeGameId
} from "./shared.js?v=20260722-animation-perf2";

const $ = (id) => document.getElementById(id);
const panels = {
  join: $("joinPanel"),
  lobby: $("lobbyPanel"),
  character: $("characterPanel"),
  battle: $("battlePanel"),
  waiting: $("waitingPanel"),
  gameOver: $("gameOverPanel")
};
const elements = {
  joinForm: $("joinForm"),
  manualGameId: $("manualGameId"),
  connection: $("phoneConnection"),
  controllerGameCode: $("controllerGameCode"),
  phoneLobbySlots: $("phoneLobbySlots"),
  lobbyPhoneMessage: $("lobbyPhoneMessage"),
  startSoloButton: $("startSoloButton"),
  characterGrid: $("characterGrid"),
  selectedCharacterCard: $("selectedCharacterCard"),
  selectedCharacterArt: $("selectedCharacterArt"),
  selectedCharacterName: $("selectedCharacterName"),
  selectedCharacterTitle: $("selectedCharacterTitle"),
  selectedCharacterHp: $("selectedCharacterHp"),
  selectedCharacterAtk: $("selectedCharacterAtk"),
  selectedCharacterMoves: $("selectedCharacterMoves"),
  confirmCharacterButton: $("confirmCharacterButton"),
  phoneMode: $("phoneMode"),
  phoneTeamStatus: $("phoneTeamStatus"),
  phoneEnemyName: $("phoneEnemyName"),
  phoneEnemyHpBar: $("phoneEnemyHpBar"),
  phoneEnemyHpText: $("phoneEnemyHpText"),
  phoneTurn: $("phoneTurn"),
  movePrompt: $("movePrompt"),
  phoneRoundMessage: $("phoneRoundMessage"),
  moveGrid: $("moveGrid"),
  phoneWinnerText: $("phoneWinnerText"),
  phoneGameOverMessage: $("phoneGameOverMessage"),
  playAgainButton: $("playAgainButton")
};

let gameId = getGameId(null);
let playerId = null;
let sessionRef = null;
let unsubscribe = null;
let selectedCharacterId = null;
let latestState = null;

function showPanel(panelName) {
  Object.entries(panels).forEach(([name, panel]) => {
    panel.hidden = name !== panelName;
  });
}

function setConnection(label, online = false) {
  elements.connection.textContent = label;
  elements.connection.classList.toggle("online", online);
}

function effectText(fighter) {
  const effects = fighter?.effects || {};
  const parts = [];

  if (fighter?.shield > 0) parts.push(`Shield ${fighter.shield}`);
  if (effects.attackUpTurns > 0) parts.push("Attack up");
  if (effects.attackDownTurns > 0) parts.push("Attack down");
  if (effects.damageReductionTurns > 0) parts.push("Guarded");
  if (effects.defenseDownTurns > 0) parts.push("Defense down");
  if (effects.regenTurns > 0) parts.push("Regenerating");
  if (effects.burnTurns > 0) parts.push("Burning");
  if (effects.tauntTurns > 0) parts.push("Taunting");

  return parts.join(" / ") || "No active effects.";
}

function renderCharacterCards() {
  elements.characterGrid.innerHTML = "";

  listCharacters().forEach((character) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "character-card";
    button.style.setProperty("--fighter-color", character.color);
    button.style.setProperty("--fighter-accent", character.accent);
    button.innerHTML = `
      <img src="${character.asset}" alt="${character.name}">
      <span>${character.title}</span>
      <strong>${character.name}</strong>
      <small>HP ${character.maxHp} / ATK ${character.atk}</small>
    `;
    button.addEventListener("click", () => selectCharacter(character.id));
    elements.characterGrid.append(button);
  });
}

function selectCharacter(characterId) {
  selectedCharacterId = characterId;
  const character = listCharacters().find((item) => item.id === characterId);

  if (!character) {
    return;
  }

  elements.selectedCharacterCard.hidden = false;
  elements.selectedCharacterArt.src = character.asset;
  elements.selectedCharacterArt.alt = character.name;
  elements.selectedCharacterName.textContent = character.name;
  elements.selectedCharacterTitle.textContent = character.title;
  elements.selectedCharacterHp.textContent = character.maxHp;
  elements.selectedCharacterAtk.textContent = character.atk;
  elements.selectedCharacterMoves.textContent = getMoves(character.moves).map((move) => move.name).join(", ");
}

function renderLobby(state) {
  showPanel("lobby");
  setConnection("Online", true);
  const entries = getLobbyEntries(state);
  const isInLobby = entries.some((entry) => entry.id === playerId);

  elements.phoneLobbySlots.innerHTML = "";
  [0, 1].forEach((slot) => {
    const entry = entries.find((item) => Number(item.slot) === slot);
    const slotNode = document.createElement("div");
    slotNode.className = `phone-lobby-slot ${entry ? "filled" : ""}`;
    slotNode.innerHTML = `
      <span>Player ${slot + 1}</span>
      <strong>${entry ? entry.label || "Joined" : "Open"}</strong>
    `;
    elements.phoneLobbySlots.append(slotNode);
  });

  elements.lobbyPhoneMessage.textContent = isInLobby
    ? "You are in. Start alone now, or wait for another player to enter the code."
    : "This battle lobby is full. Please wait for the next reset.";
  elements.startSoloButton.disabled = !isInLobby;
}

function renderCharacterSelect(state) {
  showPanel("character");
  setConnection("Online", true);

  const lobbyEntry = state?.lobby?.[playerId];
  selectedCharacterId = lobbyEntry?.characterId || selectedCharacterId;
  if (selectedCharacterId) {
    selectCharacter(selectedCharacterId);
  } else {
    elements.selectedCharacterCard.hidden = true;
  }
}

function renderTeamStatus(players) {
  elements.phoneTeamStatus.innerHTML = "";
  players.forEach((player) => {
    const item = document.createElement("article");
    item.className = `phone-fighter-strip ${player.id === playerId ? "self" : ""}`;
    item.innerHTML = `
      <img src="${player.asset}" alt="${player.name}">
      <div>
        <span>${player.id === playerId ? "You" : `Player ${Number(player.slot || 0) + 1}`}</span>
        <strong>${player.name}</strong>
        <div class="hp-track"><div class="hp-fill" style="width:${hpPercent(player)}%"></div></div>
        <small>${player.hp}/${player.maxHp} HP</small>
      </div>
    `;
    elements.phoneTeamStatus.append(item);
  });
}

function renderMoveButtons(state, self) {
  const ownMoveLocked = Boolean(state.pendingMoves?.[playerId]);
  const isLocked = state.status !== "battle" || ownMoveLocked || self.hp <= 0;
  elements.moveGrid.innerHTML = "";

  self.moves.forEach((moveId) => {
    const move = getMove(moveId);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "move-button";
    button.disabled = isLocked;
    button.innerHTML = `
      <strong>${move.name}</strong>
      <span>${move.description}</span>
    `;
    button.addEventListener("click", () => submitMove(move.id));
    elements.moveGrid.append(button);
  });
}

function renderBattle(state) {
  const players = getOrderedPlayers(state);
  const self = state.players?.[playerId];

  if (!self) {
    showPanel("waiting");
    setConnection("Watching", true);
    return;
  }

  showPanel("battle");
  setConnection("Online", true);
  renderTeamStatus(players);

  elements.phoneMode.textContent = state.mode === "multiplayer" ? "Co-op Mode" : "Solo Mode";
  elements.phoneTurn.textContent = `Turn ${state.turn || 1}`;
  elements.phoneEnemyName.textContent = state.monster?.name || "Monster";
  elements.phoneEnemyHpBar.style.width = `${hpPercent(state.monster)}%`;
  elements.phoneEnemyHpText.textContent = `${state.monster?.hp || 0} / ${state.monster?.maxHp || 0}`;

  if (state.status === "resolving") {
    elements.movePrompt.textContent = "Resolving";
    elements.phoneRoundMessage.textContent = "Watch the big screen.";
  } else if (state.status === "level-complete") {
    elements.movePrompt.textContent = "Level cleared";
    elements.phoneRoundMessage.textContent = "The next monster is coming.";
  } else if (state.pendingMoves?.[playerId]) {
    elements.movePrompt.textContent = "Move sent";
    elements.phoneRoundMessage.textContent = "Locked in. Wait for the other player or watch the big screen.";
  } else if (self.hp <= 0) {
    elements.movePrompt.textContent = "You are down";
    elements.phoneRoundMessage.textContent = "Your teammate may still finish the fight.";
  } else {
    elements.movePrompt.textContent = "Choose Your Move!";
    elements.phoneRoundMessage.textContent = `${effectText(self)} Monster: ${effectText(state.monster)}`;
  }

  renderMoveButtons(state, self);
}

function renderGameOver(state) {
  showPanel("gameOver");
  setConnection("Complete", true);
  const playersWon = state.winner === "players";
  elements.phoneWinnerText.textContent = playersWon ? "You won!" : "You lost";
  elements.phoneGameOverMessage.textContent = playersWon
    ? `Your curry party cleared all ${getLevelCount(state.mode || "solo")} levels.`
    : "The monster won. Try a different character combination.";
}

function renderWaiting() {
  showPanel("waiting");
  setConnection("Busy", true);
}

function render(state) {
  latestState = state;

  if (!gameId) {
    showPanel("join");
    return;
  }

  elements.controllerGameCode.textContent = formatGameCode(gameId);

  if (!state) {
    showPanel("lobby");
    return;
  }

  if (state.status === "attract" || state.status === "lobby") {
    renderLobby(state);
    return;
  }

  if (state.status === "character-select") {
    const entries = getLobbyEntries(state);
    const isParticipant = entries.some((entry) => entry.id === playerId);
    if (!isParticipant) {
      renderWaiting();
      return;
    }

    renderCharacterSelect(state);
    return;
  }

  if (state.status === "battle" || state.status === "resolving" || state.status === "level-complete") {
    renderBattle(state);
    return;
  }

  if (state.status === "game-over") {
    renderGameOver(state);
    return;
  }

  renderWaiting();
}

function findOpenSlot(state) {
  const entries = getLobbyEntries(state);
  const usedSlots = new Set(entries.map((entry) => Number(entry.slot)));
  return [0, 1].find((slot) => !usedSlots.has(slot));
}

async function ensureSession() {
  const snapshot = await get(sessionRef);
  if (snapshot.exists()) {
    return snapshot.val();
  }

  const session = createAttractSession(gameId, null, serverTimestamp());
  await set(sessionRef, session);
  return session;
}

async function joinLobby() {
  if (!sessionRef || !playerId) {
    return;
  }

  const state = await ensureSession();

  if (["battle", "resolving", "level-complete"].includes(state.status)) {
    return;
  }

  const existingEntry = state.lobby?.[playerId];
  const slot = existingEntry ? Number(existingEntry.slot) : findOpenSlot(state);

  if (slot === undefined) {
    return;
  }

  const nextLobby = {
    ...(state.lobby || {}),
    [playerId]: {
      id: playerId,
      slot,
      label: `Player ${slot + 1}`,
      joinedAt: Date.now(),
      characterId: existingEntry?.characterId || null,
      confirmed: Boolean(existingEntry?.confirmed)
    }
  };
  const joinedCount = Object.keys(nextLobby).length;

  await update(sessionRef, {
    status: joinedCount >= 2 ? "character-select" : "lobby",
    mode: joinedCount >= 2 ? "multiplayer" : state.mode || null,
    lobby: nextLobby,
    lastActionAt: serverTimestamp()
  });
}

async function startSolo() {
  if (!sessionRef) {
    return;
  }

  const snapshot = await get(sessionRef);
  const state = snapshot.val();

  if (!state?.lobby?.[playerId]) {
    return;
  }

  await update(sessionRef, {
    status: "character-select",
    mode: "solo",
    lobby: {
      [playerId]: {
        ...state.lobby[playerId],
        slot: 0
      }
    },
    lastActionAt: serverTimestamp()
  });
}

async function confirmCharacter() {
  if (!sessionRef || !selectedCharacterId) {
    return;
  }

  const snapshot = await get(sessionRef);
  const state = snapshot.val();
  const ownEntry = state?.lobby?.[playerId];

  if (!ownEntry || state.status !== "character-select") {
    return;
  }

  const nextLobby = {
    ...(state.lobby || {}),
    [playerId]: {
      ...ownEntry,
      characterId: selectedCharacterId,
      confirmed: true
    }
  };
  const entries = Object.values(nextLobby);
  const expectedCount = state.mode === "multiplayer" ? 2 : 1;
  const readyEntries = entries
    .filter((entry) => entry.confirmed && entry.characterId)
    .sort((a, b) => Number(a.slot || 0) - Number(b.slot || 0))
    .slice(0, expectedCount);

  if (readyEntries.length < expectedCount) {
    await update(sessionRef, {
      lobby: nextLobby,
      lastActionAt: serverTimestamp()
    });
    return;
  }

  const players = Object.fromEntries(
    readyEntries.map((entry, index) => {
      const player = buildPlayer(entry.characterId, entry.id, index);
      return [entry.id, player];
    })
  );
  const playerOrder = readyEntries.map((entry) => entry.id);
  const monster = buildMonster(state.mode, 0);
  const log = [
    `${readyEntries.length === 2 ? "Two players" : "One player"} entered ${state.mode === "multiplayer" ? "co-op" : "solo"} mode.`,
    `${monster.name} enters the battle.`
  ];

  await update(sessionRef, {
    status: "battle",
    lobby: nextLobby,
    activePlayerIds: playerOrder,
    playerOrder,
    players,
    monster,
    levelIndex: 0,
    turn: 1,
    pendingMoves: {},
    activeMoves: {},
    roundResult: {
      messages: log,
      createdAt: Date.now()
    },
    winner: null,
    log,
    battleStartedAt: serverTimestamp(),
    lastActionAt: serverTimestamp()
  });
}

async function submitMove(moveId) {
  if (!sessionRef) {
    return;
  }

  const snapshot = await get(sessionRef);
  const state = snapshot.val();

  if (!state || state.status !== "battle" || !state.players?.[playerId] || state.pendingMoves?.[playerId]) {
    return;
  }

  const token = `${playerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await update(sessionRef, {
    [`pendingMoves/${playerId}`]: {
      moveId,
      playerId,
      token,
      createdAt: serverTimestamp()
    },
    lastActionAt: serverTimestamp()
  });
}

async function playAgain() {
  if (!sessionRef) {
    return;
  }

  await set(sessionRef, createAttractSession(gameId, null, serverTimestamp()));
  await joinLobby();
}

function connect(nextGameId) {
  gameId = sanitizeGameId(nextGameId);

  if (!gameId) {
    showPanel("join");
    return;
  }

  window.localStorage.setItem("storefront-last-game", gameId);
  playerId = getOrCreatePlayerId(gameId);
  sessionRef = ref(db, `sessions/${gameId}`);
  elements.controllerGameCode.textContent = formatGameCode(gameId);

  if (unsubscribe) {
    unsubscribe();
  }

  unsubscribe = onValue(sessionRef, (snapshot) => {
    render(snapshot.val());
  }, (error) => {
    console.error(error);
    setConnection("Offline", false);
  });

  joinLobby().catch((error) => {
    console.error(error);
    setConnection("Offline", false);
  });
}

function boot() {
  renderCharacterCards();
  elements.joinForm.addEventListener("submit", (event) => {
    event.preventDefault();
    connect(elements.manualGameId.value);
    window.history.replaceState({}, "", `?gameId=${encodeURIComponent(gameId)}`);
  });
  elements.startSoloButton.addEventListener("click", startSolo);
  elements.confirmCharacterButton.addEventListener("click", confirmCharacter);
  elements.playAgainButton.addEventListener("click", playAgain);

  if (!gameId) {
    elements.manualGameId.value = window.localStorage.getItem("storefront-last-game") || "";
    showPanel("join");
    setConnection("Offline", false);
    return;
  }

  connect(gameId);
}

boot();
