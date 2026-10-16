# Probar la app con datos móviles (API local vía ngrok)

Grabar rutas y seguir spots exige salir a la calle, lejos del Wi-Fi de casa. Como la API
todavía no está desplegada, se expone la API local con un túnel de ngrok y se compila la app
(build de *staging*) apuntando a ese túnel.

```
iPhone/Android (datos móviles) ──HTTPS──▶ ngrok (dominio fijo) ──▶ Mac: Docker :8000 (API Django)
```

## Configuración inicial (una sola vez)

1. **Cuenta de ngrok y su authtoken.** El authtoken de la Mac tiene que ser de la misma cuenta
   que tiene el dominio. Cópialo de https://dashboard.ngrok.com/get-started/your-authtoken y guárdalo:

   ```sh
   ngrok config add-authtoken TU_TOKEN
   ```

2. **Dominio fijo.** El plan gratis incluye un dominio que no cambia; está en
   https://dashboard.ngrok.com/domains (por ejemplo, `algo-algo-algo.ngrok-free.dev`).

3. **`.env.staging`.** Copia la plantilla y pon el dominio en `NGROK_DOMAIN`:

   ```sh
   cp .env.staging.example .env.staging
   ```

   ```
   NGROK_DOMAIN=algo-algo-algo.ngrok-free.dev
   VITE_API_URL=https://${NGROK_DOMAIN}/api/v1/
   ```

   El archivo está en `.gitignore`; el resto de variables (Google, nombre de la app) se toman de `.env`.

4. **Solo Android: JDK para Gradle.** Gradle 8.14 no corre con Java 25 o superior. Si `java -version`
   muestra una versión mayor, haz que Gradle use el JDK que trae Android Studio creando
   `~/.gradle/gradle.properties` con:

   ```
   org.gradle.java.home=/Applications/Android Studio.app/Contents/jbr/Contents/Home
   ```

## Cada vez que quieras probar

1. **Levanta el backend** (desde el repo `manzaspots-backend`), si no está corriendo:

   ```sh
   docker compose up -d
   ```

2. **Abre el túnel** en una terminal y déjala abierta durante toda la prueba. El script también
   mantiene la Mac despierta (`caffeinate`) mientras el túnel está abierto:

   ```sh
   npm run tunnel
   ```

3. **Compila e instala la app de staging.** Solo hace falta repetir este paso si cambiaste código
   desde la última instalación; si no, la app ya instalada sigue apuntando al túnel.

   - **iOS (Xcode):**

     ```sh
     npm run cap:staging:sync
     npx cap open ios
     ```

     En Xcode elige el iPhone y dale Run (⌘R).

   - **Android:**

     ```sh
     npm run cap:staging:android
     ```

     O, si prefieres Android Studio: `npm run cap:staging:sync` y luego `npx cap open android`.

4. **Prueba con el Wi-Fi del teléfono apagado.**

5. **Al terminar, cierra el túnel** con Ctrl+C en su terminal. El backend corre con `DEBUG=True`,
   así que mientras el túnel está abierto cualquiera con la URL puede ver los errores detallados de Django.

6. **Para volver al build normal**, corre `npm run cap:sync`.

## Cosas a tener en cuenta

- **Siempre sincroniza con `CAP_ENV=staging`** (los scripts `cap:staging:*` ya lo hacen). Un
  `npx cap sync` sin esa variable regresa la app a su User-Agent de navegador, y el plan gratis de
  ngrok responde a cualquier User-Agent de navegador con su página de aviso en lugar de la API.
  El build de staging se identifica como `Manzaspots/staging` para evitarlo.
- **`npx cap open ios` solo abre Xcode**; no compila ni copia nada. Primero corre `npm run cap:staging:sync`.
- **La Mac tiene que estar encendida, despierta y con internet** mientras pruebas. Conviene dejarla
  conectada a la corriente.
- **Para depurar**, abre http://127.0.0.1:4040 en la Mac: muestra cada petición que llega por el
  túnel y lo que respondió la API. Si no aparece ninguna, la app no está llegando al túnel.

## Solución de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| `ERR_NGROK_320` · *This domain is reserved for another account* | El authtoken de la Mac es de otra cuenta de ngrok | `ngrok config add-authtoken` con el token de la cuenta que tiene el dominio |
| `ERR_NGROK_313` · *Only paid plans may create endpoints with custom subdomains* | El dominio de `.env.staging` no es tu dominio fijo | Copia el dominio exacto de https://dashboard.ngrok.com/domains |
| `ERR_NGROK_3200` · *The endpoint … is offline* | El túnel no está abierto | `npm run tunnel` y deja la terminal abierta |
| `ERR_NGROK_6024` o la app recibe HTML en vez de JSON | La app se sincronizó sin `CAP_ENV=staging` | `npm run cap:staging:sync` y vuelve a instalar |
| `npm run tunnel`: *La API no responde en localhost:8000* | El Docker del backend no está arriba | `docker compose up -d` en `manzaspots-backend` |
| Gradle: *Unsupported class file major version 70* (o 69) | Gradle se ejecuta con Java 26 (o 25) | Paso 4 de la configuración inicial |
| La app sigue llamando a la IP de casa (`192.168.x.x`) | Se instaló un build normal, no el de staging | `npm run cap:staging:sync` (o `cap:staging:android`) y vuelve a instalar |
