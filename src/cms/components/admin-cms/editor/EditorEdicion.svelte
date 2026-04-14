<script>
  import Icon from "../../common/Icon.svelte";
  
  let { 
    content = $bindable(), 
    title = $bindable(),
    textarea = $bindable(), 
    viewMode = "dual",
    onToolbar, 
    onImageUpload,
    onScroll,
    onSave,
    onToggleSettings
  } = $props();

  let imageInput;

  let wordCount = $derived(content.trim() ? content.trim().split(/\s+/).length : 0);
  let readingTime = $derived(Math.ceil(wordCount / 200) || 1);

  function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onImageUpload({ target: { files: [file] } });
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
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
           <button type="button" onclick={() => onToolbar("h1")} title="H1"><Icon icon="material-symbols:format-h1-rounded" /></button>
           <button type="button" onclick={() => onToolbar("h2")} title="H2"><Icon icon="material-symbols:format-h2-rounded" /></button>
           <button type="button" onclick={() => onToolbar("h3")} title="H3"><Icon icon="material-symbols:format-h3-rounded" /></button>
         </div>
         <div class="cms-toolbar-divider"></div>
         <div class="cms-toolbar-group">
           <button type="button" onclick={() => onToolbar("bold")} title="Negrita"><Icon icon="material-symbols:format-bold-rounded" /></button>
           <button type="button" onclick={() => onToolbar("italic")} title="Cursiva"><Icon icon="material-symbols:format-italic-rounded" /></button>
           <button type="button" onclick={() => onToolbar("strike")} title="Tachado"><Icon icon="material-symbols:strikethrough-s-rounded" /></button>
         </div>
         <div class="cms-toolbar-divider"></div>
         <div class="cms-toolbar-group">
           <button type="button" onclick={() => onToolbar("list-ul")} title="Lista"><Icon icon="material-symbols:format-list-bulleted-rounded" /></button>
           <button type="button" onclick={() => onToolbar("list-ol")} title="Lista numerada"><Icon icon="material-symbols:format-list-numbered-rounded" /></button>
           <button type="button" onclick={() => onToolbar("task")} title="Tareas"><Icon icon="material-symbols:check-circle" /></button>
           <button type="button" onclick={() => onToolbar("table")} title="Tabla"><Icon icon="material-symbols:grid-view-rounded" /></button>
         </div>
         <div class="cms-toolbar-divider"></div>
         <div class="cms-toolbar-group">
           <button type="button" onclick={() => onToolbar("link")} title="Enlace"><Icon icon="material-symbols:link-rounded" /></button>
           <button type="button" onclick={() => imageInput.click()} title="Imagen"><Icon icon="material-symbols:image-outline" /></button>
           <button type="button" onclick={() => onToolbar("hr")} title="Separador"><Icon icon="material-symbols:horizontal-rule-rounded" /></button>
         </div>
         <div class="cms-toolbar-divider"></div>
         <div class="cms-toolbar-group">
            <button type="button" onclick={clearFormat} title="Limpiar Formato"><Icon icon="material-symbols:format-clear-rounded" /></button>
         </div>

         <input type="file" bind:this={imageInput} onchange={onImageUpload} style="display: none;" accept="image/*" />
      </div>

      <!-- Fila 2: Componentes Avanzados y Widgets -->
      <div class="cms-editor-toolbar second-row">
        <div class="cms-toolbar-group">
          <button type="button" onclick={() => onToolbar("note")} title="Nota" class="tool-note"><Icon icon="material-symbols:info-outline-rounded" /></button>
          <button type="button" onclick={() => onToolbar("tip")} title="Tip" class="tool-tip"><Icon icon="material-symbols:lightbulb-outline-rounded" /></button>
          <button type="button" onclick={() => onToolbar("warning")} title="Aviso" class="tool-warning"><Icon icon="material-symbols:warning-amber-rounded" /></button>
          <button type="button" onclick={() => onToolbar("important")} title="Importante" class="tool-important"><Icon icon="material-symbols:error-outline-rounded" /></button>
        </div>
        <div class="cms-toolbar-divider"></div>
        <div class="cms-toolbar-group">
          <button type="button" onclick={() => onToolbar("mermaid-flow")} title="Flowchart"><Icon icon="material-symbols:bar-chart-4-bars-rounded" /></button>
          <button type="button" onclick={() => onToolbar("mermaid-seq")} title="Sequence"><Icon icon="material-symbols:timeline" /></button>
          <button type="button" onclick={() => onToolbar("mermaid-gantt")} title="Gantt"><Icon icon="material-symbols:calendar-month-outline-rounded" /></button>
        </div>
        <div class="cms-toolbar-divider"></div>
        <div class="cms-toolbar-group">
          <button type="button" onclick={() => onToolbar("music")} title="Música"><Icon icon="material-symbols:music-note-rounded" /></button>
          <button type="button" onclick={() => onToolbar("video")} title="Video / iFrame"><Icon icon="material-symbols:video-library-rounded" /></button>
        </div>
        <div class="cms-toolbar-divider"></div>
        <div class="cms-toolbar-group">
          <button type="button" onclick={() => onToolbar("code")} title="Bloque de Código"><Icon icon="material-symbols:terminal-rounded" /></button>
          <button type="button" onclick={() => onToolbar("math")} title="Matemáticas (Math)"><Icon icon="material-symbols:functions-rounded" /></button>
          <button type="button" onclick={() => onToolbar("spoiler")} title="Spoiler / Detalles"><Icon icon="material-symbols:visibility-off-outline-rounded" /></button>
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
          ondrop={handleDrop}
          onpaste={handlePaste}
          onkeydown={handleKeyDown}
          class="cms-writing-textarea" 
          placeholder="Comienza a escribir tu historia..."
        ></textarea>
      </div>
    </div>
    <div class="cms-editor-status">
      <div class="cms-status-left">
        <span>{wordCount} palabras</span>
        <span class="status-divider"></span>
        <span>Lectura: ~{readingTime} min</span>
      </div>
      <div class="cms-status-right">
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
</style>
