(() => {
  "use strict";

  const paths = {
    pause: '<path d="M8 5v14m8-14v14" stroke-width="3.5"/>',
    play: '<path d="m7 4 13 8-13 8Z" fill="currentColor" stroke="none"/>',
    utensils: '<path d="M4 3v5a3 3 0 0 0 6 0V3M7 3v18m12 0V3c-3 2-5 6-5 10h5"/>',
    ticket: '<path d="M3 7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4zM15 6v2m0 3v2m0 3v2"/>',
    bag: '<path d="m4.5 7.5-1 12a1.5 1.5 0 0 0 1.5 1.7h14a1.5 1.5 0 0 0 1.5-1.7l-1-12Z"/><path d="M8.5 9V6a3.5 3.5 0 0 1 7 0v3"/>',
    flame: '<path d="M12.5 2c1.7 4.6-2.7 5.9-1.5 9 1.9-.5 3.5-2 3.7-4.3C18.1 9 20 12.4 20 15.4a8 8 0 0 1-16 0c0-3.3 1.7-5.9 4.1-8.4-.2 2.7.3 3.8.8 4.2C8.4 7.9 12 6.2 12.5 2Z"/>',
    burger: '<path d="M3 10c.4-4.2 4.1-7 9-7s8.6 2.8 9 7H3ZM3 17h18c-.5 2.9-2.4 4-5 4H8c-2.6 0-4.5-1.1-5-4ZM2 13c1.9-1.2 3.6-1 5.4.1 2.1 1.4 3.1 1.4 5.2 0 1.7-1.1 3.2-1.2 5-.1 1.5.9 2.8 1.1 4.4.2"/><path d="m8.5 7 .5-.4m6.2.1.6.4"/>',
    pizza: '<path d="M4 20.2 7 4c4.8.6 9.4 3 13 7.3L5.3 21a.9.9 0 0 1-1.3-.8ZM7 7.2c4 .6 7.5 2.5 10.4 5.7"/><circle cx="9.1" cy="12" r="1"/><path d="m7.5 16 .2-.1m4.7-2.2.2-.1"/>',
    "cup-soda": '<path d="m6.3 8 1.6 13h8.2l1.6-13M5 8h14M12.6 8 14 3l4-1m-11 13c3-2 6 .9 10-.5"/>',
    cake: '<path d="m3 12 4-5 13 4v9H3v-8Zm0 0 17-1M3 16c2.2-2.1 3.1 1 5.1-.1 2.4-1.4 3.3 1.2 5.3 0 2.1-1.3 4 1 6.6-.9"/><circle cx="10" cy="6" r="2"/><path d="M10.6 4.1c.2-1.3 1.3-2.1 2.5-2.2"/>',
    combo: '<path d="m14.7 8 .8-4h6l-1.6 15h-3M14.5 4h8M18 4l.6-2.5L21 1M2 14c.4-3 2.8-5 6.3-5s5.9 2 6.3 5H2Zm0 3h12.6M3 20h10.5"/>',
    "arrow-right": '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    "arrow-left": '<path d="M20 12H5m6-6-6 6 6 6"/>',
    "chevron-right": '<path d="m9 5 7 7-7 7"/>',
    "chevron-left": '<path d="m15 5-7 7 7 7"/>',
    "chevron-down": '<path d="m5 9 7 7 7-7"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 6.5V12l3.5 2"/>',
    search: '<circle cx="10.6" cy="10.6" r="6.9"/><path d="m16 16 4.5 4.5"/>',
    heart: '<path d="M20.6 4.8a5.2 5.2 0 0 0-7.4 0L12 6l-1.2-1.2a5.2 5.2 0 0 0-7.4 7.4l7.7 7.8a1.3 1.3 0 0 0 1.8 0l7.7-7.8a5.2 5.2 0 0 0 0-7.4Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="m6 6 12 12M6 18 18 6"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    "message-circle": '<path d="M20.5 11.4a8.5 8.5 0 0 1-12 7.9l-5.4 1.4 1.5-5.1A8.5 8.5 0 1 1 20.5 11.4Z"/>',
    "map-pin": '<path d="M19.5 10c0 5-7.5 11-7.5 11s-7.5-6-7.5-11a7.5 7.5 0 1 1 15 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    "credit-card": '<rect x="2" y="4.5" width="20" height="15" rx="3"/><path d="M2 9h20M6 15h4"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    star: '<path d="m12 2.6 2.9 5.9 6.6 1-4.8 4.6 1.2 6.6-5.9-3.1-5.9 3.1 1.2-6.6-4.8-4.6 6.6-1z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'
  };

  function icon(name, size = 20) {
    return '<svg aria-hidden="true" focusable="false" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
      (paths[name] || "") + '</svg>';
  }

  const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const preview = item => "assets/previews/" + item.id + ".webp";
  // A newly registered product can use its original photo before previews are generated.
  document.addEventListener("error", event => {
    const photo = event.target;
    if (photo instanceof HTMLImageElement && photo.dataset.original) {
      const original = photo.dataset.original;
      delete photo.dataset.original;
      photo.src = original;
    }
  }, true);
  window.BrasaUI = Object.freeze({ icon, preview, money: cents => currency.format(cents / 100) });
  document.querySelectorAll("[data-icon]").forEach(node => {
    node.outerHTML = icon(node.dataset.icon, Number(node.dataset.size) || 20);
  });
})();
