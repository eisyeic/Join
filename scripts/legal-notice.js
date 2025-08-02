import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

onAuthStateChanged(auth, (user) => {
  const navLoginBox = document.querySelector('.nav-login-box');
  const nav = document.querySelector('.nav');
  const navBox = document.querySelector('.nav-box');
  const navLoginBoxMobile = document.querySelector('.nav-login-box-mobile');
  
  if (user && user.email !== 'guest@login.de') {
    navLoginBox.classList.add('d-none');
    nav.classList.remove('d-none');
    navBox.classList.remove('d-none');
    navLoginBoxMobile.classList.add('d-none');
  } else {
    navLoginBox.classList.remove('d-none');
    nav.classList.add('d-none');
    navBox.classList.add('d-none');
    navLoginBoxMobile.classList.remove('d-none');
  }
});