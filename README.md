<div align="center">

# 📅 Rutina

> Tareas diarias y notas rápidas, siempre contigo.

Una **Progressive Web App (PWA)** para organizar tus tareas repetitivas del día a día y guardar notas rápidas con formato Markdown. Funciona 100% offline y almacena todo en tu dispositivo.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-enabled-5A0FC8?logo=pwa&logoColor=white)](https://developer.mozilla.org/docs/Web/Progressive_web_apps)
[![Demo](https://img.shields.io/badge/Demo-ver%20en%20vivo-22c55e)](https://roaring-empanada-bf1f5a.netlify.app/notas)

</div>

---

## 🔗 Demo en vivo

Puedes probar la aplicación desplegada aquí:

👉 **[rutina.netlify.app](https://roaring-empanada-bf1f5a.netlify.app/notas)**

> 💡 Para instalarla como app en tu móvil o escritorio, ábrela en el navegador y elige la opción *"Añadir a pantalla de inicio"* o *"Instalar aplicación"*.

---

## ✨ Características

- **Tareas diarias** — crea tareas que se repitan cada día a una hora concreta.
- **Duración configurable** — repite una tarea para siempre o durante N días, semanas o meses. Las tareas expiradas se marcan automáticamente como finalizadas.
- **Progreso diario** — barra de progreso con el porcentaje de tareas completadas.
- **Notas rápidas en Markdown** — escribe notas con títulos, negrita, cursiva, listas, citas y bloques de código.
- **Editor con toolbar** — botones para dar formato sin escribir Markdown a mano.
- **Vista previa** — alterna entre edición y vista previa al instante.
- **Colores** — personaliza cada nota con 6 colores disponibles.
- **Búsqueda** — encuentra notas al instante por título o contenido.
- **Confirmaciones** — diálogo de confirmación antes de eliminar tareas o notas.
- **Offline-first** — toda la información se guarda en IndexedDB (Dexie) y funciona sin conexión.
- **Instalable** — como PWA, puedes añadirla a la pantalla de inicio de tu móvil o escritorio.
- **Tema claro/oscuro** — se adapta automáticamente a las preferencias del sistema.

## 🛠️ Tecnologías

| Área | Tecnología |
|------|-----------|
| Framework | [React 19](https://react.dev/) |
| Lenguaje | [TypeScript 6](https://www.typescriptlang.org/) |
| Build | [Vite 8](https://vitejs.dev/) |
| Estilos | [Tailwind CSS 4](https://tailwindcss.com/) |
| Router | [React Router 7](https://reactrouter.com/) |
| Base de datos | [Dexie 4](https://dexie.org/) (IndexedDB) |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) |
| Linter | [oxlint](https://oxc.rs/) |

## 🚀 Inicio rápido

```bash
# Clona el repositorio
git clone <url-del-repo>
cd RutinaApp

# Instala las dependencias
npm install

# Inicia el servidor de desarrollo
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## 📦 Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con recarga en caliente. |
| `npm run build` | Compila TypeScript y genera el bundle de producción. |
| `npm run preview` | Previsualiza la build de producción localmente. |
| `npm run lint` | Ejecuta el linter (oxlint) sobre el código. |

## 🌐 Despliegue (PWA)

Para que la aplicación funcione como **PWA** (instalable, offline y con service worker), **no basta con ejecutar `npm run dev`**. El service worker y el manifest solo se generan en la build de producción. Sigue estos pasos:

```bash
# 1. Genera la build de producción
npm run build

# 2. (Opcional) Prueba la build en local
npm run preview
```

El resultado de la compilación se genera en la carpeta `dist/`. Sube el contenido de esa carpeta a cualquier servicio de hosting estático:

- [Netlify](https://www.netlify.com/) (arrastra la carpeta `dist` o conecta tu repositorio)
- [Vercel](https://vercel.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [GitHub Pages](https://pages.github.com/)
- Cualquier hosting estático que sirva sobre **HTTPS** (requisito obligatorio para las PWA).

> ⚠️ **Importante:** las PWA requieren que el sitio se sirva por **HTTPS** (excepto `localhost`). Sin HTTPS, el service worker no se registrará y la app no se podrá instalar ni funcionar offline.

Una vez desplegada, los visitantes podrán instalar la app en su dispositivo desde el menú del navegador (*"Instalar aplicación"* o *"Añadir a pantalla de inicio"*).

## 📁 Estructura del proyecto

```
src/
├── features/
│   ├── tasks/                 # Feature de tareas diarias
│   │   ├── components/
│   │   │   ├── TaskForm.tsx   # Formulario crear/editar tarea
│   │   │   └── TaskItem.tsx   # Tarjeta de tarea
│   │   ├── pages/
│   │   │   └── TaskPage.tsx   # Página principal de tareas
│   │   └── index.ts
│   └── notes/                 # Feature de notas rápidas
│       ├── components/
│       │   ├── NoteCard.tsx   # Tarjeta de nota
│       │   └── NoteForm.tsx   # Editor de nota con Markdown
│       ├── pages/
│       │   └── NotesPage.tsx  # Página de notas
│       ├── constants.ts       # Colores de las notas
│       └── index.ts
├── shared/
│   ├── components/            # Componentes reutilizables
│   │   ├── AppShell.tsx       # Layout con navegación inferior
│   │   ├── ConfirmDialog.tsx  # Diálogo de confirmación
│   │   ├── Icons.tsx          # Iconos SVG
│   │   ├── MarkdownEditor.tsx # Editor Markdown con toolbar
│   │   ├── MarkdownView.tsx   # Renderizador de Markdown
│   │   ├── Modal.tsx          # Modal bottom-sheet
│   │   └── markdown.ts        # Parser Markdown
│   ├── db/
│   │   └── database.ts        # Instancia Dexie y tipos
│   └── utils/
│       └── date.ts            # Utilidades de fecha y repetición
├── routes/
│   └── index.tsx              # Definición de rutas
├── App.tsx
├── main.tsx
└── index.css                  # Tema, animaciones y estilos Markdown
```

## 🧩 Arquitectura

El proyecto sigue una **arquitectura por features** (tareas y notas) con una capa `shared` para componentes, base de datos y utilidades comunes. Cada feature es autosuficiente y se comunica con la base de datos a través de Dexie.

La persistencia se realiza íntegramente en **IndexedDB** mediante Dexie, por lo que la app funciona sin conexión y no requiere backend. Los hooks de `dexie-react-hooks` (`useLiveQuery`) mantienen la UI sincronizada con los datos en tiempo real.

## 📝 Sintaxis Markdown soportada

| Elemento | Sintaxis |
|----------|----------|
| Título 2 | `## Título` |
| Título 3 | `### Título` |
| Negrita | `**texto**` |
| Cursiva | `*texto*` |
| Código inline | `` `código` `` |
| Bloque de código | ` ``` ` |
| Lista | `- elemento` |
| Lista ordenada | `1. elemento` |
| Cita | `> texto` |
| Enlace | `[texto](url)` |

## 🔒 Privacidad

Tus datos se almacenan **únicamente en tu dispositivo** (IndexedDB). No se envían a ningún servidor y no hay cuentas ni seguimiento.

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---

<div align="center">

Hecho con 💜 y React.

</div>
