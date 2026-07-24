import { allAlivePlayersHaveMoves, prepareNextLevel, resolveRound } from "./battle-engine.js?v=20260724-idle-perf2";
import { CHARACTERS, LEVELS, getLevelCount, getMove } from "./game-data.js?v=20260724-idle-perf2";
import {
  createAttractSession,
  formatGameCode,
  getAlivePlayerIds,
  getGameId,
  getLobbyEntries,
  getOrderedPlayers,
  hpPercent
} from "./shared.js?v=20260724-idle-perf2";

let get;
let onValue;
let ref;
let remove;
let serverTimestamp;
let set;
let update;
let db;

const DESIGN_WIDTH = 577;
const DESIGN_HEIGHT = 1439;
const SCREEN_GAME_STORAGE_KEY = "storefront-screen-game";
const BATTLE_BACKGROUND_HANDOFF_LEAD_SECONDS = 0.16;
const MOVE_ANIMATION_FALLBACK_TIMEOUT_MS = 1600;
const MOVE_ANIMATION_VERSION = "20260722-animation-perf2";
const IDLE_ANIMATION_VERSION = "20260724-idle-perf2";
const IDLE_BACKGROUND_VERSION = "20260724-idle-perf2";
const LIVE_MOVE_ANIMATION_SPACING_MS = 940;
const WEBSITE_URL = "https://reito-bt.github.io/Monster-Curry-Personality-Prototype-Website/";
const IDLE_IMPACT_WORDS = ["BAM!", "SIZZLE!", "CRUNCH!", "POW!", "SLASH!", "BOOM!"];

const $ = (id) => document.getElementById(id);
const elements = {
  attractView: $("attractView"),
  lobbyView: $("lobbyView"),
  battleView: $("battleView"),
  gameOverView: $("gameOverView"),
  websiteQr: $("websiteQr"),
  websiteQrFallback: $("websiteQrFallback"),
  idleBattleBackground: $("idleBattleBackground"),
  idleBattleMove: $("idleBattleMove"),
  idlePlayerFighter: $("idlePlayerFighter"),
  idlePlayerArt: $("idlePlayerArt"),
  idleMoveAnimation: $("idleMoveAnimation"),
  idleMonsterFighter: $("idleMonsterFighter"),
  idleMonsterArt: $("idleMonsterArt"),
  monsterCard: $("monsterCard"),
  liveBattleMove: $("liveBattleMove"),
  liveBattleImpact: $("liveBattleImpact"),
  moveAnimation: $("moveAnimation"),
  battleBackgroundVideos: [$("battleBackgroundVideoA"), $("battleBackgroundVideoB")],
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
let gameId = null;
let gameCode = null;
let sessionRef = null;
let unsubscribe = null;
let rotatingSession = false;
let battleBackgroundRunning = false;
let activeBattleBackgroundIndex = 0;
let battleBackgroundHandoffInProgress = false;
let battleBackgroundMonitor = null;
let battleBackgroundPreload = null;
let idleBattleTimer = null;
let idleBattleState = null;
let idleCharacterCursor = 0;
let idleMonsterCursor = 0;
let idleBackgroundRequest = 0;
let idleBackgroundWarmTimer = null;
let liveBattleAnimationToken = null;
let screenScaleFrame = null;
let lastBattleSnapshot = null;
let gameOverRevealTimer = null;
const liveBattleTimers = new Set();
const warmedMoveAnimations = new Set();
const warmingMoveAnimations = new Set();
const queuedMoveAnimations = new Set();
const moveAnimationWarmQueue = [];
const idleBackgroundPreloads = new Map();
const idleElementAnimationStates = new WeakMap();
const moveAnimationPlaybackStates = new WeakMap();
let moveAnimationWarmQueueRunning = false;
const transparentMoveAnimationsSupported = Boolean(
  elements.moveAnimation?.canPlayType('video/webm; codecs="vp9"')
);
const networkInformation = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const idleVideoAnimationsEnabled = Boolean(
  transparentMoveAnimationsSupported
  && !networkInformation?.saveData
  && !["slow-2g", "2g"].includes(networkInformation?.effectiveType)
  && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
);

function updateScreenScale() {
  const viewport = window.visualViewport;
  const viewportWidth = Math.max(1, viewport?.width || document.documentElement.clientWidth || window.innerWidth);
  const viewportHeight = Math.max(1, viewport?.height || document.documentElement.clientHeight || window.innerHeight);
  const viewportLeft = viewport?.offsetLeft || 0;
  const viewportTop = viewport?.offsetTop || 0;
  const scale = Math.min(viewportWidth / DESIGN_WIDTH, viewportHeight / DESIGN_HEIGHT);
  const screenWidth = DESIGN_WIDTH * scale;
  const screenHeight = DESIGN_HEIGHT * scale;
  const screenX = viewportLeft + Math.max(0, (viewportWidth - screenWidth) / 2);
  const screenY = viewportTop + Math.max(0, (viewportHeight - screenHeight) / 2);
  const rootStyle = document.documentElement.style;

  rootStyle.setProperty("--screen-scale", String(scale));
  rootStyle.setProperty("--screen-x", `${screenX}px`);
  rootStyle.setProperty("--screen-y", `${screenY}px`);
}

function scheduleScreenScaleUpdate() {
  updateScreenScale();
  window.cancelAnimationFrame(screenScaleFrame);
  screenScaleFrame = window.requestAnimationFrame(() => {
    screenScaleFrame = window.requestAnimationFrame(() => {
      screenScaleFrame = null;
      updateScreenScale();
    });
  });
}

function isFourDigitCode(value) {
  return /^\d{4}$/.test(String(value || ""));
}

function generateFourDigitCode() {
  const randomValue = new Uint32Array(1);
  window.crypto.getRandomValues(randomValue);
  return String(1000 + (randomValue[0] % 9000));
}

async function findAvailableGameId(excludedGameId = null) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidate = generateFourDigitCode();
    if (candidate === excludedGameId) {
      continue;
    }
    const snapshot = await get(ref(db, `sessions/${candidate}`));
    if (!snapshot.exists()) {
      return candidate;
    }
  }

  throw new Error("Could not allocate a four-digit game code.");
}

