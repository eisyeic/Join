const layout = document.getElementById("layout");
const button = document.getElementById("sign-up");

setTimeout(() => {
  layout.classList.add("bg-white");
}, 500);

button.addEventListener("click", () => {
  layout.classList.toggle("bg-white");
});
