/* PIZZI · Sofia voice widget (Vapi) + aibooking.dk demo note */
(() => {
  "use strict";

  const CFG = Object.assign({
    publicKey: "",
    assistantId: "",
    firstMessage: "¡Ciao! Soy Sofia, de Pizzi. ¿Te preparo un pedido para recoger, te reservo mesa o te cuento qué pizzas tenemos?"
  }, window.PIZZI_VOICE || {});

  const $ = s => document.querySelector(s);
  const fab = $("#vFab"), panel = $("#vPanel"), orb = $("#vOrb"), statusEl = $("#vStatus"),
        log = $("#vLog"), callBtn = $("#vCall"), closeBtn = $("#vClose"),
        owner = $("#ownerModal");

  let vapi = null, state = "idle"; // idle | connecting | live

  const STATUS = {
    idle: "Pulsa el botón y habla con Sofia",
    connecting: "Conectando…",
    listening: "Te escucho…",
    speaking: "Sofia está hablando",
    ended: "Llamada terminada. Grazie mille!",
    nokey: "La demo de voz se activa en breve.",
    mic: "Necesito permiso para usar tu micrófono.",
    error: "Algo ha fallado. Inténtalo de nuevo."
  };
  const say = k => { statusEl.textContent = STATUS[k] || k; };

  function setState(s) {
    state = s;
    panel.dataset.state = s;
    fab.dataset.state = s;
    callBtn.textContent = s === "idle" ? "Hablar con Sofia" : s === "connecting" ? "Conectando…" : "Colgar";
    callBtn.disabled = s === "connecting";
  }

  function addLine(role, text, partial) {
    let last = log.lastElementChild;
    if (!(last && last.dataset.role === role && last.dataset.partial === "1")) {
      last = document.createElement("p");
      last.dataset.role = role;
      log.appendChild(last);
    }
    last.dataset.partial = partial ? "1" : "0";
    last.textContent = text;
    while (log.children.length > 6) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }

  function openPanel() {
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add("is-open"));
    fab.setAttribute("aria-expanded", "true");
  }
  function closePanel() {
    if (state !== "idle") stop();
    panel.classList.remove("is-open");
    fab.setAttribute("aria-expanded", "false");
    setTimeout(() => { if (!panel.classList.contains("is-open")) panel.hidden = true; }, 300);
  }

  function ensureVapi() {
    if (vapi) return vapi;
    if (!window.Vapi || !CFG.publicKey || !CFG.assistantId) return null;
    vapi = new window.Vapi(CFG.publicKey);
    vapi.on("call-start", () => { setState("live"); say("listening"); });
    vapi.on("call-end", () => { setState("idle"); say("ended"); orb.style.setProperty("--vol", 0); });
    vapi.on("speech-start", () => say("speaking"));
    vapi.on("speech-end", () => { if (state === "live") say("listening"); });
    vapi.on("volume-level", v => orb.style.setProperty("--vol", Math.min(1, v * 1.6).toFixed(3)));
    vapi.on("message", m => {
      // create_order from Sofia → show the order on screen for review/payment (order.js)
      const calls = m && m.type === "tool-calls" ? (m.toolCallList || m.toolCalls || []).map(c => c.function || c)
        : m && m.type === "function-call" && m.functionCall ? [{ name: m.functionCall.name, arguments: m.functionCall.parameters }] : [];
      calls.filter(c => c && c.name === "create_order").forEach(c => {
        let args = c.arguments || c.parameters || {};
        if (typeof args === "string") { try { args = JSON.parse(args); } catch (_) { args = {}; } }
        dispatchEvent(new CustomEvent("pizzi:voice-order", { detail: args }));
      });
      if (m && m.type === "transcript" && m.transcript) addLine(m.role === "user" ? "user" : "bot", m.transcript, m.transcriptType === "partial");
    });
    vapi.on("error", e => {
      console.warn("[Sofia]", e);
      const msg = String((e && (e.message || e.errorMsg || (e.error && e.error.message))) || e);
      setState("idle");
      say(/permission|notallowed|microphone/i.test(msg) ? "mic" : "error");
    });
    return vapi;
  }

  async function start(loc) {
    const v = ensureVapi();
    if (!v) { say("nokey"); console.warn("[Sofia] Missing Vapi publicKey/assistantId in window.PIZZI_VOICE"); return; }
    setState("connecting"); say("connecting");
    log.innerHTML = "";
    try {
      const overrides = {};
      if (loc) {
        overrides.firstMessage = `¡Ciao! Soy Sofia, de ${loc.name}. Perfetto, preparamos tu pedido para recoger aquí. ¿Qué pizzas te apetecen?`;
        overrides.variableValues = { location: loc.name, location_id: loc.id };
      } else if (CFG.firstMessage) overrides.firstMessage = CFG.firstMessage;
      await v.start(CFG.assistantId, overrides);
    } catch (e) {
      console.warn("[Sofia]", e);
      setState("idle");
      say(/permission|notallowed/i.test(String(e && e.name || e)) ? "mic" : "error");
    }
  }
  function stop() { try { vapi && vapi.stop(); } catch (_) {} setState("idle"); }

  fab.addEventListener("click", () => panel.classList.contains("is-open") ? closePanel() : openPanel());
  closeBtn.addEventListener("click", closePanel);
  callBtn.addEventListener("click", () => state === "idle" ? start() : stop());
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (!owner.hidden) closeOwner(); else if (panel.classList.contains("is-open")) closePanel();
  });

  /* ---------- owner modal (aibooking.dk) ---------- */
  function openOwner() { owner.hidden = false; requestAnimationFrame(() => owner.classList.add("is-open")); $("#ownerClose").focus(); }
  function closeOwner() { owner.classList.remove("is-open"); setTimeout(() => { owner.hidden = true; }, 300); }
  document.querySelectorAll("[data-owner]").forEach(b => b.addEventListener("click", openOwner));
  $("#ownerClose").addEventListener("click", closeOwner);
  owner.addEventListener("click", e => { if (e.target === owner) closeOwner(); });
  $("#ownerTry").addEventListener("click", () => { closeOwner(); openPanel(); if (state === "idle") start(); });

  const sub = $("#vSub");
  window.PizziVoice = {
    open: openPanel,
    openAndStart: loc => {
      sub.textContent = loc ? "Pedido para recoger en " + loc.name : "Asistente de voz de Pizzi";
      openPanel();
      if (state === "idle") start(loc);
    }
  };

  setState("idle"); say("idle");
})();
