<div align="center">

# Rutina

**Organiza tus tareas, guarda tus ideas y conversa con IA, todo desde un mismo lugar.**

Una aplicación web progresiva (PWA) para gestionar rutinas diarias y notas rápidas. Tus datos se almacenan en el dispositivo y la aplicación puede utilizarse sin conexión.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-instalable-5A0FC8?logo=pwa&logoColor=white)](https://developer.mozilla.org/docs/Web/Progressive_web_apps)

[**Abrir demo**](https://roaring-empanada-bf1f5a.netlify.app/notas)

</div>

---

## Contenido

- [Demo](#demo)
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Instalación y desarrollo](#instalación-y-desarrollo)
- [Comandos disponibles](#comandos-disponibles)
- [Compilación y despliegue](#compilación-y-despliegue)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Arquitectura y almacenamiento](#arquitectura-y-almacenamiento)
- [Markdown compatible](#markdown-compatible)
- [Privacidad](#privacidad)
- [Licencia](#licencia)

## Demo

Prueba la aplicación en [la demo en vivo](https://roaring-empanada-bf1f5a.netlify.app/notas).

Para instalarla en un móvil o escritorio, abre la demo en un navegador compatible y selecciona **Instalar aplicación** o **Añadir a pantalla de inicio**.

## Características

### Tareas

- Crea tareas diarias y asígnales una hora.
- Configura su repetición indefinida o por un número determinado de días, semanas o meses.
- Consulta el progreso del día y marca las tareas completadas.
- Las tareas cuyo período de repetición ha terminado se muestran como finalizadas.

### Notas

- Crea y busca notas por título o contenido.
- Escribe en Markdown con la barra de herramientas y alterna entre edición y vista previa.
- Personaliza las tarjetas con seis colores.

### Chat con IA local

- Ejecuta modelos directamente en el dispositivo con WebLLM y WebGPU: SmolLM2 360M, Qwen 2.5 0.5B y Llama 3.2 3B.
- Crea, recupera y elimina conversaciones que se guardan automáticamente en el dispositivo.
- Consulta el estado de descarga de cada modelo y una estimación de compatibilidad del dispositivo.
- Visualiza las respuestas con formato Markdown.

La primera descarga de un modelo requiere conexión a Internet. Después, WebLLM puede reutilizar sus archivos desde la caché del navegador; el navegador podría eliminarlos para liberar espacio. La compatibilidad y el consumo de memoria son estimaciones: un modelo puede no ejecutarse aunque el dispositivo aparezca como compatible.

### Aplicación

- Accede a tareas y notas sin conexión.
- Instálala como PWA en dispositivos compatibles.
- Usa el tema claro u oscuro según la preferencia del sistema.
- Protege las acciones de eliminación con diálogos de confirmación.

## Tecnologías

| Área | Tecnología |
| --- | --- |
| Interfaz | [React 19](https://react.dev/) |
| Lenguaje | [TypeScript 6](https://www.typescriptlang.org/) |
| Desarrollo y compilación | [Vite 8](https://vite.dev/) |
| Estilos | [Tailwind CSS 4](https://tailwindcss.com/) |
| Enrutamiento | [React Router 7](https://reactrouter.com/) |
| Almacenamiento local | [Dexie 4](https://dexie.org/) sobre IndexedDB |
| Modelos de IA locales | [WebLLM](https://webllm.mlc.ai/) y WebGPU |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) |
| Linter | [oxlint](https://oxc.rs/) |

## Requisitos

- [Node.js](https://nodejs.org/) y npm.
- Un navegador moderno para ejecutar la aplicación.
- Para usar el chat: navegador con WebGPU, contexto seguro (HTTPS o `localhost`) y recursos suficientes para el modelo seleccionado.

## Instalación y desarrollo

```bash
git clone https://github.com/juand-22/rutinaapp.git
cd rutinaapp
npm install
npm run dev
```

Abre la dirección local que indique Vite (por defecto, [http://localhost:5173](http://localhost:5173)).

## Comandos disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo con recarga en caliente. |
| `npm run build` | Comprueba los tipos y genera la versión de producción. |
| `npm run preview` | Sirve localmente la compilación de producción. |
| `npm run lint` | Analiza el código con oxlint. |

## Compilación y despliegue

Genera la aplicación para producción y, si lo deseas, pruébala en local:

```bash
npm run build
npm run preview
```

La compilación se guarda en `dist/`. Publica su contenido en un proveedor de hosting estático, como [Netlify](https://www.netlify.com/), [Vercel](https://vercel.com/), [Cloudflare Pages](https://pages.cloudflare.com/) o [GitHub Pages](https://pages.github.com/).

Para habilitar la instalación y el funcionamiento offline de la PWA, el sitio debe servirse mediante **HTTPS**; `localhost` es la excepción durante el desarrollo. El service worker y el manifest se generan como parte de la compilación de producción.

## Estructura del proyecto

```text
src/
├── features/
│   ├── chat/
│   │   ├── pages/ChatPage.tsx       # Chat local con IA
│   │   └── index.ts
│   ├── notes/
│   │   ├── components/              # Formulario y tarjeta de nota
│   │   ├── pages/NotesPage.tsx      # Página de notas
│   │   ├── constants.ts             # Colores disponibles
│   │   └── index.ts
│   └── tasks/
│       ├── components/              # Formulario y elemento de tarea
│       ├── pages/TaskPage.tsx       # Página de tareas
│       └── index.ts
├── routes/index.tsx                 # Rutas de la aplicación
├── shared/
│   ├── components/                  # Componentes y utilidades compartidos
│   ├── db/database.ts               # Base de datos y modelos de datos
│   └── utils/date.ts                # Utilidades de fechas y repetición
├── App.tsx
├── main.tsx
└── index.css
```

## Arquitectura y almacenamiento

La aplicación organiza las funcionalidades por áreas (`features`) y concentra en `shared` los componentes, la base de datos y las utilidades reutilizables.

Las tareas, notas y conversaciones se guardan localmente en **IndexedDB** mediante Dexie. No se necesita un backend para utilizarlas, y los hooks de `dexie-react-hooks` mantienen la interfaz sincronizada con los cambios.

El chat genera respuestas en el dispositivo mediante WebGPU. Los modelos disponibles tienen requisitos aproximados de memoria GPU de **580 MB** (SmolLM2 360M), **1.061 MB** (Qwen 2.5 0.5B) y **2.952 MB** (Llama 3.2 3B). La primera descarga necesita conexión y espacio local. Los archivos se conservan en la caché del navegador para poder reutilizarlos sin conexión, pero el navegador puede desalojarlos. La estimación de compatibilidad no representa una medición exacta de la memoria GPU libre.

## Markdown compatible

El editor y el chat admiten los siguientes elementos:

| Elemento | Sintaxis |
| --- | --- |
| Encabezados de nivel 1 a 3 | `# Título`, `## Título` y `### Título` |
| Negrita y cursiva | `**texto**` y `*texto*` |
| Código en línea | `` `código` `` |
| Bloque de código | Bloque delimitado con tres acentos graves |
| Listas | `- elemento` o `1. elemento` |
| Citas | `> texto` |
| Enlaces | `[texto](https://ejemplo.com)` |

## Privacidad

Las tareas, notas y conversaciones se guardan en el almacenamiento local del navegador y no requieren una cuenta ni un servidor de la aplicación. El chat se procesa localmente; al descargar un modelo por primera vez, sus archivos se obtienen a través de Internet y se guardan en la caché del navegador.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo [`LICENSE`](./LICENSE) para más información.

---

<div align="center">

Desarrollado con React y TypeScript.

</div>
