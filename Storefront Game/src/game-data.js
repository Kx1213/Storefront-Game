export const MOVES = Object.freeze({
  "sear-strike": {
    id: "sear-strike",
    name: "Sear Strike",
    damage: 27,
    description: "Heavy damage."
  },
  "pepper-burst": {
    id: "pepper-burst",
    name: "Pepper Burst",
    damage: 19,
    shield: 7,
    description: "Damage and a small guard."
  },
  "plating-guard": {
    id: "plating-guard",
    name: "Plating Guard",
    shield: 30,
    description: "Block the next hit."
  },
  "rally-meal": {
    id: "rally-meal",
    name: "Rally Meal",
    heal: 24,
    shield: 6,
    description: "Recover HP."
  },
  "tapioca-bolt": {
    id: "tapioca-bolt",
    name: "Tapioca Bolt",
    damage: 23,
    description: "Reliable damage."
  },
  "sugar-rush": {
    id: "sugar-rush",
    name: "Sugar Rush",
    damage: 15,
    heal: 12,
    description: "Hit and recover."
  },
  "bubble-guard": {
    id: "bubble-guard",
    name: "Bubble Guard",
    shield: 32,
    description: "Strong block."
  },
  "steep-focus": {
    id: "steep-focus",
    name: "Steep Focus",
    focus: 1,
    shield: 8,
    description: "Boost your next attack."
  },
  "wok-slash": {
    id: "wok-slash",
    name: "Wok Slash",
    damage: 25,
    description: "Fast damage."
  },
  "broth-splash": {
    id: "broth-splash",
    name: "Broth Splash",
    damage: 13,
    heal: 16,
    description: "Damage and heal."
  },
  "flash-step": {
    id: "flash-step",
    name: "Flash Step",
    shield: 24,
    focus: 1,
    description: "Block and charge up."
  },
  "chili-combo": {
    id: "chili-combo",
    name: "Chili Combo",
    damage: 31,
    description: "Big damage."
  },
  "cleaver-line": {
    id: "cleaver-line",
    name: "Cleaver Line",
    damage: 22,
    description: "Enemy attack."
  },
  "steam-wave": {
    id: "steam-wave",
    name: "Steam Wave",
    damage: 18,
    shield: 5,
    description: "Enemy attack."
  },
  "prep-counter": {
    id: "prep-counter",
    name: "Prep Counter",
    shield: 26,
    focus: 1,
    description: "Enemy guard."
  },
  "staff-meal": {
    id: "staff-meal",
    name: "Staff Meal",
    heal: 20,
    description: "Enemy recovery."
  }
});

export const CHARACTERS = Object.freeze([
  {
    id: "flame-chef",
    name: "Flame Chef",
    title: "Burst damage",
    maxHp: 124,
    color: "#e34b35",
    accent: "#ffd166",
    asset: "./assets/flame-chef.svg",
    moves: ["sear-strike", "pepper-burst", "plating-guard", "rally-meal"]
  },
  {
    id: "boba-mage",
    name: "Boba Mage",
    title: "Control and heal",
    maxHp: 116,
    color: "#6a4c93",
    accent: "#4ecdc4",
    asset: "./assets/boba-mage.svg",
    moves: ["tapioca-bolt", "sugar-rush", "bubble-guard", "steep-focus"]
  },
  {
    id: "noodle-ninja",
    name: "Noodle Ninja",
    title: "Fast finisher",
    maxHp: 108,
    color: "#1b998b",
    accent: "#ff9f1c",
    asset: "./assets/noodle-ninja.svg",
    moves: ["wok-slash", "broth-splash", "flash-step", "chili-combo"]
  }
]);

export const ENEMY = Object.freeze({
  id: "rival-chef",
  name: "Rival Chef",
  title: "House challenger",
  maxHp: 138,
  color: "#263238",
  accent: "#ff6b6b",
  asset: "./assets/rival-chef.svg",
  moves: ["cleaver-line", "steam-wave", "prep-counter", "staff-meal"]
});

export function getCharacter(characterId) {
  return CHARACTERS.find((character) => character.id === characterId) || CHARACTERS[0];
}

export function getMove(moveId) {
  return MOVES[moveId] || null;
}

export function getMoves(moveIds) {
  return moveIds.map(getMove).filter(Boolean);
}
