<script>
  import { onMount, tick } from "svelte";
  import jsyaml from "js-yaml";
  import { cmsFetch as ghFetch } from "./utils/api";
  import { parsePost, stringifyPost } from "./utils/parser";
  import { toastStore } from "./stores/toastStore";
  import { slugify } from "./utils/formatter";
  import { fade } from "svelte/transition";
  import ShortcutsModal from "./editor/ShortcutsModal.svelte";
  import ImageSelector from "./editor/ImageSelector.svelte";
  import Icon from "../common/Icon.svelte";
  let validationErrors = $derived.by(() => {
    const errors = [];
    
    // Mapeo de campos que tienen variables de estado específicas
    const dedicatedValues = {
      title: titleInput,
      published: publishedInput,
      category: categoryInput,
      description: descriptionInput,
      tags: tagsInput,
      cover: coverInput,
      coverInContent: coverInContentInput,
      slug: slugInput,
      author: authorInput,
      lang: langInput,
      updated: updatedInput,
      licenseName: licenseNameInput,
      licenseUrl: licenseUrlInput,
      sourceLink: sourceLinkInput,
      draft: draftInput,
      pinned: pinnedInput,
      comment: commentInput,
      inNavbar: inNavbarInput,
      icon: iconInput,
      body: contentInput
    };

    // Validación básica para posts
    if (!isConfig) {
      if (!titleInput || !titleInput.trim()) errors.push({ field: 'title', message: 'El título es obligatorio.' });
      if (!publishedInput) errors.push({ field: 'published', message: 'La fecha de publicación es obligatoria.' });
    }

    // Validación dinámica basada en campos del config.yml
    if (currentCollection?.fields) {
      currentCollection.fields.forEach(f => {
        // En CMS config, los campos son obligatorios por defecto a menos que required sea false
        if (f.required !== false) {
           // Ignorar campos que se manejan por inputs específicos (title, published) para no duplicar alerts
           if (f.name === 'title' || f.name === 'published') return;

           // Obtener el valor: primero de variables dedicadas, luego de formData
           let val = dedicatedValues[f.name];
           if (val === undefined && formData) {
             val = formData[f.name];
           }

           // Validación de vacío (especial atención a booleanos, que pueden ser false)
           const isEmpty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);
           
           if (isEmpty) {
              errors.push({ field: f.name, message: `El campo '${f.label || f.name}' es obligatorio.` });
           }
        }
      });
    }

    return errors;
  });

  import EditorHeader from "./editor/EditorHeader.svelte";
  import EditorMetadata from "./editor/EditorMetadata.svelte";
  import EditorEdicion from "./editor/EditorEdicion.svelte";
  import EditorPreview from "./editor/EditorPreview.svelte";

  let { githubToken, isMock = false, cmsConfig, post = null, onPostSaved, onPostCancelled } = $props();

  // Determinar la colección actual basada en el path
  const currentCollection = $derived.by(() => {
    if (!post || !cmsConfig) return null;
    return cmsConfig.collections.find(c => {
       if (c.folder && post.path.startsWith(c.folder)) return true;
       if (c.files && c.files.find(f => f.file === post.path)) return true;
       return false;
    });
  });

  const isJSON = $derived(post?.path?.endsWith(".json") || currentCollection?.format === "json");
  const isYAML = $derived(post?.path?.endsWith(".yaml") || post?.path?.endsWith(".yml") || currentCollection?.format === "yaml");
  const isConfig = $derived(currentCollection?.files !== undefined);

  const mockPosts = [
    {
      name: "guia-estilos.md",
      path: "src/content/posts/guia-estilos.md",
      sha: "mock-sha-1",
      fm: {
        title: "Guía Completa de Estilos CMS",
        published: "2024-04-12",
        category: "Documentación",
        description: "Un post de prueba para visualizar el renderizado de todos los elementos Markdown disponibles.",
        tags: ["markdown", "guia", "test", "obsidian"]
      },
      content: `# Guía de Estilos Markdown

Este post es una muestra de todas las capacidades de renderizado de nuestro nuevo editor. ¡Pruébalo todo!

## 1. Formato de Texto Inline

Puedes aplicar formatos de forma inteligente:
- **Texto en negrita** (Ctrl+B)
- *Texto en cursiva* (Ctrl+I)
- ~~Texto tachado~~
- \`Código en línea\` (Ctrl+E)
- [Enlace a Google](https://google.com) (Ctrl+K)

---

## 2. Bloques de Información (Obsidian Callouts)

Hemos integrado los callouts estándar de Obsidian y GitHub:

> [!INFO] Nota Informativa
> Este es un bloque de información para resaltar datos importantes. Soporta **Markdown** dentro.

> [!WARNING] Aviso Crítico
> Ten cuidado con este tipo de avisos, son para advertencias importantes.

> [!TIP] Consejos Útiles
> ¡Puedes usar Ctrl+1, 2, 3 para cambiar encabezados rápidamente!

> [!QUOTE] Cita Celebre
> "La simplicidad es la máxima sofisticación." — Leonardo da Vinci

---

## 3. Listas y Tareas

### Listas de tareas (Checklists)
- [x] Implementar bordes redondeados
- [x] Migrar a sintaxis Obsidian
- [ ] Añadir Slash Commands (/)
- [ ] Dominar el mundo con Astro

### Listas ordenadas y desordenadas
1. Primer elemento importante
2. Segundo elemento con sub-lista:
   - Sub-item A
   - Sub-item B
3. Tercer elemento

---

## 4. Bloques de Código

El editor soporta resaltado de sintaxis profesional:

\`\`\`javascript
function saludar(nombre) {
  console.log(\`¡Hola \${nombre}, bienvenido al CMS!\`);
}

// Probando el renderizado
saludar("Usuario");
\`\`\`

---

## 5. Tablas

| Elemento | Estado | Prioridad |
| :--- | :---: | :--- |
| Editor MD | ✅ | Alta |
| Vista Previa | ✅ | Alta |
| Auto-guardado | ✅ | Media |
| Drag & Drop | ⏳ | Baja |

---

## 6. Citas Estándar

> Esto es una cita estándar de Markdown (Blockquote).
> Puede ocupar varias líneas y se ve genial con el diseño del blog.

---

### ¡Fin de la Guía!
Sigue escribiendo y disfruta de la experiencia fluida de edición.`
    }
  ];

  const STYLE_GUIDE = mockPosts[0].content;

  // State para todos los campos Frontmatter
  let titleInput = $state("");
  let publishedInput = $state("");
  let updatedInput = $state("");
  let pinnedInput = $state(false);
  let descriptionInput = $state("");
  let coverInput = $state("");
  let coverInContentInput = $state(false);
  let tagsInput = $state("");
  let categoryInput = $state("");
  let langInput = $state("");
  let licenseNameInput = $state("");
  let licenseUrlInput = $state("");
  let authorInput = $state("");
  let sourceLinkInput = $state("");
  let draftInput = $state(false);
  let commentInput = $state(true);
  let inNavbarInput = $state(false);
  let iconInput = $state("");
  let slugInput = $state("");
  let imdbIdInput = $state("");
  let ageRatingInput = $state("");
  let formData = $state({}); // Added missing formData state

  let filenameInput = $state("");
  let contentInput = $state("");
  let currentSha = $state(null);
  let isLoading = $state(false);
  let isSaving = $state(false);
  let isUploading = $state(false);
  let viewMode = $state("dual"); // write, dual, preview
  let renderedHTML = $state("");
  let showSettings = $state(false);
  let showGalleryModal = $state(false);
  let showShortcuts = $state(false);
  let tempImageSelection = $state("");
  let editorTextarea = $state(null);

  // Lógica de detección de Frontmatter manual (Pegado)
  $effect(() => {
    if (contentInput && contentInput.trim().startsWith('---')) {
      const parts = contentInput.split('---');
      if (parts.length >= 3) {
        const parsed = parsePost(contentInput);
        if (Object.keys(parsed.fm).length > 0) {
          // Migrar datos detectados
          const fm = parsed.fm;
          if (fm.title) titleInput = fm.title;
          if (fm.category) categoryInput = fm.category;
          if (fm.published) {
            try {
              publishedInput = new Date(fm.published).toISOString().split('T')[0];
            } catch(e) {}
          }
          if (fm.description) descriptionInput = fm.description;
          if (fm.tags) tagsInput = Array.isArray(fm.tags) ? fm.tags.join(", ") : fm.tags;
          if (fm.image || fm.cover) coverInput = fm.cover || fm.image;
          if (fm.coverInContent !== undefined) coverInContentInput = !!fm.coverInContent;
          if (fm.slug) slugInput = fm.slug;
          if (fm.author) authorInput = fm.author;
          if (fm.lang) langInput = fm.lang;
          if (fm.draft !== undefined) draftInput = !!fm.draft;
          
          // Limpiar el textarea quitando el frontmatter
          contentInput = parsed.content;
          console.log("CMS: Frontmatter detectado y migrado automáticamente.");
        }
      }
    }
  });

  // Lógica de Auto-guardado Local
  const DRAFT_KEY = $derived(post ? `cms_draft_${post.path}` : 'cms_draft_new');

  function saveLocalDraft() {
    if (isLoading || isSaving) return;
    const draft = {
      title: titleInput,
      content: contentInput,
      fm: {
        category: categoryInput,
        published: publishedInput,
        tags: tagsInput,
        cover: coverInput,
        coverInContent: coverInContentInput,
        slug: slugInput,
        author: authorInput,
        lang: langInput,
        updated: updatedInput,
        licenseName: licenseNameInput,
        licenseUrl: licenseUrlInput,
        sourceLink: sourceLinkInput,
        description: descriptionInput,
        draft: draftInput,
        pinned: pinnedInput,
        comment: commentInput,
        inNavbar: inNavbarInput,
        icon: iconInput,
        imdbId: imdbIdInput,
        ageRating: ageRatingInput
      },
      timestamp: Date.now()
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function loadLocalDraft() {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      // Evitar preguntar si el borrador es exactamente igual a lo que ya hay
      if (draft.content !== contentInput || draft.title !== titleInput) {
        if (confirm("Se ha encontrado un borrador local sin guardar de una sesión anterior. ¿Deseas recuperarlo?")) {
          titleInput = draft.title || "";
          contentInput = draft.content || "";
          if (draft.fm) {
            categoryInput = draft.fm.category || "";
            publishedInput = draft.fm.published || "";
            tagsInput = draft.fm.tags || "";
            descriptionInput = draft.fm.description || "";
            coverInput = draft.fm.cover || draft.fm.image || "";
            coverInContentInput = !!draft.fm.coverInContent;
            slugInput = draft.fm.slug || "";
            authorInput = draft.fm.author || "";
            langInput = draft.fm.lang || "";
            draftInput = !!draft.fm.draft;
            pinnedInput = !!draft.fm.pinned;
            commentInput = draft.fm.comment !== undefined ? draft.fm.comment : true;
            inNavbarInput = !!draft.fm.inNavbar;
            iconInput = draft.fm.icon || "";
            imdbIdInput = draft.fm.imdbId || "";
            ageRatingInput = draft.fm.ageRating || "";
          }
        } else {
          // Si el usuario dice que NO, lo borramos para no volver a preguntar
          clearLocalDraft();
        }
      }
    } catch (e) { console.error(e); }
  }

  function clearLocalDraft() { localStorage.removeItem(DRAFT_KEY); }

  let lastDraftSaved = $state(null);
  $effect(() => { 
    if (contentInput || titleInput) {
      saveLocalDraft();
      lastDraftSaved = new Date();
    }
  });

  $effect(() => {
    if (post) {
      filenameInput = post.name || "nuevo-post.md";
      // Solo inicializar currentSha si es nulo para evitar sobrescribir el SHA cargado por loadPost
      if (!currentSha) {
         currentSha = post.sha || null;
         console.log("CMS: Inicializando SHA desde post:", currentSha);
      }
    } else {
      if (!publishedInput) publishedInput = new Date().toISOString().split("T")[0];
      if (titleInput) {
        const generatedSlug = slugify(titleInput);
        slugInput = generatedSlug;
        filenameInput = generatedSlug + ".md";
      }
    }
  });

  onMount(async () => {
    if (!window.marked) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
      script.onload = () => {
        const hljsScript = document.createElement("script");
        hljsScript.src = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js";
        hljsScript.onload = () => {
          const hljsCss = document.createElement("link");
          hljsCss.rel = "stylesheet";
          hljsCss.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css";
          document.head.appendChild(hljsCss);
          window.marked.setOptions({
            highlight: function (code, lang) {
              const language = window.hljs.getLanguage(lang) ? lang : "plaintext";
              return window.hljs.highlight(code, { language }).value;
            },
            breaks: true,
            gfm: true
          });
          updatePreview();
        };
        document.head.appendChild(hljsScript);
      };
      document.head.appendChild(script);
    } else {
      updatePreview();
    }
    
    if (post && githubToken) {
      await loadPost();
    } else if (!post) {
      // Dejar vacío para nuevos posts
      contentInput = "";
      titleInput = "";
      categoryInput = "";
    }
    
    loadLocalDraft();
  });

  async function loadPost() {
    isLoading = true;

    try {
      const data = await ghFetch(`contents/${post.path}`, githubToken);
      currentSha = data.sha;
      const decoded = decodeURIComponent(escape(atob(data.content)));
      
      if (isJSON) {
        formData = JSON.parse(decoded);
        titleInput = formData.title || post.name;
      } else if (isYAML && isConfig) {
        formData = jsyaml.load(decoded);
        titleInput = "Ajustes del Sitio";
        showSettings = true; // Forzar sidebar de ajustes
      } else {
        const parsed = parsePost(decoded);
        formData = parsed.fm || {};
        contentInput = parsed.content;
        
        // Si es una colección de archivos, mapear el contenido al campo 'body' si existe
        if (isConfig && currentCollection.files) {
          const fileConfig = currentCollection.files.find(f => f.file === post.path);
          if (fileConfig && fileConfig.fields) {
            const hasBodyField = fileConfig.fields.some(f => f.name === 'body');
            if (hasBodyField) {
              formData.body = contentInput;
            }
          }
        }

        titleInput = formData.title || "";
        categoryInput = formData.category || "";
        publishedInput = formData.published ? new Date(formData.published).toISOString().split("T")[0] : "";
        updatedInput = formData.updated ? new Date(formData.updated).toISOString().split("T")[0] : "";
        pinnedInput = !!formData.pinned;
        descriptionInput = formData.description || "";
        coverInput = formData.cover || formData.image || "";
        coverInContentInput = formData.coverInContent !== undefined ? !!formData.coverInContent : false;
        tagsInput = Array.isArray(formData.tags) ? formData.tags.join(", ") : formData.tags || "";
        langInput = formData.lang || "";
        licenseNameInput = formData.licenseName || "";
        licenseUrlInput = formData.licenseUrl || "";
        authorInput = formData.author || "";
        sourceLinkInput = formData.sourceLink || "";
        draftInput = !!formData.draft;
        commentInput = formData.comment !== undefined ? formData.comment : true;
        inNavbarInput = !!formData.inNavbar;
        iconInput = formData.icon || "";
        slugInput = formData.slug || "";
        imdbIdInput = formData.imdbId || "";
        ageRatingInput = formData.ageRating || "";
      }
      
      filenameInput = post.name;
      console.log("CMS: Post cargado con éxito, SHA:", currentSha);
    } catch (err) { 
      console.error("CMS: Error cargando post:", err); 
      toastStore.error("Error al cargar la versión más reciente: " + err.message);
    } finally { isLoading = false; }
  }

  function updatePreview() {
    if (!window.marked || contentInput === undefined) return;
    
    // Pre-procesar Admonitions estilo Obsidian (> [!INFO])
    let processedMD = contentInput.replace(
      /^>\s*\[!(NOTE|INFO|TODO|TIP|IMPORTANT|WARNING|CAUTION|FAILURE|DANGER|BUG|EXAMPLE|QUOTE|SPOILER|SIDEBAR|NARRADOR|ABSTRACT|SUMMARY|TLDR|SUCCESS|CHECK|DONE|QUESTION|HELP|FAQ|ATTENTION|FAIL|MISSING|ERROR|CITE)\]\s*(.*)?\n((?:>\s*.*\n?)*)/gmi,
      (match, type, title, content) => {
        const typeLower = type.toLowerCase();
        const cleanContent = content.replace(/^>\s?/gm, "");
        const displayTitle = title || type.charAt(0) + type.slice(1).toLowerCase();
        
        let html = `\n<div class="admonition bdm-${typeLower}">\n\n`;
        if (typeLower !== 'narrador') {
          html += `<div class="bdm-title">${displayTitle}</div>\n\n`;
        }
        html += cleanContent + `\n\n</div>\n`;
        return html;
      }
    );

    // Pre-procesar ::: (Directivas) antes de marked para evitar que los envuelva en <p>
    processedMD = processedMD.replace(
      /:::(note|warning|tip|important|caution|info|sidebar|narrador|spoiler|abstract|summary|tldr|todo|success|check|done|question|help|faq|attention|failure|fail|missing|danger|error|bug|example|quote|cite)\n?([\s\S]*?)\n?:::/gi,
      (match, type, content) => {
        const typeLower = type.toLowerCase();
        const displayTitle = typeLower === 'narrador' ? '' : typeLower.toUpperCase();
        
        if (typeLower === 'spoiler') {
          return `\n<details class="admonition bdm-spoiler">\n<summary class="bdm-title">SPOILER (Clic para revelar)</summary>\n<div class="bdm-content">\n\n${content}\n\n</div>\n</details>\n`;
        }
        
        let html = `\n<div class="admonition bdm-${typeLower}">\n\n`;
        if (displayTitle) {
          html += `<div class="bdm-title">${displayTitle}</div>\n\n`;
        }
        html += content + `\n\n</div>\n`;
        return html;
      }
    );

    // Pre-procesar bloque de música estilo Twilight (:::music{...})
    processedMD = processedMD.replace(
      /:::music\{(.*?)\}/g,
      (match, params) => {
        const attrs = {};
        params.split(',').forEach(p => {
          const parts = p.split('=');
          const k = parts[0].trim();
          const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
          if (k && v) attrs[k] = v;
        });
        
        // Estructura idéntica a MusicCardComponent.mjs
        return `<div class="card-music">
          <div class="music-cover" style="background-image: url('${attrs.cover || ''}')"></div>
          <div class="music-info">
            <div class="music-header">
              <div class="music-title">${attrs.title || 'Música'}</div>
              <div class="music-artist">${attrs.artist || 'Artista'}</div>
            </div>
            <div class="music-lyric" style="display: grid; place-items: center;">
              <div class="lyric-current">Reproduciendo: ${attrs.title || '...'}</div>
            </div>
            <div class="music-controls">
               <button class="play-btn">
                 <svg viewBox="0 0 24 24" style="width: 1.25rem; fill: currentColor;"><path d="M8 5v14l11-7z"></path></svg>
               </button>
               <div class="progress-container"><div class="progress-bar" style="width: 30%"></div></div>
               <span class="time-display">0:00 / 3:50</span>
            </div>
          </div>
        </div>`;
      }
    );

    // Soporte para tarjetas de película (:::movie{...})
    processedMD = processedMD.replace(
      /:::movie\{(.*?)\}/g,
      (match, params) => {
        const attrs = {};
        params.split(',').forEach(p => {
          const parts = p.split('=');
          if (parts.length >= 2) {
            const k = parts[0].trim();
            const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            if (k) attrs[k] = v;
          }
        });
        
        // Limpiar URL de imagen de Wikimedia Commons si es necesario
        let coverUrl = attrs.url || attrs.cover || '';
        if (coverUrl.includes('Special:FilePath/')) {
           // Ya es una ruta directa
        } else if (coverUrl.includes('commons.wikimedia.org/wiki/')) {
           const filename = coverUrl.split('/').pop();
           coverUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
        }
        
        // El link ahora es 'link', pero mantenemos 'url' como fallback si no hay 'link' y 'url' no parece una imagen
        let mainUrl = attrs.link || '#';
        if (mainUrl === '#' && attrs.url && !attrs.url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
           mainUrl = attrs.url;
        }
        if (mainUrl === '#' && attrs.imdbId) {
           mainUrl = `https://www.imdb.com/title/${attrs.imdbId}`;
        }
        
        // Generar HTML y eliminar saltos de línea/espacios extra para que Markdown no se confunda
        const html = `<div class="card-movie-info"><a href="${mainUrl}" target="_blank" class="card-movie-link" style="display: flex; width: 100%; height: 100%; text-decoration: none; color: inherit;"><div class="movie-poster" style="background-image: url('${coverUrl}')"><div class="movie-poster-overlay"></div></div><div class="movie-details"><div class="movie-header"><div class="movie-title-row"><h3 class="movie-card-title">${attrs.title || 'Título'}</h3><div class="movie-badges-col">${attrs.age ? `<span class="movie-age-badge">${attrs.age}</span>` : ''}${attrs.recAge ? `<span class="movie-rec-age-badge">⭐ ${attrs.recAge}</span>` : ''}</div></div><div class="movie-original-title">${attrs.originalTitle || attrs.title || ''}</div></div><div class="movie-footer-info"><div class="movie-footer-row"><div class="imdb-badge"><span class="imdb-logo">IMDb</span></div></div></div></div></a></div>`;

        return `\n\n${html}\n\n`;
        }
        );
    // Soporte para tarjetas de GitHub (::github{repo="..."})
    processedMD = processedMD.replace(
      /::github\{(.*?)\}/g,
      (match, params) => {
        const attrs = {};
        params.split(',').forEach(p => {
          const parts = p.split('=');
          const k = parts[0].trim();
          const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
          if (k && v) attrs[k] = v;
        });
        const repo = attrs.repo || "";
        const [owner, name] = repo.split('/');
        
        return `<a class="card-github fetch-waiting no-styling" href="https://github.com/${repo}" target="_blank">
          <div class="gc-titlebar">
            <div class="gc-titlebar-left">
              <div class="gc-owner">
                <div class="gc-avatar"></div>
                <div class="gc-user">${owner || 'owner'}</div>
              </div>
              <div class="gc-divider">/</div>
              <div class="gc-repo">${name || 'repo'}</div>
            </div>
            <div class="github-logo"></div>
          </div>
          <div class="gc-description">GitHub Repository: ${repo}</div>
          <div class="gc-infobar">
            <div class="gc-stars">00K</div>
            <div class="gc-forks">0K</div>
            <div class="gc-license">MIT</div>
            <span class="gc-language">Loading...</span>
          </div>
        </a>`;
      }
    );

    // Configurar renderer personalizado para que el código use los estilos de expressive-code
    const renderer = {
      code(token) {
        const { text: code, lang = 'text' } = token;
        const language = (lang || '').match(/\S*/)[0] || 'text';
        return `<div class="expressive-code">
          <figure class="frame">
            <figcaption class="header">
              <span class="title">${language}</span>
            </figcaption>
            <pre><code class="language-${language}">${code}</code></pre>
          </figure>
        </div>`;
      },
      image(token) {
        const { href, title, text } = token;
        let alt = text || "";
        let style = "";
        let widthAttr = "";
        
        if (alt.includes("|")) {
          const parts = alt.split("|");
          alt = parts[0].trim();
          const size = parts[parts.length - 1].trim();
          if (size && ( /^\d+$/.test(size) || /^\d+(px|em|rem|%|vw|vh)$/.test(size) )) {
            const width = /^\d+$/.test(size) ? `${size}px` : size;
            style = `style="width: ${width}; height: auto;"`;
            widthAttr = `width="${size.replace(/[^0-9]/g, '')}"`;
          }
        }
        
        return `<img src="${href}" alt="${alt}" ${title ? `title="${title}"` : ""} ${widthAttr} ${style} />`;
      }
    };
    window.marked.use({ renderer });

    renderedHTML = window.marked.parse(processedMD);
    
    setTimeout(buildScrollMap, 100);
  }

  $effect(() => { if (contentInput !== undefined) updatePreview(); });

  async function handleSave() {
    if (validationErrors.length > 0) {
      toastStore.warning("Por favor, corrige los errores antes de guardar.");
      console.error("Errores de validación:", validationErrors);
      return;
    }
    isSaving = true;
    


    let finalContent = "";
    if (isJSON) {
      finalContent = JSON.stringify($state.snapshot(formData), null, 4);
    } else if (isYAML && isConfig) {
      finalContent = jsyaml.dump($state.snapshot(formData));
    } else {
      const finalFM = {
        ...$state.snapshot(formData),
      };
      
      // Sincronizar TODOS los campos de la UI con el objeto de metadatos final
      if (titleInput) finalFM.title = titleInput.trim();
      if (categoryInput) finalFM.category = categoryInput.trim();
      if (publishedInput) finalFM.published = publishedInput;
      if (descriptionInput) finalFM.description = descriptionInput.trim();
      if (tagsInput) finalFM.tags = tagsInput.split(",").map(t => t.trim()).filter(t => t);
      if (coverInput) finalFM.cover = coverInput.trim();
      finalFM.coverInContent = !!coverInContentInput;
      if (slugInput) finalFM.slug = slugInput.trim();
      if (authorInput) finalFM.author = authorInput.trim();
      if (langInput) finalFM.lang = langInput.trim();
      if (updatedInput) finalFM.updated = updatedInput;
      if (licenseNameInput) finalFM.licenseName = licenseNameInput.trim();
      if (licenseUrlInput) finalFM.licenseUrl = licenseUrlInput.trim();
      if (sourceLinkInput) finalFM.sourceLink = sourceLinkInput.trim();
      if (iconInput) finalFM.icon = iconInput.trim();
      if (imdbIdInput) finalFM.imdbId = imdbIdInput.trim();
      if (ageRatingInput) finalFM.ageRating = ageRatingInput.trim();
      
      finalFM.draft = !!draftInput;
      finalFM.pinned = !!pinnedInput;
      finalFM.comment = !!commentInput;
      finalFM.inNavbar = !!inNavbarInput;
      
      // Si existe un campo 'body' en formData (proveniente de colecciones de archivos), 
      // usarlo como contenido principal y quitarlo de FM para no duplicar datos
      let bodyContent = contentInput;
      if (isConfig && finalFM.body !== undefined) {
        bodyContent = finalFM.body;
        delete finalFM.body;
      }
      
      finalContent = stringifyPost(finalFM, bodyContent);
    }

    try {
      const targetPath = post ? post.path : `src/content/posts/${filenameInput.endsWith(".md") ? filenameInput : filenameInput + ".md"}`;
      
      // Verificación de seguridad: Si es un post NUEVO, no permitimos sobrescribir si el archivo ya existe
      if (!post && githubToken && !isMock) {
        console.log(`CMS: Verificando duplicado para ${targetPath}...`);
        try {
          const latest = await ghFetch(`contents/${targetPath}`, githubToken);
          if (latest && latest.sha) {
            toastStore.error("¡Error! Ya existe un post con este nombre. Cambia el título o edita el post original desde el Dashboard.");
            isSaving = false;
            return;
          }
        } catch (e) {
          // Si es 404, perfecto, el archivo es nuevo
          if (e.status !== 404) {
            console.warn("CMS: Error inesperado al verificar duplicado:", e.message);
          }
        }
      }

      // Si es una EDICIÓN y no tenemos SHA (ej: navegación directa), recuperarlo
      if (post && !currentSha && githubToken && !isMock) {
        console.log(`CMS: SHA faltante para edición en ${targetPath}, recuperando...`);
        try {
          const latest = await ghFetch(`contents/${targetPath}`, githubToken);
          currentSha = latest.sha;
        } catch (e) {
          console.error("CMS: No se pudo recuperar el SHA para edición:", e.message);
        }
      }

      console.log(`CMS: Guardando en ${targetPath} con SHA:`, currentSha || "NUEVO ARCHIVO");

      const response = await ghFetch(`contents/${targetPath}`, githubToken, {
        method: "PUT",
        body: JSON.stringify({
          message: `CMS: Save ${titleInput}`,
          content: btoa(unescape(encodeURIComponent(finalContent))),
          sha: currentSha || undefined,
        }),
      });

      // Actualizar el SHA actual con la respuesta de GitHub/Local para permitir guardados sucesivos
      if (response && response.content && response.content.sha) {
        currentSha = response.content.sha;
      }
      toastStore.success("¡Guardado con éxito!");
      clearLocalDraft();
      onPostSaved();
    } catch (err) { toastStore.error("Error al guardar: " + err.message); } finally { isSaving = false; }
  }

  import { optimizeImage } from "./utils/images";
  async function genericUpload(file) {
      if (isMock) return "assets/uploads/mock-upload.jpg";

      // Límite de la API de GitHub REST para subidas directas (25MB aproximado para evitar errores)
      const MAX_SIZE = 25 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
          throw new Error("El archivo es demasiado grande. El límite es de 25MB.");
      }
      
      let base64 = "";
      let fileName = file.name;

      if (file.type.startsWith('image/')) {
          // Si es imagen, optimizamos
          const optimized = await optimizeImage(file);
          base64 = optimized.base64;
          fileName = optimized.fileName;
      } else {
          // Si es música u otro, subida directa en base64
          base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result.split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(file);
          });
      }

      // Limpiar el nombre del archivo para evitar caracteres problemáticos
      const fileExt = fileName.includes('.') ? fileName.split('.').pop() : '';
      const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
      const cleanFileName = `${slugify(baseName)}.${fileExt}`;
      const finalFileName = `${Date.now()}-${cleanFileName}`;
      
      // Determinar la subcarpeta según el tipo de archivo (música vs imágenes)
      const isAudio = file.type.startsWith('audio/') || finalFileName.endsWith('.lrc');
      
      let mediaFolder = (cmsConfig?.media_folder || "public/assets/images").replace(/\/$/, "");
      let publicFolder = (cmsConfig?.public_folder || "/assets/images").replace(/\/$/, "");

      // Si es audio o letras, intentamos usar la carpeta de música si la de imágenes está configurada
      if (isAudio && (mediaFolder.includes('images') || mediaFolder.includes('img'))) {
          mediaFolder = mediaFolder.replace(/images|img/, 'music');
          publicFolder = publicFolder.replace(/images|img/, 'music');
      }

      const path = `${mediaFolder}/${finalFileName}`;
      const publicPath = `${publicFolder}/${finalFileName}`;
      
      await ghFetch(`contents/${path}`, githubToken, {
        method: "PUT",
        body: JSON.stringify({
          message: `CMS: Upload file ${finalFileName}`,
          content: base64,
        }),
      });
      return publicPath;
  }

  async function handleImageUpload(event) {
    const file = event.target.files ? event.target.files[0] : event;
    if (!file) return;
    try {
      isUploading = true;
      const markdownPath = await genericUpload(file);
      const el = document.getElementById("post-content");
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const snip = file.type.startsWith('image/') ? `\n![${file.name}](${markdownPath})\n` : `\n[${file.name}](${markdownPath})\n`;
      contentInput = contentInput.substring(0, start) + snip + contentInput.substring(end);
      toastStore.success("Archivo subido e insertado.");
      tick().then(() => { if (el) { el.focus(); el.setSelectionRange(start + snip.length, start + snip.length); } });
    } catch (err) { toastStore.error("Error al subir: " + err.message); } finally { isUploading = false; if (event.target) event.target.value = ''; }
  }
  
  function handleImageSelected(url) {
    if (!url) return;
    const el = editorTextarea;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const snip = `\n![Imagen](${url})\n`;
    contentInput = contentInput.substring(0, start) + snip + contentInput.substring(end);
    
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snip.length, start + snip.length);
    }, 10);
    
    showGalleryModal = false;
    tempImageSelection = "";
  }

  function handleToolbar(type) {
    const el = editorTextarea;
    if (!el) return;
    
    let start = el.selectionStart;
    let end = el.selectionEnd;
    const fullText = contentInput;
    
    // Encontrar el inicio y fin de la línea actual
    const lineStart = fullText.lastIndexOf("\n", start - 1) + 1;
    let lineEnd = fullText.indexOf("\n", end);
    if (lineEnd === -1) lineEnd = fullText.length;
    
    const lineText = fullText.substring(lineStart, lineEnd);
    const selText = fullText.substring(start, end);
    
    let newFullText = fullText;
    let newCursorStart = start;
    let newCursorEnd = end;

    const isHeader = type.match(/^h[1-6]$/);
    const isList = type === 'list-ul' || type === 'list-ol' || type === 'task';
    const isQuote = type === 'quote';

    if (isHeader || isQuote || isList) {
      // --- Lógica de Bloque (Línea completa) ---
      let cleanLine = lineText.replace(/^(#+\s*|>\s*|[-\*]\s*|\d+\.\s*|[-\*]\s*\[[\s xX]\]\s*)/, "");
      let prefix = "";
      
      if (isHeader) {
        const level = type[1];
        prefix = "#".repeat(level) + " ";
      } else if (isQuote) {
        prefix = "> ";
      } else if (type === 'list-ul') {
        prefix = "- ";
      } else if (type === 'list-ol') {
        prefix = "1. ";
      } else if (type === 'task') {
        prefix = "- [ ] ";
      }

      if (lineText.startsWith(prefix)) {
        newFullText = fullText.substring(0, lineStart) + cleanLine + fullText.substring(lineEnd);
        newCursorStart = start - prefix.length;
        newCursorEnd = end - prefix.length;
      } else {
        newFullText = fullText.substring(0, lineStart) + prefix + cleanLine + fullText.substring(lineEnd);
        const diff = prefix.length - (lineText.length - cleanLine.length);
        newCursorStart = start + diff;
        newCursorEnd = end + diff;
      }
    } else {
      // --- Lógica Inline (Negrita, Cursiva, etc.) con Toggle ---
      let marker = "";
      switch (type) {
        case "bold": marker = "**"; break;
        case "italic": marker = "*"; break;
        case "code-inline": marker = "`"; break;
        case "strike": marker = "~~"; break;
      }

      if (marker) {
        const mLen = marker.length;
        
        // SI NO HAY SELECCIÓN: Expandir a la palabra actual
        if (start === end) {
          const leftText = fullText.substring(0, start);
          const rightText = fullText.substring(end);
          const wordLeft = leftText.match(/[\wáéíóúÁÉÍÓÚñÑ]+$/);
          const wordRight = rightText.match(/^[\wáéíóúÁÉÍÓÚñÑ]+/);
          
          if (wordLeft || wordRight) {
            start = start - (wordLeft ? wordLeft[0].length : 0);
            end = end + (wordRight ? wordRight[0].length : 0);
          }
        }

        const currentSel = fullText.substring(start, end);

        // Caso A: La selección ya incluye los marcadores: [**hola**]
        if (currentSel.startsWith(marker) && currentSel.endsWith(marker)) {
          const stripped = currentSel.substring(mLen, currentSel.length - mLen);
          newFullText = fullText.substring(0, start) + stripped + fullText.substring(end);
          newCursorStart = start;
          newCursorEnd = start + stripped.length;
        } 
        // Caso B: Los marcadores están justo fuera de la selección: **[hola]**
        else if (fullText.substring(start - mLen, start) === marker && fullText.substring(end, end + mLen) === marker) {
          newFullText = fullText.substring(0, start - mLen) + currentSel + fullText.substring(end + mLen);
          newCursorStart = start - mLen;
          newCursorEnd = end - mLen;
        }
        // Caso C: No está formateado, aplicar marcadores
        else {
          const snip = `${marker}${currentSel || "texto"}${marker}`;
          newFullText = fullText.substring(0, start) + snip + fullText.substring(end);
          if (!currentSel) {
            newCursorStart = start + mLen;
            newCursorEnd = newCursorStart + 5; 
          } else {
            newCursorStart = start;
            newCursorEnd = start + snip.length;
          }
        }
      } else {
        // Otros (Link, HR, Code blocks, Obsidian Callouts)
        let snip = "";
        switch (type) {
          case "link": snip = `[${selText || "enlace"}](https://)`; break;
          case "hr": snip = `\n---\n`; break;
          case "code": snip = `\n\`\`\`javascript\n${selText || "// código"}\n\`\`\`\n`; break;
          case "note": snip = `\n> [!NOTE] Nota\n> ${selText || "Contenido..."}\n`; break;
          case "tip": snip = `\n> [!TIP] Tip\n> ${selText || "Consejo..."}\n`; break;
          case "warning": snip = `\n> [!WARNING] Aviso\n> ${selText || "Alerta..."}\n`; break;
          case "important": snip = `\n> [!IMPORTANT] Importante\n> ${selText || "Crítico..."}\n`; break;
          case "narrador": snip = `\n:::narrador\n${selText || "Texto del narrador..."}\n:::\n`; break;
          case "sidebar": snip = `\n:::sidebar\n${selText || "Contenido lateral..."}\n:::\n`; break;
          case "mermaid-flow": snip = `\n\`\`\`mermaid\ngraph TD\n    A[Inicio] --> B(Proceso)\n    B --> C{Decision}\n    C -->|Si| D[Fin]\n    C -->|No| B\n\`\`\`\n`; break;
          case "mermaid-seq": snip = `\n\`\`\`mermaid\nsequenceDiagram\n    Participante A->>Participante B: Mensaje\n    Participante B-->>Participante A: Respuesta\n\`\`\`\n`; break;
          case "mermaid-gantt": snip = `\n\`\`\`mermaid\ngantt\n    title Proyecto\n    section Fase 1\n    Tarea :a1, 2024-01-01, 30d\n\`\`\`\n`; break;
          case "music": snip = `\n:::music{title="Título", artist="Artista", cover="/assets/images/default.jpg", audio="/assets/music/song.mp3", lrc=""}\n`; break;
          case "movie": snip = `\n:::movie{title="Título", originalTitle="Original", age="+7", recAge="+10", url="https://image-url.jpg", link="https://imdb.com/..."}\n`; break;
          case "video": snip = `\n<iframe width="100%" height="468" src="URL_EMBED" frameborder="0" allowfullscreen></iframe>\n`; break;
          case "math": snip = `\n$$\n${selText || "e = mc^2"}\n$$\n`; break;
          case "spoiler": snip = `\n:::spoiler\n${selText || "Contenido oculto que se revela al hacer clic..."}\n:::\n`; break;
        }
        newFullText = fullText.substring(0, start) + snip + fullText.substring(end);
        newCursorStart = start;
        newCursorEnd = start + snip.length;
      }
    }

    contentInput = newFullText;
    tick().then(() => {
      el.focus();
      el.setSelectionRange(Math.max(0, newCursorStart), Math.max(0, newCursorEnd));
    });
  }

  let previewEl = $state(null);
  let isSyncingTarget = false;
  let scrollMap = [];
  async function buildScrollMap() {
    if (!editorTextarea || !previewEl) return;
    await tick();
    const headers = previewEl.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const newMap = [{ editor: 0, preview: 0 }];
    const lines = contentInput.split("\n");
    const textareaHeight = editorTextarea.scrollHeight;
    const previewHeight = previewEl.scrollHeight;
    headers.forEach(header => {
      const text = header.textContent.trim();
      const lineIndex = lines.findIndex(l => l.trim().replace(/^#+\s*/, "") === text);
      if (lineIndex !== -1) {
        newMap.push({ editor: (lineIndex / lines.length) * textareaHeight, preview: header.offsetTop - previewEl.offsetTop });
      }
    });
    newMap.push({ editor: textareaHeight, preview: previewHeight });
    scrollMap = newMap;
  }
  function syncScroll(e) {
    if (isSyncingTarget) { isSyncingTarget = false; return; }
    const source = e.target;
    const target = source === editorTextarea ? previewEl : editorTextarea;
    if (!target || scrollMap.length < 2) return;
    const scrollPos = source.scrollTop;
    if (scrollPos <= 5) { target.scrollTop = 0; return; }
    for (let i = 0; i < scrollMap.length - 1; i++) {
      const start = source === editorTextarea ? scrollMap[i].editor : scrollMap[i].preview;
      const end = source === editorTextarea ? scrollMap[i+1].editor : scrollMap[i+1].preview;
      if (scrollPos >= start && scrollPos <= end) {
        const ratio = (scrollPos - start) / (end - start);
        const targetStart = source === editorTextarea ? scrollMap[i].preview : scrollMap[i].editor;
        const targetEnd = source === editorTextarea ? scrollMap[i+1].preview : scrollMap[i+1].editor;
        target.scrollTop = targetStart + ratio * (targetEnd - targetStart);
        isSyncingTarget = true;
        break;
      }
    }
  }
  import FieldRenderer from "./editor/FieldRenderer.svelte";
</script>

<div class="cms-editor-wrapper">
  <EditorHeader 
    filename={filenameInput} 
    isSaving={isSaving} 
    onSave={handleSave} 
    onCancel={onPostCancelled}
    onToggleSettings={() => showSettings = !showSettings}
    showSettings={showSettings}
    viewMode={isJSON || (isYAML && isConfig) ? 'write' : viewMode}
    onViewModeChange={(m) => viewMode = m}
    {validationErrors}
  />


  <main class="cms-editor-main-content">
    {#if isJSON || (isYAML && isConfig)}
      <div class="cms-config-editor">
        <div class="cms-config-container card-base">
          <h2>Edición de {currentCollection?.label || 'Datos'}</h2>
          <div class="cms-fields-grid">
            {#if currentCollection?.fields}
              {#each currentCollection.fields as field}
                <FieldRenderer 
                  {field} 
                  bind:value={formData[field.name]} 
                  onUpload={genericUpload} 
                  {githubToken}
                  {isMock}
                  {cmsConfig}
                />
              {/each}
            {:else if currentCollection?.files}
              {@const currentFile = currentCollection.files.find(f => f.file === post?.path)}
              {#if currentFile?.fields}
                {#each currentFile.fields as field}
                  <FieldRenderer 
                    {field} 
                    bind:value={formData[field.name]} 
                    onUpload={genericUpload} 
                    {githubToken}
                    {isMock}
                    {cmsConfig}
                  />
                {/each}
              {/if}
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <div class="cms-split-view" class:with-sidebar={showSettings} class:mode-write={viewMode === 'write'} class:mode-preview={viewMode === 'preview'}>
        <EditorEdicion 
          bind:content={contentInput}
          bind:title={titleInput}
          viewMode={viewMode}
          bind:textarea={editorTextarea}
          onToolbar={handleToolbar}
          onImageUpload={handleImageUpload}
          onScroll={syncScroll}
          onSave={handleSave}
          onToggleSettings={() => showSettings = !showSettings}
          onOpenGallery={() => showGalleryModal = true}
          onOpenShortcuts={() => showShortcuts = true}
          {isUploading}
          lastSaved={lastDraftSaved}
          {githubToken}
          {isMock}
          {cmsConfig}
        />

        <EditorPreview 
          title={titleInput}
          published={publishedInput}
          category={categoryInput}
          renderedHTML={renderedHTML}
          bind:previewEl={previewEl}
          onScroll={syncScroll}
        />
      </div>

      <EditorMetadata 
        isVisible={showSettings}
        {githubToken}
        {isMock}
        {cmsConfig}
        bind:category={categoryInput}
        bind:published={publishedInput}
        bind:description={descriptionInput}
        bind:tags={tagsInput}
        bind:cover={coverInput}
        bind:coverInContent={coverInContentInput}
        bind:slug={slugInput}
        bind:author={authorInput}
        bind:lang={langInput}
        bind:updated={updatedInput}
        bind:licenseName={licenseNameInput}
        bind:licenseUrl={licenseUrlInput}
        bind:sourceLink={sourceLinkInput}
        bind:draft={draftInput}
        bind:pinned={pinnedInput}
        bind:comment={commentInput}
        bind:inNavbar={inNavbarInput}
        bind:icon={iconInput}
        bind:imdbId={imdbIdInput}
        bind:ageRating={ageRatingInput}
        bind:title={titleInput}
        bind:content={contentInput}
      />
    {/if}
  </main>

  {#if showShortcuts}
    <ShortcutsModal onOpenChange={(val) => showShortcuts = val} />
  {/if}

  {#if showGalleryModal}
    <div class="cms-gallery-modal-overlay" transition:fade={{duration: 200}}>
      <div class="cms-gallery-modal-wrapper">
        <div class="cms-modal-content">
          <ImageSelector 
            bind:value={tempImageSelection}
            {githubToken}
            {isMock}
            {cmsConfig}
            onSelect={handleImageSelected}
          />
          <button class="close-gallery-btn" onclick={() => showGalleryModal = false} aria-label="Cerrar galería">
            <Icon icon="material-symbols:close-rounded" />
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .cms-editor-wrapper {
    background: var(--page-bg);
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .cms-editor-main-content {
    flex: 1;
    display: flex;
    position: relative;
    overflow: hidden;
  }

  /* Estilos para corregir la vista previa de Admonitions y Narrador */
  :global(.markdown-content .admonition) {
    border-radius: 0.75rem;
    margin: 1.5rem 0;
    padding: 1rem 1.25rem;
    position: relative;
    border-left: 4px solid var(--primary);
    background: color-mix(in srgb, var(--primary) 8%, transparent);
    width: 100%;
    overflow: visible;
  }

  /* Obsidian Color Palette for Admonitions */
  :global(.markdown-content .bdm-note), :global(.markdown-content .bdm-info), :global(.markdown-content .bdm-todo), :global(.markdown-content .bdm-abstract), :global(.markdown-content .bdm-summary), :global(.markdown-content .bdm-tldr) { 
    --adm-color: #0891b2; 
    border-color: var(--adm-color) !important; 
    background: color-mix(in srgb, var(--adm-color) 10%, transparent) !important;
  }
  :global(.markdown-content .bdm-tip), :global(.markdown-content .bdm-example), :global(.markdown-content .bdm-hint) { 
    --adm-color: #10b981; 
    border-color: var(--adm-color) !important; 
    background: color-mix(in srgb, var(--adm-color) 10%, transparent) !important;
  }
  :global(.markdown-content .bdm-success), :global(.markdown-content .bdm-check), :global(.markdown-content .bdm-done) { 
    --adm-color: #22c55e; 
    border-color: var(--adm-color) !important; 
    background: color-mix(in srgb, var(--adm-color) 10%, transparent) !important;
  }
  :global(.markdown-content .bdm-question), :global(.markdown-content .bdm-help), :global(.markdown-content .bdm-faq) { 
    --adm-color: #f97316; 
    border-color: var(--adm-color) !important; 
    background: color-mix(in srgb, var(--adm-color) 10%, transparent) !important;
  }
  :global(.markdown-content .bdm-warning), :global(.markdown-content .bdm-caution), :global(.markdown-content .bdm-attention) { 
    --adm-color: #f59e0b; 
    border-color: var(--adm-color) !important; 
    background: color-mix(in srgb, var(--adm-color) 10%, transparent) !important;
  }
  :global(.markdown-content .bdm-important), :global(.markdown-content .bdm-danger), :global(.markdown-content .bdm-error), :global(.markdown-content .bdm-bug), :global(.markdown-content .bdm-failure), :global(.markdown-content .bdm-fail), :global(.markdown-content .bdm-missing) { 
    --adm-color: #ef4444; 
    border-color: var(--adm-color) !important; 
    background: color-mix(in srgb, var(--adm-color) 10%, transparent) !important;
  }
  :global(.markdown-content .bdm-quote), :global(.markdown-content .bdm-cite) { 
    --adm-color: #94a3b8; 
    border-color: var(--adm-color) !important; 
    background: color-mix(in srgb, var(--adm-color) 10%, transparent) !important;
  }
  
  :global(.markdown-content .admonition .bdm-title) {
    color: var(--adm-color, var(--primary)) !important;
  }
  
  :global(.markdown-content .bdm-spoiler) { 
    border-left: 4px solid #4b5563 !important; 
    background: rgba(0, 0, 0, 0.2) !important;
    border-radius: 0.75rem;
    color: var(--text-secondary) !important;
    backdrop-filter: blur(2px);
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0 !important;
    overflow: hidden;
  }
  :global(.markdown-content .bdm-spoiler[open]) {
    background: rgba(0, 0, 0, 0.3) !important;
    backdrop-filter: none;
  }
  :global(.markdown-content .bdm-spoiler .bdm-title) {
    color: #9ca3af !important;
    font-size: 0.75rem !important;
    padding: 1rem 1.25rem;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 850;
    transition: color 0.2s;
  }
  :global(.markdown-content .bdm-spoiler .bdm-title::-webkit-details-marker) {
    display: none;
  }
  :global(.markdown-content .bdm-spoiler .bdm-title::before) {
    content: "";
    display: inline-block;
    width: 1.1rem;
    height: 1.1rem;
    background-color: currentColor;
    mask-size: contain;
    mask-position: center;
    mask-repeat: no-repeat;
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 17c.55 0 1-.45 1-1s-.45-1-1-1s-1 .45-1 1s.45 1 1 1zm6-5h-1V9c0-2.76-2.24-5-5-5S7 6.24 7 9v3H6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2zM8.9 9c0-1.71 2.29-3.1 3.1-3.1s3.1 1.39 3.1 3.1v3H8.9V9zM18 20H6v-6h12v6z'/%3E%3C/svg%3E");
    transition: transform 0.3s ease;
  }
  :global(.markdown-content .bdm-spoiler[open] .bdm-title::before) {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 17c.55 0 1-.45 1-1s-.45-1-1-1s-1 .45-1 1s.45 1 1 1zm6-5h-1V9c0-2.76-2.24-5-5-5S7 6.24 7 9v3H6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2zm-6-6c1.66 0 3 1.34 3 3v3H9V9c0-1.66 1.34-3 3-3z'/%3E%3C/svg%3E");
  }

  :global(.card-movie-info) {
    display: flex;
    background: var(--card-bg);
    border-radius: 1.25rem;
    overflow: hidden;
    margin: 2.5rem 0;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    border: 1px solid var(--line-divider);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    max-width: 800px;
    padding: 0 !important; /* ELIMINAR TODO EL PADDING */
  }

  :global(.card-movie-link) {
    display: flex !important;
    width: 100%;
    align-items: stretch !important;
    text-decoration: none !important;
    color: inherit !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  :global(.card-movie-info:hover) {
    transform: translateY(-4px);
    box-shadow: 0 15px 45px rgba(0,0,0,0.15);
    border-color: var(--primary);
  }

  :global(.movie-poster) {
    width: 160px;
    min-width: 160px;
    background-size: cover;
    background-position: center;
    background-color: var(--btn-regular-bg);
    position: relative;
    border-right: 1px solid var(--line-divider);
    margin: 0 !important;
    padding: 0 !important;
    align-self: stretch;
  }

  :global(.movie-poster-overlay) {
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, transparent, rgba(0,0,0,0.1));
  }

  :global(.movie-details) {
    flex: 1;
    padding: 2.25rem 2.5rem; /* El padding solo aquí, dentro de los detalles */
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1.75rem;
  }

  :global(.movie-header) {
    display: flex;
    flex-direction: column;
    gap: 1rem; /* Más espacio entre Título y Título Original */
  }

  :global(.movie-title-row) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
  }

  :global(.movie-card-title) {
    font-size: 1.85rem !important; /* Ligeramente más grande */
    font-weight: 950 !important;
    margin: 0 !important;
    color: var(--text-primary);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  :global(.movie-badges-col) {
    display: flex;
    gap: 0.6rem;
    flex-shrink: 0;
  }

  :global(.movie-age-badge), :global(.movie-rec-age-badge) {
    padding: 0.35rem 0.8rem;
    border-radius: 0.6rem;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }

  :global(.movie-age-badge) {
    background: var(--btn-regular-bg);
    color: var(--text-secondary);
    border: 1.5px solid var(--line-divider); /* Borde más definido */
  }

  :global(.movie-rec-age-badge) {
    background: color-mix(in srgb, var(--primary) 12%, transparent);
    color: var(--primary);
    border: 1.5px solid color-mix(in srgb, var(--primary) 25%, transparent);
  }

  :global(.movie-original-title) {
    font-size: 1.05rem;
    opacity: 0.4;
    font-style: italic;
    font-weight: 500;
    margin-top: 0.2rem;
  }

  :global(.movie-footer-info) {
    margin-top: 0.75rem; /* Más margen arriba del badge de IMDb */
    padding-top: 1.25rem;
    border-top: 1px dashed var(--line-divider); /* Línea discontinua para un toque más ligero */
  }

  :global(.imdb-badge) {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  @media (max-width: 600px) {
    :global(.card-movie-info) {
      flex-direction: column;
    }
    :global(.movie-poster) {
      width: 100%;
      height: 250px;
      border-right: none;
      border-bottom: 1px solid var(--line-divider);
    }
  }

  :global(.markdown-content .bdm-sidebar) {
    border-left: 2px solid var(--primary) !important;
    background: var(--btn-regular-bg) !important;
    font-size: 0.9rem !important;
  }

  :global(.markdown-content .bdm-narrador) {
    border: none !important;
    background: transparent !important;
    padding: 0 !important;
    margin: 2.5rem 0 2.5rem 2.5rem !important;
    font-style: italic !important;
    opacity: 1 !important;
    width: auto !important;
    display: block !important;
    border-left: none !important;
    color: var(--text-primary) !important;
  }

  :global(.font-adventures .bdm-narrador) {
    margin: 2.5rem 4rem !important;
    text-align: justify;
  }

  :global(.markdown-content .bdm-narrador::before),
  :global(.markdown-content .bdm-narrador::after),
  :global(.markdown-content .bdm-narrador .bdm-title) {
    content: none !important;
    display: none !important;
  }

  /* Corrección de colores en modo oscuro del editor */
  :global(.dark .markdown-content) {
    color: oklch(0.85 0.01 var(--hue)) !important;
  }
  :global(.dark .markdown-content :is(h1, h2, h3, h4, h5, h6, strong, b)) {
    color: oklch(0.98 0.01 var(--hue)) !important;
  }

  :global(.markdown-content .admonition p) {
    margin: 0.5rem 0;
    white-space: normal !important;
    overflow: visible !important;
  }

  :global(.markdown-content .bdm-title) {
    font-weight: 850;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: inherit;
  }

  :global(.card-movie-link) {
    text-decoration: none !important;
    color: inherit !important;
  }

  :global(.card-movie-link:hover .movie-poster) {
    transform: scale(1.05);
    border-color: var(--primary);
  }

  :global(.card-movie-link:hover .movie-details) {
    filter: brightness(1.2);
  }

  :global(.card-movie-info) {
    display: flex;
    gap: 1.5rem;
    background: rgba(var(--card-bg-rgb, 255, 255, 255), 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid var(--line-divider);
    border-radius: 1.5rem;
    padding: 1.5rem;
    margin: 2.5rem 0;
    overflow: hidden;
    position: relative;
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.25);
  }

  :global(.movie-poster) {
    width: 150px;
    height: 220px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-color: var(--card-bg); /* Fondo de reserva */
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Icono cuando no hay imagen */
  :global(.movie-poster:empty::before) {
    content: "🎬";
    font-size: 2.5rem;
    opacity: 0.3;
  }

  :global(.movie-poster-overlay) {
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, transparent, rgba(0,0,0,0.1));
  }

  :global(.movie-details) {
    flex: 1;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5rem;
  }

  :global(.movie-title-row) {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  :global(.movie-card-title) {
    margin: 0 !important;
    font-size: 1.6rem !important;
    font-weight: 950 !important;
    color: var(--text-primary) !important;
    line-height: 1.1 !important;
    letter-spacing: -0.02em !important;
  }

  :global(.movie-age-badge) {
    background: var(--primary);
    color: var(--text-on-primary);
    padding: 0.25rem 0.6rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 850;
    white-space: nowrap;
  }

  :global(.movie-rec-age-badge) {
    background: #fbbf24;
    color: #000;
    padding: 0.25rem 0.6rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 850;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  :global(.movie-badges-col) {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    align-items: flex-end;
  }

  :global(.movie-original-title) {
    font-size: 0.9rem;
    opacity: 0.5;
    font-weight: 600;
    font-style: italic;
  }

  :global(.imdb-badge) {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.7rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  :global(.movie-footer-row) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 0.8rem;
  }

  :global(.imdb-view-link) {
    font-size: 0.75rem !important;
    color: var(--primary) !important;
    font-weight: 700 !important;
    text-decoration: none !important;
    text-transform: none !important;
    letter-spacing: normal !important;
    opacity: 0.8;
    transition: all 0.2s ease;
  }

  :global(.imdb-view-link:hover) {
    opacity: 1;
    text-decoration: underline !important;
    transform: translateX(2px);
  }

  :global(.imdb-logo) {
    background: #f5c518;
    color: #000;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    font-weight: 950;
  }

  :global(.imdb-badge-link) {
    text-decoration: none !important;
    color: inherit !important;
    transition: opacity 0.2s ease;
  }

  :global(.imdb-badge-link:hover) {
    opacity: 0.8;
  }

  :global(.imdb-view-link) {
    font-size: 0.65rem;
    color: var(--primary);
    font-weight: 700;
    margin-left: 0.2rem;
  }

  :global(.movie-web-link) {
    font-size: 0.7rem;
    color: var(--primary);
    opacity: 0.7;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  :global(.movie-web-link:hover) {
    opacity: 1;
    text-decoration: underline;
  }

  .cms-config-editor {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
    display: flex;
    justify-content: center;
    background: var(--page-bg);
  }

  .cms-config-container {
    width: 100%;
    max-width: 900px;
    padding: 3rem;
    height: fit-content;
    margin-bottom: 5rem;
  }

  .cms-config-container h2 {
    margin-bottom: 2rem;
    font-size: 1.75rem;
    font-weight: 800;
  }

  .cms-fields-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .cms-split-view {
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex: 1;
    width: 100%;
    height: 100%;
    background: var(--page-bg);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 0.75rem;
    gap: 0;
  }

  .cms-split-view.mode-write {
    grid-template-columns: 1fr;
  }
  .cms-split-view.mode-write :global(.cms-editor-preview-wrapper) {
    display: none;
  }
  .cms-split-view.mode-write :global(.cms-editor-card) {
    border-radius: 1.5rem;
    border-right: 1px solid var(--line-divider);
  }

  .cms-split-view.mode-preview {
    grid-template-columns: 1fr;
  }
  .cms-split-view.mode-preview :global(.cms-editor-card) {
    display: none;
  }
  .cms-split-view.mode-preview :global(.cms-editor-preview-wrapper) {
    display: flex; /* Asegura que se vea */
    border-radius: 1.5rem;
    border-left: 1px solid var(--line-divider);
  }

  .cms-split-view.with-sidebar {
    margin-right: 320px;
  }

  @media (max-width: 1100px) {
    .cms-split-view {
      grid-template-columns: 1fr;
      gap: 1rem; /* Margen entre bloques cuando se separan */
    }
    .cms-split-view :global(.cms-editor-card) {
      border-radius: 1.5rem;
      border-right: 1px solid var(--line-divider);
    }
    .cms-split-view :global(.cms-editor-preview-wrapper) {
      border-radius: 1.5rem;
      border-left: 1px solid var(--line-divider);
    }
    .cms-split-view.with-sidebar {
      margin-right: 0;
    }
  }

  /* Modales Estilos Globales */
  .cms-gallery-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cms-gallery-modal-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .cms-modal-content {
    position: relative;
    width: 90%;
    max-width: 1000px;
    pointer-events: auto;
  }

  .close-gallery-btn {
    position: absolute;
    top: 1.5rem;
    right: 2.5rem;
    z-index: 10000;
    background: var(--btn-regular-bg);
    border: none;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-primary);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
</style>
