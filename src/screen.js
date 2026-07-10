import { get, onValue, ref, serverTimestamp, set, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { db } from "./firebase.js";
import { allAlivePlayersHaveMoves, prepareNextLevel, resolveRound } from "./battle-engine.js";
import { getLevelCount, getMove } from "./game-data.js";
import {
  createAttractSession,
  formatGameCode,
  getAlivePlayerIds,
  getGameId,
  getLobbyEntries,
  getOrderedPlayers,
  hpPercent
} from "./shared.js";

const gameId = getGameId("storefront-1");
const gameCode = formatGameCode(gameId);
const sessionRef = ref(db, `sessions/${gameId}`);

const $ = (id) => document.getElementById(id);
const elements = {
  attractView: $("attractView"),
  lobbyView: $("lobbyView"),
  battleView: $("battleView"),
  gameOverView: $("gameOverView"),
  attractVideo: $("attractVideo"),
  gameCodeLabel: $("gameCodeLabel"),
  lobbyCode: $("lobbyCode"),
  lobbyJoinCode: $("lobbyJoinCode"),
  miniGameCode: $("miniGameCode"),
  gameOverCode: $("gameOverCode"),
  lobbyTitle: $("lobbyTitle"),
  lobbyMessage: $("lobbyMessage"),
  lobbySlots: $("lobbySlots"),
  modeLabel: $("modeLabel"),
  levelLabel: $("levelLabel"),
  turnNumber: $("turnNumber"),
  playerCards: $("playerCards"),
  monsterName: $("monsterName"),
  monsterHpBar: $("monsterHpBar"),
  monsterHpText: $("monsterHpText"),
  monsterArt: $("monsterArt"),
  monsterEffects: $("monsterEffects"),
  battleStatus: $("battleStatus"),
  lastMoves: $("lastMoves"),
  battleLog: $("battleLog"),
  winnerText: $("winnerText"),
  gameOverMessage: $("gameOverMessage"),
  gameOverEyebrow: $("gameOverEyebrow"),
  resetButton: $("resetButton"),
  copyJoinButton: $("copyJoinButton"),
  fullScreenButton: $("fullScreenButton")
};

let resolvingToken = null;
let levelAdvanceToken = null;
let gameOverTimer = null;

function setView(viewName) {
  elements.attractView.hidden = viewName !== "attract";
  elements.lobbyView.hidden = viewName !== "lobby";
  elements.battleView.hidden = viewName !== "battle";
  elements.gameOverView.hidden = viewName !== "game-over";
}

function effectText(fighter) {
  const effects = fighter?.effects || {};
  const parts = [];

  if (fighter?.shield > 0) parts.push(`Shield ${fighter.shield}`);
  if (effects.attackUpTurns > 0) parts.push("Attack up");
  if (effects.attackDownTurns > 0) parts.push("Attack down");
  if (effects.damageReductionTurns > 0) parts.push("Guarded");
  if (effects.regenTurns > 0) parts.push("Regenerating");
  if (effects.burnTurns > 0) parts.push("Burning");
  if (effects.tauntTurns > 0) parts.push("Taunting");

  return parts.join(" / ");
}

function renderHp(track, label, fighter) {
  track.style.width = `${hpPercent(fighter)}%`;
  label.textContent = `${fighter.hp}/${fighter.maxHp}`;
}

function renderAttract() {
  setView("attract");
}

function renderLobby(state) {
  setView("lobby");
  const entries = getLobbyEntries(state);

  elements.lobbyTitle.textContent = entries.length >= 2 ? "Both players joined" : "Waiting for players";
  elements.lobbyMessage.textContent = entries.length >= 2
    ? "Co-op mode is starting automatically. Pick your characters on your phones."
    : "A player can press Start on their phone to play solo. A second player starts co-op automatically.";
  elements.lobbySlots.innerHTML = "";

  [0, 1].forEach((slot) => {
    const entry = entries.find((item) => Number(item.slot) === slot);
    const card = document.createElement("article");
    card.className = `lobby-slot ${entry ? "filled" : ""}`;
    card.innerHTML = `
      <span>Player ${slot + 1}</span>
      <strong>${entry ? "Joined" : "Open"}</strong>
    `;
    elements.lobbySlots.append(card);
  });
}

function playerCard(player, pendingMoves) {
  const move = pendingMoves?.[player.id] ? getMove(pendingMoves[player.id].moveId) : null;
  const card = document.createElement("article");
  card.className = `combat-card player-card ${player.hp <= 0 ? "down" : ""}`;
  card.style.setProperty("--fighter-color", player.color || "#ed1d24");
  card.style.setProperty("--fighter-accent", player.accent || "#f5ad0f");
  card.innerHTML = `
    <div class="combat-label">
      <span>Player ${Number(player.slot || 0) + 1}</span>
      <strong>${player.name}</strong>
    </div>
    <div class="hp-row">
      <span>HP</span>
      <div class="hp-track"><div class="hp-fill" style="width:${hpPercent(player)}%"></div></div>
      <strong>${player.hp}/${player.maxHp}</strong>
    </div>
    <img class="combat-art" src="${player.asset}" alt="${player.name}">
    <div class="effect-line">${effectText(player)}</div>
    <div class="locked-move">${player.hp <= 0 ? "Down" : move ? `Locked: ${move.name}` : "Choosing move"}</div>
  `;
  return card;
}

function renderLog(log) {
  const entries = Array.isArray(log) ? log.slice(-5) : [];
  elements.battleLog.innerHTML = "";

  entries.forEach((entry) => {
    const line = document.createElement("p");
    line.textContent = entry;
    elements.battleLog.append(line);
  });
}

function renderBattle(state) {
  setView("battle");
  const players = getOrderedPlayers(state);
  const monster = state.monster;
  const aliveIds = getAlivePlayerIds(state);
  const readyCount = aliveIds.filter((id) => Boolean(state.pendingMoves?.[id])).length;
  const totalLevels = getLevelCount(state.mode || "solo");

  elements.modeLabel.textContent = state.mode === "multiplayer" ? "Co-op Mode" : "Solo Mode";
  elements.levelLabel.textContent = `Level ${Number(state.levelIndex || 0) + 1} / ${totalLevels}`;
  elements.turnNumber.textContent = state.turn || 1;
  elements.playerCards.innerHTML = "";
  players.forEach((player) => elements.playerCards.append(playerCard(player, state.pendingMoves || {})));

  if (monster) {
    elements.monsterName.textContent = monster.name;
    renderHp(elements.monsterHpBar, elements.monsterHpText, monster);
    elements.monsterArt.src = monster.asset;
    elements.monsterArt.alt = monster.name;
    elements.monsterEffects.textContent = effectText(monster);
  }

  if (state.status === "resolving") {
    elements.battleStatus.textContent = "Resolving moves...";
  } else if (state.status === "level-complete") {
    elements.battleStatus.textContent = "Level cleared. Get ready!";
  } else {
    elements.battleStatus.textContent = readyCount >= aliveIds.length
      ? "Moves locked. Resolving now!"
      : `Now pick your move on your phone! ${readyCount}/${aliveIds.length} ready`;
  }

  const chosenMoves = Object.values(state.pendingMoves || {})
    .map((entry) => getMove(entry.moveId)?.name)
    .filter(Boolean);
  elements.lastMoves.textContent = chosenMoves.length ? `Locked moves: ${chosenMoves.join(" + ")}` : "";
  renderLog(state.log);
}

function renderGameOver(state) {
  setView("game-over");
  const playersWon = state.winner === "players";
  elements.gameOverEyebrow.textContent = playersWon ? "All levels cleared" : "Battle lost";
  elements.winnerText.textContent = playersWon ? "Players win!" : "Monster wins";
  elements.gameOverMessage.textContent = playersWon
    ? "The curry party cleared all five levels. Enter the code on the website for the next battle."
    : "The monster held the screen. Enter the code on the website to try again.";
}

function render(state) {
  elements.gameCodeLabel.textContent = gameCode;
  elements.lobbyCode.textContent = gameCode;
  elements.lobbyJoinCode.textContent = gameCode;
  elements.miniGameCode.textContent = gameCode;
  elements.gameOverCode.textContent = gameCode;

  if (!state || state.status === "attract") {
    renderAttract();
    return;
  }

  if (state.status === "lobby" || state.status === "character-select") {
    renderLobby(state);
    return;
  }

  if (state.status === "game-over") {
    renderGameOver(state);
    return;
  }

  renderBattle(state);
}

async function resetToAttract() {
  window.clearTimeout(gameOverTimer);
  levelAdvanceToken = null;
  resolvingToken = null;
  await set(sessionRef, createAttractSession(gameId, null, serverTimestamp()));
}

async function resolvePendingMoves(state) {
  if (state.status !== "battle" || !allAlivePlayersHaveMoves(state)) {
    return;
  }

  const token = Object.values(state.pendingMoves || {})
    .map((entry) => entry.token)
    .sort()
    .join("|");

  if (!token || resolvingToken === token) {
    return;
  }

  resolvingToken = token;
  await update(sessionRef, {
    status: "resolving",
    activeMoves: state.pendingMoves,
    lastActionAt: serverTimestamp()
  });

  window.setTimeout(async () => {
    const snapshot = await get(sessionRef);
    const liveState = snapshot.val();
    const liveToken = Object.values(liveState?.pendingMoves || {})
      .map((entry) => entry.token)
      .sort()
      .join("|");

    if (!liveState || liveToken !== token) {
      resolvingToken = null;
      return;
    }

    const nextState = resolveRound(liveState);
    const updatePayload = {
      ...nextState,
      pendingMoves: {},
      activeMoves: {},
      lastActionAt: serverTimestamp()
    };

    if (nextState.status === "game-over") {
      updatePayload.gameOverAt = serverTimestamp();
    }

    await update(sessionRef, updatePayload);
    resolvingToken = null;
  }, 1200);
}

function scheduleLevelAdvance(state) {
  if (state?.status !== "level-complete") {
    levelAdvanceToken = null;
    return;
  }

  const token = `${state.levelIndex}-${state.roundResult?.createdAt || ""}`;
  if (levelAdvanceToken === token) {
    return;
  }

  levelAdvanceToken = token;
  window.setTimeout(async () => {
    const snapshot = await get(sessionRef);
    const liveState = snapshot.val();

    if (!liveState || liveState.status !== "level-complete") {
      return;
    }

    await update(sessionRef, {
      ...prepareNextLevel(liveState),
      lastActionAt: serverTimestamp()
    });
  }, 4200);
}

function scheduleGameOverReset(state) {
  window.clearTimeout(gameOverTimer);

  if (state?.status === "game-over") {
    gameOverTimer = window.setTimeout(resetToAttract, 24000);
  }
}

function bindControls() {
  elements.attractVideo?.addEventListener("error", () => {
    elements.attractVideo.hidden = true;
  }, true);

  elements.attractVideo?.querySelector("source")?.addEventListener("error", () => {
    elements.attractVideo.hidden = true;
  });

  elements.resetButton.addEventListener("click", resetToAttract);
  elements.copyJoinButton.addEventListener("click", async () => {
    await navigator.clipboard?.writeText(gameId);
    elements.copyJoinButton.textContent = "Copied";
    window.setTimeout(() => {
      elements.copyJoinButton.textContent = "Copy game code";
    }, 1200);
  });
  elements.fullScreenButton.addEventListener("click", () => {
    document.documentElement.requestFullscreen?.();
  });
}

async function boot() {
  bindControls();

  const snapshot = await get(sessionRef);
  if (!snapshot.exists()) {
    await resetToAttract();
  }

  onValue(sessionRef, (nextSnapshot) => {
    const state = nextSnapshot.val();
    render(state);
    scheduleLevelAdvance(state);
    scheduleGameOverReset(state);
    resolvePendingMoves(state).catch((error) => {
      console.error("Could not resolve moves", error);
      resolvingToken = null;
    });
  });
}

boot().catch((error) => {
  console.error(error);
  elements.gameCodeLabel.textContent = "Firebase connection failed";
});
