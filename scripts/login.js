const layout = document.getElementById('layout');
const logoBlue = document.getElementById('logo-blue');
const logoWhite = document.getElementById('logo-white');

const signUpTop = document.getElementById('sign-up');
const signUpBottom = document.getElementById('sign-up-bottom')
const signUpButtonBox  = document.getElementById('sign-up-top-right-box');
const signUpBottomBox = document.getElementById('sign-up-bottom-box')

const loginBox = document.getElementById('login-box');
const signUpBox = document.getElementById('sign-up-box');
const confirmBox = document.getElementById('confirm');
const goBack = document.getElementById('go-back');

const toggleIcon = document.getElementById('togglePassword');
const error = document.getElementById('errorMessage');
const errorSignUp = document.getElementById('error-sign-up');
const passwordInput = document.getElementById("login-password");

const signUpButton = document.getElementById('sign-up-button');
const slideInMessage = document.getElementById('slide-in-banner');

const emailInput = document.getElementById('login-email');
const emailSignUpInput = document.getElementById('sign-up-email');

let isVisible = false;


// onload background and icon animation
setTimeout(() => {
  layout.classList.add('bg-white');
  logoWhite.style.opacity = "0";
  logoBlue.style.opacity = "1";
}, 500);


// change background and icon animation
function openSignUpBox() {
  const isNowBlue = layout.classList.toggle('bg-blue');
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


// back arrow button, change bg and icon animation
goBack.addEventListener("click", () => {
  let isNowBlue = layout.classList.toggle("bg-blue");
  layout.classList.toggle("bg-white", !isNowBlue);

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
});


// change the visibility icon on input
function updateIcon() {
  let value = passwordInput.value;
  if (!value) {
    toggleIcon.src = "./assets/log_in_sign_up/icons/lock.svg";
    toggleIcon.classList.remove("cursor-pointer");
  } else if (isVisible) {
    toggleIcon.src = "./assets/log_in_sign_up/icons/visibility.svg";
    toggleIcon.classList.add("cursor-pointer");
  } else {
    toggleIcon.src = "./assets/log_in_sign_up/icons/visibility_off.svg";
    toggleIcon.classList.add("cursor-pointer");
  }
}
 
// onclick eye will show / hide password
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
});


// clear error on input email
emailInput.addEventListener("input", function () {
  error.innerHTML = "";
});


// change color on click to the inputbox
const inputs = document.querySelectorAll(".input-wrapper input");

inputs.forEach((input) => {
  input.addEventListener("focus", () => {
    inputs.forEach((el) => {
      el.parentElement.style.borderColor = el === input ? '#4589FF' : '#D1D1D1';
    });
  });

  input.addEventListener("blur", () => {
    input.parentElement.style.borderColor = '#D1D1D1';
  });
});


//clear error on input password
passwordInput.addEventListener("input", function () {
  error.innerHTML = "";
});


// check email validation
 function validation() {
    let email = this.value.trim();
    let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailPattern.test(email)) {
        error.innerHTML = "Check your email. Please try again.";
        errorSignUp.innerHTML = "Check your email. Please try again.";
        emailInput.parentElement.style.borderColor = "#FF8190";
    } 
};

emailInput.addEventListener('blur', validation);
emailSignUpInput.addEventListener('blur', validation);

// confirm box change icon
confirmBox.addEventListener('click', function() {
  confirmBox.classList.toggle('checked');
  signUpButton.classList.toggle('sign-up-button');
});


// to do: anmelden kommt dann hier rein
function signUp() {
  layout.style.opacity = "0.5";
  slideInMessage.classList.add('visible');
  setTimeout(() => {
    slideInMessage.classList.remove('visible');
    layout.style.opacity = "1";
    goBack.click();
  }, 1200);
};


// to do: Hier kommt das loginscript rein!
function logIn() { 
  error.innerHTML = "Check your email and password. Please try again.";
  emailInput.parentElement.style.borderColor = '#FF8190'; 
  passwordInput.parentElement.style.borderColor = '#FF8190';
  window.location.href = "summary-board.html"; 
};

