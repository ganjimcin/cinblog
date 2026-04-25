<script>
  import Icon from "../../common/Icon.svelte";
  import { fade } from "svelte/transition";
  import ShortcutsModal from "./ShortcutsModal.svelte";
  
  let { 
    content = $bindable(), 
    title = $bindable(),
    textarea = $bindable(), 
    viewMode = "dual",
    onToolbar, 
    onImageUpload,
    onScroll,
    onSave,
    onToggleSettings,
    githubToken,
    isMock,
    cmsConfig,
    isUploading = false,
    lastSaved = null
  } = $props();
  
  let isDragging = $state(false);

  import ImageSelector from "./ImageSelector.svelte";


  let imageInput;
  let showGalleryModal = $state(false);
  let showShortcuts = $state(false);
  let tempImageSelection = $state("");

  function handleImageSelected(url) {
    if (!url) return;
    const el = textarea;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const snip = `\n![Imagen](${url})\n`;
    content = content.substring(0, start) + snip + content.substring(end);
    
    // Pequeño delay para asegurar que el DOM se actualice antes de dar el foco
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snip.length, start + snip.length);
    }, 10);
    
    showGalleryModal = false;
    tempImageSelection = "";
  }


  let wordCount = $derived(content.trim() ? content.trim().split(/\s+/).length : 0);
  let readingTime = $derived(Math.ceil(wordCount / 200) || 1);

  function handleDrop(event) {
    event.preventDefault();
    isDragging = false;
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onImageUpload({ target: { files: [file] } });
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event) {
    event.preventDefault();
    isDragging = false;
  }

  async function handlePaste(event) {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        event.preventDefault();
        const file = item.getAsFile();
        onImageUpload({ target: { files: [file] } });
      }
    }
  }

  function handleKeyDown(event) {
    const isMod = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    
    if (isMod) {
      if (event.key >= '1' && event.key <= '6') {
        event.preventDefault();
        onToolbar(`h${event.key}`);
        return;
      }

      switch (event.key.toLowerCase()) {
        case 's': event.preventDefault(); if (onSave) onSave(); break;
        case 'b': event.preventDefault(); onToolbar("bold"); break;
        case 'i': event.preventDefault(); onToolbar("italic"); break;
        case 'k': event.preventDefault(); onToolbar("link"); break;
        case 'e': event.preventDefault(); onToolbar("code-inline"); break;
        case 'x': 
          if (isShift) {
            event.preventDefault();
            onToolbar("strike");
          }
          break;
        case 'z': 
          if (isShift && onToggleSettings) {
            event.preventDefault();
            onToggleSettings();
          }
          break;
      }
    } else {
      if (event.key === '?') {
        event.preventDefault();
        showShortcuts = true;
      }
    }
  }

  function clearFormat() {
    const el = textarea;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = content.substring(start, end);
    if (!sel) return;

    const cleaned = sel
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/^#+\s+/gm, '')
      .replace(/^>\s+/gm, '')
      .replace(/`{1,3}(.*?)\1/g, '$1');

    content = content.substring(0, start) + cleaned + content.substring(end);
  }
</script>

<div class="cms-editor-card" class:zen-mode={viewMode === 'write'}>
  <div class="cms-editor-toolbar-sticky">
    <div class="cms-toolbar-rows">
      <!-- Fila 1: Formato básico y Estructura -->
      <div class="cms-editor-toolbar">
         <div class="cms-toolbar-group">
           <button type="button" onclick={() => onToolbar("h1")} data-tooltip="Título 1"><Icon icon="material-symbols:format-h1-rounded" /></button>
           <button type="button" onclick={() => onToolbar("h2")} data-tooltip="Título 2"><Icon icon="material-symbols:format-h2-rounded" /></button>
           <button type="button" onclick={() => onToolbar("h3")} data-tooltip="Título 3"><Icon icon="material-symbols:format-h3-rounded" /></button>
         </div>
         <div class="cms-toolbar-divider"></div>
         <div class="cms-toolbar-group">
           <button type="button" onclick={() => onToolbar("bold")} data-tooltip="Negrita (Ctrl+B)"><Icon icon="material-symbols:format-bold-rounded" /></button>
           <button type="button" onclick={() => onToolbar("italic")} data-tooltip="Cursiva (Ctrl+I)"><Icon icon="material-symbols:format-italic-rounded" /></button>
           <button type="button" onclick={() => onToolbar("strike")} data-tooltip="Tachado (Ctrl+Shift+X)"><Icon icon="material-symbols:strikethrough-s-rounded" /></button>
         </div>
         <div class="cms-toolbar-divider"></div>
         <div class="cms-toolbar-group">
           <button type="button" onclick={() => onToolbar("list-ul")} data-tooltip="Lista"><Icon icon="material-symbols:format-list-bulleted-rounded" /></button>
           <button type="button" onclick={() => onToolbar("list-ol")} data-tooltip="Lista numerada"><Icon icon="material-symbols:format-list-numbered-rounded" /></button>
           <button type="button" onclick={() => onToolbar("task")} data-tooltip="Tareas"><Icon icon="material-symbols:check-circle" /></button>
           <button type="button" onclick={() => onToolbar("table")} data-tooltip="Tabla"><Icon icon="material-symbols:grid-view-rounded" /></button>
         </div>
         <div class="cms-toolbar-divider"></div>
         <div class="cms-toolbar-group">
           <button type="button" onclick={() => onToolbar("link")} data-tooltip="Enlace (Ctrl+K)"><Icon icon="material-symbols:link-rounded" /></button>
           <button type="button" onclick={() => showGalleryModal = true} data-tooltip="Galería de Imágenes"><Icon icon="material-symbols:image-search-outline" /></button>
           <button type="button" onclick={() => imageInput.click()} data-tooltip="Subir Archivo"><Icon icon="material-symbols:upload-file-outline-rounded" /></button>
           <button type="button" onclick={() => onToolbar("hr")} data-tooltip="Separador"><Icon icon="material-symbols:horizontal-rule-rounded" /></button>
         </div>
         <div class="cms-toolbar-divider"></div>
         <div class="cms-toolbar-group">
            <button type="button" onclick={clearFormat} data-tooltip="Limpiar Formato"><Icon icon="material-symbols:format-clear-rounded" /></button>
            <button type="button" onclick={() => showShortcuts = true} data-tooltip="Ayuda (Atajos)"><Icon icon="material-symbols:help-outline-rounded" /></button>
         </div>

         <input type="file" bind:this={imageInput} onchange={onImageUpload} style="display: none;" accept="image/*" />
          
          {#if showGalleryModal}
            <div class="cms-gallery-modal-wrapper">
              <div class="cms-modal-content">
                <ImageSelector 
                  bind:value={tempImageSelection}
                  {githubToken}
                  {isMock}
                  {cmsConfig}
                  onSelect={handleImageSelected}
                />
                <button class="close-gallery-btn" onclick={() => showGalleryModal = false}>
                  <Icon icon="material-symbols:close-rounded" />
                </button>
              </div>
            </div>
          {/if}

      </div>

      <!-- Fila 2: Componentes Avanzados y Widgets -->
      <div class="cms-editor-toolbar second-row">
        <div class="cms-toolbar-group">
          <button type="button" onclick={() => onToolbar("note")} data-tooltip="Nota Informativa" class="tool-note"><Icon icon="material-symbols:info-outline-rounded" /></button>
          <button type="button" onclick={() => onToolbar("tip")} data-tooltip="Tip / Consejo" class="tool-tip"><Icon icon="material-symbols:lightbulb-outline-rounded" /></button>
          <button type="button" onclick={() => onToolbar("warning")} data-tooltip="Aviso / Alerta" class="tool-warning"><Icon icon="material-symbols:warning-amber-rounded" /></button>
          <button type="button" onclick={() => onToolbar("important")} data-tooltip="Importante" class="tool-important"><Icon icon="material-symbols:error-outline-rounded" /></button>
        </div>
        <div class="cms-toolbar-divider"></div>
        <div class="cms-toolbar-group">
          <button type="button" onclick={() => onToolbar("mermaid-flow")} data-tooltip="Diagrama de Flujo"><Icon icon="material-symbols:bar-chart-4-bars-rounded" /></button>
          <button type="button" onclick={() => onToolbar("mermaid-seq")} data-tooltip="Diagrama de Secuencia"><Icon icon="material-symbols:timeline" /></button>
          <button type="button" onclick={() => onToolbar("mermaid-gantt")} data-tooltip="Diagrama de Gantt"><Icon icon="material-symbols:calendar-month-outline-rounded" /></button>
        </div>
        <div class="cms-toolbar-divider"></div>
        <div class="cms-toolbar-group">
          <button type="button" onclick={() => onToolbar("music")} data-tooltip="Tarjeta de Música"><Icon icon="material-symbols:music-note-rounded" /></button>
          <button type="button" onclick={() => onToolbar("video")} data-tooltip="Video / iFrame"><Icon icon="material-symbols:video-library-rounded" /></button>
        </div>
        <div class="cms-toolbar-divider"></div>
        <div class="cms-toolbar-group">
          <button type="button" onclick={() => onToolbar("code")} data-tooltip="Bloque de Código"><Icon icon="material-symbols:terminal-rounded" /></button>
          <button type="button" onclick={() => onToolbar("math")} data-tooltip="Ecuación Matemática"><Icon icon="material-symbols:functions-rounded" /></button>
          <button type="button" onclick={() => onToolbar("spoiler")} data-tooltip="Spoiler / Detalles"><Icon icon="material-symbols:visibility-off-outline-rounded" /></button>
        </div>
      </div>
    </div>
  </div>

  <div class="cms-writing-area">
    <div class="cms-writing-scroll-container">
      <div class="cms-writing-content-wrapper">
        <input 
          type="text" 
          bind:value={title} 
          class="cms-main-title-input" 
          placeholder="Título del post..." 
          onkeydown={handleKeyDown}
        />
        <textarea 
          id="post-content" 
          bind:this={textarea}
          bind:value={content} 
          onscroll={onScroll}
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          ondrop={handleDrop}
          onpaste={handlePaste}
          onkeydown={handleKeyDown}
          class="cms-writing-textarea" 
          placeholder="Comienza a escribir tu historia..."
        ></textarea>

        {#if isDragging}
          <div class="cms-drag-overlay" in:fade={{duration: 200}}>
            <div class="cms-drag-box">
              <Icon icon="material-symbols:add-a-photo-outline-rounded" />
              <p>Suelta para subir imagen</p>
            </div>
          </div>
        {/if}

        {#if isUploading}
           <div class="cms-upload-overlay" in:fade={{duration: 200}}>
             <Icon icon="svg-spinners:ring-resize" />
             <p>Subiendo archivo...</p>
           </div>
        {/if}
      </div>
    </div>
    
    {#if showShortcuts}
      <ShortcutsModal onOpenChange={(val) => showShortcuts = val} />
    {/if}

    <div class="cms-editor-status">
      <div class="cms-status-left">
        <span>{wordCount} palabras</span>
        <span class="status-divider"></span>
        <span>Lectura: ~{readingTime} min</span>
      </div>
      <div class="cms-status-right">
        {#if lastSaved}
          <span class="autosave-tag">
            <Icon icon="material-symbols:cloud-done-outline" />
            Borrador local: {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
          <span class="status-divider"></span>
        {/if}
        {content.length} caracteres
      </div>
    </div>
  </div>
</div>

<style>
  .cms-editor-card {    background: var(--card-bg);
    display: flex;
    flex-direction: column;
    height: 100%;
    margin: 0;
    border: 1px solid var(--line-divider);
    border-right: none;
    border-radius: 1.5rem 0 0 1.5rem;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  }

  .zen-mode { 
    margin: 0 auto;
    max-width: 900px;
    width: 100%;
    height: 100%;
    border-radius: 1.5rem;
    border-right: 1px solid var(--line-divider);
    box-shadow: 0 20px 50px rgba(0,0,0,0.05);
  }

  .zen-mode .cms-writing-textarea {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-weight: 450;
    font-size: 1.25rem;
    letter-spacing: -0.01em;
    max-width: 700px;
    margin: 0 auto;
    line-height: 1.8;
  }

  .cms-writing-scroll-container {
    flex: 1;
    overflow-y: auto;
    background: var(--card-bg);
    user-select: text !important;
    -webkit-user-select: text !important;
    pointer-events: auto !important;
  }

  .cms-writing-content-wrapper {
    max-width: 800px;
    margin: 0 auto;
    padding: 4rem 2rem;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    user-select: text !important;
    -webkit-user-select: text !important;
    pointer-events: auto !important;
  }

  .cms-main-title-input {
    background: transparent;
    border: none;
    outline: none;
    font-size: 3rem;
    font-weight: 900;
    color: var(--text-primary);
    margin-bottom: 2rem;
    width: 100%;
    letter-spacing: -0.04em;
    line-height: 1.2;
    user-select: text !important;
    -webkit-user-select: text !important;
    pointer-events: auto !important;
  }

  .cms-main-title-input::placeholder { opacity: 0.1; }

  .cms-editor-toolbar-sticky {
    background: var(--btn-regular-bg);
    border-bottom: 1px solid var(--line-divider);
    padding: 0.5rem 1rem;
    min-height: 7rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    z-index: 100;
  }

  .cms-toolbar-rows {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .cms-writing-area {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
    position: relative;
    z-index: 10;
    user-select: text !important;
    -webkit-user-select: text !important;
    pointer-events: auto !important;
  }

  .cms-writing-textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    color: var(--text-primary);
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.15rem;
    line-height: 1.8;
    width: 100%;
    padding: 0;
    min-height: 500px;
    user-select: text !important;
    -webkit-user-select: text !important;
    pointer-events: auto !important;
  }

  .cms-editor-status {
    background: var(--card-bg);
    padding: 0.75rem 2rem;
    font-size: 0.75rem;
    font-weight: 800;
    opacity: 0.6;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid var(--line-divider);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .cms-status-left {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .status-divider {
    width: 4px;
    height: 4px;
    background: var(--line-divider);
    border-radius: 50%;
  }

  .cms-status-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .autosave-tag {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--primary);
    opacity: 0.8;
  }

  .autosave-tag :global(svg) {
    font-size: 1rem;
  }

  .cms-editor-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    /* Reseteo estilos de cms.css para integración total */
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    padding: 0 !important;
  }

  .cms-toolbar-group {
    display: flex;
    gap: 0.35rem;
  }

  .cms-editor-toolbar button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.15rem;
    height: 2.15rem;
    border: none;
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-primary);
    cursor: pointer;
    border-radius: 0.6rem;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 1.1rem;
    font-weight: 700;
    border: 1px solid transparent;
    pointer-events: auto;
    position: relative;
    z-index: 2;
  }

  .cms-editor-toolbar button:hover {
    background: var(--card-bg);
    color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-color: var(--line-divider);
  }

  .tool-warning:hover { color: #f59e0b !important; }
  .tool-tip:hover { color: #10b981 !important; }
  .tool-note:hover { color: #3b82f6 !important; }
  .tool-important:hover { color: #ef4444 !important; }

  .cms-toolbar-divider {
    width: 1px;
    height: 1.25rem;
    background: var(--line-divider);
    margin: 0 0.25rem;
  }

  .cms-gallery-modal-wrapper {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
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
    z-index: 2100;
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

  /* Overlay Styles */
  .cms-drag-overlay, .cms-upload-overlay {
    position: absolute;
    inset: 0;
    background: var(--bg-glass);
    backdrop-filter: blur(8px);
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 1rem;
    color: var(--primary);
    gap: 1rem;
  }

  .cms-drag-overlay {
    border: 3px dashed var(--primary);
    background: oklch(from var(--primary) l c h / 0.05);
  }

  .cms-drag-box {
    text-align: center;
    animation: pulse 2s infinite;
  }

  .cms-drag-box :global(svg) {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .cms-drag-box p {
    font-size: 1.25rem;
    font-weight: 800;
  }

  .cms-upload-overlay :global(svg) {
    font-size: 3rem;
  }

  .cms-upload-overlay p {
     font-weight: 700;
     opacity: 0.8;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  /* Tooltip Premium Styles */
  [data-tooltip] {
    position: relative;
  }

  [data-tooltip]::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    background: var(--bg-glass);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--line-divider);
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 1000;
    pointer-events: none;
  }

  [data-tooltip]:hover::after {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }
</style>
