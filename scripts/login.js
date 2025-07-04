const layout = document.getElementById('layout');
const signUpButton = document.getElementById('sign-up');
const logoBlue = document.getElementById('logo-blue');
const logoWhite = document.getElementById('logo-white');
const signUpButtonBox  = document.getElementById('sign-up-button-box');
const goBack = document.getElementById('go-back');
const loginBox = document.getElementById('login-box');
const passwordInput = document.getElementById("password");
const toggleIcon = document.getElementById('togglePassword');
const emailInput = document.getElementById('email');
const error = document.getElementById('errorMessage');
const signUpBox = document.getElementById('sign-up-box');

let isVisible = false;


// onload background and icon animation
setTimeout(() => {
  layout.classList.add('bg-white');
  logoWhite.style.opacity = "0";
  logoBlue.style.opacity = "1";
}, 500);

// change background and icon animation
signUpButton.addEventListener("click", () => {
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
  loginBox.classList.add('d-none');
  signUpBox.classList.remove('d-none');
});

// left arrow button, change bg and icon animation
goBack.addEventListener("click", () => {
  const isNowBlue = layout.classList.toggle("bg-blue");
  layout.classList.toggle("bg-white", !isNowBlue);

  if (isNowBlue) {
    logoWhite.style.opacity = "1";
    logoBlue.style.opacity = "0";
  } else {
    logoWhite.style.opacity = "0";
    logoBlue.style.opacity = "1";
  }
  signUpButtonBox.classList.remove('d-none');
  loginBox.classList.remove('d-none');
  signUpBox.classList.add('d-none');
});


// change the visibility icon on input
function updateIcon() {
  const value = passwordInput.value;
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

//clear error on input password
passwordInput.addEventListener("input", function () {
  error.innerHTML = "";
});

// change underline highlight-color on input email and defalut on password
emailInput.addEventListener("focus", function () {
  emailInput.parentElement.style.borderColor = "#4589FF";
  passwordInput.parentElement.style.borderColor = "#D1D1D1";
});

// change email underline color to default
emailInput.addEventListener("blur", function () {
  emailInput.parentElement.style.borderColor = "#D1D1D1";
});

// change underline highlight-color on input password and defalut on email
passwordInput.addEventListener("focus", function () {
  passwordInput.parentElement.style.borderColor = "#4589FF";
  emailInput.parentElement.style.borderColor = "#D1D1D1";
});

// change password under color to default
passwordInput.addEventListener("blur", function () {
  passwordInput.parentElement.style.borderColor = "#D1D1D1";
});

// check email validation
emailInput.addEventListener('blur', function () {
    const email = this.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailPattern.test(email)) {
        error.innerHTML = "Check your email. Please try again.";
    } 
});





// to do: Hier kommt das loginscript rein!
logIn = () => error.innerHTML = "Check your email and password. Please try again.";