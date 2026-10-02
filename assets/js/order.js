/* PIZZI · demo ordering: cart → pickup → details → payment (Stripe-ready) → confirmation */
(() => {
  "use strict";
  const P = window.Pizzi;
  if (!P) return;
  const { LOCALES, PIZZAS, DRINKS, DIAS, LOOKS, status, madridNow, toMin, hhmm, eur, esc } = P;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ------------------------------------------------------------------ catalog */
  const EXTRAS = [
    { id: "veg", n: "Mozzarella vegana", p: 2 },
    { id: "moz", n: "Extra de mozzarella", p: 1.5 },
    { id: "bur", n: "Extra de crema de burrata", p: 2 },
    { id: "pic", n: "Aceite picante", p: 0 }
  ];
  const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
  const CATALOG = {};
  PIZZAS.forEach(([n, t, ing, p, , look]) => { CATALOG[norm(n)] = { n, t, ing, p, look, pizza: true }; });
  DRINKS.forEach(([n, p]) => { CATALOG[norm(n)] = { n, t: "bebida", p, pizza: false }; });

  /* -------------------------------------------------------------- payments
     Demo adapter. To go live with Stripe:
       1. Backend endpoint creates a PaymentIntent for order.total (EUR, cents) and returns client_secret.
       2. Load https://js.stripe.com/v3, mount a Payment Element in #payElement instead of the demo card.
       3. In pay(): stripe.confirmPayment({ elements, redirect: "if_required" }) and return its status.
     Everything else (cart, pickup, confirmation) stays the same. */
  const Payments = {
    provider: "demo",
    async pay(order) {
      await new Promise(r => setTimeout(r, 1400));
      return { status: "succeeded", id: "pi_demo_" + Math.random().toString(36).slice(2, 10), amount: Math.round(order.total * 100) };
    }
  };

  /* ------------------------------------------------------------------- state */
  const KEY = "pizzi-order-v1";
  let S = { items: [], loc: "mercado", slot: "", name: "", phone: "", notes: "", pay: "card" };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} };

  const itemPrice = it => (CATALOG[norm(it.n)].p + it.extras.reduce((a, id) => a + (EXTRAS.find(e => e.id === id) || { p: 0 }).p, 0)) * it.q;
  const total = () => S.items.reduce((a, it) => a + itemPrice(it), 0);
  const count = () => S.items.reduce((a, it) => a + it.q, 0);

  function addItem(n, extras = [], q = 1, note = "") {
    const key = n + "|" + [...extras].sort().join(",") + "|" + note;
    const ex = S.items.find(it => it.key === key);
    if (ex) ex.q += q; else S.items.push({ key, n, extras: [...extras], q, note });
    save(); paintBadge();
  }

  /* ---------------------------------------------------------- pickup slots */
  function slotsFor(locId) {
    const l = LOCALES.find(x => x.id === locId);
    const { day, min } = madridNow();
    const out = [];
    const st = status(l);
    if (st.open) out.push({ v: "asap", label: "Lo antes posible (≈15 min)" });
    for (let off = 0; off < 2; off++) {
      const d = (day + off) % 7;
      for (const [o, c] of l.h[d]) {
        let from = toMin(o) + 15;
        if (off === 0) from = Math.max(from, Math.ceil((min + 20) / 15) * 15);
        for (let m = from; m <= toMin(c) - 15; m += 15) {
          out.push({ v: off + "|" + m, label: (off === 0 ? "Hoy" : "Mañana") + " · " + hhmm(m) });
        }
      }
    }
    return out;
  }
  const slotLabel = v => { const s = slotsFor(S.loc).find(x => x.v === v); return s ? s.label : ""; };

  /* -------------------------------------------------------------- DOM refs */
  const drawer = $("#cart"), body = $("#cartBody"), foot = $("#cartFoot"), steps = $$(".cart__steps li");
  const badge = $("#cartBadge"), navCart = $("#navCart"), toast = $("#toast"), sheet = $("#addSheet");
  let step = 0, lastFocus = null;

  function paintBadge() {
    const c = count();
    badge.textContent = c;
    navCart.classList.toggle("has-items", c > 0);
    $("#navCartTotal").textContent = c ? eur(total()) : "Pedido";
  }
  let toastT;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove("is-on"), 2200);
  }

  /* ----------------------------------------------------- add-to-cart sheet */
  let sheetItem = null, sheetQty = 1;
  function openSheet(n) {
    const c = CATALOG[norm(n)];
    if (!c) return;
    if (!c.pizza) { addItem(c.n); showToast(c.n + " añadida al pedido"); return; }
    sheetItem = c; sheetQty = 1;
    $("#sheetImg").innerHTML = c.look.startsWith("img:")
      ? `<img src="assets/img/${c.look.slice(4)}" alt="">`
      : `<div class="card__disc" style="background:${LOOKS[c.look]}"></div>`;
    $("#sheetName").textContent = c.n;
    $("#sheetIng").textContent = c.ing;
    $("#sheetExtras").innerHTML = EXTRAS.map(e => `<label class="chk"><input type="checkbox" value="${e.id}"><span>${e.n}</span><b>${e.p ? "+" + eur(e.p) : "gratis"}</b></label>`).join("");
    $("#sheetNote").value = "";
    paintSheet();
    lastFocus = document.activeElement;
    openLayer(sheet);
  }
  function sheetExtras() { return $$("#sheetExtras input:checked").map(i => i.value); }
  function paintSheet() {
    $("#sheetQty").textContent = sheetQty;
    const unit = sheetItem.p + sheetExtras().reduce((a, id) => a + EXTRAS.find(e => e.id === id).p, 0);
    $("#sheetAdd").textContent = "Añadir · " + eur(unit * sheetQty);
  }
  $("#sheetExtras").addEventListener("change", paintSheet);
  $("#sheetMinus").addEventListener("click", () => { sheetQty = Math.max(1, sheetQty - 1); paintSheet(); });
  $("#sheetPlus").addEventListener("click", () => { sheetQty = Math.min(20, sheetQty + 1); paintSheet(); });
  $("#sheetAdd").addEventListener("click", () => {
    addItem(sheetItem.n, sheetExtras(), sheetQty, $("#sheetNote").value.trim().slice(0, 120));
    closeLayer(sheet);
    showToast(sheetQty + " × " + sheetItem.n + " añadida");
  });
  $("#sheetClose").addEventListener("click", () => closeLayer(sheet));

  /* ----------------------------------------------------------- layers */
  function openLayer(el) {
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("is-open"));
    document.body.classList.add("is-locked");
    const f = el.querySelector("button, input, select, a");
    if (f) setTimeout(() => f.focus(), 50);
  }
  function closeLayer(el) {
    el.classList.remove("is-open");
    setTimeout(() => { el.hidden = true; }, 300);
    if (drawer.hidden || el === drawer) document.body.classList.remove("is-locked");
    if (lastFocus && el !== drawer) lastFocus.focus();
  }
  [drawer, sheet].forEach(el => el.addEventListener("click", e => { if (e.target === el) closeLayer(el); }));
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (!sheet.hidden) closeLayer(sheet); else if (!drawer.hidden) closeLayer(drawer);
  });

  /* ---------------------------------------------------------- checkout */
  const STEP_TITLES = ["Tu pedido", "Recogida", "Tus datos", "Pago"];
  function openCart(at = 0) { step = at; render(); lastFocus = document.activeElement; openLayer(drawer); }
  $("#cartClose").addEventListener("click", () => closeLayer(drawer));
  navCart.addEventListener("click", () => openCart(0));

  function render() {
    steps.forEach((li, i) => { li.classList.toggle("is-on", i <= step && step < 4); li.classList.toggle("is-done", i < step); });
    $(".cart__steps").hidden = step === 4;
    $("#cartTitle").textContent = step === 4 ? "¡Pedido confirmado!" : STEP_TITLES[step];
    if (step < 4) [renderItems, renderPickup, renderDetails, renderPay][step]();
    body.scrollTop = 0;
  }

  function renderItems() {
    if (!S.items.length) {
      body.innerHTML = `<div class="cart__empty"><img src="assets/img/pistachiola.webp" alt=""><p>Tu pedido está vacío.</p><p class="muted">Añade una pizza desde la carta o pídeselo a Sofia por voz.</p></div>`;
      foot.innerHTML = `<a class="btn btn--red btn--full" href="#carta" id="goCarta">Ver la carta</a>
        <button class="btn btn--line btn--full" type="button" data-sofia-cart>Pedir con Sofia</button>`;
      $("#goCarta").addEventListener("click", () => closeLayer(drawer));
      return;
    }
    body.innerHTML = `<ul class="lines">${S.items.map((it, i) => `
      <li><div class="lines__main"><b>${esc(it.n)}</b>
        ${it.extras.length ? `<span>${it.extras.map(id => EXTRAS.find(e => e.id === id).n).join(", ")}</span>` : ""}
        ${it.note ? `<span>“${esc(it.note)}”</span>` : ""}</div>
        <div class="qty"><button type="button" data-dec="${i}" aria-label="Quitar uno">−</button><span>${it.q}</span><button type="button" data-inc="${i}" aria-label="Añadir uno">+</button></div>
        <b class="lines__p">${eur(itemPrice(it))}</b></li>`).join("")}</ul>
      <button type="button" class="link" id="moreItems">+ Añadir algo más</button>`;
    foot.innerHTML = totalsHtml() + `<button class="btn btn--red btn--full" type="button" id="next">Continuar · ${eur(total())}</button>`;
    $$("[data-inc]", body).forEach(b => b.addEventListener("click", () => { S.items[+b.dataset.inc].q++; save(); paintBadge(); renderItems(); }));
    $$("[data-dec]", body).forEach(b => b.addEventListener("click", () => { const it = S.items[+b.dataset.dec]; it.q--; if (it.q < 1) S.items.splice(+b.dataset.dec, 1); save(); paintBadge(); renderItems(); }));
    $("#moreItems").addEventListener("click", () => { closeLayer(drawer); location.hash = "#carta"; });
    $("#next").addEventListener("click", () => { step = 1; render(); });
  }
  const totalsHtml = () => `<div class="totals"><span>Total (IVA incl.)</span><b>${eur(total())}</b></div>`;

  function renderPickup() {
    body.innerHTML = `
      <p class="label">¿En qué Pizzi lo recoges?</p>
      <div class="locpick">${LOCALES.map(l => { const st = status(l); return `
        <label class="locpick__o"><input type="radio" name="loc" value="${l.id}" ${S.loc === l.id ? "checked" : ""}>
          <span><b>${esc(l.n)}</b><small>${esc(l.d)}</small><em class="${st.open ? "ok" : ""}">${esc(st.txt)}</em></span></label>`; }).join("")}</div>
      <label class="label" for="slot">¿A qué hora?</label>
      <select id="slot" class="field"></select>
      <p class="muted small">Pedidos para recoger. Sin envío a domicilio.</p>`;
    const fillSlots = () => {
      const opts = slotsFor(S.loc);
      $("#slot").innerHTML = opts.length ? opts.map(o => `<option value="${o.v}" ${o.v === S.slot ? "selected" : ""}>${o.label}</option>`).join("") : `<option value="">No hay horas disponibles</option>`;
      if (!opts.find(o => o.v === S.slot)) S.slot = opts[0] ? opts[0].v : "";
      $("#next").disabled = !S.slot;
    };
    foot.innerHTML = totalsHtml() + `<div class="row"><button class="btn btn--line" type="button" id="back">Atrás</button><button class="btn btn--red" type="button" id="next">Continuar</button></div>`;
    $$('input[name="loc"]', body).forEach(r => r.addEventListener("change", () => { S.loc = r.value; save(); fillSlots(); }));
    $("#slot").addEventListener("change", e => { S.slot = e.target.value; save(); });
    fillSlots();
    $("#back").addEventListener("click", () => { step = 0; render(); });
    $("#next").addEventListener("click", () => { if (S.slot) { step = 2; render(); } });
  }

  function renderDetails() {
    body.innerHTML = `
      <label class="label" for="fName">Nombre</label>
      <input id="fName" class="field" autocomplete="name" value="${esc(S.name)}" placeholder="¿A nombre de quién?">
      <label class="label" for="fPhone">Móvil</label>
      <input id="fPhone" class="field" type="tel" autocomplete="tel" inputmode="tel" value="${esc(S.phone)}" placeholder="+34 600 000 000">
      <label class="label" for="fNotes">Nota para la cocina <span class="muted">(opcional)</span></label>
      <textarea id="fNotes" class="field" rows="2" maxlength="200" placeholder="Bien hecha, sin cortar…">${esc(S.notes)}</textarea>
      <p class="err" id="fErr" hidden></p>`;
    foot.innerHTML = totalsHtml() + `<div class="row"><button class="btn btn--line" type="button" id="back">Atrás</button><button class="btn btn--red" type="button" id="next">Ir al pago</button></div>`;
    $("#back").addEventListener("click", () => { grab(); step = 1; render(); });
    $("#next").addEventListener("click", () => {
      grab();
      const err = $("#fErr");
      if (S.name.length < 2) { err.textContent = "Escribe tu nombre."; err.hidden = false; $("#fName").focus(); return; }
      if (S.phone.replace(/\D/g, "").length < 9) { err.textContent = "Escribe un móvil válido (9 cifras o más)."; err.hidden = false; $("#fPhone").focus(); return; }
      step = 3; render();
    });
    function grab() { S.name = $("#fName").value.trim(); S.phone = $("#fPhone").value.trim(); S.notes = $("#fNotes").value.trim(); save(); }
  }

  function renderPay() {
    const l = LOCALES.find(x => x.id === S.loc);
    body.innerHTML = `
      <div class="summary">
        <div><span>Recogida</span><b>Pizzi ${esc(l.n)} · ${esc(slotLabel(S.slot))}</b></div>
        <div><span>A nombre de</span><b>${esc(S.name)} · ${esc(S.phone)}</b></div>
        <div><span>Pedido</span><b>${S.items.map(it => it.q + "× " + esc(it.n)).join(", ")}</b></div>
      </div>
      <p class="label">¿Cómo quieres pagar?</p>
      <div class="paypick">
        <label><input type="radio" name="pay" value="card" ${S.pay === "card" ? "checked" : ""}><span><b>Tarjeta</b><small>Visa, Mastercard, Apple Pay, Google Pay</small></span></label>
        <label><input type="radio" name="pay" value="local" ${S.pay === "local" ? "checked" : ""}><span><b>Pagar al recoger</b><small>En efectivo o tarjeta en el local</small></span></label>
      </div>
      <div class="stripe" id="payElement" ${S.pay === "card" ? "" : "hidden"}>
        <div class="stripe__demo">Modo demo · no se realiza ningún cargo. No introduzcas una tarjeta real.</div>
        <label class="stripe__l">Número de tarjeta</label>
        <div class="stripe__f stripe__card"><span>4242 4242 4242 4242</span><i>VISA</i></div>
        <div class="stripe__row">
          <div><label class="stripe__l">Caducidad</label><div class="stripe__f">12 / 34</div></div>
          <div><label class="stripe__l">CVC</label><div class="stripe__f">123</div></div>
        </div>
        <p class="stripe__by">🔒 Pago seguro con <b>stripe</b></p>
      </div>
      <p class="err" id="payErr" hidden></p>`;
    const btnTxt = () => S.pay === "card" ? "Pagar " + eur(total()) : "Confirmar pedido · " + eur(total());
    foot.innerHTML = totalsHtml() + `<div class="row"><button class="btn btn--line" type="button" id="back">Atrás</button><button class="btn btn--red" type="button" id="next">${btnTxt()}</button></div>`;
    $$('input[name="pay"]', body).forEach(r => r.addEventListener("change", () => { S.pay = r.value; save(); $("#payElement").hidden = S.pay !== "card"; $("#next").textContent = btnTxt(); }));
    $("#back").addEventListener("click", () => { step = 2; render(); });
    $("#next").addEventListener("click", async e => {
      const btn = e.currentTarget;
      btn.disabled = true; btn.innerHTML = `<span class="spin"></span> ${S.pay === "card" ? "Procesando pago…" : "Enviando pedido…"}`;
      const order = { items: S.items.map(it => ({ ...it })), loc: S.loc, slot: S.slot, name: S.name, phone: S.phone, notes: S.notes, pay: S.pay, total: total() };
      try {
        const res = S.pay === "card" ? await Payments.pay(order) : (await new Promise(r => setTimeout(r, 700)), { status: "pay_at_pickup" });
        if (res.status !== "succeeded" && res.status !== "pay_at_pickup") throw new Error(res.status);
        confirmOrder(order, res);
      } catch (err) {
        btn.disabled = false; btn.textContent = btnTxt();
        $("#payErr").textContent = "No se ha podido completar el pago. Inténtalo de nuevo.";
        $("#payErr").hidden = false;
      }
    });
  }

  function confirmOrder(order, res) {
    step = 4;
    const code = "PZ-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    const l = LOCALES.find(x => x.id === order.loc);
    render();
    body.innerHTML = `
      <div class="done">
        <div class="done__check" aria-hidden="true">✓</div>
        <p class="done__code">Código <b>${code}</b></p>
        <p>Te esperamos en <b>Pizzi ${esc(l.n)}</b>, ${esc(slotLabel(order.slot).toLowerCase())}.</p>
        <p class="muted">${esc(l.d)}</p>
        <ul class="lines lines--ro">${order.items.map(it => `<li><div class="lines__main"><b>${it.q}× ${esc(it.n)}</b>${it.extras.length ? `<span>${it.extras.map(id => EXTRAS.find(e => e.id === id).n).join(", ")}</span>` : ""}</div><b class="lines__p">${eur(itemPrice(it))}</b></li>`).join("")}</ul>
        <div class="totals"><span>${res.status === "succeeded" ? "Pagado con tarjeta" : "A pagar en el local"}</span><b>${eur(order.total)}</b></div>
        <p class="done__demo">Demo: este pedido es de prueba y no llega al local.</p>
        <p class="script">¡Llévame a casa que estoy caliente!</p>
      </div>`;
    foot.innerHTML = `<a class="btn btn--red btn--full" href="${l.maps}" target="_blank" rel="noopener">Cómo llegar →</a>
      <button class="btn btn--line btn--full" type="button" id="newOrder">Hacer otro pedido</button>`;
    S.items = []; S.notes = ""; save(); paintBadge();
    $("#newOrder").addEventListener("click", () => { step = 0; render(); });
  }

  /* --------------------------------------------------------------- wiring */
  document.addEventListener("click", e => {
    const add = e.target.closest("[data-add]");
    if (add) { lastFocus = add; openSheet(add.dataset.add); return; }
    if (e.target.closest("[data-sofia-cart]")) { closeLayer(drawer); window.PizziVoice && window.PizziVoice.openAndStart(); }
  });
  $$("[data-open-cart]").forEach(b => b.addEventListener("click", () => openCart(0)));

  // Sofia (Vapi) → order on screen. voice.js dispatches this when the assistant calls create_order.
  addEventListener("pizzi:voice-order", ev => {
    const a = ev.detail || {};
    const items = Array.isArray(a.items) ? a.items : [];
    const map = { mozzarella_vegana: "veg", extra_mozzarella: "moz", extra_burrata: "bur", aceite_picante: "pic" };
    S.items = [];
    items.forEach(it => { const c = CATALOG[norm(it.product || it.name || "")]; if (c) addItem(c.n, (it.extras || []).map(x => map[x] || x).filter(x => EXTRAS.find(e => e.id === x)), Math.max(1, +it.quantity || 1), it.notes || ""); });
    if (a.location_id && LOCALES.find(l => l.id === a.location_id)) S.loc = a.location_id;
    if (a.customer_name) S.name = String(a.customer_name);
    if (a.customer_phone) S.phone = String(a.customer_phone);
    S.slot = ""; save(); paintBadge();
    if (S.items.length) { openCart(S.name && S.phone ? 1 : 0); showToast("Sofia ha preparado tu pedido. Revisa y confirma."); }
  });

  window.PizziOrder = {
    open: openCart,
    startAt(locId) { S.loc = locId; save(); if (S.items.length) openCart(1); else { location.hash = "#carta"; showToast("Elige tus pizzas y pulsa “+”"); } }
  };

  paintBadge();
})();
