# Monster Curry Storefront Battle

Static HTML/CSS/JavaScript storefront battle prototype. The big screen shows a tall portrait battle display, and phones join from the Monster Curry website by entering the game code shown on the screen.

## Web Game Features

- Uses the eight approved Monster Curry characters.
- Stores the optimized web character art under `assets/characters`.
- Added a lobby for up to 2 players.
- First player sees "Waiting for other players to join" and can press `Start Single Player`.
- If a second player enters the code before the solo battle starts, the game switches to co-op automatically.
- Added 5 solo levels and 5 harder co-op levels.
- Replaced the generic monster art with five enemy designs: Curry Goblin, Root Curry Brute, Sporeback Brute, Rotten Goblin, and Blaze Fiend.
- Added enemy-specific move sets for all five encounters, culminating in Blaze Fiend.
- Added on-demand transparent move animations for all eight playable characters. Live kiosk clips are optimized to 480 × 480 at 24 fps and retain their alpha channel, while the original full-resolution sources remain available.
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

## Attract and Battle Backgrounds

The unattended attract screen cycles through all five monsters. Each simulated fight uses the matching lightweight WebP environment from `assets/backgrounds`, while one upcoming scene is preloaded to keep the transition quick. The active QR-controlled game retains the original optimized `assets/battle-background.mp4` presentation.

The idle preview also rotates through the playable characters and demonstrates one signature move per character. It uses dedicated 512 × 512 WebP character art plus 320 × 320 transparent clips, and plays each clip only on the first player attack of a simulated fight; later attacks use lightweight CSS motion. On lower-powered kiosks, the preview automatically stays with lightweight CSS motion. Only the current short clip is warmed, avoiding a full animation-library download at startup.

When players lock their moves, the kiosk gives each selected transparent clip up to 10 seconds to become ready. A clip that times out or fails falls back to the lightweight CSS attack for that move only; later moves still get their own animation attempt. During playback, the background briefly holds its current frame so the kiosk decodes only the foreground clip, and co-op moves remain serialized to prevent two alpha videos decoding together. Append `?animationQuality=high` to use the original 640 × 640 transparent clips on a higher-powered kiosk, or `?animationQuality=static` to use CSS-only attacks on hardware without smooth VP9 playback.

## Firebase

Firebase config is in `src/firebase.js`. Realtime Database state is stored at:

```text
sessions/{gameId}
```

Publish the Realtime Database rules separately from the website:

```bash
firebase deploy --only database --project storefront-game
```

A GitHub push updates the web files but does not deploy Firebase rules. For prototype testing, `database.rules.json` allows public access only below `sessions`. For a production deployment, add Firebase Auth, App Check, and server-side battle resolution with Cloud Functions.

## Assumption

The source settings provide Teppa Spark's title and artwork, but no stats or moves. The web game uses this balanced placeholder kit:

- HP 1000
- ATK 100
- Precision Skewer
- Spark Plate
- Focus Flambe
- Final Showpiece
