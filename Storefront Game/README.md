# Storefront Battle

Static HTML/CSS/JavaScript prototype for a storefront turn-based battle game. The display page runs on the big screen, and phones join through a QR code to choose a character and submit moves. Firebase Realtime Database stores the shared session state.

## Run locally

Serve the folder over HTTP:

```bash
python -m http.server 8000
```

Open the display:

```text
http://localhost:8000/index.html?gameId=storefront-1
```

The QR code points phones to:

```text
http://localhost:8000/controller.html?gameId=storefront-1
```

## Attract video

Put your looping gameplay video at:

```text
assets/gameplay-loop.mp4
```

The display already includes:

```html
<video autoplay muted loop playsinline>
  <source src="./assets/gameplay-loop.mp4" type="video/mp4">
</video>
```

If that file is missing, the screen shows a built-in animated fallback stage.

## Firebase

Your Firebase config is in `src/firebase.js`. The app uses Realtime Database at:

```text
sessions/{gameId}
```

For quick testing, publish `database.rules.json` from this project. These rules are intentionally open for a public prototype. For a real storefront deployment, protect writes with Firebase Auth, App Check, and server-side turn resolution through Cloud Functions so players cannot edit HP or moves from browser devtools.

Deploy static hosting with:

```bash
firebase deploy
```
