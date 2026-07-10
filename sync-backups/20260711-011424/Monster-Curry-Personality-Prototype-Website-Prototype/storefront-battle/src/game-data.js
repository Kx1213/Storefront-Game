export const MOVES = Object.freeze({
  "crispy-slash": {
    id: "crispy-slash",
    name: "Crispy Slash",
    description: "Deals 25 Power damage to the monster.",
    target: "monster",
    power: 25
  },
  "heros-courage": {
    id: "heros-courage",
    name: "Hero's Courage",
    description: "Increase own Attack by 20% for 2 turns.",
    target: "self",
    attackUpPct: 0.2,
    duration: 2
  },
  "comfort-meal": {
    id: "comfort-meal",
    name: "Comfort Meal",
    description: "Heal self for 20% HP.",
    target: "self",
    healPct: 0.2
  },
  "counter-guard": {
    id: "counter-guard",
    name: "Counter Guard",
    description: "Take 50% less damage this turn and counter if hit.",
    target: "self",
    damageReductionPct: 0.5,
    counterPower: 15,
    duration: 1
  },
  "vine-whip": {
    id: "vine-whip",
    name: "Vine Whip",
    description: "Deals 20 Power damage.",
    target: "monster",
    power: 20
  },
  "sharing-feast": {
    id: "sharing-feast",
    name: "Sharing Feast",
    description: "Heal all allies by 15% HP.",
    target: "all-allies",
    healPct: 0.15
  },
  "rally-together": {
    id: "rally-together",
    name: "Rally Together",
    description: "Increase all allies' Attack by 20% for 2 turns.",
    target: "all-allies",
    attackUpPct: 0.2,
    duration: 2
  },
  "tangling-vines": {
    id: "tangling-vines",
    name: "Tangling Vines",
    description: "Reduce the monster's Attack by 20% for 2 turns.",
    target: "monster",
    attackDownPct: 0.2,
    duration: 2
  },
  "mega-chomp": {
    id: "mega-chomp",
    name: "Mega Chomp",
    description: "Deals 30 Power damage.",
    target: "monster",
    power: 30
  },
  "devour": {
    id: "devour",
    name: "Devour",
    description: "Damage the monster and recover 50% of damage dealt.",
    target: "monster",
    power: 24,
    lifestealPct: 0.5
  },
  "belly-shield": {
    id: "belly-shield",
    name: "Belly Shield",
    description: "Gain a shield equal to 25% Max HP.",
    target: "self",
    shieldPct: 0.25
  },
  "hungry-challenge": {
    id: "hungry-challenge",
    name: "Hungry Challenge",
    description: "Taunt the monster for 2 turns.",
    target: "self",
    tauntTurns: 2
  },
  "egg-toss": {
    id: "egg-toss",
    name: "Egg Toss",
    description: "Deals 15 Power damage.",
    target: "monster",
    power: 15
  },
  "fluffy-hug": {
    id: "fluffy-hug",
    name: "Fluffy Hug",
    description: "Heal the lowest-HP ally by 30% HP.",
    target: "lowest-ally",
    healPct: 0.3
  },
  "sunny-side-up": {
    id: "sunny-side-up",
    name: "Sunny Side Up",
    description: "Remove debuffs from the lowest-HP ally.",
    target: "lowest-ally",
    cleanse: true
  },
  "sweet-dreams": {
    id: "sweet-dreams",
    name: "Sweet Dreams",
    description: "Give an ally damage reduction and regeneration for 2 turns.",
    target: "lowest-ally",
    damageReductionPct: 0.2,
    regenPct: 0.1,
    duration: 2
  },
  "cheese-wheel": {
    id: "cheese-wheel",
    name: "Cheese Wheel",
    description: "Deals 20 Power damage.",
    target: "monster",
    power: 20
  },
  "melted-cheese": {
    id: "melted-cheese",
    name: "Melted Cheese",
    description: "Shield the lowest-HP ally for 30% Max HP.",
    target: "lowest-ally",
    shieldPct: 0.3
  },
  "cover-up": {
    id: "cover-up",
    name: "Cover Up",
    description: "Redirect attacks from the weakest ally to Cheezu.",
    target: "lowest-ally",
    cover: true,
    duration: 1
  },
  "comfort-feast": {
    id: "comfort-feast",
    name: "Comfort Feast",
    description: "Heal all allies and increase Defense for 2 turns.",
    target: "all-allies",
    healPct: 0.15,
    damageReductionPct: 0.2,
    duration: 2
  },
  "noodle-strike": {
    id: "noodle-strike",
    name: "Noodle Strike",
    description: "Deals 25 Power damage.",
    target: "monster",
    power: 25
  },
  "slurp-combo": {
    id: "slurp-combo",
    name: "Slurp Combo",
    description: "Attack twice, each hit dealing 15 Power.",
    target: "monster",
    hits: [15, 15]
  },
  "cold-broth": {
    id: "cold-broth",
    name: "Cold Broth",
    description: "Increase own Attack by 20% for 2 turns.",
    target: "self",
    attackUpPct: 0.2,
    duration: 2
  },
  "finishing-slurp": {
    id: "finishing-slurp",
    name: "Finishing Slurp",
    description: "Deals 40 Power, +50% if monster is below 40% HP.",
    target: "monster",
    power: 40,
    executeBelowPct: 0.4,
    executeBonusPct: 0.5
  },
  "sizzling-plate": {
    id: "sizzling-plate",
    name: "Sizzling Plate",
    description: "Deals 35 Power damage.",
    target: "monster",
    power: 35
  },
  "flame-burst": {
    id: "flame-burst",
    name: "Flame Burst",
    description: "Deals 20 Power and burns for 5% Max HP for 2 turns.",
    target: "monster",
    power: 20,
    burnPct: 0.05,
    burnTurns: 2
  },
  "heat-up": {
    id: "heat-up",
    name: "Heat Up",
    description: "Increase own Attack by 30% for 2 turns.",
    target: "self",
    attackUpPct: 0.3,
    duration: 2
  },
  "grand-performance": {
    id: "grand-performance",
    name: "Grand Performance",
    description: "Deals 60 Power, then lowers own Defense next turn.",
    target: "monster",
    power: 60,
    selfDefenseDownPct: 0.2,
    selfDefenseDownTurns: 1
  },
  "precision-skewer": {
    id: "precision-skewer",
    name: "Precision Skewer",
    description: "Deals 28 Power damage.",
    target: "monster",
    power: 28
  },
  "spark-plate": {
    id: "spark-plate",
    name: "Spark Plate",
    description: "Deals 18 Power and lowers monster Attack for 2 turns.",
    target: "monster",
    power: 18,
    attackDownPct: 0.15,
    duration: 2
  },
  "focus-flambe": {
    id: "focus-flambe",
    name: "Focus Flambe",
    description: "Increase own Attack by 25% for 2 turns.",
    target: "self",
    attackUpPct: 0.25,
    duration: 2
  },
  "final-showpiece": {
    id: "final-showpiece",
    name: "Final Showpiece",
    description: "Deals 45 Power and gains a small shield.",
    target: "monster",
    power: 45,
    selfShieldPct: 0.1
  },
  "monster-claw": {
    id: "monster-claw",
    name: "Monster Claw",
    description: "A direct monster strike.",
    target: "player",
    power: 18
  },
  "curry-splash": {
    id: "curry-splash",
    name: "Curry Splash",
    description: "Hits one player and lowers Attack.",
    target: "player",
    power: 15,
    attackDownPct: 0.15,
    duration: 2
  },
  "spice-roar": {
    id: "spice-roar",
    name: "Spice Roar",
    description: "Lowers all players' Attack.",
    target: "all-players",
    attackDownPct: 0.15,
    duration: 2
  },
  "pot-slam": {
    id: "pot-slam",
    name: "Pot Slam",
    description: "A heavy monster strike.",
    target: "player",
    power: 26
  },
  "monster-guard": {
    id: "monster-guard",
    name: "Monster Guard",
    description: "The monster gains a shield.",
    target: "self",
    shieldPct: 0.12
  },
  "mega-stomp": {
    id: "mega-stomp",
    name: "Mega Stomp",
    description: "A dangerous late-level strike.",
    target: "player",
    power: 36
  }
});

