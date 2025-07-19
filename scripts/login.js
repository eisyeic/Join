import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


// onload background and icon animation
let layout = document.getElementById('layout');
let logoBlue = document.getElementById('logo-blue');
let logoWhite = document.getElementById('logo-white');

setTimeout(() => {
  layout.classList.add('bg-white');
  logoWhite.style.opacity = "0";
  logoBlue.style.opacity = "1";
}, 500);


// change background and icon animation by clicking on sign up button
let signUpButtonBox  = document.getElementById('sign-up-top-right-box');
let signUpBottomBox = document.getElementById('sign-up-bottom-box')
let loginBox = document.getElementById('login-box');
let signUpBox = document.getElementById('sign-up-box');

function openSignUpBox() {
  let isNowBlue = layout.classList.toggle('bg-blue');
  layout.classList.toggle('bg-white', !isNowBlue);
  if (isNowBlue) {
    logoWhite.style.opacity = "1";
    logoBlue.style.opacity = "0";
  } else {
    logoWhite.style.opacity = "0";
    logoBlue.style.opacity = "1";
  }
  signUpButtonBox.classList.add('d-none');
  signUpBottomBox.classList.add('d-none-important'); 
  loginBox.classList.add('d-none');
  signUpBox.classList.remove('d-none');
}


// back arrow functionality
let goBack = document.getElementById('go-back');

goBack.addEventListener("click", () => {
  let isNowBlue = layout.classList.toggle('bg-blue');
  layout.classList.toggle('bg-white', !isNowBlue);

  if (isNowBlue) {
    logoWhite.style.opacity = "1";
    logoBlue.style.opacity = "0";
  } else {
    logoWhite.style.opacity = "0";
    logoBlue.style.opacity = "1";
  }
  signUpButtonBox.classList.remove('d-none');
  signUpBottomBox.classList.remove('d-none-important');
  loginBox.classList.remove('d-none');
  signUpBox.classList.add('d-none');
})


// change the visibility icon on input password
let toggleIcon = document.getElementById('togglePassword');
let error = document.getElementById('errorMessage');
let errorSignUp = document.getElementById('error-sign-up');
let passwordInput = document.getElementById("login-password");
let isVisible = false;

function updateIcon() {
  let value = passwordInput.value;
  if (!value) {
    toggleIcon.src = "./assets/log_in_sign_up/icons/lock.svg";
    toggleIcon.classList.remove('cursor-pointer');
  } else if (isVisible) {
    toggleIcon.src = "./assets/log_in_sign_up/icons/visibility.svg";
    toggleIcon.classList.add('cursor-pointer');
  } else {
    toggleIcon.src = "./assets/log_in_sign_up/icons/visibility_off.svg";
    toggleIcon.classList.add('cursor-pointer');
  }
}

// onclick eye will show / hide password text
toggleIcon.addEventListener("click", function () {
  if (!passwordInput.value) return;
  isVisible = !isVisible;
  passwordInput.type = isVisible ? "text" : "password";
  updateIcon();
});


// change password visibility icon on input
passwordInput.addEventListener("input", function () {
  if (!passwordInput.value) {
    isVisible = false;
    passwordInput.type = "password";
    error.innerHTML = "";
  }
  updateIcon();
})


// check email validation
let emailInput = document.getElementById('login-email');
let emailSignUpInput = document.getElementById('sign-up-email');

function validation() {
  let email = this.value.trim();
  let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (email && !emailPattern.test(email)) {
    if (this.id === 'login-email') {
      error.innerHTML = "Check your email. Please try again.";
      this.parentElement.style.borderColor = "var(--error-color)";
    } else if (this.id === 'sign-up-email') {
      errorSignUp.innerHTML = "Check your email. Please try again.";
      this.parentElement.style.borderColor = "var(--error-color)";
    }
  }
}


// check email validation on blur event / leave input field
emailInput.addEventListener("blur", validation);
emailSignUpInput.addEventListener("blur", validation);


// clear error on input email
emailInput.addEventListener("input", function () {
  error.innerHTML = "";
  this.parentElement.style.borderColor = "";
});


