(() => {
  "use strict";

  const { products, combos, offers, service } = window.BrasaCatalog;
  const allItems = new Map([...products, ...combos, ...offers].map(item => [item.id, item]));
  const storageKey = "brasa-club.cart.v1";
  const estimate = service.estimatedTime;
  const money = amount => window.BrasaUI.money(amount);
  const icon = (name, size = 20) => window.BrasaUI.icon(name, size);
  const keyOf = (sourceId, productId) => `${sourceId}|${productId}`;
  const includedIn = source => source.items || [source.item || source.id];

  let rows = new Map();
  let screen = "cart";
  let opener = null;
  let delivery = {};

  function restore(raw) {
    const saved = JSON.parse(raw || "[]");
    const result = new Map();
    if (!Array.isArray(saved)) return result;
    for (const line of saved) {
      if (!line || !Number.isSafeInteger(line.quantity) || line.quantity <= 0) continue;
      const source = allItems.get(line.sourceId);
      if (!source || !includedIn(source).includes(line.productId)) continue;
      const { sourceId, productId, quantity } = line;
      result.set(keyOf(sourceId, productId), { sourceId, productId, quantity });
    }
    return result;
  }

  function readStoredCart() {
    try {
      rows = restore(window.localStorage.getItem(storageKey));
    } catch {
      // Storage may be unavailable when the menu is opened directly from disk.
    }
  }

  readStoredCart();

  function count() {
    return [...rows.values()].reduce((sum, row) => sum + row.quantity, 0);
  }

  // Allocate a combo's exact price in centavos. Rounding cumulative shares
  // keeps the three individual amounts equal to the advertised total.
  const comboUnits = new Map();
  for (const combo of combos) {
    let accrued = 0;
    let allocated = 0;
    for (const productId of combo.items) {
      accrued += allItems.get(productId).price;
      const cumulative = Math.round(accrued * combo.price / combo.originalPrice);
      comboUnits.set(keyOf(combo.id, productId), cumulative - allocated);
      allocated = cumulative;
    }
  }

  function summarize() {
    const lines = [];
    let subtotal = 0;
    let total = 0;
    for (const [key, row] of rows) {
      const product = allItems.get(row.productId);
      const source = allItems.get(row.sourceId);
      const regular = product.price * row.quantity;
      let amount = regular;
      if (source.items) {
        const sets = Math.min(...source.items.map(id => rows.get(keyOf(source.id, id))?.quantity || 0));
        amount = sets * comboUnits.get(key) + (row.quantity - sets) * product.price;
      } else if (source.item) {
        amount = source.price * row.quantity;
      }
      subtotal += regular;
      total += amount;
      lines.push({ key, product, source, quantity: row.quantity, amount });
    }
    return { lines, subtotal, total, discount: subtotal - total };
  }

  function announce() {
    window.dispatchEvent(new CustomEvent("brasa:cart", {
      detail: { count: count(), total: summarize().total }
    }));
  }

  function commit() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...rows.values()]));
    } catch {
      // The current tab keeps a functioning cart even if storage is blocked.
    }
    announce();
    if (panel.open) render();
  }

  function add(id, quantity = 1) {
    const source = allItems.get(id);
    if (!source || !Number.isSafeInteger(quantity) || quantity < 1) return false;
    for (const productId of includedIn(source)) {
      const key = keyOf(id, productId);
      const existing = rows.get(key)?.quantity || 0;
      rows.set(key, { sourceId: id, productId, quantity: existing + quantity });
    }
    commit();
    return true;
  }

  const panel = document.createElement("dialog");
  panel.className = "brasa-order";
  panel.id = "brasa-order";
  panel.setAttribute("aria-labelledby", "brasa-order-title");
  document.body.append(panel);
  document.querySelectorAll("[data-delivery-estimate]").forEach(label => {
    label.textContent = estimate;
  });

  function adjustToKeyboard() {
    if (!window.visualViewport) return;
    const height = Math.round(window.visualViewport.height);
    panel.style.setProperty("--bo-visible-height", height + "px");
    panel.classList.toggle("bo-short", height <= 580);
  }

  function closeButton() {
    return `<button type="button" class="bo-icon-button" data-bo="close" aria-label="Fechar carrinho">${icon("x")}</button>`;
  }

  function origin(source) {
    if (source.items) return source.name;
    if (source.item) return "Oferta da casa";
    return "";
  }

  function lineView(line) {
    const { key, product, source, quantity, amount } = line;
    const provenance = origin(source);
    return `<li class="bo-line">
      <div class="bo-photo"><img src="${window.BrasaUI.preview(product)}" data-original="${product.image}" alt="" width="78" height="78"></div>
      <div class="bo-item-info">
        <strong>${product.name}</strong>
        ${provenance ? `<small>${provenance}</small>` : ""}
        <span class="bo-stepper">
          <button type="button" data-bo="decrease" data-line="${key}" aria-label="Diminuir quantidade de ${product.name}">${icon("minus", 14)}</button>
          <span aria-label="Quantidade">${quantity}</span>
          <button type="button" data-bo="increase" data-line="${key}" aria-label="Aumentar quantidade de ${product.name}">${icon("plus", 14)}</button>
        </span>
      </div>
      <div class="bo-line-end">
        <button type="button" class="bo-remove" data-bo="remove" data-line="${key}" aria-label="Remover ${product.name} do carrinho">${icon("trash", 16)}</button>
        <b>${money(amount)}</b>
      </div>
    </li>`;
  }

  function emptyView() {
    return `<div class="bo-empty">
      <span class="bo-empty-icon">${icon("bag", 42)}</span>
      <h3>Seu carrinho está vazio</h3>
      <p>Escolha seus favoritos no cardápio para montar o pedido.</p>
      <button class="bo-primary" type="button" data-bo="close">Explorar cardápio ${icon("arrow-right", 18)}</button>
    </div>`;
  }

  function summaryView(summary) {
    return `<div class="bo-summary">
      ${summary.discount ? `<div><span>Subtotal</span><span>${money(summary.subtotal)}</span></div>
        <div class="bo-discount"><span>Desconto</span><span>− ${money(summary.discount)}</span></div>` : ""}
      <div class="bo-total"><strong>Total do pedido</strong><strong>${money(summary.total)}</strong></div>
      <div class="bo-time"><span>${icon("clock", 16)} Tempo estimado</span><b>${estimate}</b></div>
    </div>`;
  }

  function field(name, label, autocomplete, extra = "") {
    const required = name === "complement" ? "" : "required";
    const optional = name === "complement" ? ' <span class="bo-optional">(opcional)</span>' : "";
    return `<label class="bo-field ${extra}">
      <span>${label}${optional}</span>
      <input type="text" name="${name}" autocomplete="${autocomplete}" maxlength="120" ${required}>
    </label>`;
  }

  function checkoutView() {
    return `<form id="brasa-checkout-form" class="bo-checkout">
      <fieldset>
        <legend>${icon("map-pin", 18)} Endereço de entrega</legend>
        <div class="bo-fields">
          ${field("customer", "Seu nome", "name", "bo-wide")}
          ${field("street", "Rua ou avenida", "address-line1", "bo-wide")}
          ${field("number", "Número", "off")}
          ${field("district", "Bairro", "address-level3")}
          ${field("city", "Cidade", "address-level2", "bo-wide")}
          ${field("complement", "Complemento ou referência", "address-line2", "bo-wide")}
        </div>
      </fieldset>
      <fieldset>
        <legend>${icon("credit-card", 18)} Pagamento na entrega</legend>
        <label class="bo-field bo-select">
          <span>Forma de pagamento</span>
          <select name="payment" required>
            <option value="">Selecione uma opção</option>
            <option>Pix</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Dinheiro</option>
          </select>
          ${icon("chevron-down", 16)}
        </label>
      </fieldset>
    </form>`;
  }

  function render() {
    const summary = summarize();
    if (!summary.lines.length) screen = "cart";
    const isCheckout = screen === "checkout";
    const title = isCheckout ? "Entrega e pagamento" : "Seu carrinho";
    const currentFocus = document.activeElement?.closest("[data-bo]");
    const scroll = panel.querySelector(".bo-body")?.scrollTop || 0;
    const quantity = count();
    panel.innerHTML = `<div class="bo-shell">
      <header class="bo-header">
        <div class="bo-heading">
          ${isCheckout ? `<button type="button" data-bo="back" class="bo-icon-button" aria-label="Voltar ao carrinho">${icon("arrow-left")}</button>` : ""}
          <h2 id="brasa-order-title" tabindex="-1">${title}</h2>
          ${!isCheckout && quantity ? `<span class="bo-count">${quantity}</span>` : ""}
        </div>
        ${closeButton()}
      </header>
      ${summary.lines.length ? `<div class="bo-body">
        ${isCheckout ? checkoutView() : `<ul class="bo-items">${summary.lines.map(lineView).join("")}</ul>
          ${summary.lines.some(line => line.source.items) ? '<p class="bo-combo-note">O desconto de cada combo vale para o trio completo.</p>' : ""}`}
      </div>
      <footer class="bo-footer">
        ${summaryView(summary)}
        ${isCheckout ? `<button type="submit" form="brasa-checkout-form" class="bo-primary">${icon("message-circle", 19)} Abrir WhatsApp</button>
          <p class="bo-help">Confira a mensagem no WhatsApp e toque em enviar.</p>` :
          `<button type="button" data-bo="continue" class="bo-primary">Continuar ${icon("arrow-right", 18)}</button>`}
      </footer>` : emptyView()}
    </div>`;
    if (isCheckout) {
      for (const [key, value] of Object.entries(delivery)) {
        const field = panel.querySelector(`[name="${key}"]`);
        if (field) field.value = value;
      }
    }
    const body = panel.querySelector(".bo-body");
    if (body) body.scrollTop = scroll;
    if (panel.open && currentFocus && !panel.contains(currentFocus)) {
      const { bo, line } = currentFocus.dataset;
      const selector = line ? `[data-bo="${bo}"][data-line="${line}"]` : `[data-bo="${bo}"]`;
      const next = panel.querySelector(selector) || panel.querySelector(isCheckout ? "[name=customer]" : "[data-bo=close]");
      next?.focus({ preventScroll: true });
    }
  }

  function open() {
    if (panel.open) return;
    opener = document.activeElement;
    screen = "cart";
    adjustToKeyboard();
    window.visualViewport?.addEventListener("resize", adjustToKeyboard);
    render();
    panel.showModal();
    document.documentElement.classList.add("bo-open");
  }

  function changeQuantity(key, delta) {
    const row = rows.get(key);
    if (!row) return;
    if (row.quantity + delta > 0) row.quantity += delta;
    else rows.delete(key);
    commit();
  }

  panel.addEventListener("click", event => {
    if (event.target === panel) {
      const rect = panel.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) panel.close();
      return;
    }
    const button = event.target.closest("[data-bo]");
    if (!button) return;
    const { bo, line } = button.dataset;
    switch (bo) {
      case "close": panel.close(); break;
      case "increase": changeQuantity(line, 1); break;
      case "decrease": changeQuantity(line, -1); break;
      case "remove": rows.delete(line); commit(); break;
      case "continue":
      case "back":
        screen = bo === "continue" ? "checkout" : "cart";
        render();
        panel.querySelector(".bo-shell")?.scrollTo(0, 0);
        panel.querySelector(".bo-body")?.scrollTo(0, 0);
        panel.querySelector(screen === "checkout" ? "#brasa-order-title" : "[data-bo=continue]")?.focus();
        break;
    }
  });

  panel.addEventListener("close", () => {
    window.visualViewport?.removeEventListener("resize", adjustToKeyboard);
    document.documentElement.classList.remove("bo-open");
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });

  panel.addEventListener("input", event => {
    const input = event.target;
    if (!input.form) return;
    delivery[input.name] = input.value;
    input.setCustomValidity("");
  });

  function message(summary, data) {
    const text = ["Olá, Brasa Club! Gostaria de fazer este pedido:", ""];
    summary.lines.forEach(({ product, source, quantity, amount }) => {
      const label = origin(source);
      text.push(`${quantity}× ${product.name}${label ? ` (${label})` : ""} — ${money(amount)}`);
    });
    if (summary.discount) {
      text.push("", `Subtotal: ${money(summary.subtotal)}`, `Desconto: − ${money(summary.discount)}`);
    }
    text.push(`Total do pedido: ${money(summary.total)}`, "",
      `Nome: ${data.customer}`, `Endereço: ${data.street}, ${data.number} — ${data.district}, ${data.city}`);
    if (data.complement) text.push(`Complemento: ${data.complement}`);
    text.push(`Pagamento: ${data.payment}`, `Tempo estimado: ${estimate}`);
    return text.join("\n");
  }

  panel.addEventListener("submit", event => {
    event.preventDefault();
    const form = event.target;
    if (!count()) return;
    const data = Object.fromEntries(new FormData(form));
    for (const key of Object.keys(data)) {
      data[key] = data[key].trim();
      if (form.elements[key].required && !data[key]) {
        form.elements[key].setCustomValidity("Preencha este campo.");
      }
    }
    if (!form.reportValidity()) return;
    delivery = data;
    const encoded = encodeURIComponent(message(summarize(), data));
    window.open(`https://wa.me/${service.whatsapp}?text=${encoded}`, "_blank", "noopener,noreferrer");
  });

  window.addEventListener("storage", event => {
    if (event.key !== storageKey && event.key !== null) return;
    readStoredCart();
    announce();
    if (panel.open) render();
  });

  window.BrasaOrder = Object.freeze({ add, count, open });
})();
