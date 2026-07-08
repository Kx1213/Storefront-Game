import { get, onValue, ref, serverTimestamp, set, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { db } from "./firebase.js";
import { getMove, getMoves } from "./game-data.js";
import {
  buildEnemy,
  buildJoinUrl,
  buildPlayer,
  formatGameCode,
  getGameId,
  getOrCreatePlayerId,
  hpPercent,
  listCharacters,
  sanitizeGameId
} from "./shared.js";

const $ = (id) => document.getElementById(id);
const panels = {
  join: $("joinPanel"),
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
  characterHint: $("characterHint"),
  characterGrid: $("characterGrid"),
  phonePlayerName: $("phonePlayerName"),
  phonePlayerHpBar: $("phonePlayerHpBar"),
  phonePlayerHpText: $("phonePlayerHpText"),
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

function showPanel(panelName) {
  Object.entries(panels).forEach(([name, panel]) => {
    panel.hidden = name !== panelName;
  });
}

function setConnection(label, online = false) {
  elements.connection.textContent = label;
  elements.connection.classList.toggle("online", online);
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
      <small>${character.maxHp} HP</small>
      <em>${getMoves(character.moves).map((move) => move.name).join(" / ")}</em>
    `;
    button.addEventListener("click", () => chooseCharacter(character.id));
    elements.characterGrid.append(button);
  });
}

function renderHp(prefix, fighter) {
  $(`${prefix}HpBar`).style.width = `${hpPercent(fighter)}%`;
  $(`${prefix}HpText`).textContent = `${fighter.hp} / ${fighter.maxHp}`;
}

function renderMoveButtons(state) {
  const isLocked = state.status !== "battle" || Boolean(state.pendingMove);
  elements.moveGrid.innerHTML = "";

  state.player.moves.forEach((moveId) => {
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
  showPanel("battle");
  setConnection("Online", true);
  elements.phonePlayerName.textContent = state.player.name;
  elements.phoneEnemyName.textContent = state.enemy.name;
  renderHp("phonePlayer", state.player);
  renderHp("phoneEnemy", state.enemy);
  elements.phoneTurn.textContent = `Turn ${state.turn || 1}`;

  if (state.status === "resolving") {
    elements.movePrompt.textContent = "Resolving";
    elements.phoneRoundMessage.textContent = "Watch the big screen.";
  } else if (state.pendingMove) {
    elements.movePrompt.textContent = "Move sent";
    elements.phoneRoundMessage.textContent = "Locked in. Watch the big screen.";
  } else {
    elements.movePrompt.textContent = "Choose your move";
    elements.phoneRoundMessage.textContent = state.roundResult?.messages?.at(-1) || "Pick the next action.";
  }

  renderMoveButtons(state);
}

function renderGameOver(state) {
  showPanel("gameOver");
  const playerWon = state.winner === "player";
  elements.phoneWinnerText.textContent = playerWon ? "You won" : "You lost";
  elements.phoneGameOverMessage.textContent = playerWon
    ? "Nice finish. Start another battle when ready."
    : "The rival won this round. Try a different character or move order.";
}

function renderWaiting() {
  showPanel("waiting");
  setConnection("Busy", true);
}

function renderCharacterSelect(state) {
  showPanel("character");
  setConnection(state ? "Online" : "Ready", Boolean(state));
  elements.controllerGameCode.textContent = formatGameCode(gameId);
  elements.characterHint.textContent = state?.status === "game-over"
    ? "Choose a character for the next battle."
    : "Your choice appears on the big screen.";
}

function render(state) {
  if (!gameId) {
    showPanel("join");
    return;
  }

  const ownsBattle = state?.activePlayerId === playerId;

  if ((state?.status === "battle" || state?.status === "resolving") && !ownsBattle) {
    renderWaiting();
    return;
  }

  if ((state?.status === "battle" || state?.status === "resolving") && ownsBattle) {
    renderBattle(state);
    return;
  }

  if (state?.status === "game-over" && ownsBattle) {
    renderGameOver(state);
    return;
  }

  renderCharacterSelect(state);
}

async function chooseCharacter(characterId) {
  if (!sessionRef) {
    return;
  }

  const snapshot = await get(sessionRef);
  const state = snapshot.val();
  const battleIsTaken = (state?.status === "battle" || state?.status === "resolving")
    && state.activePlayerId
    && state.activePlayerId !== playerId;

  if (battleIsTaken) {
    renderWaiting();
    return;
  }

  const player = buildPlayer(characterId, playerId);
  const enemy = buildEnemy();
  const log = [`${player.name} stepped up.`, `${enemy.name} is ready.`];

  await set(sessionRef, {
    gameId,
    joinUrl: state?.joinUrl || buildJoinUrl(gameId),
    status: "battle",
    activePlayerId: playerId,
    player,
    enemy,
    turn: 1,
    pendingMove: null,
    activeMove: null,
    roundResult: {
      messages: log,
      createdAt: Date.now()
    },
    winner: null,
    log,
    createdAt: state?.createdAt || serverTimestamp(),
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

  if (!state || state.status !== "battle" || state.activePlayerId !== playerId || state.pendingMove) {
    return;
  }

  const token = `${playerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await update(sessionRef, {
    pendingMove: {
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

  await update(sessionRef, {
    status: "attract",
    activePlayerId: null,
    player: null,
    enemy: null,
    turn: 0,
    pendingMove: null,
    activeMove: null,
    roundResult: null,
    winner: null,
    log: ["Waiting for the next challenger."],
    lastActionAt: serverTimestamp()
  });
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
}

function boot() {
  renderCharacterCards();
  elements.joinForm.addEventListener("submit", (event) => {
    event.preventDefault();
    connect(elements.manualGameId.value);
    window.history.replaceState({}, "", `controller.html?gameId=${encodeURIComponent(gameId)}`);
  });
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
