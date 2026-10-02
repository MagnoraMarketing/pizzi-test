/* PIZZI · menu, locations, live opening status — vanilla, no dependencies */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ------------------------------------------------------------------ data */
  const T = (a, b) => [[a, b]];
  const LOCALES = [
    { id: "mercado", n: "Mercado Central", d: "C/ de les Carabasses, 3 · Ciutat Vella", tel: "+34 744 78 47 37", maps: "https://maps.app.goo.gl/rAKcLgmbYJYk6TSh9",
      h: [[["12:00", "15:00"], ["19:00", "24:00"]], [["12:00", "15:00"], ["19:00", "24:00"]], [["12:00", "15:00"], ["19:00", "24:00"]], [["12:00", "15:00"], ["19:00", "24:00"]], T("12:00", "24:00"), T("12:00", "24:00"), T("12:00", "24:00")] },
    { id: "abastos", n: "Abastos", d: "C/ de Sant Francesc de Borja, 20 · Extramurs", tel: "+34 673 16 14 66", maps: "https://maps.app.goo.gl/iob1fPZKLdyD8FNF9",
      h: [[], T("18:30", "23:30"), T("18:30", "23:30"), T("18:30", "23:30"), T("18:30", "24:00"), T("18:30", "24:00"), T("18:30", "23:30")] },
    { id: "russafa", n: "Ruzafa", d: "C. de Ruzafa, 58 · L'Eixample", tel: "+34 744 78 47 37", maps: "https://maps.app.goo.gl/VfqsVDEDcRsKXxyu9",
      h: [T("18:30", "23:30"), T("18:30", "23:30"), T("18:30", "23:30"), T("18:30", "23:30"), T("18:30", "24:00"), T("18:30", "24:00"), T("18:30", "23:30")] },
    { id: "canovas", n: "Cánovas", d: "C. de Joaquín Costa, 12 · L'Eixample", tel: "+34 604 81 24 26", maps: "https://maps.app.goo.gl/L3ei1jMcgYXmEefz7",
      h: [T("18:00", "23:30"), T("18:00", "23:30"), T("18:00", "23:30"), T("18:00", "23:30"), T("18:00", "25:00"), T("18:00", "25:00"), T("18:00", "23:30")] },
    { id: "peris", n: "Peris y Valero", d: "Av. de Peris i Valero, 189 · L'Eixample", tel: "+34 744 78 47 37", maps: "https://maps.app.goo.gl/iMcQYmXb9bt8SR686",
      h: [T("18:30", "23:30"), T("18:30", "23:30"), T("18:30", "23:30"), T("18:30", "23:30"), T("18:30", "24:00"), T("18:30", "24:00"), T("18:30", "23:30")] }
  ];
  const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

  // [name, type, ingredients, price, tag, look]
  const PIZZAS = [
    ["PISTACHIOLA", "especial", "Pesto di pistacchio, mozzarella, mortadella, crema de burrata", 9.9, "Top ventas", "img:pistachiola.webp"],
    ["ITALIANÍSIMA", "especial", "Salsa tomate, mozzarella, tomate cherry, crema de burrata, rúcula, salsa pesto", 9.9, "Fresca y verde", "img:italianisima.webp"],
    ["TARTUFINA", "especial", "Salsa de trufa, mozzarella, jamón cocido, champiñones, parmigiano", 9.9, "Top ventas", "truffle"],
    ["MARGHERITA", "clasica", "Salsa tomate, mozzarella fior di latte, albahaca fresca", 6.9, "La de siempre", "tomato"],
    ["DI PARMA", "especial", "Salsa tomate, mozzarella, prosciutto crudo, parmigiano, rúcula", 9.9, "", "tomato"],
    ["MONTESA", "especial", "Crema de trufa, mozzarella, champiñones, longaniza, crema de burrata", 9.9, "", "truffle"],
    ["QUATTRO FORMAGGI", "clasica", "Salsa tomate, mozzarella, gorgonzola, queso de cabra, parmigiano", 8.9, "", "cheese"],
    ["PEPPERONI", "clasica", "Salsa tomate, mozzarella, pepperoni", 8.9, "", "tomato"],
    ["CAPRICCIOSA", "clasica", "Salsa tomate, mozzarella, jamón cocido, champiñones, alcachofas, olivas negras", 9.9, "", "tomato"],
    ["BARBACOA", "especial", "Salsa barbacoa, mozzarella, pollo, bacon, cebolla", 9.9, "", "bbq"],
    ["REINA", "clasica", "Salsa tomate, mozzarella, jamón cocido, champiñones", 8.9, "", "tomato"],
    ["NAPOLI", "clasica", "Salsa tomate, mozzarella, anchoas, alcaparras, olivas negras", 8.9, "", "tomato"],
    ["TUNA", "clasica", "Salsa tomate, mozzarella, atún, cebolla, olivas negras", 9.9, "", "tomato"]
  ];
  const DRINKS = [["Coca-Cola", 2.5], ["Coca-Cola Zero", 2.5], ["Fanta naranja", 2.5], ["Fanta limón", 2.5], ["Cerveza", 2.5], ["Agua", 2]];
  const LOOKS = {
    tomato: "radial-gradient(circle at 50% 50%,#d63a2a 0 58%,#f4e2c4 59% 62%,#e2a35f 63% 100%)",
    truffle: "radial-gradient(circle at 50% 50%,#6b4a32 0 58%,#f4e2c4 59% 62%,#e2a35f 63% 100%)",
    cheese: "radial-gradient(circle at 50% 50%,#f3d98f 0 58%,#fff3d6 59% 62%,#e2a35f 63% 100%)",
    bbq: "radial-gradient(circle at 50% 50%,#5a2318 0 58%,#f4e2c4 59% 62%,#e2a35f 63% 100%)"
  };
  const eur = n => n.toFixed(2).replace(".", ",") + " €";
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------------------------------------------------- opening hours (Madrid) */
  const toMin = s => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const hhmm = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  function madridNow() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const g = t => parts.find(p => p.type === t).value;
    const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(g("weekday"));
    return { day, min: Number(g("hour")) * 60 + Number(g("minute")) };
  }
  function status(l) {
    const { day, min } = madridNow();
    const yest = (day + 6) % 7;
    for (const [o, c] of l.h[day]) if (min >= toMin(o) && min < toMin(c)) return { open: true, txt: "Abierto ahora · hasta las " + hhmm(toMin(c)) };
    for (const [, c] of l.h[yest]) if (toMin(c) > 1440 && min < toMin(c) - 1440) return { open: true, txt: "Abierto ahora · hasta las " + hhmm(toMin(c)) };
    for (let off = 0; off < 8; off++) {
      const d = (day + off) % 7;
      for (const [o] of l.h[d]) {
        if (off === 0 && toMin(o) <= min) continue;
        const when = off === 0 ? "hoy" : off === 1 ? "mañana" : "el " + DIAS[d];
        return { open: false, txt: "Cerrado · abre " + when + " a las " + o };
      }
    }
    return { open: false, txt: "Cerrado" };
  }
  function paintStatus() {
    $$("[data-status]").forEach(el => {
      const l = LOCALES.find(x => x.id === el.dataset.status);
      const s = status(l);
      el.querySelector(".dot").className = "dot " + (s.open ? "is-open" : "is-closed");
      el.querySelector(".status__txt").textContent = s.txt;
    });
    const m = status(LOCALES[0]);
    const navDot = $("[data-live-dot]");
    navDot.className = "dot " + (m.open ? "is-open" : "is-closed");
    $("[data-live-short]").textContent = m.open ? "Abierto · Llamar" : "Llamar";
  }

  /* ----------------------------------------------------------------- render */
  const hoursTxt = r => r.length ? r.map(x => x[0] + "–" + hhmm(toMin(x[1])).replace(/^00:00$/, "24:00")).join(" · ") : "Cerrado";
  const weekHtml = l => { const today = madridNow().day; return l.h.map((r, i) => `
      <div class="${i === today ? "is-today" : ""}"><span>${DIAS[i]}${i === today ? " · hoy" : ""}</span><span>${hoursTxt(r)}</span></div>`).join(""); };

  function renderLocales() {
    $("#localesGrid").innerHTML = LOCALES.map((l, i) => `
      <button type="button" class="loc${i === 0 ? " is-main" : ""}" data-loc="${l.id}" aria-haspopup="dialog">
        <span class="status" data-status="${l.id}"><span class="dot"></span><span class="status__txt">…</span></span>
        <h3>${esc(l.n)}</h3><p>${esc(l.d)}</p><p>${esc(l.tel)}</p>
        <span class="loc__go">Pedir aquí →</span>
      </button>`).join("");
    $("#hoursMercado").innerHTML = weekHtml(LOCALES[0]);
    $$("[data-loc]").forEach(b => b.addEventListener("click", () => openLoc(b.dataset.loc)));
  }

  /* location modal: address, hours, order here with Sofia */
  const locModal = $("#locModal");
  let locReturn = null, locCurrent = null;
  function openLoc(id) {
    const l = LOCALES.find(x => x.id === id);
    if (!l) return;
    locCurrent = l;
    locReturn = document.activeElement;
    $("#locName").textContent = "Pizzi " + l.n;
    const st = status(l);
    $("#locStatus").innerHTML = `<span class="dot ${st.open ? "is-open" : "is-closed"}"></span><span>${esc(st.txt)}</span>`;
    $("#locAddr").textContent = l.d.replace(" · ", ", ") + ", València";
    $("#locTel").textContent = l.tel;
    $("#locTel").href = "tel:" + l.tel.replace(/\s/g, "");
    $("#locCall").href = "tel:" + l.tel.replace(/\s/g, "");
    $("#locMaps").href = l.maps;
    $("#locHours").innerHTML = weekHtml(l);
    $("#locOrderTxt").textContent = st.open
      ? "¿Pedimos para recoger aquí? Sofia te toma el pedido por voz en un minuto."
      : "Ahora está cerrado, pero Sofia puede dejarte el pedido programado para cuando abra.";
    locModal.hidden = false;
    requestAnimationFrame(() => locModal.classList.add("is-open"));
    $("#locOrder").focus();
  }
  function closeLoc() {
    locModal.classList.remove("is-open");
    setTimeout(() => { locModal.hidden = true; }, 300);
    if (locReturn) locReturn.focus();
  }
  $("#locClose").addEventListener("click", closeLoc);
  locModal.addEventListener("click", e => { if (e.target === locModal) closeLoc(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !locModal.hidden) closeLoc(); });
  $("#locOrder").addEventListener("click", () => {
    const l = locCurrent;
    closeLoc();
    if (window.PizziVoice) window.PizziVoice.openAndStart({ id: l.id, name: "Pizzi " + l.n });
  });

  function renderCarta() {
    const drinkCards = DRINKS.map(([n, p]) => `
      <article class="card" data-type="bebida"><div class="card__img"><div class="card__drink">${esc(n[0])}</div></div>
        <div class="card__body"><div class="card__top"><h3>${esc(n)}</h3><span class="card__price">${eur(p)}</span></div><p>${n === "Agua" ? "Botella 50 cl" : "Lata 33 cl"}</p></div></article>`);
    const pizzaCards = PIZZAS.map(([n, t, ing, p, tag, look]) => {
      const visual = look.startsWith("img:")
        ? `<img src="assets/img/${look.slice(4)}" alt="Pizza ${esc(n.toLowerCase())}" loading="lazy">`
        : `<div class="card__disc" style="background:${LOOKS[look]}"></div>`;
      return `<article class="card" data-type="${t}"><div class="card__img">${visual}</div>
        <div class="card__body"><div class="card__top"><h3>${esc(n)}</h3><span class="card__price">${eur(p)}</span></div><p>${esc(ing)}</p>${tag ? `<span class="card__tag">${esc(tag)}</span>` : ""}</div></article>`;
    });
    $("#cartaGrid").innerHTML = pizzaCards.concat(drinkCards).join("");
    $$(".tabs [data-filter]").forEach(b => b.addEventListener("click", () => {
      $$(".tabs [data-filter]").forEach(x => x.setAttribute("aria-selected", String(x === b)));
      const f = b.dataset.filter;
      $$("#cartaGrid .card").forEach(c => { c.hidden = f !== "all" && c.dataset.type !== f; });
    }));
  }

  /* ------------------------------------------------------------------ boot */
  renderLocales();
  renderCarta();
  paintStatus();
  setInterval(paintStatus, 60000);
  $("#yr").textContent = new Date().getFullYear();

  // nav: solid after the hero, mobile menu
  const nav = $("#nav"), burger = $("#navBurger"), hero = $(".hero");
  const onScroll = () => nav.classList.toggle("is-solid", scrollY > hero.offsetHeight - 70);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const setMenu = open => {
    nav.classList.toggle("is-menu", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-menu")));
  $$("#navLinks a").forEach(a => a.addEventListener("click", () => setMenu(false)));

  // "Pedir con Sofia" buttons open the voice widget
  $$("[data-sofia]").forEach(b => b.addEventListener("click", () => window.PizziVoice && window.PizziVoice.openAndStart()));
})();
