(() => {
  "use strict";

  const service = { whatsapp: "5571983789492", estimatedTime: "35–50 min" };

  // Prices are stored in centavos. Product IDs also identify their local photos.
  const categories = [
    { id: "burgers", name: "Hambúrgueres", icon: "burger" },
    { id: "pizzas", name: "Pizzas", icon: "pizza" },
    { id: "drinks", name: "Bebidas", icon: "cup-soda" },
    { id: "desserts", name: "Sobremesas", icon: "cake" },
    { id: "combos", name: "Combos", icon: "combo" }
  ];

  function product(id, category, name, price, description) {
    return { id, category, name, price, description, image: `assets/food/${id}.webp` };
  }

  const products = [
    product("brasa-classic", "burgers", "Brasa Classic", 3200, "Carne na brasa, cheddar, alface, tomate e picles no brioche com gergelim."),
    product("bacon-fire", "burgers", "Bacon Fire", 3790, "Carne na brasa, cheddar derretido e bacon caramelizado no brioche tostado."),
    product("double-smash", "burgers", "Double Smash", 3990, "Duas carnes com crosta dourada, cheddar em dobro e picles no pão macio."),
    product("crispy-chicken", "burgers", "Crispy Chicken", 3190, "Frango empanado crocante, alface fresca e maionese de ervas no brioche."),
    product("veggie-grill", "burgers", "Veggie Grill", 3490, "Hambúrguer vegetal grelhado, folhas frescas, tomate e cebola-roxa."),

    product("margherita", "pizzas", "Margherita", 4290, "Pizza individual com massa de longa fermentação, tomate, muçarela e manjericão."),
    product("pepperoni", "pizzas", "Pepperoni", 4590, "Pizza individual com molho de tomate, muçarela e pepperoni de bordas tostadas."),
    product("quatro-queijos", "pizzas", "Quatro Queijos", 4690, "Pizza individual com muçarela, gorgonzola, provolone e parmesão."),
    product("frango-catupiry", "pizzas", "Frango com Catupiry", 4490, "Pizza individual com frango desfiado, Catupiry e um toque de orégano."),
    product("calabresa", "pizzas", "Calabresa", 4190, "Pizza individual com molho de tomate, calabresa fatiada e cebola-roxa."),

    product("cola-gelada", "drinks", "Cola Gelada", 700, "Refrigerante de cola com bastante gelo. Copo de 350 ml."),
    product("limonada", "drinks", "Limonada da Casa", 990, "Limão espremido na hora, gelo e hortelã fresca. Copo de 350 ml."),
    product("cha-pessego", "drinks", "Chá de Pêssego", 1090, "Chá gelado de pêssego com notas frutadas. Copo de 350 ml."),
    product("soda-berries", "drinks", "Soda de Frutas Vermelhas", 1390, "Água com gás, frutas vermelhas e gelo. Copo de 350 ml."),
    product("mate-limao", "drinks", "Mate com Limão", 990, "Chá-mate tostado com limão e gelo. Copo de 350 ml."),

    product("brownie", "desserts", "Brownie da Casa", 1100, "Chocolate intenso, casquinha fina e centro úmido. Uma fatia."),
    product("cookie", "desserts", "Cookie de Chocolate", 990, "Cookie de bordas douradas com pedaços generosos de chocolate."),
    product("pudim", "desserts", "Pudim de Leite", 1290, "Pudim de leite condensado com calda de caramelo. Porção individual."),
    product("cheesecake", "desserts", "Cheesecake de Frutas Vermelhas", 1590, "Creme de queijo, base de biscoito e calda de frutas vermelhas. Uma fatia."),
    product("mousse", "desserts", "Mousse de Chocolate", 1190, "Mousse de chocolate cremoso em porção individual.")
  ];

  const byId = new Map(products.map(item => [item.id, item]));

  function combo(id, name, items, price) {
    const included = items.map(item => byId.get(item));
    return {
      id, name, items, price, category: "combos",
      description: included.map(item => item.name).join(" + "),
      originalPrice: included.reduce((sum, item) => sum + item.price, 0),
      image: `assets/campaign/${id}.webp`
    };
  }

  const combos = [
    combo("combo-brasa", "Combo da Brasa", ["brasa-classic", "cola-gelada", "brownie"], 4000),
    combo("combo-bacon", "Combo Bacon Fire", ["bacon-fire", "cha-pessego", "cookie"], 4990),
    combo("combo-pizza", "Combo Margherita", ["margherita", "limonada", "cheesecake"], 5590),
    combo("combo-smash", "Combo Double Smash", ["double-smash", "mate-limao", "pudim"], 5190),
    combo("combo-pepperoni", "Combo Pepperoni", ["pepperoni", "soda-berries", "mousse"], 5990)
  ];

  function offer(id, item, price) {
    const original = byId.get(item);
    return {
      ...original, id, item, price, originalPrice: original.price,
      image: `assets/campaign/${id}.webp`
    };
  }

  const offers = [
    offer("oferta-classic", "brasa-classic", 2690),
    offer("oferta-bacon", "bacon-fire", 3190),
    offer("oferta-margherita", "margherita", 3690),
    offer("oferta-cookie", "cookie", 790),
    offer("oferta-soda", "soda-berries", 1090)
  ];

  window.BrasaCatalog = { service, categories, products, combos, offers };
})();