function updateGameCodeLabels(state = null) {
  elements.gameCodeLabel.textContent = gameCode || "----";
  elements.lobbyCode.textContent = gameCode || "----";
  elements.lobbyJoinCode.textContent = gameCode || "----";
  elements.miniGameCode.textContent = gameCode || "----";
  elements.gameOverCode.textContent = state?.status === "game-over" ? "New code soon" : gameCode || "----";
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function renderWebsiteQr() {
  if (!elements.websiteQr) {
    return;
  }

  if (window.QRious) {
    elements.websiteQr.hidden = false;
    elements.websiteQrFallback.hidden = true;
    new window.QRious({
      element: elements.websiteQr,
      value: WEBSITE_URL,
      size: 260,
      level: "H",
      background: "white",
      foreground: "#151515"
    });
    return;
  }

  elements.websiteQr.hidden = true;
  elements.websiteQrFallback.hidden = false;
  elements.websiteQrFallback.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(WEBSITE_URL)}`;
}

async function connectFirebase() {
  const [databaseModule, firebaseModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js"),
    import("./firebase.js")
  ]);

  ({
    get,
    onValue,
    ref,
    remove,
    serverTimestamp,
    set,
    update
  } = databaseModule);
  db = firebaseModule.db;
}

function clearIdleElementAnimations(element) {
  if (!element) {
    return;
  }

  const states = idleElementAnimationStates.get(element);
  if (!states) {
    return;
  }

  states.forEach((state, className) => {
    window.cancelAnimationFrame(state.frame);
    window.clearTimeout(state.timer);
    element.classList.remove(className);
  });
  idleElementAnimationStates.delete(element);
}

function animateIdleElement(element, className, duration = 720) {
  if (!element) {
    return;
  }

  let states = idleElementAnimationStates.get(element);
  if (!states) {
    states = new Map();
    idleElementAnimationStates.set(element, states);
  }

  const previousState = states.get(className);
  window.cancelAnimationFrame(previousState?.frame);
  window.clearTimeout(previousState?.timer);
  element.classList.remove(className);
  const state = { frame: null, timer: null };
  states.set(className, state);
  state.frame = window.requestAnimationFrame(() => {
    state.frame = window.requestAnimationFrame(() => {
      state.frame = null;
      element.classList.add(className);
      state.timer = window.setTimeout(() => {
        element.classList.remove(className);
        states.delete(className);
        if (states.size === 0) {
          idleElementAnimationStates.delete(element);
        }
      }, duration);
    });
  });
}

function idleBackgroundUrl(backgroundPath) {
  if (!backgroundPath) {
    return null;
  }

  const url = new URL(backgroundPath, window.location.href);
  url.searchParams.set("v", IDLE_BACKGROUND_VERSION);
  return url.href;
}

function preloadIdleBackground(backgroundPath) {
  const sourceUrl = idleBackgroundUrl(backgroundPath);
  if (!sourceUrl) {
    return Promise.resolve(null);
  }

  if (!idleBackgroundPreloads.has(sourceUrl)) {
    const preload = new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.addEventListener("load", () => resolve(sourceUrl), { once: true });
      image.addEventListener("error", () => {
        idleBackgroundPreloads.delete(sourceUrl);
        resolve(null);
      }, { once: true });
      image.src = sourceUrl;
    });
    idleBackgroundPreloads.set(sourceUrl, preload);
  }

  return idleBackgroundPreloads.get(sourceUrl);
}

function updateIdleBattleBackground(backgroundPath) {
  const sourceUrl = idleBackgroundUrl(backgroundPath);
  if (!sourceUrl || elements.idleBattleBackground.dataset.sourceUrl === sourceUrl) {
    return;
  }

  const requestId = ++idleBackgroundRequest;
  void preloadIdleBackground(backgroundPath).then((loadedUrl) => {
    if (!loadedUrl || requestId !== idleBackgroundRequest || elements.attractView.hidden) {
      return;
    }

    elements.idleBattleBackground.style.backgroundImage = `url("${loadedUrl}")`;
    elements.idleBattleBackground.dataset.sourceUrl = loadedUrl;
  });
}

function updateIdleBattleDisplay() {
  const state = idleBattleState;
  if (!state) {
    return;
  }

  elements.idlePlayerArt.src = state.character.idleAsset || state.character.asset;
  elements.idlePlayerArt.alt = state.character.name;
  elements.idlePlayerFighter.dataset.characterId = state.character.id;
  elements.idleMonsterArt.src = state.monster.asset;
  elements.idleMonsterArt.alt = state.monster.name;
  elements.idleMonsterFighter.dataset.monsterName = state.monster.name;
  updateIdleBattleBackground(state.monster.idleBackground);
}

function showIdleBattleMove(moveName) {
  elements.idleBattleMove.textContent = moveName;
  animateIdleElement(elements.idleBattleMove, "is-showing", 1080);
}

function scheduleIdleBattleStep(delay) {
  window.clearTimeout(idleBattleTimer);
  idleBattleTimer = window.setTimeout(() => {
    idleBattleTimer = null;
    runIdleBattleStep();
  }, delay);
}

function resetIdleBattle() {
  const character = CHARACTERS[idleCharacterCursor % CHARACTERS.length];
  const monster = LEVELS.solo[idleMonsterCursor % LEVELS.solo.length];
  const playerMove = getMove(character.moves[0]);
  const playerAnimationMove = playerMove && character.idleAnimation
    ? { ...playerMove, animation: character.idleAnimation }
    : null;
  idleCharacterCursor = (idleCharacterCursor + 1) % CHARACTERS.length;
  idleMonsterCursor = (idleMonsterCursor + 1) % LEVELS.solo.length;
  idleBattleState = {
    character,
    monster,
    playerMove,
    playerAnimationMove,
    playerAnimationShown: false,
    playerHp: 100,
    monsterHp: 100,
    playerTurn: true
  };

  clearMoveAnimationPlayback(elements.idleMoveAnimation);
  clearIdleElementAnimations(elements.idleBattleMove);
  clearIdleElementAnimations(elements.idlePlayerFighter);
  clearIdleElementAnimations(elements.idleMonsterFighter);
  elements.idlePlayerFighter.classList.remove("is-attacking", "is-hit", "is-victorious", "is-defeated");
  elements.idleMonsterFighter.classList.remove("is-attacking", "is-hit", "is-victorious", "is-defeated");
  showIdleBattleMove(`${character.name} enters the arena!`);
  updateIdleBattleDisplay();
  if (idleVideoAnimationsEnabled && playerAnimationMove) {
    warmMoveAnimation(playerAnimationMove);
  }
  window.clearTimeout(idleBackgroundWarmTimer);
  idleBackgroundWarmTimer = window.setTimeout(() => {
    idleBackgroundWarmTimer = null;
    if (idleBattleState?.character === character && !document.hidden && !elements.attractView.hidden) {
      void preloadIdleBackground(LEVELS.solo[idleMonsterCursor % LEVELS.solo.length]?.idleBackground);
    }
  }, 1400);
}

function runIdleBattleStep() {
  if (elements.attractView.hidden) {
    return;
  }

  if (!idleBattleState) {
    resetIdleBattle();
  }

  const state = idleBattleState;
  const playerAttacks = state.playerTurn;
  const attacker = playerAttacks ? elements.idlePlayerFighter : elements.idleMonsterFighter;
  const defender = playerAttacks ? elements.idleMonsterFighter : elements.idlePlayerFighter;
  const move = playerAttacks
    ? state.playerMove
    : getMove(randomItem(state.monster.moves));
  const damage = Math.floor(15 + Math.random() * 18);

  if (playerAttacks) {
    state.monsterHp = Math.max(0, state.monsterHp - damage);
  } else {
    state.playerHp = Math.max(0, state.playerHp - damage);
  }

  showIdleBattleMove(move?.name || "Power attack");
  if (playerAttacks && !state.playerAnimationShown && idleVideoAnimationsEnabled && state.playerAnimationMove) {
    state.playerAnimationShown = true;
    playMoveAnimation(state.playerAnimationMove, elements.idleMoveAnimation, true);
  }
  animateIdleElement(attacker, "is-attacking");
  animateIdleElement(defender, "is-hit", 560);
  updateIdleBattleDisplay();

  const battleEnded = state.playerHp <= 0 || state.monsterHp <= 0;
  if (battleEnded) {
    const playerWon = state.monsterHp <= 0;
    const winner = playerWon ? elements.idlePlayerFighter : elements.idleMonsterFighter;
    const defeated = playerWon ? elements.idleMonsterFighter : elements.idlePlayerFighter;
    showIdleBattleMove(playerWon ? `${state.character.name} wins!` : "Monster wins!");
    winner.classList.add("is-victorious");
    defeated.classList.add("is-defeated");
    scheduleIdleBattleStep(1650);
    idleBattleState = null;
    return;
  }

  state.playerTurn = !state.playerTurn;
  scheduleIdleBattleStep(1050 + Math.floor(Math.random() * 500));
}

function startIdleBattle() {
  if (idleBattleTimer) {
    return;
  }

  resetIdleBattle();
  scheduleIdleBattleStep(700);
}

function stopIdleBattle() {
  window.clearTimeout(idleBattleTimer);
  window.clearTimeout(idleBackgroundWarmTimer);
  idleBattleTimer = null;
  idleBackgroundWarmTimer = null;
  idleBattleState = null;
  idleBackgroundRequest += 1;
  clearMoveAnimationPlayback(elements.idleMoveAnimation);
  clearIdleElementAnimations(elements.idleBattleMove);
  clearIdleElementAnimations(elements.idlePlayerFighter);
  clearIdleElementAnimations(elements.idleMonsterFighter);
  elements.idlePlayerFighter.classList.remove("is-attacking", "is-hit", "is-victorious", "is-defeated");
  elements.idleMonsterFighter.classList.remove("is-attacking", "is-hit", "is-victorious", "is-defeated");
}

function scheduleLiveBattleAnimation(callback, delay) {
  const timer = window.setTimeout(() => {
    liveBattleTimers.delete(timer);
    callback();
  }, delay);
  liveBattleTimers.add(timer);
}

function getMoveAnimationPlaybackState(video) {
  if (!moveAnimationPlaybackStates.has(video)) {
    moveAnimationPlaybackStates.set(video, {
      fallbackTimer: null,
      requestId: 0
    });
  }

  return moveAnimationPlaybackStates.get(video);
}

function clearMoveAnimationPlayback(video) {
  if (!video) {
    return;
  }

  const playback = getMoveAnimationPlaybackState(video);
  window.clearTimeout(playback.fallbackTimer);
  playback.fallbackTimer = null;
  playback.requestId += 1;
  video.pause();
  video.oncanplay = null;
  video.onerror = null;
  video.classList.remove("is-playing", "has-transparent-source");
  if (video.getAttribute("src")) {
    video.removeAttribute("src");
    video.load();
  }
}

function clearLiveBattleAnimations() {
  liveBattleTimers.forEach((timer) => window.clearTimeout(timer));
  liveBattleTimers.clear();
  liveBattleAnimationToken = null;
  lastBattleSnapshot = null;
  elements.liveBattleMove.classList.remove("is-showing");
  elements.liveBattleImpact.classList.remove("is-bursting");
  clearMoveAnimationPlayback(elements.moveAnimation);
}

function getPlayerBattleCard(playerId) {
  return Array.from(elements.playerCards.children)
    .find((card) => card.dataset.playerId === playerId) || null;
}

function showLiveBattleAction(moveName, impact = null) {
  elements.liveBattleMove.textContent = moveName;
  animateIdleElement(elements.liveBattleMove, "is-showing", 1080);
  if (impact) {
    elements.liveBattleImpact.textContent = impact;
    animateIdleElement(elements.liveBattleImpact, "is-bursting", 700);
  }
}

function moveAnimationUrl(move, transparent = transparentMoveAnimationsSupported) {
  if (!move?.animation) {
    return null;
  }

  const animationPath = transparent
    ? move.animation.replace(/\.mp4$/i, ".webm")
    : move.animation;
  const url = new URL(animationPath, window.location.href);
  url.searchParams.set(
    "v",
    animationPath.includes("/animations/idle/")
      ? IDLE_ANIMATION_VERSION
      : MOVE_ANIMATION_VERSION
  );
  return url.href;
}

async function fetchMoveAnimationSource(sourceUrl, urgent = false) {
  if (!sourceUrl || warmedMoveAnimations.has(sourceUrl) || warmingMoveAnimations.has(sourceUrl)) {
    return;
  }

  warmingMoveAnimations.add(sourceUrl);
  try {
    const response = await fetch(sourceUrl, {
      cache: "force-cache",
      priority: urgent ? "high" : "low"
    });
    if (!response.ok) {
      throw new Error(`Could not preload move animation (${response.status})`);
    }
    await response.arrayBuffer();
    warmedMoveAnimations.add(sourceUrl);
  } catch {
    // Playback still retries the preferred source and its MP4 fallback on demand.
  } finally {
    warmingMoveAnimations.delete(sourceUrl);
  }
}

async function drainMoveAnimationWarmQueue() {
  if (moveAnimationWarmQueueRunning) {
    return;
  }

  moveAnimationWarmQueueRunning = true;
  try {
    while (moveAnimationWarmQueue.length) {
      const { sourceUrl } = moveAnimationWarmQueue.shift();
      queuedMoveAnimations.delete(sourceUrl);
      await fetchMoveAnimationSource(sourceUrl);
    }
  } finally {
    moveAnimationWarmQueueRunning = false;
    if (moveAnimationWarmQueue.length) {
      void drainMoveAnimationWarmQueue();
    }
  }
}

function warmMoveAnimation(
  move,
  {
    urgent = false,
    transparent = transparentMoveAnimationsSupported
  } = {}
) {
  const sourceUrl = moveAnimationUrl(move, transparent);
  if (!sourceUrl || warmedMoveAnimations.has(sourceUrl) || warmingMoveAnimations.has(sourceUrl)) {
    return;
  }

  if (queuedMoveAnimations.has(sourceUrl)) {
    const queuedIndex = moveAnimationWarmQueue.findIndex((entry) => entry.sourceUrl === sourceUrl);
    if (!urgent) {
      return;
    }
    if (queuedIndex >= 0) {
      moveAnimationWarmQueue.splice(queuedIndex, 1);
    }
    queuedMoveAnimations.delete(sourceUrl);
  }

  if (urgent) {
    void fetchMoveAnimationSource(sourceUrl, true);
    return;
  }

  moveAnimationWarmQueue.push({ sourceUrl });
  queuedMoveAnimations.add(sourceUrl);
  void drainMoveAnimationWarmQueue();
}

function warmSelectedCharacterAnimations(state) {
  const characterIds = new Set([
    ...getLobbyEntries(state)
      .filter((entry) => entry.confirmed && entry.characterId)
      .map((entry) => entry.characterId),
    ...Object.values(state?.players || {})
      .map((player) => player.characterId)
      .filter(Boolean)
  ]);

  characterIds.forEach((characterId) => {
    const character = CHARACTERS.find((entry) => entry.id === characterId);
    character?.moves
      .map((moveId) => getMove(moveId))
      .filter(Boolean)
      .forEach((move) => warmMoveAnimation(move));
  });
}

function playMoveAnimation(
  move,
  video = elements.moveAnimation,
  preferTransparency = transparentMoveAnimationsSupported
) {
  if (!video || !move?.animation) {
    return;
  }

  const playback = getMoveAnimationPlaybackState(video);
  window.clearTimeout(playback.fallbackTimer);
  playback.fallbackTimer = null;
  const requestId = ++playback.requestId;
  const transparentUrl = moveAnimationUrl(move, true);
  const fallbackUrl = moveAnimationUrl(move, false);
  const useTransparentSource = Boolean(preferTransparency && transparentMoveAnimationsSupported);

  const startPlayback = (sourceUrl, usesTransparency) => {
    if (requestId !== playback.requestId || video.src !== sourceUrl) {
      return;
    }

    window.clearTimeout(playback.fallbackTimer);
    playback.fallbackTimer = null;
    video.oncanplay = null;
    video.onerror = null;
    video.pause();
    video.currentTime = 0;
    video.classList.remove("is-playing");
    video.classList.toggle("has-transparent-source", usesTransparency);
    video.classList.add("is-playing");
    video.play()
      .catch(() => {
        if (requestId !== playback.requestId) {
          return;
        }

        if (usesTransparency) {
          loadSource(fallbackUrl, false);
        } else {
          video.classList.remove("is-playing");
        }
      });
  };

  const loadSource = (sourceUrl, usesTransparency) => {
    if (!sourceUrl || requestId !== playback.requestId) {
      return;
    }

    window.clearTimeout(playback.fallbackTimer);
    playback.fallbackTimer = null;
    video.pause();
    video.classList.remove("is-playing");
    video.classList.toggle("has-transparent-source", usesTransparency);
    video.oncanplay = () => startPlayback(sourceUrl, usesTransparency);
    video.onerror = () => {
      if (requestId !== playback.requestId) {
        return;
      }

      if (usesTransparency) {
        loadSource(fallbackUrl, false);
      } else {
        video.classList.remove("is-playing");
      }
    };

    if (video.src !== sourceUrl) {
      video.src = sourceUrl;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      startPlayback(sourceUrl, usesTransparency);
      return;
    }

    video.load();
    if (usesTransparency && fallbackUrl && fallbackUrl !== sourceUrl) {
      playback.fallbackTimer = window.setTimeout(() => {
        playback.fallbackTimer = null;
        if (requestId === playback.requestId && !video.classList.contains("is-playing")) {
          loadSource(fallbackUrl, false);
        }
      }, MOVE_ANIMATION_FALLBACK_TIMEOUT_MS);
    }
  };

  loadSource(
    useTransparentSource ? transparentUrl : fallbackUrl,
    useTransparentSource
  );
}

function captureBattleSnapshot(state) {
  return {
    roundResultCreatedAt: state.roundResult?.createdAt || null,
    monsterHp: Number(state.monster?.hp || 0),
    players: Object.fromEntries(getOrderedPlayers(state).map((player) => [player.id, Number(player.hp || 0)]))
  };
}

function animateResolvingMoves(state) {
  if (state.status !== "resolving") {
    return;
  }

  const activeMoves = state.activeMoves || {};
  const token = Object.values(activeMoves).map((entry) => entry.token).filter(Boolean).sort().join("|");
  if (!token || liveBattleAnimationToken === token) {
    return;
  }

  liveBattleAnimationToken = token;
  const actions = getOrderedPlayers(state)
    .map((player) => ({ player, move: getMove(activeMoves[player.id]?.moveId) }))
    .filter((action) => action.move && action.player.hp > 0);

  actions.forEach(({ player, move }, index) => {
    scheduleLiveBattleAnimation(() => {
      if (elements.battleView.hidden) {
        return;
      }

      const playerCard = getPlayerBattleCard(player.id);
      showLiveBattleAction(move.name, randomItem(IDLE_IMPACT_WORDS));
      playMoveAnimation(move);
      animateIdleElement(playerCard, "is-live-attacking", 680);
      if (move.power || move.hits) {
        animateIdleElement(elements.monsterCard, "is-live-hit", 580);
      }
    }, 120 + index * LIVE_MOVE_ANIMATION_SPACING_MS);
  });
}

function monsterMoveNameFromMessages(monsterName, messages) {
  const prefix = `${monsterName} used `;
  const message = messages.find((entry) => entry.startsWith(prefix));
  if (!message) {
    return messages.some((entry) => entry.startsWith(`${monsterName} gained `))
      ? getMove("monster-guard")?.name || "Monster Guard"
      : null;
  }

  const remainder = message.slice(prefix.length);
  return remainder.split(" on ")[0].split(".")[0];
}

function animateRoundOutcome(state, previousSnapshot) {
  const roundResultCreatedAt = state.roundResult?.createdAt || null;
  if (!previousSnapshot || !roundResultCreatedAt || previousSnapshot.roundResultCreatedAt === roundResultCreatedAt) {
    return;
  }

  const messages = Array.isArray(state.roundResult?.messages) ? state.roundResult.messages : [];
  const monsterMoveName = monsterMoveNameFromMessages(state.monster?.name || "", messages);
  const damagedPlayerIds = getOrderedPlayers(state)
    .filter((player) => Number(player.hp || 0) < Number(previousSnapshot.players[player.id] ?? player.hp))
    .map((player) => player.id);

  if (monsterMoveName) {
    scheduleLiveBattleAnimation(() => {
      if (elements.battleView.hidden) {
        return;
      }

      showLiveBattleAction(monsterMoveName, randomItem(IDLE_IMPACT_WORDS));
      animateIdleElement(elements.monsterCard, "is-live-attacking", 680);
      damagedPlayerIds.forEach((playerId) => animateIdleElement(getPlayerBattleCard(playerId), "is-live-hit", 580));
    }, 100);
  } else if (Number(state.monster?.hp || 0) <= 0 && previousSnapshot.monsterHp > 0) {
    scheduleLiveBattleAnimation(() => showLiveBattleAction(`${state.monster.name} defeated!`, "KO!"), 100);
  }
}

function cancelBattleBackgroundCallback(callback) {
  if (!callback) {
    return;
  }

  if (callback.cancel) {
    callback.cancel();
  } else if (typeof callback.video.cancelVideoFrameCallback === "function") {
    callback.video.cancelVideoFrameCallback(callback.id);
  }
}

function monitorBattleBackground(videoIndex) {
  const video = elements.battleBackgroundVideos[videoIndex];
  if (!battleBackgroundRunning || videoIndex !== activeBattleBackgroundIndex || typeof video.requestVideoFrameCallback !== "function") {
    return;
  }

  const callback = {
    video,
    id: video.requestVideoFrameCallback(() => {
      if (battleBackgroundMonitor === callback) {
        battleBackgroundMonitor = null;
      }

      if (!battleBackgroundRunning || videoIndex !== activeBattleBackgroundIndex) {
        return;
      }

      const secondsRemaining = video.duration - video.currentTime;
      if (Number.isFinite(secondsRemaining) && secondsRemaining <= BATTLE_BACKGROUND_HANDOFF_LEAD_SECONDS) {
        handOffBattleBackground(videoIndex);
        return;
      }

      monitorBattleBackground(videoIndex);
    })
  };
  battleBackgroundMonitor = callback;
}

function stopBattleBackground() {
  battleBackgroundRunning = false;
  battleBackgroundHandoffInProgress = false;
  cancelBattleBackgroundCallback(battleBackgroundMonitor);
  cancelBattleBackgroundCallback(battleBackgroundPreload);
  battleBackgroundMonitor = null;
  battleBackgroundPreload = null;

  elements.battleBackgroundVideos.forEach((video, index) => {
    video.pause();
    video.currentTime = 0;
    video.classList.toggle("is-active", index === 0);
  });
  activeBattleBackgroundIndex = 0;
}

function handOffBattleBackground(endedIndex) {
  if (!battleBackgroundRunning || endedIndex !== activeBattleBackgroundIndex || battleBackgroundHandoffInProgress) {
    return;
  }

  battleBackgroundHandoffInProgress = true;
  const currentVideo = elements.battleBackgroundVideos[endedIndex];
  const nextIndex = activeBattleBackgroundIndex === 0 ? 1 : 0;
  const nextVideo = elements.battleBackgroundVideos[nextIndex];
  nextVideo.currentTime = 0;

  const revealNextVideo = () => {
    battleBackgroundPreload = null;
    if (!battleBackgroundRunning || endedIndex !== activeBattleBackgroundIndex) {
      nextVideo.pause();
      nextVideo.currentTime = 0;
      battleBackgroundHandoffInProgress = false;
      return;
    }

    nextVideo.classList.add("is-active");
    currentVideo.classList.remove("is-active");
    activeBattleBackgroundIndex = nextIndex;
    currentVideo.pause();
    currentVideo.currentTime = 0;
    battleBackgroundHandoffInProgress = false;
    monitorBattleBackground(nextIndex);
  };

  if (typeof nextVideo.requestVideoFrameCallback === "function") {
    const callback = {
      video: nextVideo,
      id: nextVideo.requestVideoFrameCallback(revealNextVideo)
    };
    battleBackgroundPreload = callback;
  } else {
    const onPlaying = () => revealNextVideo();
    nextVideo.addEventListener("playing", onPlaying, { once: true });
    battleBackgroundPreload = {
      video: nextVideo,
      cancel: () => nextVideo.removeEventListener("playing", onPlaying)
    };
  }

  nextVideo.play().catch(() => {
    cancelBattleBackgroundCallback(battleBackgroundPreload);
    battleBackgroundPreload = null;
    battleBackgroundHandoffInProgress = false;

    if (battleBackgroundRunning && endedIndex === activeBattleBackgroundIndex) {
      currentVideo.currentTime = 0;
      currentVideo.play().then(() => monitorBattleBackground(endedIndex)).catch(() => {});
    }
  });
}

function startBattleBackground() {
  if (battleBackgroundRunning) {
    return;
  }

  battleBackgroundRunning = true;
  const currentVideo = elements.battleBackgroundVideos[activeBattleBackgroundIndex];
  currentVideo.play().then(() => {
    monitorBattleBackground(activeBattleBackgroundIndex);
  }).catch(() => {
    // The game stays usable if a browser blocks muted autoplay.
  });
}

function setView(viewName) {
  const attractIsActive = viewName === "attract";
  const battleIsActive = viewName === "battle";
  elements.attractView.hidden = !attractIsActive;
  elements.lobbyView.hidden = viewName !== "lobby";
  elements.battleView.hidden = !battleIsActive;
  elements.gameOverView.hidden = viewName !== "game-over";

  if (battleIsActive && !document.hidden) {
    startBattleBackground();
  } else if (battleBackgroundRunning) {
    stopBattleBackground();
  }

  if (!battleIsActive) {
    clearLiveBattleAnimations();
  }

  if (attractIsActive && !document.hidden) {
    startIdleBattle();
  } else {
    stopIdleBattle();
  }
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
  card.className = `combat-card player-card ${player.hp <= 0 ? "down is-defeated" : ""}`;
  card.dataset.playerId = player.id;
  card.style.setProperty("--fighter-color", player.color || "#ed1d24");
  card.style.setProperty("--fighter-accent", player.accent || "#f5ad0f");
  card.innerHTML = `
    <div class="combat-label">
      <span>Player ${Number(player.slot || 0) + 1}</span>
      <strong>${player.name}</strong>
    </div>
    <div class="hp-row">
      <span>HP</span>
      <div class="hp-track">
        <div class="hp-fill" style="width:${hpPercent(player)}%"></div>
        <strong class="hp-value">${player.hp}/${player.maxHp}</strong>
      </div>
    </div>
    <img class="combat-art" src="${player.asset}" alt="${player.name}" decoding="async">
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
  const previousSnapshot = lastBattleSnapshot;
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
    elements.monsterCard.classList.toggle("is-defeated", monster.hp <= 0);
    elements.monsterCard.style.setProperty("--fighter-color", monster.color || "#1d6e58");
    elements.monsterCard.style.setProperty("--fighter-accent", monster.accent || "#f5ad0f");
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
  } else if (state.status === "game-over") {
    elements.battleStatus.textContent = "Final blow!";
  } else {
    elements.battleStatus.textContent = readyCount >= aliveIds.length
      ? "Moves locked. Resolving now!"
      : `Now pick your move on your phone! ${readyCount}/${aliveIds.length} ready`;
  }

  const chosenMoves = Object.values(state.pendingMoves || {})
    .map((entry) => getMove(entry.moveId))
    .filter(Boolean);
  chosenMoves.forEach((move) => warmMoveAnimation(move, { urgent: true }));
  elements.lastMoves.textContent = chosenMoves.length ? `Locked moves: ${chosenMoves.map((move) => move.name).join(" + ")}` : "";
  renderLog(state.log);
  animateResolvingMoves(state);
  animateRoundOutcome(state, previousSnapshot);
  lastBattleSnapshot = captureBattleSnapshot(state);
}