//clear error on input password
passwordInput.addEventListener("input", function () {
  error.innerHTML = "";
  this.parentElement.style.borderColor = "";
});


// clear error on input email sign up
emailSignUpInput.addEventListener("input", function () {
  errorSignUp.innerHTML = "";
  this.parentElement.style.borderColor = "";
});


// confirm box change icon
let confirmBox = document.getElementById('confirm');

confirmBox.addEventListener('click', function() {
  this.classList.toggle('checked');
  signUpButton.classList.toggle('sign-up-button');
})


// login function
let loginButton = document.getElementById('login-button');

function logIn() {
  let email = emailInput.value.trim();
  let password = passwordInput.value;
  if (password.length < 6) {
    error.innerHTML = "Check your email and password. Please try again.";
    passwordInput.parentElement.style.borderColor = 'var(--error-color)';
    return;
  }
  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      console.log("Eingeloggt:", userCredential.user.email);
      window.location.href = "summary-board.html";
    })
    .catch(err => {
      error.innerHTML = "Check your email and password. Please try again.";
      emailInput.parentElement.style.borderColor = 'var(--error-color)'; 
      passwordInput.parentElement.style.borderColor = 'var(--error-color)';
    });
};


// event listener for Enter key
document.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    if (!loginBox.classList.contains("d-none")) {
      logIn();
    } else if (!signUpBox.classList.contains("d-none")) {
      signUp();
    }
  }
});


// event listener for login button
loginButton.addEventListener("click", logIn);


// sign up function
let slideInMessage = document.getElementById('slide-in-banner');
let signupPageButton = document.getElementById('sign-up-page-button');
let signUpButton = document.getElementById('sign-up-button');

function signUp() {
  const name = document.getElementById("name").value.trim();
  const email = emailSignUpInput.value.trim();
  const password = document.getElementById("sign-up-password").value;
  const confirm = document.getElementById("confirm-password").value;
  const accepted = confirmBox.classList.contains("checked");

  resetSignUpErrors();

  if (!allFieldsFilled(name, email, password, confirm)) return;
  if (!isValidEmail(email)) return;
  if (!isValidPassword(password, "signup")) return;
  if (password !== confirm) {
    showError(errorSignUp, "Passwords do not match.");
    return;
  }
  if (!accepted) {
    showError(errorSignUp, "You must accept the privacy policy.");
    return;
  }
  registerUser(email, password);
}


// check if all fields are filled
function allFieldsFilled(name, email, pw, confirmPw) {
  if (!name || !email || !pw || !confirmPw) {
    showError(errorSignUp, "Please fill out all fields.");
    return false;
  }
  return true;
}


// email validation function
function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email)) {
    showError(errorSignUp, "Check your email. Please try again.");
    emailSignUpInput.parentElement.style.borderColor = "var(--error-color)";
    return false;
  }
  return true;
}


// password validation function
function isValidPassword(password, context = "signup") {
  if (password.length < 6) {
    const msg = "Password must be at least 6 characters.";
    if (context === "signup") {
      showError(errorSignUp, msg);
      document.getElementById("sign-up-password").parentElement.style.borderColor = "#FF8190";
    } else {
      showError(error, msg);
      passwordInput.parentElement.style.borderColor = "#FF8190";
    }
    return false;
  }
  return true;
}


// show error message function
function showError(element, message) {
  element.innerHTML = message;
}


// reset sign up errors
function resetSignUpErrors() {
  errorSignUp.innerHTML = "";
  emailSignUpInput.parentElement.style.borderColor = "";
}


// register user function
function registerUser(email, password) {
  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      console.log("Benutzer registriert:", userCredential.user.email);
      layout.style.opacity = "0.5";
      slideInMessage.classList.add("visible");
      setTimeout(() => {
        slideInMessage.classList.remove("visible");
        layout.style.opacity = "1";
        goBack.click();
      }, 1200);
    })
    .catch(error => {
      console.error("Registrierungsfehler:", error);
      showError(errorSignUp, error.message);
    });
}

// event listeners for sign up button and sign up page button
signupPageButton.addEventListener("click", openSignUpBox);
signUpButton.addEventListener("click", signUp);