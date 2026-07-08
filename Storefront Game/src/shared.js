import { CHARACTERS, ENEMY, getCharacter } from "./game-data.js";

export function sanitizeGameId(value) {
  if (!value) {
    return null;
  }

  const clean = String(value).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 48);
  return clean || null;
}

export function getGameId(fallback = null) {
  const params = new URLSearchParams(window.location.search);
  return sanitizeGameId(params.get("gameId")) || sanitizeGameId(fallback);
}

export function buildJoinUrl(gameId) {
  const url = new URL("controller.html", window.location.href);
  url.search = "";
  url.searchParams.set("gameId", gameId);
  return url.toString();
}

export function formatGameCode(gameId) {
  return sanitizeGameId(gameId).replace(/-/g, " ").toUpperCase();
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function hpPercent(fighter) {
  if (!fighter || !fighter.maxHp) {
    return 0;
  }

  return clamp(Math.round((fighter.hp / fighter.maxHp) * 100), 0, 100);
}

export function getOrCreatePlayerId(gameId) {
  const key = `storefront-player:${gameId}`;
  const stored = window.localStorage.getItem(key);

  if (stored) {
    return stored;
  }

  const generated = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  window.localStorage.setItem(key, generated);
  return generated;
}

export function buildPlayer(characterId, playerId) {
  const character = getCharacter(characterId);

  return {
    id: playerId,
    characterId: character.id,
    name: character.name,
    title: character.title,
    maxHp: character.maxHp,
    hp: character.maxHp,
    shield: 0,
    focus: 0,
    color: character.color,
    accent: character.accent,
    asset: character.asset,
    moves: character.moves
  };
}

export function buildEnemy() {
  return {
    id: ENEMY.id,
    characterId: ENEMY.id,
    name: ENEMY.name,
    title: ENEMY.title,
    maxHp: ENEMY.maxHp,
    hp: ENEMY.maxHp,
    shield: 0,
    focus: 0,
    color: ENEMY.color,
    accent: ENEMY.accent,
    asset: ENEMY.asset,
    moves: ENEMY.moves
  };
}

export function createAttractSession(gameId, joinUrl, timestampValue) {
  return {
    gameId,
    joinUrl,
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
    createdAt: timestampValue,
    lastActionAt: timestampValue
  };
}

export function appendLog(currentLog, entries, limit = 8) {
  const base = Array.isArray(currentLog) ? currentLog : [];
  return [...base, ...entries].slice(-limit);
}

export function listCharacters() {
  return CHARACTERS;
}
