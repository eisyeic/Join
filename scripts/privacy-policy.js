import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

onAuthStateChanged(auth, (user) => {
  const navLoginBox = document.querySelector('.nav-login-box');
  const nav = document.querySelector('.nav');
  
  if (user && user.email !== 'guest@login.de') {
    navLoginBox.classList.add('d-none');
    nav.classList.remove('d-none');
  } else {
    navLoginBox.classList.remove('d-none');
    nav.classList.add('d-none');
  }
});