# manzaspots-pwa

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Probar en dispositivo con datos móviles (API local vía ngrok)

1. Copia `.env.staging.example` a `.env.staging` y pon tu dominio fijo de ngrok
   (https://dashboard.ngrok.com/domains) en `NGROK_DOMAIN`.
2. Con el Docker del backend corriendo, abre el túnel (deja esta terminal abierta;
   mantiene la Mac despierta mientras corre):

```sh
npm run tunnel
```

3. Compila e instala la app apuntando al túnel:

```sh
npm run cap:staging:android   # o cap:staging:ios
```

El build de staging usa un User-Agent propio (`Manzaspots/staging`) para que ngrok no
responda con su página de aviso. Un `npm run cap:sync` normal lo deja como estaba.
