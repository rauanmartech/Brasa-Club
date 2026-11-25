(() => {
  "use strict";

  const { products, combos, offers, categories } = window.BrasaCatalog;
  const { icon, money, preview } = window.BrasaUI;
  const order = window.BrasaOrder;
  const allItems = [...products, ...combos, ...offers];
  const byId = new Map(allItems.map(item => [item.id, item]));
  const favoriteKey = "brasa-club.favorites.v1";
  const favorites = new Set();
  const $ = selector => document.querySelector(selector);
  const tabs = $("#category-tabs");
  const search = $("#search");
  const results = $("#menu-results");
  const dialog = $("#product-dialog");
  const hero = $(".hero");
  const heroIntervalMs = 4600;
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const autoplayButton = $("#hero-autoplay");
  const favoriteFilter = $("#favorites-filter");
  const phoneLayout = window.matchMedia("(max-width: 700px)");
  const thumbnails = { burgers: "brasa-classic", pizzas: "margherita", drinks: "cola-gelada", desserts: "cheesecake", combos: "combo-brasa" };
  let category = "burgers";
  let favoritesOnly = false;
  let deals = false;
  let slide = 0;
  let transitioning = false;
  let heroTimer;
  let heroVisible = false;
  let heroPressed = false;
  let autoplayPaused = motionPreference.matches;
  let selected = null;
  let quantity = 1;
  let toastTimer;
  let detailCloseTimer;

  function arrangeHome() {
    const intro = $("#menu-intro");
    if (phoneLayout.matches) intro.after(hero);
    else intro.before(hero);
  }

  try {
    const saved = JSON.parse(localStorage.getItem(favoriteKey) || "[]");
    if (Array.isArray(saved)) saved.filter(id => byId.has(id)).forEach(id => favorites.add(id));
  } catch { /* Favorites remain usable in memory when storage is unavailable. */ }

  function discount(item) {
    return Math.round((1 - item.price / item.originalPrice) * 100);
  }

  function heartButton(item) {
    const active = favorites.has(item.id);
    return `<button type="button" class="heart-button" data-heart="${item.id}" aria-label="${active ? "Remover" : "Salvar"} ${item.name} ${active ? "dos" : "nos"} favoritos" aria-pressed="${active}">${icon("heart", 18)}</button>`;
  }

  function card(item) {
    const badge = item.originalPrice ? `<span class="card-badge">−${discount(item)}%</span>` :
      item.id === "brasa-classic" ? `<span class="card-badge">${icon("flame", 12)}Mais pedido</span>` : "";
    const price = item.originalPrice ? `<s>${money(item.originalPrice)}</s>` : "";
    return `<article class="product-card">
      <div class="card-photo">
        <button type="button" class="photo-button" data-detail="${item.id}" aria-label="Ver detalhes de ${item.name}">
          <img src="./${preview(item)}" data-original="./${item.image}" alt="" loading="lazy" decoding="async">
        </button>${badge}${heartButton(item)}
      </div>
      <div class="card-copy">
        <h3><button type="button" data-detail="${item.id}">${item.name}</button></h3>
        <p>${item.description}</p>
        <div class="card-bottom"><div class="card-price">${price}<strong>${money(item.price)}</strong></div>
          <button type="button" class="quick-add" data-add="${item.id}" aria-label="Adicionar ${item.name} ao carrinho">${icon("plus", 20)}</button>
        </div>
      </div>
    </article>`;
  }

  function group(title, items, showTitle) {
    if (!items.length) return "";
    return `<div class="result-group"><div class="results-heading ${showTitle ? "" : "mobile-only"}"><h2>${title}</h2><span>${items.length} ${items.length === 1 ? "opção" : "opções"}</span></div>
      <div class="product-grid">${items.map(card).join("")}</div></div>`;
  }

  const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  function renderMenu() {
    const term = normalize(search.value.trim());
    const include = item => (!favoritesOnly || favorites.has(item.id)) &&
      (!term || normalize(item.name + " " + item.description).includes(term));
    const globalSearch = Boolean(term || favoritesOnly);
    tabs.querySelectorAll("button").forEach(button => {
      button.setAttribute("aria-pressed", String(!globalSearch && button.dataset.category === category));
    });
    favoriteFilter.setAttribute("aria-pressed", String(favoritesOnly));
    const favoriteLabel = favoritesOnly ? "Mostrar todos os produtos" : "Mostrar favoritos";
    favoriteFilter.setAttribute("aria-label", favoriteLabel);
    favoriteFilter.title = favoriteLabel;
    let count;
    if (deals) {
      const c = combos.filter(include);
      const o = offers.filter(include);
      count = c.length + o.length;
      results.innerHTML = group("Combos", c, true) + group("Ofertas", o, true);
    } else {
      const source = globalSearch ? (favoritesOnly ? allItems : [...products, ...combos]) :
        category === "combos" ? combos : products.filter(item => item.category === category);
      const filtered = source.filter(include);
      count = filtered.length;
      const title = term ? "Resultados da busca" : favoritesOnly ? "Seus favoritos" : categories.find(c => c.id === category).name;
      results.innerHTML = group(title, filtered, globalSearch);
    }
    if (!count) {
      results.innerHTML = `<div class="empty-menu">${icon(favoritesOnly ? "heart" : "search", 30)}<h2>${favoritesOnly && !term ? "Seus favoritos aparecem aqui" : "Nenhum item encontrado"}</h2><p>${favoritesOnly && !term ? "Toque no coração dos produtos que você mais gosta." : "Experimente buscar por outro nome ou ingrediente."}</p><button class="secondary" type="button" data-clear-filter>Ver o cardápio</button></div>`;
    }
    $("#result-status").textContent = `${count} ${count === 1 ? "opção disponível" : "opções disponíveis"}.`;
    document.body.classList.toggle("filtering", globalSearch);
  }

  function renderHero() {
    const combo = combos[slide];
    const photo = $("#hero-image");
    $("#hero-mobile-image").srcset = "./" + preview(combo);
    photo.src = "./" + combo.image;
    photo.alt = combo.description;
    const title = combo.name.replace(/^Combo\s+/i, "");
    $("#hero-title").innerHTML = `COMBO <em>${title}</em>`;
    $("#hero-description").textContent = combo.description;
    $("#hero-price").textContent = money(combo.price);
    $("#hero-old").textContent = money(combo.originalPrice);
    const stamp = $("#discount-stamp");
    stamp.querySelector("strong").innerHTML = `${discount(combo)}<span>%</span>`;
    stamp.setAttribute("aria-label", `${discount(combo)} por cento de desconto`);
    $(".hero-pager").querySelectorAll("button").forEach((button, i) => {
      button.setAttribute("aria-pressed", String(i === slide));
    });
    scheduleHero();
  }

  function scheduleHero() {
    clearTimeout(heroTimer);
    if (combos.length < 2 || autoplayPaused || heroPressed || transitioning || !heroVisible || document.hidden ||
        document.querySelector("dialog[open]")) return;
    heroTimer = setTimeout(() => moveSlide(1), heroIntervalMs);
  }

  function setAutoplayPaused(paused) {
    autoplayPaused = paused;
    const action = paused ? "Retomar" : "Pausar";
    autoplayButton.setAttribute("aria-label", action + " rotação dos destaques");
    autoplayButton.title = autoplayButton.getAttribute("aria-label");
    autoplayButton.innerHTML = icon(paused ? "play" : "pause", 12);
    scheduleHero();
  }

  function changeSlide(next, direction) {
    if (transitioning || next === slide) {
      scheduleHero();
      return;
    }
    if (motionPreference.matches) {
      slide = next;
      renderHero();
      return;
    }
    transitioning = true;
    clearTimeout(heroTimer);
    hero.dataset.slideDirection = direction < 0 ? "back" : "forward";
    hero.classList.add("hero-leaving");
    setTimeout(() => {
      slide = next;
      renderHero();
      hero.classList.remove("hero-leaving");
      hero.classList.add("hero-entering");
      setTimeout(() => {
        hero.classList.remove("hero-entering");
        transitioning = false;
        scheduleHero();
      }, 230);
    }, 170);
  }

  function moveSlide(delta) {
    changeSlide((slide + delta + combos.length) % combos.length, delta);
  }

  function renderQuantity() {
    $("#detail-quantity").textContent = String(quantity);
    $("#detail-minus").disabled = quantity === 1;
    $("#detail-plus").disabled = quantity === 99;
    $("#detail-total").textContent = money(quantity * selected.price);
  }

  function showDetail(id) {
    const item = byId.get(id);
    if (!item) return;
    selected = item;
    quantity = 1;
    const children = item.items?.map(key => byId.get(key));
    const categoryName = categories.find(c => c.id === item.category)?.name || "";
    dialog.classList.remove("is-closing");
    dialog.innerHTML = `<div class="detail-scroll">
      <div class="detail-visual"><button class="round-button detail-close" type="button" data-close-detail aria-label="Fechar detalhes">${icon("chevron-left")}</button>
        ${heartButton(item)}<img class="detail-photo" src="./${item.image}" alt="${item.name}">
      </div>
      <div class="detail-body"><span class="detail-category">${icon(item.items ? "combo" : categories.find(c => c.id === item.category).icon, 15)} ${categoryName}</span>
        <h2 id="product-title">${item.name}</h2>
        <div class="detail-price">${item.originalPrice ? `<s>${money(item.originalPrice)}</s>` : ""}<strong>${money(item.price)}</strong></div>
        ${children ? `<h3>O que vem no combo</h3><ul class="detail-ingredients">${children.map(child => `<li><img src="./${preview(child)}" data-original="./${child.image}" alt=""><span>${child.name}</span><small>1 un.</small></li>`).join("")}</ul>` : `<p>${item.description}</p>`}
      </div></div>
      <div class="detail-actions"><div class="stepper"><button type="button" id="detail-minus" aria-label="Diminuir quantidade">${icon("minus", 16)}</button><output id="detail-quantity" aria-label="Quantidade"></output><button type="button" id="detail-plus" aria-label="Aumentar quantidade">${icon("plus", 16)}</button></div>
        <button type="button" class="primary detail-add" data-add-selected>Adicionar <strong id="detail-total"></strong></button></div>`;
    renderQuantity();
    dialog.showModal();
    document.documentElement.classList.add("detail-open");
    scheduleHero();
  }

  function closeDetail() {
    if (!dialog.open || dialog.classList.contains("is-closing")) return;
    if (motionPreference.matches) {
      dialog.close();
      return;
    }
    dialog.classList.add("is-closing");
    detailCloseTimer = setTimeout(() => dialog.close(), 280);
  }

  function setFavorite(button) {
    const id = button.dataset.heart;
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    try { localStorage.setItem(favoriteKey, JSON.stringify([...favorites])); } catch { /* Memory fallback. */ }
    if (favoritesOnly) renderMenu();
    document.querySelectorAll(`[data-heart="${id}"]`).forEach(el => {
      const on = favorites.has(id);
      el.setAttribute("aria-pressed", String(on));
      el.setAttribute("aria-label", `${on ? "Remover" : "Salvar"} ${byId.get(id).name} ${on ? "dos" : "nos"} favoritos`);
    });
  }

  function toast(item, qty) {
    clearTimeout(toastTimer);
    const el = $("#toast");
    el.innerHTML = `<span class="toast-check">${icon("check", 15)}</span><span>${qty > 1 ? qty + " × " : ""}${item.name} no carrinho</span><button type="button" data-open-cart>Ver</button>`;
    el.classList.add("visible");
    toastTimer = setTimeout(() => el.classList.remove("visible"), 3600);
  }

  function addItem(id, qty = 1) {
    if (order.add(id, qty)) {
      if (dialog.open) closeDetail();
      toast(byId.get(id), qty);
    }
  }

  function updateCount() {
    const value = order.count();
    document.querySelectorAll("[data-cart-count]").forEach(el => {
      el.textContent = value > 99 ? "99+" : value;
      el.dataset.empty = String(value === 0);
    });
    document.querySelectorAll("[data-open-cart]").forEach(el => el.setAttribute("aria-label", `Abrir carrinho, ${value} ${value === 1 ? "item" : "itens"}`));
  }

  function route() {
    deals = location.hash === "#combos-e-ofertas";
    document.body.classList.toggle("deals-page", deals);
    document.querySelectorAll("[data-nav]").forEach(el => {
      if (el.dataset.nav === (deals ? "deals" : "menu")) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
    $(".desktop-title").textContent = deals ? "Combos e ofertas" : "Nosso cardápio";
    $(".mobile-title").innerHTML = deals ? "Combos e <em>ofertas</em>" : "O que vai pedir <em>hoje?</em>";
    document.title = (deals ? "Combos e ofertas" : "Cardápio") + " · Brasa Club";
    search.value = "";
    favoritesOnly = false;
    renderMenu();
  }

  tabs.innerHTML = categories.map(c => {
    const item = byId.get(thumbnails[c.id]);
    return `<button type="button" data-category="${c.id}"><img alt="" src="./${preview(item)}" data-original="./${item.image}"><span>${c.name}</span></button>`;
  }).join("");
  document.addEventListener("click", event => {
    const link = event.target.closest("[data-nav], .brand");
    if (link && link.hash === location.hash) {
      route();
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const el = event.target.closest("button");
    if (!el) return;
    if (el.hasAttribute("data-open-cart")) {
      $("#toast").classList.remove("visible");
      order.open();
    } else if (el.dataset.detail) showDetail(el.dataset.detail);
    else if (el.dataset.add) addItem(el.dataset.add);
    else if (el.dataset.heart) setFavorite(el);
    else if (el.dataset.category) {
      category = el.dataset.category;
      favoritesOnly = false;
      search.value = "";
      renderMenu();
    } else if (el.hasAttribute("data-clear-filter")) {
      favoritesOnly = false;
      search.value = "";
      renderMenu();
    } else if (el.dataset.slide !== undefined) {
      const next = Number(el.dataset.slide);
      changeSlide(next, next > slide ? 1 : -1);
    }
  });
  dialog.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) {
      const r = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) closeDetail();
      return;
    }
    if (button.hasAttribute("data-close-detail")) closeDetail();
    if (button.hasAttribute("data-add-selected")) addItem(selected.id, quantity);
    if (button.id === "detail-minus") { quantity = Math.max(1, quantity - 1); renderQuantity(); }
    if (button.id === "detail-plus") { quantity = Math.min(99, quantity + 1); renderQuantity(); }
  });
  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    closeDetail();
  });
  dialog.addEventListener("close", () => {
    clearTimeout(detailCloseTimer);
    dialog.classList.remove("is-closing");
    document.documentElement.classList.remove("detail-open");
    scheduleHero();
  });
  $("#hero-image").addEventListener("error", () => $("#hero-mobile-image").removeAttribute("srcset"));
  $("#hero-details").addEventListener("click", () => showDetail(combos[slide].id));
  $("#prev-hero").addEventListener("click", () => moveSlide(-1));
  $("#next-hero").addEventListener("click", () => moveSlide(1));
  $(".hero-pager").innerHTML = combos.map((combo, i) => `<button type="button" data-slide="${i}" aria-label="Mostrar ${combo.name}"></button>`).join("");
  autoplayButton.addEventListener("click", () => setAutoplayPaused(!autoplayPaused));
  motionPreference.addEventListener("change", event => setAutoplayPaused(event.matches));
  document.addEventListener("visibilitychange", scheduleHero);
  document.addEventListener("close", event => {
    if (event.target instanceof HTMLDialogElement) scheduleHero();
  }, true);
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    scheduleHero();
  }).observe(hero);
  hero.addEventListener("pointerdown", () => {
    heroPressed = true;
    clearTimeout(heroTimer);
  });
  function releaseHero() {
    if (!heroPressed) return;
    heroPressed = false;
    scheduleHero();
  }
  window.addEventListener("pointerup", releaseHero);
  window.addEventListener("pointercancel", releaseHero);
  window.addEventListener("blur", releaseHero);
  favoriteFilter.addEventListener("click", () => { favoritesOnly = !favoritesOnly; renderMenu(); });
  search.addEventListener("input", renderMenu);
  $(".skip").addEventListener("click", event => {
    event.preventDefault();
    $("#main").focus();
  });
  let startPoint;
  hero.addEventListener("touchstart", event => { startPoint = event.touches[0]; }, { passive: true });
  hero.addEventListener("touchend", event => {
    if (!startPoint) return;
    const dx = event.changedTouches[0].clientX - startPoint.clientX;
    const dy = event.changedTouches[0].clientY - startPoint.clientY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) moveSlide(dx < 0 ? 1 : -1);
    startPoint = null;
  }, { passive: true });
  window.addEventListener("hashchange", () => { route(); window.scrollTo({ top: 0, behavior: "instant" }); });
  window.addEventListener("brasa:cart", updateCount);
  phoneLayout.addEventListener("change", arrangeHome);
  arrangeHome();
  setAutoplayPaused(autoplayPaused);
  renderHero();
  route();
  updateCount();
})();
