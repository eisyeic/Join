const layout = document.getElementById("layout");
const button = document.getElementById("sign-up");
const logoBlue = document.getElementById("logo-blue");
const logoWhite = document.getElementById("logo-white");
const signUp = document.getElementById('sign-up-box');

setTimeout(() => {
  layout.classList.add("bg-white");
  logoWhite.style.opacity = "0";
  logoBlue.style.opacity = "1";
}, 500);

button.addEventListener("click", () => {
  const isNowBlue = layout.classList.toggle("bg-blue");
  layout.classList.toggle("bg-white", !isNowBlue);

  if (isNowBlue) {
    logoWhite.style.opacity = "1";
    logoBlue.style.opacity = "0";
  } else {
    logoWhite.style.opacity = "0";
    logoBlue.style.opacity = "1";
  }
  signUp.classList.add('d-none'); 
});