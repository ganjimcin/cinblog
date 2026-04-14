# Astro CMS (Svelte 5 Edition)

Un sistema de gestión de contenidos ligero, sin servidor (serverless) y diseñado específicamente para sitios estáticos construidos con Astro. Este CMS funciona directamente en el navegador, comunicándose con la API de GitHub para gestionar tus archivos Markdown de forma visual y eficiente.

## Características Principales

### Interfaz de Escritura Centrada (WYSIWYG)
- **Diseño Zen**: Modo de escritura a pantalla completa con tipografía optimizada para lectura, eliminando distracciones técnicas.
- **Título Integrado**: Edición del título directamente sobre el área de contenido, emulando la experiencia de editores modernos como Notion o Medium.
- **Modos de Vista**: Selector dinámico entre modo Escritura (Zen), modo Dual (Split-view) y modo Previsualización completa.
- **Panel Lateral de Metadatos**: Configuración de Frontmatter (categorías, etiquetas, SEO, autor, licencias) en una barra lateral colapsable.

### Automatización y Productividad
- **Slug Automático**: Generación inteligente de URLs amigables y nombres de archivo a partir del título en tiempo real.
- **Gestión de Imágenes Pro**: Soporte para arrastrar y soltar (Drag & Drop) y pegar desde el portapapeles (Ctrl+V). Las imágenes se optimizan y convierten a WebP automáticamente antes de subirse a GitHub.
- **Atajos de Teclado**: Soporte nativo para `Ctrl+S` (Guardar), `Ctrl+B` (Negrita), `Ctrl+I` (Itálica) y `Ctrl+K` (Enlace).
- **Estadísticas en Vivo**: Conteo de palabras, caracteres y tiempo estimado de lectura calculado al instante.

### Seguridad y Resiliencia
- **Borradores Locales (Anti-pánico)**: Sistema de auto-guardado en `localStorage` que protege tu trabajo ante cierres accidentales del navegador o fallos de red.
- **Recuperación Inteligente**: Detección de cambios no sincronizados al cargar un post, ofreciendo restaurar la versión local más reciente.
- **Sin Intermediarios**: El CMS se comunica directamente desde tu navegador con la API de GitHub mediante Personal Access Tokens (PAT). No hay servidores intermedios que procesen tus datos o credenciales.
- **Codificación Robusta**: Manejo de archivos UTF-8 para garantizar la integridad de caracteres especiales y emojis en el contenido.

## Configuración y Uso

El CMS requiere un Token de Acceso Personal (PAT) de GitHub con permisos de escritura (`repo`) sobre el repositorio donde se aloja tu sitio Astro.

### Estructura de Contenidos
El sistema está configurado para trabajar con la estructura estándar de Astro:
- **Posts**: `src/content/posts/*.md`
- **Imágenes**: `public/assets/images/`

### Instalación
1. Clona el repositorio dentro de tu proyecto Astro o despliégalo de forma independiente.
2. Configura las constantes de tu repositorio (Usuario, Repo, Rama) en `src/constants/config.ts`.
3. Ejecuta el servidor de desarrollo o construye el bundle para producción.

## Detalles Técnicos
- **Core**: Svelte 5 (Runas, Props, Bindable).
- **Markdown**: Marked.js con soporte para resaltado de sintaxis (Highlight.js).
- **Estilos**: CSS Puro (Vanilla) con variables modernas y soporte para temas.
- **API**: GitHub REST API v3.

## Seguridad de Credenciales
Este CMS nunca almacena tu token de GitHub de forma persistente en servidores externos. El token se maneja únicamente en la sesión de tu navegador. Se recomienda el uso de tokens con expiración y alcance limitado (Fine-grained tokens) para mayor seguridad.
