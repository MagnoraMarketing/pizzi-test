/* PIZZI · scroll-driven "video" engine — vanilla, no dependencies */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const root = document.documentElement;
  const motion = !root.classList.contains("no-motion");

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
  function renderLocales() {
    $("#localesGrid").innerHTML = LOCALES.map((l, i) => `
      <a class="loc${i === 0 ? " is-main" : ""}" href="${l.maps}" target="_blank" rel="noopener">
        <span class="status" data-status="${l.id}"><span class="dot"></span><span class="status__txt">…</span></span>
        <h3>${esc(l.n)}</h3><p>${esc(l.d)}</p><p>${esc(l.tel)}</p>
        <span class="loc__go">Cómo llegar →</span>
      </a>`).join("");
    const today = madridNow().day;
    $("#hoursMercado").innerHTML = LOCALES[0].h.map((r, i) => `
      <div class="${i === today ? "is-today" : ""}"><span>${DIAS[i]}${i === today ? " · hoy" : ""}</span><span>${r.length ? r.map(x => x[0] + "–" + hhmm(toMin(x[1])).replace("00:00", "24:00")).join(" · ") : "Cerrado"}</span></div>`).join("");
  }
  function renderCarta() {
    const cards = [`<article class="card card--intro"><h3>Hecha<br>en 90<br>segundos</h3><p>Desliza para ver todas. Todas a 31 cm, todas al horno italiano.</p></article>`];
    PIZZAS.forEach(([n, , ing, p, tag, look]) => {
      const visual = look.startsWith("img:")
        ? `<img src="assets/img/${look.slice(4)}" alt="Pizza ${esc(n.toLowerCase())}" loading="lazy">`
        : `<div class="card__disc" style="background:${LOOKS[look]}"><span>${esc(n[0])}</span></div>`;
      cards.push(`<article class="card">${tag ? `<span class="card__tag${tag === "La de siempre" ? " card__tag--soft" : ""}">${esc(tag)}</span>` : `<span class="card__tag card__tag--soft">${p < 9 ? "Clásica" : "Especial"}</span>`}
        <div class="card__img">${visual}</div><h3>${esc(n)}</h3><p>${esc(ing)}</p><div class="card__price">${eur(p)}</div></article>`);
    });
    cards.push(`<article class="card card--drinks"><span class="card__tag card__tag--soft">Para acompañar</span><h3 style="margin-top:18px">Bebidas</h3><ul>${DRINKS.map(([n, p]) => `<li><span>${n}</span><span>${eur(p)}</span></li>`).join("")}</ul></article>`);
    $("#cartaTrack").innerHTML = cards.join("");
  }

  /* ------------------------------------------------------- ingredients (hero) */
  const SVG = {
    basil: '<svg viewBox="0 0 60 40"><path d="M2 20C14 2 44 0 58 20 44 40 14 38 2 20Z" fill="#3c8a4a"/><path d="M4 20H56" stroke="#2b6a37" stroke-width="2" fill="none"/><path d="M18 20l8-8M30 20l8-8M18 20l8 8M30 20l8 8" stroke="#2b6a37" stroke-width="1.4" fill="none"/></svg>',
    tomato: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="#d8302a"/><circle cx="20" cy="20" r="14" fill="#ef5a45"/><g fill="#f6d27b"><ellipse cx="20" cy="11" rx="2.4" ry="3.4"/><ellipse cx="28" cy="22" rx="3.4" ry="2.4"/><ellipse cx="13" cy="25" rx="3" ry="2.4"/></g></svg>',
    pistachio: '<svg viewBox="0 0 30 22"><ellipse cx="15" cy="11" rx="14" ry="10" fill="#9bbf4a"/><ellipse cx="12" cy="9" rx="6" ry="4" fill="#c6dc7a"/></svg>',
    burrata: '<svg viewBox="0 0 50 40"><path d="M6 22C2 10 18 2 28 6s20 4 18 16-16 16-26 14S9 31 6 22Z" fill="#fffaf0"/><path d="M14 18c6-6 16-6 22 0" stroke="#efe3cc" stroke-width="2" fill="none"/></svg>'
  };
  const ING = [];
  function buildIngredients() {
    const wrap = $("#ingredients");
    const kinds = ["basil", "tomato", "pistachio", "burrata", "basil", "tomato", "pistachio", "basil", "burrata", "tomato", "pistachio", "basil", "tomato", "pistachio"];
    const sizes = { basil: 70, tomato: 48, pistachio: 30, burrata: 60 };
    kinds.forEach((k, i) => {
      const el = document.createElement("div");
      el.className = "ing";
      const s = sizes[k] * (0.8 + ((i * 37) % 10) / 20);
      el.style.width = s + "px";
      el.style.height = s + "px";
      el.style.margin = `${-s / 2}px 0 0 ${-s / 2}px`;
      el.innerHTML = SVG[k];
      wrap.appendChild(el);
      ING.push({ el, ang: (i / kinds.length) * Math.PI * 2 + (i % 3) * 0.3, r: 0.36 + ((i * 13) % 7) / 40, rot: (i * 47) % 360, spin: (i % 2 ? 1 : -1) * (120 + i * 20), depth: 0.6 + ((i * 7) % 5) / 6, ph: i * 1.7 });
    });
  }

  /* -------------------------------------------------------------- the engine */
  const scenes = {};
  let vh = innerHeight, vw = innerWidth;
  let target = scrollY, smooth = scrollY, lastSmooth = scrollY, velocity = 0;
  const t0 = performance.now();

  function measure() {
    vh = innerHeight; vw = innerWidth;
    const track = $("#cartaTrack");
    const carta = $(".carta");
    if (motion) carta.style.height = Math.max(vh * 1.5, track.scrollWidth - vw + vh * 1.2) + "px";
    $$(".scene").forEach(s => {
      const r = s.getBoundingClientRect();
      scenes[s.dataset.scene] = { el: s, top: r.top + scrollY, h: s.offsetHeight };
    });
  }
  const prog = name => { const s = scenes[name]; return s ? clamp((smooth - s.top) / Math.max(1, s.h - vh)) : 0; };
  const inView = name => { const s = scenes[name]; return s && smooth + vh > s.top - 200 && smooth < s.top + s.h + 200; };

  // cached nodes
  const N = {};
  function cache() {
    Object.assign(N, {
      heroBg: $(".hero__bg"), hwL: $(".hw--l"), hwR: $(".hw--r"), pizza: $(".hero__pizza"), pizzaImg: $(".hero__pizza img"),
      badge: $(".hero__badge"), sticker: $(".hero__sticker"), copy: $(".hero__copy"), lines: $$(".hero__title .line>span"),
      btns: $(".hero__btns"), kicker: $(".hero__copy .kicker"), heroSticky: $(".hero .sticky"),
      frames: $$(".frame"), frameImgs: $$(".frame img"), chapters: $$(".chapter"), filmSticky: $(".film .sticky"),
      tc: $("#tc"), tl: $("#tlFill"), tlItems: $$(".timeline li"), deg: $("#degrees"),
      track: $("#cartaTrack"), cartaFill: $("#cartaFill"),
      revealSticky: $(".reveal .sticky"), revealSpans: $$(".reveal__title span"),
      marquee: $("[data-marquee]"), nav: $("#nav")
    });
  }

  let mq = 0;
  function frame(now) {
    const time = (now - t0) / 1000;
    target = scrollY;
    smooth = lerp(smooth, target, 0.12);
    if (Math.abs(smooth - target) < 0.1) smooth = target;
    velocity = lerp(velocity, smooth - lastSmooth, 0.2);
    lastSmooth = smooth;

    /* HERO */
    if (inView("hero")) {
      const p = prog("hero");
      const a = easeIO(seg(p, 0, 0.5));
      const b = ease(seg(p, 0.38, 0.72));
      const sc = 1 + a * 1.55;
      N.pizza.style.transform = `scale(${sc}) translateY(${Math.sin(time * 1.2) * 6 * (1 - a)}px)`;
      N.pizzaImg.style.transform = `rotate(${p * 320 + time * 4}deg)`;
      N.pizza.style.opacity = 1 - b * 0.82;
      N.pizza.style.filter = `blur(${b * 6}px)`;
      N.hwL.style.transform = `translateX(${-a * 70}vw) rotate(${-a * 8}deg)`;
      N.hwR.style.transform = `translateX(${a * 70}vw) rotate(${a * 8}deg)`;
      N.heroSticky.style.setProperty("--dark", (b * 0.6).toFixed(3));
      N.heroSticky.style.setProperty("--hint", clamp(1 - p * 10).toFixed(3));
      N.heroSticky.style.setProperty("--steam", clamp(1 - a * 2.5).toFixed(3));
      N.badge.style.transform = `translate(${a * 30}vw, ${-a * 50}vh) rotate(${a * 90}deg)`;
      N.sticker.style.transform = `translate(${-a * 50}vw, ${a * 20}vh) rotate(${-6 - a * 30}deg)`;
      N.copy.style.opacity = b;
      N.copy.classList.toggle("is-on", b > 0.6);
      N.kicker.style.transform = `translateY(${(1 - b) * 30}px)`;
      N.lines.forEach((l, i) => { const k = ease(seg(p, 0.42 + i * 0.06, 0.66 + i * 0.06)); l.style.transform = `translateY(${(1 - k) * 110}%) rotate(${(1 - k) * 4}deg)`; });
      N.btns.style.transform = `translateY(${(1 - ease(seg(p, 0.6, 0.8))) * 40}px)`;
      N.btns.style.opacity = seg(p, 0.6, 0.8);
      const R = Math.min(vw, vh);
      ING.forEach(g => {
        const r = R * g.r * (1 + a * 2.4 * g.depth);
        const x = Math.cos(g.ang + p * 0.8) * r + Math.sin(time * 0.8 + g.ph) * 6;
        const y = Math.sin(g.ang + p * 0.8) * r * 0.85 + Math.cos(time + g.ph) * 8;
        g.el.style.transform = `translate(${x}px,${y}px) rotate(${g.rot + p * g.spin + time * 10}deg) scale(${0.9 + a * g.depth * 0.8})`;
        g.el.style.opacity = 1 - seg(p, 0.45, 0.7);
      });
    }

    /* FILM */
    if (inView("film")) {
      const p = prog("film");
      const q = clamp(p * 1.08 - 0.04) * 4; // small lead-in / lead-out
      const lb = lerp(50, 9, ease(seg(p, 0, 0.06)));
      N.filmSticky.style.setProperty("--lb", lb + "vh");
      N.frames.forEach((f, i) => {
        const fin = i === 0 ? 1 : clamp((q - i + 0.12) / 0.24);
        const fout = i === 3 ? 1 : clamp((i + 1 - q + 0.12) / 0.24);
        f.style.opacity = Math.min(fin, fout);
        const loc = clamp(q - i + 0.2, 0, 1.4);
        N.frameImgs[i].style.transform = `scale(${1.22 - loc * 0.14}) translate(${(i % 2 ? 1 : -1) * loc * 2}%, ${loc * -1.5}%)`;
      });
      N.chapters.forEach((c, i) => {
        const t = q - i;
        const fin = ease(seg(t, 0.02, 0.22));
        const fout = i === 3 ? 0 : ease(seg(t, 0.8, 0.98));
        c.style.opacity = fin * (1 - fout);
        c.style.transform = `translateY(${(1 - fin) * 70 - fout * 70}px)`;
        c.style.filter = `blur(${(1 - fin + fout) * 8}px)`;
      });
      const secs = p * 90, f25 = Math.floor((secs % 1) * 25);
      N.tc.textContent = `00:${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(Math.floor(secs % 60)).padStart(2, "0")}:${String(f25).padStart(2, "0")}`;
      N.tl.style.transform = `scaleX(${p})`;
      const idx = Math.min(3, Math.floor(q));
      N.tlItems.forEach((li, i) => li.classList.toggle("is-on", i <= idx));
      N.deg.textContent = Math.round(lerp(20, 485, ease(seg(q - 2, 0, 0.5))));
    }

    /* CARTA (horizontal) */
    if (inView("carta")) {
      const p = prog("carta");
      const max = Math.max(0, N.track.scrollWidth - vw);
      N.track.style.transform = `translate3d(${-p * max}px,0,0)`;
      N.cartaFill.style.transform = `scaleX(${p})`;
    }

    /* REVEAL */
    if (inView("reveal")) {
      const p = prog("reveal");
      const a = easeIO(seg(p, 0, 0.55));
      const st = N.revealSticky.style;
      st.setProperty("--ci", (1 - a) * 22 + "%");
      st.setProperty("--cx", (1 - a) * 34 + "%");
      st.setProperty("--cr", (1 - a) * 48 + "px");
      st.setProperty("--rs", (1.45 - a * 0.45 + seg(p, 0.55, 1) * 0.08).toFixed(3));
      st.setProperty("--rd", (seg(p, 0.3, 0.6) * 0.45).toFixed(3));
      N.revealSpans.forEach((s, i) => {
        const k = ease(seg(p, 0.32 + i * 0.08, 0.52 + i * 0.08));
        s.style.opacity = k;
        s.style.transform = `translateY(${(1 - k) * 80}px) skewY(${(1 - k) * 6}deg)`;
      });
    }

    /* marquee: drifts on its own, accelerates with scroll velocity */
    mq -= 0.6 + Math.min(18, Math.abs(velocity) * 0.5);
    const half = N.marquee.scrollWidth / 2;
    if (half && -mq > half) mq += half;
    N.marquee.style.transform = `translate3d(${mq}px,0,0)`;

    const heroEnd = scenes.hero ? scenes.hero.top + scenes.hero.h - 80 : vh;
    const f = scenes.film, overFilm = f && target >= f.top - 40 && target < f.top + f.h - vh;
    N.nav.classList.toggle("is-solid", target > heroEnd && !overFilm);
    N.nav.classList.toggle("is-film", !!overFilm);

    requestAnimationFrame(frame);
  }

  /* ----------------------------------------------------------- count-ups */
  function countUps() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const end = +e.target.dataset.count, st = performance.now(), dur = 1400;
      const step = n => { const k = ease(clamp((n - st) / dur)); e.target.textContent = Math.round(end * k); if (k < 1) requestAnimationFrame(step); };
      motion ? requestAnimationFrame(step) : (e.target.textContent = end);
    }), { threshold: 0.6 });
    $$("[data-count]").forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------------- loader */
  function loader(done) {
    const L = $("#loader"), num = $("#loaderNum"), bar = $("#loaderBar");
    if (!motion) { done(); return; }
    const imgs = [$(".hero__pizza img")];
    let ready = false;
    Promise.all(imgs.map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))).then(() => ready = true);
    const st = performance.now();
    const tick = n => {
      const k = clamp((n - st) / 1300);
      const v = Math.round((ready ? k : Math.min(k, 0.85)) * 100);
      num.textContent = v; bar.style.width = v + "%";
      if (v < 100) requestAnimationFrame(tick);
      else { L.classList.add("is-done"); setTimeout(() => L.remove(), 1100); done(); }
    };
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------ boot */
  renderLocales();
  renderCarta();
  paintStatus();
  setInterval(paintStatus, 60000);
  $("#yr").textContent = new Date().getFullYear();
  countUps();
  cache();

  if (motion) {
    buildIngredients();
    measure();
    addEventListener("resize", measure);
    addEventListener("load", measure);
    if (document.fonts) document.fonts.ready.then(measure);
    // anchor links: jump scene-aware (native smooth scroll)
    $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      const el = id === "#top" ? document.body : $(id);
      if (!el) return;
      e.preventDefault();
      let y = id === "#top" ? 0 : el.getBoundingClientRect().top + scrollY;
      if (id === "#carta") y += 1; // land inside the pinned scene
      if (id === "#historia") y += vh * 0.35;
      scrollTo({ top: y, behavior: "smooth" });
    }));
    loader(() => {});
    requestAnimationFrame(frame);
  } else {
    loader(() => {});
  }
})();
