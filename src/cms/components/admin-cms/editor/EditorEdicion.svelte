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
    onOpenGallery,
    onOpenShortcuts,
    githubToken,
    isMock,
    cmsConfig,
    isUploading = false,
    lastSaved = null
  } = $props();
  
  let isDragging = $state(false);
  let showHeadingMenu = $state(false);
  let showDiagramMenu = $state(false);
  let showCalloutMenu = $state(false);

  import ImageSelector from "./ImageSelector.svelte";


  let imageInput;

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
        if (onOpenShortcuts) onOpenShortcuts();
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

  function handleOutsideClick(event) {
    if (!event.target.closest('.cms-dropdown-container')) {
      showHeadingMenu = false;
      showDiagramMenu = false;
      showCalloutMenu = false;
    }
  }
</script>

<svelte:window onclick={handleOutsideClick} />

<div class="cms-editor-card" class:zen-mode={viewMode === 'write'}>
  <div class="cms-editor-toolbar-sticky">
    <div class="cms-toolbar-rows">
      <!-- Fila 1: Formato básico y Estructura -->
      <div class="cms-editor-toolbar">
         <div class="cms-toolbar-group cms-dropdown-container">
           <button type="button" class="cms-dropdown-trigger" onclick={(e) => { e.stopPropagation(); showHeadingMenu = !showHeadingMenu; }} data-tooltip="Encabezados (H1-H6)">
             <Icon icon="material-symbols:title-rounded" />
             <Icon icon="material-symbols:arrow-drop-down-rounded" class="dropdown-arrow" />
           </button>
           {#if showHeadingMenu}
             <div class="cms-dropdown-menu" in:fade={{duration: 100}}>
               <button type="button" onclick={() => { onToolbar("h1"); showHeadingMenu = false; }}><Icon icon="material-symbols:format-h1-rounded" /> <span>Título 1</span></button>
               <button type="button" onclick={() => { onToolbar("h2"); showHeadingMenu = false; }}><Icon icon="material-symbols:format-h2-rounded" /> <span>Título 2</span></button>
               <button type="button" onclick={() => { onToolbar("h3"); showHeadingMenu = false; }}><Icon icon="material-symbols:format-h3-rounded" /> <span>Título 3</span></button>
             </div>
           {/if}
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
           <button type="button" onclick={onOpenGallery} data-tooltip="Galería de Imágenes"><Icon icon="material-symbols:image-search-outline" /></button>
           <button type="button" onclick={() => imageInput.click()} data-tooltip="Subir Archivo"><Icon icon="material-symbols:upload-file-outline-rounded" /></button>
           <button type="button" onclick={() => onToolbar("hr")} data-tooltip="Separador"><Icon icon="material-symbols:horizontal-rule-rounded" /></button>
         </div>
         <div class="cms-toolbar-divider"></div>
         <div class="cms-toolbar-group">
            <button type="button" onclick={clearFormat} data-tooltip="Limpiar Formato"><Icon icon="material-symbols:format-clear-rounded" /></button>
            <button type="button" onclick={onOpenShortcuts} data-tooltip="Ayuda (Atajos)"><Icon icon="material-symbols:help-outline-rounded" /></button>
         </div>
      </div>

      <!-- Fila 2: Componentes Avanzados y Widgets -->
      <div class="cms-editor-toolbar second-row">
        <div class="cms-toolbar-group cms-dropdown-container">
          <button type="button" class="cms-dropdown-trigger" onclick={(e) => { e.stopPropagation(); showCalloutMenu = !showCalloutMenu; }} data-tooltip="Avisos (Admonitions)">
             <Icon icon="material-symbols:info-outline-rounded" />
             <Icon icon="material-symbols:arrow-drop-down-rounded" class="dropdown-arrow" />
          </button>
          {#if showCalloutMenu}
             <div class="cms-dropdown-menu" in:fade={{duration: 100}}>
               <button type="button" onclick={() => { onToolbar("note"); showCalloutMenu = false; }} class="tool-note"><Icon icon="material-symbols:info-outline-rounded" /> <span>Nota</span></button>
               <button type="button" onclick={() => { onToolbar("info"); showCalloutMenu = false; }} class="tool-note"><Icon icon="material-symbols:info-rounded" /> <span>Info</span></button>
               <button type="button" onclick={() => { onToolbar("tip"); showCalloutMenu = false; }} class="tool-tip"><Icon icon="material-symbols:lightbulb-outline-rounded" /> <span>Tip</span></button>
               <button type="button" onclick={() => { onToolbar("warning"); showCalloutMenu = false; }} class="tool-warning"><Icon icon="material-symbols:warning-amber-rounded" /> <span>Aviso</span></button>
               <button type="button" onclick={() => { onToolbar("caution"); showCalloutMenu = false; }} class="tool-warning"><Icon icon="material-symbols:error-rounded" /> <span>Caution</span></button>
               <button type="button" onclick={() => { onToolbar("important"); showCalloutMenu = false; }} class="tool-important"><Icon icon="material-symbols:error-outline-rounded" /> <span>Importante</span></button>
               <button type="button" onclick={() => { onToolbar("narrador"); showCalloutMenu = false; }} class="tool-narrador"><Icon icon="material-symbols:record-voice-over-outline-rounded" /> <span>Narrador</span></button>
               <button type="button" onclick={() => { onToolbar("sidebar"); showCalloutMenu = false; }} class="tool-sidebar"><Icon icon="material-symbols:side-navigation" /> <span>Sidebar</span></button>
               <button type="button" onclick={() => { onToolbar("spoiler"); showCalloutMenu = false; }} class="tool-spoiler"><Icon icon="material-symbols:visibility-off-outline-rounded" /> <span>Spoiler</span></button>
             </div>
          {/if}
        </div>
        <div class="cms-toolbar-divider"></div>
        <div class="cms-toolbar-group cms-dropdown-container">
          <button type="button" class="cms-dropdown-trigger" onclick={(e) => { e.stopPropagation(); showDiagramMenu = !showDiagramMenu; }} data-tooltip="Diagramas y Matemáticas">
             <Icon icon="material-symbols:account-tree-outline-rounded" />
             <Icon icon="material-symbols:arrow-drop-down-rounded" class="dropdown-arrow" />
          </button>
          {#if showDiagramMenu}
             <div class="cms-dropdown-menu" in:fade={{duration: 100}}>
               <button type="button" onclick={() => { onToolbar("mermaid-flow"); showDiagramMenu = false; }}><Icon icon="material-symbols:bar-chart-4-bars-rounded" /> <span>Flujo</span></button>
               <button type="button" onclick={() => { onToolbar("mermaid-seq"); showDiagramMenu = false; }}><Icon icon="material-symbols:timeline" /> <span>Secuencia</span></button>
               <button type="button" onclick={() => { onToolbar("mermaid-gantt"); showDiagramMenu = false; }}><Icon icon="material-symbols:calendar-month-outline-rounded" /> <span>Gantt</span></button>
               <button type="button" onclick={() => { onToolbar("math"); showDiagramMenu = false; }}><Icon icon="material-symbols:functions-rounded" /> <span>Ecuación</span></button>
             </div>
          {/if}
        </div>
        <div class="cms-toolbar-divider"></div>
        <div class="cms-toolbar-group">
          <button type="button" onclick={() => onToolbar("music")} data-tooltip="Tarjeta de Música"><Icon icon="material-symbols:music-note-rounded" /></button>
          <button type="button" onclick={() => onToolbar("video")} data-tooltip="Video / iFrame"><Icon icon="material-symbols:video-library-rounded" /></button>
        </div>
        <div class="cms-toolbar-divider"></div>
        <div class="cms-toolbar-group">
          <button type="button" onclick={() => onToolbar("code")} data-tooltip="Bloque de Código"><Icon icon="material-symbols:terminal-rounded" /></button>
          <button type="button" onclick={() => onToolbar("spoiler")} data-tooltip="Spoiler / Detalles"><Icon icon="material-symbols:visibility-off-outline-rounded" /></button>
        </div>
      </div>
    </div>
    <input type="file" bind:this={imageInput} onchange={onImageUpload} style="display: none;" accept="image/*" />
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
  .cms-editor-card {
    background: var(--card-bg);
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
    height: 5.25rem;
    display: flex;
    align-items: center;
    position: relative;
    z-index: 900;
  }

  .cms-toolbar-rows {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
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
    color: var(--text-secondary);
    display: flex;
    justify-content: space-between;
    border-top: 1px solid var(--line-divider);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    position: relative;
    z-index: 5;
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
    font-weight: 900;
  }

  .autosave-tag :global(svg) {
    font-size: 1rem;
  }

  .cms-editor-toolbar {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    flex-wrap: wrap !important;
    overflow: visible !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    padding: 0 !important;
  }

  .cms-editor-toolbar::-webkit-scrollbar {
    display: none;
  }

  .cms-toolbar-group {
    display: flex;
    gap: 0.2rem;
    position: relative;
  }

  .cms-editor-toolbar button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border: none;
    background: var(--card-bg);
    color: var(--text-primary);
    cursor: pointer;
    border-radius: 0.4rem;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 1.05rem;
    font-weight: 900;
    border: 1.2px solid var(--line-divider);
    pointer-events: auto;
    position: relative;
    z-index: 5;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  .cms-editor-toolbar button:hover {
    background: var(--btn-regular-bg);
    color: var(--primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    border-color: var(--primary);
    z-index: 30;
  }

  .cms-editor-toolbar button :global(svg) {
    stroke-width: 2;
  }

  .tool-warning:hover { color: var(--admonitions-color-warning, #f59e0b) !important; }
  .tool-tip:hover { color: var(--admonitions-color-tip, #10b981) !important; }
  .tool-note:hover { color: var(--admonitions-color-note, var(--primary)) !important; }
  .tool-important:hover { color: var(--admonitions-color-important, #ef4444) !important; }
  .tool-narrador:hover { color: var(--primary) !important; }
  .tool-sidebar:hover { color: var(--primary) !important; }
  .tool-spoiler:hover { color: #6b7280 !important; }

  .cms-toolbar-divider {
    width: 1px;
    height: 1.15rem;
    background: var(--line-divider);
    margin: 0 0.15rem;
  }

  /* Dropdown Styles */
  .cms-dropdown-trigger {
    width: 3.25rem !important;
    gap: 0 !important;
  }
  
  .cms-dropdown-container {
    position: relative;
  }
  
  .cms-dropdown-container:hover {
    z-index: 20;
  }
  
  .cms-dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-glass);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--line-divider);
    border-radius: 0.75rem;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    z-index: 1000;
  }

  .cms-dropdown-menu::before {
    content: '';
    position: absolute;
    top: -15px;
    left: -20px;
    right: -20px;
    height: 25px;
    background: transparent;
  }
  
  .cms-dropdown-menu button {
    width: 100% !important;
    height: auto !important;
    padding: 0.5rem 1rem !important;
    display: flex !important;
    justify-content: flex-start !important;
    align-items: center !important;
    gap: 0.75rem !important;
    font-size: 0.85rem !important;
    font-weight: 700 !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  
  .cms-dropdown-menu button:hover {
    background: var(--btn-regular-bg) !important;
  }
  
  .cms-dropdown-menu button span {
    white-space: nowrap;
  }
  
  .dropdown-arrow {
    font-size: 1.1rem;
    opacity: 0.5;
    margin-left: -0.25rem;
  }

  .cms-gallery-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    z-index: 5000;
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
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(-10px);
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