function renderGameOver(state) {
  setView("game-over");
  const playersWon = state.winner === "players";
  elements.gameOverEyebrow.textContent = playersWon ? "All levels cleared" : "Battle lost";
  elements.winnerText.textContent = playersWon ? "Players win!" : "Monster wins";
  elements.gameOverMessage.textContent = playersWon
    ? `The curry party cleared all ${getLevelCount(state.mode || "solo")} levels. A fresh code will appear for the next battle.`
    : "The monster held the screen. A fresh code will appear for the next battle.";
}

function render(state) {
  warmSelectedCharacterAnimations(state);
  updateGameCodeLabels(state);

  if (state?.status !== "game-over" && gameOverRevealTimer) {
    window.clearTimeout(gameOverRevealTimer);
    gameOverRevealTimer = null;
  }

  if (!state || state.status === "attract") {
    renderAttract();
    return;
  }

  if (state.status === "lobby" || state.status === "character-select") {
    renderLobby(state);
    return;
  }

  if (state.status === "game-over") {
    if (!elements.battleView.hidden) {
      if (!gameOverRevealTimer) {
        renderBattle(state);
        gameOverRevealTimer = window.setTimeout(() => {
          gameOverRevealTimer = null;
          renderGameOver(state);
        }, 1650);
      }
      return;
    }

    renderGameOver(state);
    return;
  }

  renderBattle(state);
}

