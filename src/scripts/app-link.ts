const page = document.querySelector<HTMLElement>("[data-app-link-page]");
const tokenElement = page?.querySelector<HTMLElement>("[data-share-token]");
const openButton = page?.querySelector<HTMLAnchorElement>("[data-open-app]");
const copyButton = page?.querySelector<HTMLButtonElement>("[data-copy-token]");
const statusElement = page?.querySelector<HTMLElement>("[data-share-status]");

function tokenFromLocation(): string {
  const url = new URL(location.href);
  const queryToken = url.searchParams.get("token")?.trim();
  if (queryToken) return queryToken;
  const parts = url.pathname.split("/").filter(Boolean);
  const route = page?.dataset.route;
  const index = parts.findIndex((part) => part.toLowerCase() === route);
  if (index < 0 || !parts[index + 1]) return "";
  const pathToken = parts[index + 1];
  if (!pathToken) return "";
  try {
    return decodeURIComponent(pathToken).trim();
  } catch {
    return "";
  }
}

if (page && tokenElement && openButton && copyButton) {
  const token = tokenFromLocation();
  const route = page.dataset.route;
  if (token && route) {
    tokenElement.textContent = token;
    openButton.href = `planteller://${route}?token=${encodeURIComponent(token)}`;
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(token);
        if (statusElement) statusElement.textContent = "Code wurde kopiert.";
      } catch {
        if (statusElement)
          statusElement.textContent =
            "Kopieren war nicht möglich. Bitte markiere den Code manuell.";
      }
    });
  } else {
    tokenElement.textContent = "Kein gültiger Code im Link gefunden";
    openButton.removeAttribute("href");
    openButton.setAttribute("aria-disabled", "true");
    copyButton.disabled = true;
    if (statusElement)
      statusElement.textContent = "Bitte lass dir den Link erneut aus PlanTeller senden.";
  }
}

export {};
