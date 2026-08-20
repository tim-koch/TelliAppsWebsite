function setStatus(
  form: HTMLFormElement,
  message: string,
  state: "idle" | "success" | "error" = "idle",
) {
  const status = form.querySelector<HTMLElement>("[data-form-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
}

function createPersonField(index: number): HTMLFieldSetElement {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "person-fieldset";
  fieldset.innerHTML = `
    <legend>Weitere Person ${index}</legend>
    <button class="person-remove" type="button" aria-label="Weitere Person ${index} entfernen">Entfernen</button>
    <div class="form-field"><label for="person-${index}-name">Name</label><input id="person-${index}-name" name="additionalName" type="text" autocomplete="name" maxlength="100"></div>
    <fieldset class="email-fieldset"><legend>Google-E-Mail-Adresse</legend><div class="split-email"><label class="sr-only" for="person-${index}-email">Teil vor dem @-Zeichen</label><input id="person-${index}-email" name="additionalEmailLocal" type="text" inputmode="email" autocomplete="off" maxlength="64"><span aria-hidden="true">@</span><label class="sr-only" for="person-${index}-domain">Domain</label><select id="person-${index}-domain" name="additionalEmailDomain"><option value="gmail.com">gmail.com</option><option value="googlemail.com">googlemail.com</option></select></div></fieldset>`;
  fieldset.querySelector("button")?.addEventListener("click", () => fieldset.remove());
  return fieldset;
}

if (!document.documentElement.hasAttribute("data-forms-ready")) {
  document.documentElement.setAttribute("data-forms-ready", "true");

  document.querySelectorAll<HTMLFormElement>("[data-beta-form]").forEach((form) => {
    const list = form.querySelector<HTMLElement>("[data-people-list]");
    const button = form.querySelector<HTMLButtonElement>("[data-add-person]");
    button?.addEventListener("click", () => {
      if (!list || list.children.length >= 4) return;
      const field = createPersonField(list.children.length + 1);
      list.append(field);
      field.querySelector<HTMLInputElement>("input")?.focus();
      if (list.children.length >= 4) button.disabled = true;
    });
  });

  document.querySelectorAll<HTMLFormElement>("[data-async-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      if (form.matches("[data-beta-form]")) {
        const local = String(data.get("emailLocal") ?? "").trim();
        const domain = String(data.get("emailDomain") ?? "gmail.com");
        const complete = `${local}@${domain}`;
        data.set("email", complete);
        const names = data.getAll("additionalName").map(String);
        const locals = data.getAll("additionalEmailLocal").map(String);
        const domains = data.getAll("additionalEmailDomain").map(String);
        const people = names
          .map((name, index) => {
            const email = locals[index]
              ? `${locals[index]}@${domains[index] || "gmail.com"}`
              : "keine E-Mail";
            return name || locals[index] ? `${name || "Ohne Namen"}: ${email}` : "";
          })
          .filter(Boolean)
          .join("\n");
        data.set("weitere_personen", people || "Keine");
      }

      const submit = form.querySelector<HTMLButtonElement>("[data-submit]");
      submit?.setAttribute("disabled", "true");
      setStatus(form, "Wird sicher übermittelt …");
      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Formularversand fehlgeschlagen");
        form.reset();
        form.querySelector<HTMLElement>("[data-people-list]")?.replaceChildren();
        setStatus(form, "Danke! Deine Anfrage wurde erfolgreich gesendet.", "success");
      } catch {
        setStatus(
          form,
          `Die Übermittlung ist gerade nicht möglich. Bitte schreibe an ${form.closest("body")?.querySelector<HTMLAnchorElement>('a[href^="mailto:"]')?.textContent ?? "kochbuch_app@outlook.de"}.`,
          "error",
        );
      } finally {
        submit?.removeAttribute("disabled");
      }
    });
  });
}

export {};
