import { ENEMY, getMove } from "./game-data.js";
import { appendLog, clamp } from "./shared.js";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function cloneFighter(fighter) {
  return {
    ...fighter,
    hp: Number(fighter?.hp ?? fighter?.maxHp ?? 0),
    maxHp: Number(fighter?.maxHp ?? 0),
    shield: Number(fighter?.shield ?? 0),
    focus: Number(fighter?.focus ?? 0)
  };
}

function chooseEnemyMove(enemy) {
  const moves = enemy.moves?.length ? enemy.moves : ENEMY.moves;
  const healMove = moves.find((moveId) => getMove(moveId)?.heal);
  const guardMove = moves.find((moveId) => getMove(moveId)?.shield && !getMove(moveId)?.damage);
  const damageMoves = moves.filter((moveId) => getMove(moveId)?.damage);

  if (healMove && enemy.hp <= enemy.maxHp * 0.35 && Math.random() < 0.45) {
    return healMove;
  }

  if (guardMove && enemy.shield < 8 && Math.random() < 0.25) {
    return guardMove;
  }

  return damageMoves[randomInt(0, damageMoves.length - 1)] || moves[0];
}

function applyDamage(target, amount) {
  const incoming = Math.max(0, amount);
  const blocked = Math.min(target.shield, incoming);
  const damage = incoming - blocked;

  target.shield = Math.max(0, target.shield - blocked);
  target.hp = clamp(target.hp - damage, 0, target.maxHp);

  return { blocked, damage };
}

function applyMove(actor, target, move, targetName) {
  const messages = [];

  if (!move) {
    return messages;
  }

  if (move.focus) {
    actor.focus = clamp(actor.focus + move.focus, 0, 3);
    messages.push(`${actor.name} powered up.`);
  }

  if (move.shield) {
    actor.shield = clamp(actor.shield + move.shield, 0, 48);
    messages.push(`${actor.name} gained ${move.shield} shield.`);
  }

  if (move.heal) {
    const before = actor.hp;
    actor.hp = clamp(actor.hp + move.heal, 0, actor.maxHp);
    messages.push(`${actor.name} recovered ${actor.hp - before} HP.`);
  }

  if (move.damage) {
    let damage = move.damage + randomInt(-3, 4);

    if (actor.focus > 0) {
      damage = Math.round(damage * 1.35);
      actor.focus -= 1;
      messages.push(`${actor.name}'s focus made the hit stronger.`);
    }

    const result = applyDamage(target, damage);
    const blockText = result.blocked ? ` ${targetName} blocked ${result.blocked}.` : "";
    messages.push(`${actor.name} used ${move.name} for ${result.damage} damage.${blockText}`);
  }

  return messages;
}

export function resolveRound(state) {
  const player = cloneFighter(state.player);
  const enemy = cloneFighter(state.enemy);
  const turn = Number(state.turn || 1);
  const playerMove = getMove(state.pendingMove?.moveId) || getMove(player.moves?.[0]);
  const enemyMove = getMove(chooseEnemyMove(enemy));
  const messages = [];

  messages.push(...applyMove(player, enemy, playerMove, enemy.name));

  let winner = null;

  if (enemy.hp <= 0) {
    winner = "player";
    messages.push(`${enemy.name} is out of HP.`);
  } else {
    messages.push(...applyMove(enemy, player, enemyMove, player.name));

    if (player.hp <= 0) {
      winner = "enemy";
      messages.push(`${player.name} is out of HP.`);
    }
  }

  if (!winner) {
    player.shield = Math.floor(player.shield * 0.35);
    enemy.shield = Math.floor(enemy.shield * 0.35);
  }

  return {
    player,
    enemy,
    status: winner ? "game-over" : "battle",
    winner,
    turn: winner ? turn : turn + 1,
    roundResult: {
      playerMoveId: playerMove?.id || null,
      playerMoveName: playerMove?.name || "Move",
      enemyMoveId: enemyMove?.id || null,
      enemyMoveName: enemyMove?.name || "Move",
      messages,
      createdAt: Date.now()
    },
    log: appendLog(state.log, messages)
  };
}
