const menuToggle = document.querySelector(".menu-toggle");
const topNav = document.querySelector(".top-nav");

menuToggle?.addEventListener("click", () => {
  const isOpen = topNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

topNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    topNav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }
});
