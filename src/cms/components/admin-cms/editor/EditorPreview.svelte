<script>
  let { 
    title, 
    published, 
    category, 
    renderedHTML, 
    previewEl = $bindable(),
    onScroll 
  } = $props();
</script>

<div class="cms-editor-preview-wrapper">
  <div class="cms-preview-header-bar">
    <span class="preview-header-title">Vista previa</span>
  </div>
  
  <div 
    class="cms-preview-container" 
    bind:this={previewEl}
    onscroll={onScroll}
  >
    <div class="cms-preview-card">
      <div class="cms-preview-content-header">
        <h1 class="preview-main-title">{title || "Sin título"}</h1>
        <div class="preview-main-meta">
           {published || "Fecha"} · {category || "Categoría"}
        </div>
      </div>
      <div class="markdown-content custom-md prose">{@html renderedHTML}</div>
    </div>
  </div>
</div>

<style>
  .cms-editor-preview-wrapper {
    background: var(--card-bg);
    display: flex;
    flex-direction: column;
    height: 100%;
    margin: 0;
    border: 1px solid var(--line-divider);
    border-left: none;
    border-radius: 0 1.5rem 1.5rem 0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  }

  /* Modo Previsualizar Solo */
  :global(.mode-preview) .cms-editor-preview-wrapper {
    margin: 0 auto;
    max-width: 900px;
    width: 100%;
    height: 100%;
    border-radius: 1.5rem;
    border-left: 1px solid var(--line-divider);
    box-shadow: 0 20px 50px rgba(0,0,0,0.05);
  }

  .cms-preview-header-bar {
    background: var(--btn-regular-bg);
    border-bottom: 1px solid var(--line-divider);
    padding: 0.75rem 2rem;
    height: 7rem;
    min-height: 7rem;
    display: flex;
    align-items: center;
  }

  .preview-header-title {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--text-secondary);
    letter-spacing: 0.1em;
  }

  .cms-preview-container {
    flex: 1;
    overflow-y: auto;
    width: 100%;
    display: flex;
    justify-content: flex-start;
    user-select: text !important;
    -webkit-user-select: text !important;
    pointer-events: auto !important;
  }

  .cms-preview-card {
    width: 100%;
    min-height: 100%;
    padding: 4rem 3rem;
    user-select: text !important;
    -webkit-user-select: text !important;
  }

  .cms-preview-content-header {
    text-align: left;
    margin-bottom: 2.5rem;
  }

  .preview-main-title { 
    font-size: 2.25rem; 
    font-weight: 950; 
    margin-bottom: 1rem; 
    color: var(--text-primary);
    letter-spacing: -0.03em;
    line-height: 1.2;
  }
  
  .preview-main-meta { 
    font-size: 0.9rem; 
    opacity: 0.45; 
    font-weight: 600;
  }

  .markdown-content {
    /* Dejar que los estilos globales (custom-md) manejen esto */
  }
</style>
