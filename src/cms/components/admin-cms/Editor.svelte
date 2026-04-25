<script>
  import { onMount, tick } from "svelte";
  import { cmsFetch as ghFetch } from "./utils/api";
  import { parsePost, stringifyPost } from "./utils/parser";
  import { slugify } from "./utils/formatter";
  let validationErrors = $derived.by(() => {
    const errors = [];
    
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

           const val = formData[f.name];
           if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
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
  let imageInput = $state("");
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
          if (fm.image) imageInput = fm.image;
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
        image: imageInput,
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
        icon: iconInput
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
      if (draft.content !== contentInput || draft.title !== titleInput) {
        if (confirm("Se ha encontrado un borrador local sin guardar. ¿Deseas recuperarlo?")) {
          titleInput = draft.title || "";
          contentInput = draft.content || "";
          if (draft.fm) {
            categoryInput = draft.fm.category || "";
            publishedInput = draft.fm.published || "";
            tagsInput = draft.fm.tags || "";
            descriptionInput = draft.fm.description || "";
            imageInput = draft.fm.image || "";
            slugInput = draft.fm.slug || "";
            authorInput = draft.fm.author || "";
            langInput = draft.fm.lang || "";
            draftInput = !!draft.fm.draft;
            pinnedInput = !!draft.fm.pinned;
            commentInput = draft.fm.comment !== undefined ? draft.fm.comment : true;
            inNavbarInput = !!draft.fm.inNavbar;
            iconInput = draft.fm.icon || "";
          }
        }
      }
    } catch (e) { console.error(e); }
  }

  function clearLocalDraft() { localStorage.removeItem(DRAFT_KEY); }

  $effect(() => { if (contentInput || titleInput) saveLocalDraft(); });

  $effect(() => {
    if (post) {
      filenameInput = post.name || "nuevo-post.md";
      currentSha = post.sha || null;
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
      // CARGA AUTOMÁTICA DE LA GUÍA PARA NUEVOS POSTS
      contentInput = STYLE_GUIDE;
      titleInput = "Guía Completa de Estilos CMS";
      categoryInput = "Documentación";
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
        imageInput = formData.image || "";
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
      }
      
      filenameInput = post.name;
    } catch (err) { console.error(err); } finally { isLoading = false; }
  }

  function updatePreview() {
    if (!window.marked || contentInput === undefined) return;
    
    // Pre-procesar Admonitions estilo Obsidian (> [!INFO])
    let processedMD = contentInput.replace(
      /^>\s*\[!(NOTE|INFO|TODO|TIP|IMPORTANT|WARNING|CAUTION|FAILURE|DANGER|BUG|EXAMPLE|QUOTE)\]\s*(.*)?\n((?:>\s*.*\n?)*)/gm,
      (match, type, title, content) => {
        const typeLower = type.toLowerCase();
        const cleanContent = content.replace(/^>\s?/gm, "");
        const displayTitle = title || type.charAt(0) + type.slice(1).toLowerCase();
        // Usar clases del tema: bdm-XXX
        return `<blockquote class="admonition bdm-${typeLower}">
          <div class="bdm-title">${displayTitle}</div>
          <div class="bdm-content">${cleanContent}</div>
        </blockquote>\n`;
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
      }
    };
    window.marked.use({ renderer });

    let rawHtml = window.marked.parse(processedMD);
    
    // Mantener compatibilidad con ::: si existiera
    // Sincronizar Avisos (Admonitions) con el blog real
    renderedHTML = rawHtml.replace(
      /:::(note|warning|tip|important|caution|info)\n?([\s\S]*?)\n?:::/g,
      (match, type, content) => {
        return `<blockquote class="admonition bdm-${type}">
          <span class="bdm-title">${type.toUpperCase()}</span>
          <div class="admonition-content">${content}</div>
        </blockquote>`;
      }
    );
    
    setTimeout(buildScrollMap, 100);
  }

  $effect(() => { if (contentInput !== undefined) updatePreview(); });

  async function handleSave() {
    if (validationErrors.length > 0) {
      alert("No se puede guardar:\n\n" + validationErrors.map(e => "- " + e.message).join("\n"));
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
      if (imageInput) finalFM.image = imageInput.trim();
      if (slugInput) finalFM.slug = slugInput.trim();
      if (authorInput) finalFM.author = authorInput.trim();
      if (langInput) finalFM.lang = langInput.trim();
      if (updatedInput) finalFM.updated = updatedInput;
      if (licenseNameInput) finalFM.licenseName = licenseNameInput.trim();
      if (licenseUrlInput) finalFM.licenseUrl = licenseUrlInput.trim();
      if (sourceLinkInput) finalFM.sourceLink = sourceLinkInput.trim();
      if (iconInput) finalFM.icon = iconInput.trim();
      
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
      await ghFetch(`contents/${targetPath}`, githubToken, {
        method: "PUT",
        body: JSON.stringify({
          message: `CMS: Save ${titleInput}`,
          content: btoa(unescape(encodeURIComponent(finalContent))),
          sha: currentSha || undefined,
        }),
      });
      alert("Guardado con éxito");
      clearLocalDraft();
      onPostSaved();
    } catch (err) { alert(err.message); } finally { isSaving = false; }
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
      tick().then(() => { if (el) { el.focus(); el.setSelectionRange(start + snip.length, start + snip.length); } });
    } catch (err) { alert("Error: " + err.message); } finally { isUploading = false; if (event.target) event.target.value = ''; }
  }

  function handleToolbar(type) {
    const el = textarea;
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
          case "mermaid-flow": snip = `\n\`\`\`mermaid\ngraph TD\n    A[Inicio] --> B(Proceso)\n    B --> C{Decision}\n    C -->|Si| D[Fin]\n    C -->|No| B\n\`\`\`\n`; break;
          case "mermaid-seq": snip = `\n\`\`\`mermaid\nsequenceDiagram\n    Participante A->>Participante B: Mensaje\n    Participante B-->>Participante A: Respuesta\n\`\`\`\n`; break;
          case "mermaid-gantt": snip = `\n\`\`\`mermaid\ngantt\n    title Proyecto\n    section Fase 1\n    Tarea :a1, 2024-01-01, 30d\n\`\`\`\n`; break;
          case "music": snip = `\n:::music{title="Título", artist="Artista", cover="/assets/images/default.jpg", audio="/assets/music/song.mp3", lrc=""}\n`; break;
          case "video": snip = `\n<iframe width="100%" height="468" src="URL_EMBED" frameborder="0" allowfullscreen></iframe>\n`; break;
          case "math": snip = `\n$$\n${selText || "e = mc^2"}\n$$\n`; break;
          case "spoiler": snip = `\n<details>\n<summary>Leer más...</summary>\n${selText || "Contenido oculto..."}\n</details>\n`; break;
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

  let textarea = $state(null);
  let previewEl = $state(null);
  let isSyncingTarget = false;
  let scrollMap = [];
  async function buildScrollMap() {
    if (!textarea || !previewEl) return;
    await tick();
    const headers = previewEl.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const newMap = [{ editor: 0, preview: 0 }];
    const lines = contentInput.split("\n");
    const textareaHeight = textarea.scrollHeight;
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
    const target = source === textarea ? previewEl : textarea;
    if (!target || scrollMap.length < 2) return;
    const scrollPos = source.scrollTop;
    if (scrollPos <= 5) { target.scrollTop = 0; return; }
    for (let i = 0; i < scrollMap.length - 1; i++) {
      const start = source === textarea ? scrollMap[i].editor : scrollMap[i].preview;
      const end = source === textarea ? scrollMap[i+1].editor : scrollMap[i+1].preview;
      if (scrollPos >= start && scrollPos <= end) {
        const ratio = (scrollPos - start) / (end - start);
        const targetStart = source === textarea ? scrollMap[i].preview : scrollMap[i].editor;
        const targetEnd = source === textarea ? scrollMap[i+1].preview : scrollMap[i+1].editor;
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
          bind:textarea={textarea}
          viewMode={viewMode}
          onToolbar={handleToolbar}
          onImageUpload={handleImageUpload}
          onScroll={syncScroll}
          onSave={handleSave}
          onToggleSettings={() => showSettings = !showSettings}
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
        bind:image={imageInput}
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
      />
    {/if}
  </main>
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
  }

  .cms-split-view.with-sidebar {
    margin-right: 320px;
  }

  @media (max-width: 1100px) {
    .cms-split-view {
      grid-template-columns: 1fr;
    }
    .cms-split-view.with-sidebar {
      margin-right: 0;
    }
  }
</style>