async function rotateToNewSession() {
  if (rotatingSession) {
    return;
  }

  rotatingSession = true;
  window.clearTimeout(gameOverTimer);
  window.clearTimeout(gameOverRevealTimer);
  gameOverRevealTimer = null;
  clearLiveBattleAnimations();
  levelAdvanceToken = null;
  resolvingToken = null;

  const previousRef = sessionRef;
  const previousGameId = gameId;
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  try {
    const nextGameId = await findAvailableGameId(previousGameId);
    if (previousRef) {
      await remove(previousRef);
    }

    await activateSession(nextGameId, true);
  } finally {
    rotatingSession = false;
  }
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
  const activeGameId = gameId;
  const activeSessionRef = sessionRef;
  await update(activeSessionRef, {
    status: "resolving",
    activeMoves: state.pendingMoves,
    lastActionAt: serverTimestamp()
  });

  const animationDelay = 1400
    + Math.max(0, getAlivePlayerIds(state).length - 1) * LIVE_MOVE_ANIMATION_SPACING_MS;

  window.setTimeout(async () => {
    if (gameId !== activeGameId) {
      return;
    }

    const snapshot = await get(activeSessionRef);
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

    await update(activeSessionRef, updatePayload);
    resolvingToken = null;
  }, animationDelay);
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
  const activeGameId = gameId;
  const activeSessionRef = sessionRef;
  window.setTimeout(async () => {
    if (gameId !== activeGameId) {
      return;
    }

    const snapshot = await get(activeSessionRef);
    const liveState = snapshot.val();

    if (!liveState || liveState.status !== "level-complete") {
      return;
    }

    await update(activeSessionRef, {
      ...prepareNextLevel(liveState),
      lastActionAt: serverTimestamp()
    });
  }, 4200);
}

