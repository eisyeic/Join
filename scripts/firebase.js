import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbEjsMDR3cREofPfBfMT7jFlPZQ5sAVLI",
  authDomain: "mytest-27fda.firebaseapp.com",
  databaseURL:
    "https://mytest-27fda-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "mytest-27fda",
  storageBucket: "mytest-27fda.firebasestorage.app",
  messagingSenderId: "862915113613",
  appId: "1:862915113613:web:03541550960b76f38128c4",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };