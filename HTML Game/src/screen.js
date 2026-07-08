import { get, onValue, ref, serverTimestamp, set, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { db } from "./firebase.js";
import { getMove } from "./game-data.js";
import { resolveRound } from "./battle-engine.js";
import {
  buildJoinUrl,
  createAttractSession,
  formatGameCode,
  getGameId,
  hpPercent
} from "./shared.js";

const gameId = getGameId("storefront-1");
const joinUrl = buildJoinUrl(gameId);
const gameCode = formatGameCode(gameId);
const sessionRef = ref(db, `sessions/${gameId}`);

const $ = (id) => document.getElementById(id);
const elements = {
  attractView: $("attractView"),
  battleView: $("battleView"),
  gameOverView: $("gameOverView"),
  screenStatus: $("screenStatus"),
  joinQr: $("joinQr"),
  joinQrSmall: $("joinQrSmall"),
  gameOverQr: $("gameOverQr"),
  attractVideo: $("attractVideo"),
  joinQrFallback: $("joinQrFallback"),
  joinUrlLabel: $("joinUrlLabel"),
  gameCodeLabel: $("gameCodeLabel"),
  miniGameCode: $("miniGameCode"),
  gameOverCode: $("gameOverCode"),
  battleStatus: $("battleStatus"),
  turnNumber: $("turnNumber"),
  roundMessage: $("roundMessage"),
  lastMoves: $("lastMoves"),
  battleLog: $("battleLog"),
  resetButton: $("resetButton"),
  copyJoinButton: $("copyJoinButton"),
  fullScreenButton: $("fullScreenButton"),
  winnerText: $("winnerText"),
  gameOverMessage: $("gameOverMessage"),
  player: {
    wrap: $("playerFighter"),
    title: $("playerTitle"),
    name: $("playerName"),
    hpText: $("playerHpText"),
    hpBar: $("playerHpBar"),
    art: $("playerArt"),
    shield: $("playerShield")
  },
  enemy: {
    wrap: $("enemyFighter"),
    title: $("enemyTitle"),
    name: $("enemyName"),
    hpText: $("enemyHpText"),
    hpBar: $("enemyHpBar"),
    art: $("enemyArt"),
    shield: $("enemyShield")
  }
};

let resolvingToken = null;
let gameOverTimer = null;

function setView(viewName) {
  elements.attractView.hidden = viewName !== "attract";
  elements.battleView.hidden = viewName !== "battle";
  elements.gameOverView.hidden = viewName !== "game-over";
}

function renderQrTo(canvas, value, size) {
  if (!canvas) {
    return;
  }

  if (window.QRious) {
    canvas.hidden = false;
    new window.QRious({
      element: canvas,
      value,
      size,
      level: "H",
      background: "white",
      foreground: "#101014"
    });
  }
}

function renderQrCodes() {
  renderQrTo(elements.joinQr, joinUrl, 320);
  renderQrTo(elements.joinQrSmall, joinUrl, 132);
  renderQrTo(elements.gameOverQr, joinUrl, 260);

  if (!window.QRious && elements.joinQrFallback) {
    elements.joinQr.hidden = true;
    elements.joinQrFallback.hidden = false;
    elements.joinQrFallback.src = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(joinUrl)}`;
  }
}

function renderFighter(target, fighter) {
  if (!fighter) {
    return;
  }

  target.wrap.style.setProperty("--fighter-color", fighter.color || "#444");
  target.wrap.style.setProperty("--fighter-accent", fighter.accent || "#fff");
  target.title.textContent = fighter.title || "";
  target.name.textContent = fighter.name || "Fighter";
  target.hpText.textContent = `${fighter.hp} / ${fighter.maxHp}`;
  target.hpBar.style.width = `${hpPercent(fighter)}%`;
  target.art.src = fighter.asset;
  target.art.alt = fighter.name;
  target.shield.textContent = fighter.shield > 0 ? `Shield ${fighter.shield}` : "";
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
  renderFighter(elements.player, state.player);
  renderFighter(elements.enemy, state.enemy);
  renderLog(state.log);

  const pendingMove = state.pendingMove ? getMove(state.pendingMove.moveId) : null;
  const latestMessage = state.roundResult?.messages?.at(-1);
  const playerMoveName = state.roundResult?.playerMoveName;
  const enemyMoveName = state.roundResult?.enemyMoveName;

  elements.turnNumber.textContent = state.turn || 1;
  elements.battleStatus.textContent = state.status === "resolving"
    ? "Resolving move"
    : pendingMove
      ? "Move locked in"
      : "Choose a move";
  elements.roundMessage.textContent = state.status === "resolving" && pendingMove
    ? `${state.player.name} chose ${pendingMove.name}.`
    : latestMessage || "Choose a move from your phone.";
  elements.lastMoves.textContent = playerMoveName && enemyMoveName
    ? `${playerMoveName} vs ${enemyMoveName}`
    : "";
}

function renderGameOver(state) {
  setView("game-over");
  const playerWon = state.winner === "player";
  elements.winnerText.textContent = playerWon ? `${state.player.name} wins` : `${state.enemy.name} wins`;
  elements.gameOverMessage.textContent = playerWon
    ? "Victory on the big screen. Scan to start the next battle."
    : "The rival held the line. Scan to try again.";
}

function renderAttract() {
  setView("attract");
  elements.screenStatus.textContent = "Waiting for challenger";
}

function render(state) {
  elements.joinUrlLabel.textContent = joinUrl;
  elements.gameCodeLabel.textContent = gameCode;
  elements.miniGameCode.textContent = gameCode;
  elements.gameOverCode.textContent = gameCode;

  if (!state || state.status === "attract") {
    renderAttract();
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
  await set(sessionRef, createAttractSession(gameId, joinUrl, serverTimestamp()));
}

async function resolvePendingMove(state) {
  if (state.status !== "battle" || !state.pendingMove || !state.player || !state.enemy) {
    return;
  }

  const token = state.pendingMove.token;

  if (!token || resolvingToken === token) {
    return;
  }

  resolvingToken = token;
  await update(sessionRef, {
    status: "resolving",
    activeMove: state.pendingMove,
    lastActionAt: serverTimestamp()
  });

  window.setTimeout(async () => {
    const snapshot = await get(sessionRef);
    const liveState = snapshot.val();

    if (!liveState || liveState.pendingMove?.token !== token) {
      resolvingToken = null;
      return;
    }

    const nextState = resolveRound(liveState);
    const updatePayload = {
      ...nextState,
      pendingMove: null,
      activeMove: null,
      lastActionAt: serverTimestamp()
    };

    if (nextState.status === "game-over") {
      updatePayload.gameOverAt = serverTimestamp();
    }

    await update(sessionRef, updatePayload);
    resolvingToken = null;
  }, 1200);
}

function scheduleGameOverReset(state) {
  window.clearTimeout(gameOverTimer);

  if (state?.status === "game-over") {
    gameOverTimer = window.setTimeout(resetToAttract, 18000);
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
    await navigator.clipboard?.writeText(joinUrl);
    elements.copyJoinButton.textContent = "Copied";
    window.setTimeout(() => {
      elements.copyJoinButton.textContent = "Copy join link";
    }, 1200);
  });
  elements.fullScreenButton.addEventListener("click", () => {
    document.documentElement.requestFullscreen?.();
  });
}

async function boot() {
  elements.joinUrlLabel.textContent = joinUrl;
  elements.gameCodeLabel.textContent = gameCode;
  bindControls();
  renderQrCodes();
  window.addEventListener("load", renderQrCodes);

  const snapshot = await get(sessionRef);
  if (!snapshot.exists()) {
    await resetToAttract();
  }

  onValue(sessionRef, (nextSnapshot) => {
    const state = nextSnapshot.val();
    render(state);
    scheduleGameOverReset(state);
    resolvePendingMove(state).catch((error) => {
      console.error("Could not resolve move", error);
      resolvingToken = null;
    });
  });
}

boot().catch((error) => {
  console.error(error);
  elements.screenStatus.textContent = "Firebase connection failed";
});