function scheduleGameOverReset(state) {
  window.clearTimeout(gameOverTimer);

  if (state?.status === "game-over") {
    gameOverTimer = window.setTimeout(() => {
      rotateToNewSession().catch((error) => console.error("Could not rotate game code", error));
    }, 24000);
  }
}

function bindControls() {
  elements.resetButton.addEventListener("click", () => {
    rotateToNewSession().catch((error) => console.error("Could not reset game", error));
  });
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
  updateScreenScale();
  renderWebsiteQr();
  startIdleBattle();
  window.addEventListener("resize", scheduleScreenScaleUpdate);
  window.addEventListener("orientationchange", scheduleScreenScaleUpdate);
  window.addEventListener("load", renderWebsiteQr, { once: true });
  window.visualViewport?.addEventListener("resize", scheduleScreenScaleUpdate);
  window.visualViewport?.addEventListener("scroll", scheduleScreenScaleUpdate);
  document.addEventListener("fullscreenchange", scheduleScreenScaleUpdate);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopIdleBattle();
      if (battleBackgroundRunning) {
        stopBattleBackground();
      }
      clearLiveBattleAnimations();
      return;
    }

    if (!elements.attractView.hidden) {
      startIdleBattle();
    }
    if (!elements.battleView.hidden) {
      startBattleBackground();
    }
  });
  elements.battleBackgroundVideos.forEach((video, index) => {
    video.addEventListener("ended", () => handOffBattleBackground(index));
  });
  [elements.moveAnimation, elements.idleMoveAnimation].forEach((video) => {
    video?.addEventListener("ended", () => {
      video.classList.remove("is-playing");
      video.currentTime = 0;
    });
  });
  bindControls();

  await connectFirebase();

  const requestedGameId = getGameId(null);
  const storedGameId = window.localStorage.getItem(SCREEN_GAME_STORAGE_KEY);
  const preferredGameId = isFourDigitCode(requestedGameId)
    ? requestedGameId
    : isFourDigitCode(storedGameId)
      ? storedGameId
      : null;

  if (preferredGameId) {
    const snapshot = await get(ref(db, `sessions/${preferredGameId}`));
    const state = snapshot.val();
    if (state && !["closed", "game-over"].includes(state.status)) {
      await activateSession(preferredGameId, false);
      return;
    }
  }

  await activateSession(await findAvailableGameId(), true);
}

async function activateSession(nextGameId, createNew) {
  gameId = nextGameId;
  gameCode = formatGameCode(gameId);
  sessionRef = ref(db, `sessions/${gameId}`);
  window.localStorage.setItem(SCREEN_GAME_STORAGE_KEY, gameId);
  updateGameCodeLabels();

  if (createNew) {
    await set(sessionRef, createAttractSession(gameId, null, serverTimestamp()));
  }

  const activeGameId = gameId;
  unsubscribe = onValue(sessionRef, (nextSnapshot) => {
    if (gameId !== activeGameId) {
      return;
    }

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
