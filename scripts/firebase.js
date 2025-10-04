/**
 * @file Firebase configuration and initialization.
 * Exports app and auth instances for use across the application.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/**
 * Firebase configuration object containing API keys and project settings.
 * @type {Object}
 */
const firebaseConfig = {
  apiKey: "AIzaSyDNIOLYyAcEXZZk95zleESHGCX2I2DJjGo",
  authDomain: "remotestorage-9778b.firebaseapp.com",
  databaseURL: "https://remotestorage-9778b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "remotestorage-9778b",
  storageBucket: "remotestorage-9778b.firebasestorage.app",
  messagingSenderId: "1046547705686",
  appId: "1:1046547705686:web:d274e4a14478ea55bcf0f7"
};

/**
 * Initialized Firebase app instance.
 * @type {FirebaseApp}
 */
const app = initializeApp(firebaseConfig);

/**
 * Firebase authentication instance.
 * @type {Auth}
 */
const auth = getAuth(app);

export { auth, app };