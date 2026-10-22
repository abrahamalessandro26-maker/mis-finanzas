# Mis finanzas

App web para controlar ingresos, gastos, pagos pendientes y ahorro. Es un solo archivo (`index.html`), sin instalar nada ni base de datos.

- Los datos se guardan en el **navegador de cada persona** (localStorage), solo en ese dispositivo.
- Incluye gastos por pagar, gráficos, calculadora, deshacer/rehacer y copia de respaldo (exportar/importar JSON).

## 1. Abrirlo en VS Code

1. Instala [VS Code](https://code.visualstudio.com/).
2. Abre esta carpeta: **Archivo > Abrir carpeta**.
3. (Opcional) Instala la extensión **Live Server** y haz clic derecho en `index.html` > **Open with Live Server** para verlo mientras editas.

## 2. Subirlo a GitHub

1. Crea una cuenta en github.com y un repositorio nuevo, por ejemplo `mis-finanzas` (puede ser público o privado).
2. En la terminal de VS Code, dentro de la carpeta:

```bash
git init
git add .
git commit -m "Primera versión"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mis-finanzas.git
git push -u origin main
```

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Describe el cambio"
git push
```

## 3A. Publicarlo en Cloudflare Pages (gratis)

1. Entra a dash.cloudflare.com > **Workers & Pages** > **Create** > **Pages** > **Connect to Git**.
2. Elige el repositorio `mis-finanzas`.
3. Configuración: **Framework preset: None**, **Build command: (vacío)**, **Build output directory: `/`** (o `.`).
4. Pulsa **Save and Deploy**. Te dará una dirección tipo `mis-finanzas.pages.dev`.

## 3B. Publicarlo en Netlify (gratis)

1. Entra a app.netlify.com > **Add new site** > **Import an existing project** > **GitHub**.
2. Elige el repositorio. **Build command:** vacío. **Publish directory:** `.`
3. Pulsa **Deploy**. Te dará una dirección tipo `algo.netlify.app`.

En ambos casos, cada `git push` publica la versión nueva automáticamente.

## 4. Tus clientes en el celular

Que abran el enlace en Safari (iPhone) o Chrome (Android) y usen **Agregar a inicio** / **Agregar a pantalla de inicio**.

## Seguridad (PIN)

La app tiene una tarjeta **Seguridad** donde cada persona puede activar un PIN de 4 a 8 números. Con PIN activo, la app lo pide al abrirla y tras 30 segundos fuera de ella. Tras 5 intentos fallidos espera 30 segundos. Si alguien olvida su PIN, la única salida es restablecerlo borrando los datos del dispositivo, y luego usar **Importar copia**.

El PIN evita que otra persona vea los datos al tomar el celular, pero **no cifra** la información guardada. No reemplaza a un login con cuenta de usuario.

## Importante

- Los datos son por dispositivo: si cambian de celular o borran los datos del navegador, los pierden. Recomiéndales usar **Descargar copia (JSON)** de vez en cuando y **Importar copia** para restaurar.
- Cualquiera con el enlace puede usar la app. Si más adelante quieres cuentas de usuario y cobro automático, hará falta una base de datos y login.
