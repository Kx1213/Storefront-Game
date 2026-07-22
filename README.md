# Monster Curry Storefront Battle

Static HTML/CSS/JavaScript storefront battle prototype. The big screen shows a tall portrait battle display, and phones join from the Monster Curry website by entering the game code shown on the screen.

## What Changed From The Settings PDF

- Replaced the old roster with the 8 Monster Curry characters from `Storefront Game Settings.pdf`.
- Added the PNG character art from `D:\Capstone\Curry Personas` under `assets/characters`.
- Added a lobby for up to 2 players.
- First player sees "Waiting for other players to join" and can press `Start Single Player`.
- If a second player enters the code before the solo battle starts, the game switches to co-op automatically.
- Added 5 solo levels and 5 harder co-op levels.
- Replaced the generic monster art with five enemy designs: Curry Goblin, Root Curry Brute, Sporeback Brute, Rotten Goblin, and Blaze Fiend.
- Added enemy-specific move sets for all five encounters, culminating in Blaze Fiend.
- Added on-demand transparent WebM move animations with optimized MP4 fallbacks for all eight playable characters, without preloading the full animation library.
- Battle is cooperative: 1 or 2 players fight the monster, reduce monster HP to 0, and advance through levels.
- The big screen uses a fixed 577×1439 design canvas and scales it uniformly, so every display with the same ratio has the same composition.
- The screen creates a random four-digit game code and replaces it after each completed game.
- The phone UI follows the red Monster Curry header and character/move flow shown in the PDF.

## Run Locally

Serve this folder over HTTP:

```bash
python -m http.server 8000
```

Open the big screen:

```text
http://localhost:8000/index.html
```

Phones should join through the Monster Curry personality website. Tap the floating `Battle` button there and enter the four-digit code shown on the big screen.

## Monster Curry Website Integration

The phone controller is integrated into the existing Monster Curry personality website files in:

```text
D:\Monster-Curry-Personality-Prototype-Website-Prototype
```

Serve that website separately, tap the floating `Battle` button, and enter the storefront game code. The website only accepts an active four-digit session created by the big screen.

## Attract Background

The attract screen uses the built-in branded background and simulated battle preview. It does not request a missing trailer file, which keeps startup fast and avoids a failed media request.

## Firebase

Firebase config is in `src/firebase.js`. Realtime Database state is stored at:

```text
sessions/{gameId}
```

For prototype testing, `database.rules.json` is open. For a real deployment, add Firebase Auth, App Check, and server-side battle resolution with Cloud Functions.

## Assumption

The PDF shows Teppa Spark's title and artwork, but no stats or moves. I added a balanced placeholder kit:

- HP 1000
- ATK 100
- Precision Skewer
- Spark Plate
- Focus Flambe
- Final Showpiece
