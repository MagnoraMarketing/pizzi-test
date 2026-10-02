# PIZZI · Mercado Central (Valencia)

Ny hjemmeside til Pizzi Pizzería med scroll-styret "video"-effekt. Den er ren HTML/CSS/JS uden build-trin og uden afhængigheder, så den kan køre direkte på GitHub Pages.

- `index.html`: siden
- `assets/css/style.css`: design
- `assets/js/main.js`: scroll-motor, carta, locales og live åben/lukket-status (Europe/Madrid)
- `assets/img/`: fotos

Lokalt: `python3 -m http.server` og åbn http://localhost:8000.
Respekterer `prefers-reduced-motion`. Uden JavaScript vises en statisk version.

Den tidligere Forno Rosso-side ligger nu i `forno-rosso/`.
