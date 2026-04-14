<script>
  import Icon from "../../common/Icon.svelte";
  let { 
    filename, 
    isSaving, 
    onSave, 
    onCancel, 
    onToggleSettings, 
    showSettings,
    viewMode = "dual",
    onViewModeChange
  } = $props();
  </script>

  <header class="cms-editor-header">
  <div class="cms-header-inner">
    <div class="cms-header-left">
      <button class="btn-plain scale-animation" onclick={onCancel} title="Volver">
        <Icon icon="material-symbols:home-outline-rounded" size="xl" />
      </button>
      <div class="flex flex-col ml-3">
        <span class="cms-editor-breadcrumb">Editor Blog</span>
        <span class="font-bold">{filename || "Nueva Entrada"}</span>
      </div>
    </div>

    <div class="cms-view-toggle">
      <button 
        class:active={viewMode === "write"} 
        onclick={() => onViewModeChange("write")}
        title="Modo Escritura"
      >
        <Icon icon="material-symbols:edit-note-outline-rounded" size="lg" />
        <span>Escribir</span>
      </button>
      <button 
        class:active={viewMode === "dual"} 
        onclick={() => onViewModeChange("dual")}
        title="Modo Dual"
      >
        <Icon icon="material-symbols:chrome-reader-mode-outline-rounded" size="lg" />
        <span>Dual</span>
      </button>
      <button 
        class:active={viewMode === "preview"} 
        onclick={() => onViewModeChange("preview")}
        title="Modo Lectura"
      >
        <Icon icon="material-symbols:visibility-outline-rounded" size="lg" />
        <span>Previsualizar</span>
      </button>
    </div>

    <div class="cms-header-actions">
      <button 
        class="btn-plain scale-animation" 
        onclick={onToggleSettings} 
        title="Ajustes del Post"
        class:active={showSettings}
      >
        <Icon icon="material-symbols:settings-outline-rounded" size="xl" />
      </button>
      <div class="cms-toolbar-divider"></div>
      <button class="btn-regular" onclick={onSave} disabled={isSaving}>
        {#if isSaving}
          <Icon icon="svg-spinners:ring-resize" size="lg" />
        {:else}
          <Icon icon="material-symbols:check-circle" size="lg" />
        {/if}
        <span>Guardar Post</span>
      </button>
    </div>
  </div>
  </header>

  <style>
  .cms-editor-header {
    background: var(--card-bg);
    border-bottom: 1px solid var(--line-divider);
    height: 4.5rem;
    display: flex;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }

  .cms-view-toggle {
    display: flex;
    background: var(--btn-regular-bg);
    padding: 0.35rem;
    border-radius: 1rem;
    gap: 0.25rem;
    border: 1px solid var(--line-divider);
  }

  .cms-view-toggle button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: 0.75rem;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 700;
    transition: all 0.2s;
  }

  .cms-view-toggle button:hover {
    color: var(--text-primary);
  }

  .cms-view-toggle button.active {
    background: var(--card-bg);
    color: var(--primary);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  @media (max-width: 800px) {
    .cms-view-toggle span { display: none; }
  }

  .active {
    color: var(--primary) !important;
  }
  .cms-header-inner {
    width: 90%;
    max-width: none;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0;
  }

  .btn-plain {
    background: transparent;
    border: none;
    width: 2.75rem;
    height: 2.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 1rem;
    color: var(--text-secondary);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;
    font-size: 1.35rem; /* Fallback for older icons */
  }

  .btn-plain:hover {
    background: var(--btn-regular-bg);
    color: var(--text-primary);
    border-color: var(--line-divider);
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }

  .btn-plain.active {
    background: var(--btn-regular-bg);
    color: var(--primary);
    border-color: var(--primary);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  }

  .btn-regular {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    background: var(--primary);
    border: none;
    border-radius: 1rem;
    color: white;
    font-weight: 750;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    gap: 0.6rem;
    box-shadow: 0 8px 20px oklch(from var(--primary) l c h / 0.15);
  }

  .btn-regular:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.1);
    box-shadow: 0 12px 25px oklch(from var(--primary) l c h / 0.25);
  }

  .btn-regular:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  .btn-regular:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  .scale-animation {
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .scale-animation:active {
    transform: scale(0.92);
  }

  .cms-editor-breadcrumb {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-secondary);
    letter-spacing: 0.1em;
  }

  .cms-header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .cms-toolbar-divider {
    width: 1px;
    height: 1.5rem;
    background: var(--line-divider);
    margin: 0 0.5rem;
  }

  .ml-3 { margin-left: 0.75rem; }
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .font-bold { font-weight: 700; }
</style>
