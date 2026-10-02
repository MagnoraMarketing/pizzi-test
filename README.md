# PIZZI · Mercado Central (Valencia)

Hjemmeside til Pizzi Pizzería med carta, live åbningsstatus for alle 5 steder og stemmeassistenten Sofia (Vapi). Den er ren HTML/CSS/JS uden build-trin, så den kan køre direkte på Vercel eller GitHub Pages.

- `index.html`: siden
- `assets/css/style.css`: design
- `assets/js/main.js`: carta med filtre, locales, mobilmenu og live åben/lukket-status (Europe/Madrid)
- `assets/js/voice.js` + `assets/vendor/`: Sofia voice-widget (Vapi web SDK 2.7.1) og demo-boksen om aibooking.dk. Hvert opkald starter en session i aibooking (`/api/widget/session` med `widgetId: "pizzi-valencia"`), som giver Vapi-nøgle og assistent og logger opkaldet under kunden Pizzi (Valencia).
- `assets/js/order.js`: demo-bestilling (kurv → afhentning → oplysninger → betaling → bekræftelse). Betalingen er en Stripe-lignende demo; se kommentaren ved `Payments` for at koble rigtig Stripe på (PaymentIntent + Payment Element i `#payElement`). Ordrer fra Sofia (`create_order` tool-call) vises automatisk i kurven.
- `voice-agent/`: prompts og fiktive værktøjsdefinitioner til Vapi
- `assets/img/`: fotos

Lokalt: `python3 -m http.server` og åbn http://localhost:8000.
Respekterer `prefers-reduced-motion`.

Den tidligere Forno Rosso-side ligger nu i `forno-rosso/`.
