import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBq5lzgJAY4H_7py32FCSHTnxuwvU-1Ixk",
  authDomain: "storefront-game.firebaseapp.com",
  databaseURL: "https://storefront-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "storefront-game",
  storageBucket: "storefront-game.firebasestorage.app",
  messagingSenderId: "805711728537",
  appId: "1:805711728537:web:9aace7f18cd32020e78d08"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getDatabase(firebaseApp);