export const CHARACTERS = Object.freeze([
  {
    id: "katsu-chan",
    name: "Katsu-Chan",
    title: "The Classic Comfort Hero",
    maxHp: 1100,
    atk: 90,
    color: "#f08a24",
    accent: "#ffd15c",
    asset: "./assets/characters/katsu-chan.png",
    moves: ["crispy-slash", "heros-courage", "comfort-meal", "counter-guard"]
  },
  {
    id: "monstora-sharemi",
    name: "Monstora Sharemi",
    title: "The Social Feast Buddy",
    maxHp: 900,
    atk: 70,
    color: "#4c9a62",
    accent: "#ffcf5a",
    asset: "./assets/characters/monstora-sharemi.png",
    moves: ["vine-whip", "sharing-feast", "rally-together", "tangling-vines"]
  },
  {
    id: "giga-nomu",
    name: "Giga Nomu",
    title: "The Big Appetite Beast",
    maxHp: 1500,
    atk: 80,
    color: "#9b5a2e",
    accent: "#f5ad0f",
    asset: "./assets/characters/giga-nomu.png",
    moves: ["mega-chomp", "devour", "belly-shield", "hungry-challenge"]
  },
  {
    id: "tamago-puffy",
    name: "Tamago Puffy",
    title: "The Soft & Cozy Dreamer",
    maxHp: 950,
    atk: 60,
    color: "#f7c746",
    accent: "#f67280",
    asset: "./assets/characters/tamago-puffy.png",
    moves: ["egg-toss", "fluffy-hug", "sunny-side-up", "sweet-dreams"]
  },
  {
    id: "cheezu-mellow",
    name: "Cheezu Mellow",
    title: "The Cheesy Comfort Lover",
    maxHp: 1200,
    atk: 80,
    color: "#f5ad0f",
    accent: "#ed1d24",
    asset: "./assets/characters/cheezu-mellow.png",
    moves: ["cheese-wheel", "melted-cheese", "cover-up", "comfort-feast"]
  },
  {
    id: "ramy-noodleton",
    name: "Ramy Noodleton",
    title: "The Chill Slurper",
    maxHp: 850,
    atk: 120,
    color: "#db8b41",
    accent: "#ffe48a",
    asset: "./assets/characters/ramy-noodleton.png",
    moves: ["noodle-strike", "slurp-combo", "cold-broth", "finishing-slurp"]
  },
  {
    id: "hot-sizz",
    name: "Hot Sizz",
    title: "The Hotplate Performer",
    maxHp: 850,
    atk: 140,
    color: "#ed1d24",
    accent: "#f5ad0f",
    asset: "./assets/characters/hot-sizz.png",
    moves: ["sizzling-plate", "flame-burst", "heat-up", "grand-performance"]
  },
  {
    id: "teppa-spark",
    name: "Teppa Spark",
    title: "The Precision Show Chef",
    maxHp: 1000,
    atk: 100,
    color: "#b01c42",
    accent: "#ffa12b",
    asset: "./assets/characters/teppa-spark.jpg",
    moves: ["precision-skewer", "spark-plate", "focus-flambe", "final-showpiece"],
    assumed: true
  }
]);

