const root = document.documentElement;
const menuButton = document.querySelector<HTMLButtonElement>("[data-menu-button]");
const menu = document.querySelector<HTMLElement>("[data-menu]");

function closeMenu() {
  menuButton?.setAttribute("aria-expanded", "false");
  menuButton?.setAttribute("aria-label", "Menü öffnen");
  menu?.removeAttribute("data-open");
}

menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  menuButton.setAttribute("aria-label", open ? "Menü öffnen" : "Menü schließen");
  if (open) menu?.removeAttribute("data-open");
  else menu?.setAttribute("data-open", "true");
});

menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
window.addEventListener("resize", () => {
  if (window.innerWidth >= 900) closeMenu();
});

const themeButton = document.querySelector<HTMLButtonElement>("[data-theme-button]");
themeButton?.addEventListener("click", () => {
  const current =
    root.dataset.theme ??
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  localStorage.setItem("telliapps-theme", next);
  themeButton.setAttribute(
    "aria-label",
    next === "dark" ? "Helles Farbschema aktivieren" : "Dunkles Farbschema aktivieren",
  );
});

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
if (reduceMotion.matches || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.setAttribute("data-visible", "true"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-visible", "true");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8%", threshold: 0.12 },
  );
  revealItems.forEach((item) => observer.observe(item));
}

const transition = document.querySelector<HTMLElement>("[data-page-transition]");
const transitionLabel = transition?.querySelector<HTMLElement>("[data-transition-label]");
document.querySelectorAll<HTMLAnchorElement>("a[data-app-transition]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (
      reduceMotion.matches ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === "_blank" ||
      !transition
    ) {
      return;
    }
    event.preventDefault();
    transition.dataset.tone = link.dataset.transitionName ?? "neutral";
    if (transitionLabel)
      transitionLabel.textContent = `${link.textContent?.trim() || "App"} wird geöffnet`;
    transition.setAttribute("data-active", "true");
    window.setTimeout(() => window.location.assign(link.href), 430);
  });
});

document.querySelectorAll<HTMLElement>("[data-analytics-event]").forEach((element) => {
  element.addEventListener("click", () => {
    const eventName = element.dataset.analyticsEvent;
    const umami = (window as Window & { umami?: { track: (name: string) => void } })
      .umami;
    if (eventName && umami) umami.track(eventName);
  });
});
