const layout = document.getElementById('layout');
const logoBlue = document.getElementById('logo-blue');
const logoWhite = document.getElementById('logo-white');
let isVisible = false;

// onload background and icon animation
setTimeout(() => {
  layout.classList.add('bg-white');
  logoWhite.style.opacity = "0";
  logoBlue.style.opacity = "1";
}, 500);

const signUpTop = document.getElementById('sign-up');
const signUpBottom = document.getElementById('sign-up-bottom')
const signUpButtonBox  = document.getElementById('sign-up-top-right-box');
const signUpBottomBox = document.getElementById('sign-up-bottom-box')
const signUpBox = document.getElementById('sign-up-box');

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


signUpTop.addEventListener("click", openSignUpBox);
signUpBottom.addEventListener("click", openSignUpBox);

// back arrow button, change bg and icon animation
const goBack = document.getElementById('go-back');
const loginBox = document.getElementById('login-box');

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
  signUpBottomBox.classList.remove('d-none-important');
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
const toggleIcon = document.getElementById('togglePassword');

toggleIcon.addEventListener("click", function () {
  if (!passwordInput.value) return;
  isVisible = !isVisible;
  passwordInput.type = isVisible ? "text" : "password";
  updateIcon();
});

// change password visibility icon on input
const error = document.getElementById('errorMessage');

passwordInput.addEventListener("input", function () {
  if (!passwordInput.value) {
    isVisible = false;
    passwordInput.type = "password";
    error.innerHTML = "";
  }
  updateIcon();
});

// clear error on input email
const emailInput = document.getElementById('login-email');

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
const passwordInput = document.getElementById("login-password");

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
        emailInput.parentElement.style.borderColor = "#FF8190";
    } 
});

// confirm box change icon
const confirmBox = document.getElementById('confirm');

confirmBox.addEventListener('click', function() {
  confirmBox.classList.toggle('checked');
});





// to do: Hier kommt das loginscript rein!
logIn = () => error.innerHTML = "Check your email and password. <br> Please try again.";