export const LEVELS = Object.freeze({
  solo: [
    { name: "Level 1: Curry Scout", maxHp: 820, atk: 70, moves: ["monster-claw", "curry-splash"] },
    { name: "Level 2: Sauce Brute", maxHp: 1050, atk: 78, moves: ["monster-claw", "curry-splash", "monster-guard"] },
    { name: "Level 3: Spice Crusher", maxHp: 1320, atk: 86, moves: ["pot-slam", "spice-roar", "monster-guard"] },
    { name: "Level 4: Monster Curry Titan", maxHp: 1580, atk: 94, moves: ["pot-slam", "curry-splash", "mega-stomp"] },
    { name: "Level 5: Final Curry Monster", maxHp: 1900, atk: 104, moves: ["mega-stomp", "spice-roar", "monster-guard"] }
  ],
  multiplayer: [
    { name: "Level 1: Curry Scout Duo", maxHp: 1400, atk: 82, moves: ["monster-claw", "curry-splash", "spice-roar"] },
    { name: "Level 2: Sauce Brute Duo", maxHp: 1780, atk: 92, moves: ["monster-claw", "pot-slam", "monster-guard"] },
    { name: "Level 3: Spice Crusher Duo", maxHp: 2180, atk: 102, moves: ["pot-slam", "spice-roar", "monster-guard"] },
    { name: "Level 4: Monster Curry Titan Duo", maxHp: 2650, atk: 112, moves: ["pot-slam", "curry-splash", "mega-stomp"] },
    { name: "Level 5: Final Curry Monster Duo", maxHp: 3200, atk: 124, moves: ["mega-stomp", "spice-roar", "monster-guard"] }
  ]
});

export const MONSTER_ASSET = "./assets/monster-curry-beast.svg";

export function getCharacter(characterId) {
  return CHARACTERS.find((character) => character.id === characterId) || CHARACTERS[0];
}

export function getMove(moveId) {
  return MOVES[moveId] || null;
}

export function getMoves(moveIds) {
  return moveIds.map(getMove).filter(Boolean);
}

export function getLevel(mode, levelIndex) {
  const levels = LEVELS[mode] || LEVELS.solo;
  return levels[Math.min(Math.max(levelIndex, 0), levels.length - 1)];
}

export function getLevelCount(mode) {
  return (LEVELS[mode] || LEVELS.solo).length;
}
