<script>
  import Icon from "../../common/Icon.svelte";
  import { fade, scale } from "svelte/transition";
  let { onOpenChange } = $props();

  const shortcuts = [
    { key: "Ctrl + S", action: "Guardar Post" },
    { key: "Ctrl + B", action: "Negrita" },
    { key: "Ctrl + I", action: "Cursiva" },
    { key: "Ctrl + K", action: "Insertar Enlace" },
    { key: "Ctrl + E", action: "Código en línea" },
    { key: "Ctrl + Shift + X", action: "Tachado" },
    { key: "Ctrl + 1-6", action: "Encabezados (H1-H6)" },
    { key: "Ctrl + Shift + Z", action: "Alternar Metadatos" },
    { key: "?", action: "Mostrar estos atajos" },
  ];
</script>

<div class="modal-backdrop" in:fade={{duration: 200}} onclick={() => onOpenChange(false)}>
  <div class="modal-content" in:scale={{duration: 300, start: 0.95}} onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <div class="header-title">
        <Icon icon="material-symbols:keyboard-outline-rounded" />
        <h2>Atajos de Teclado</h2>
      </div>
      <button class="close-btn" onclick={() => onOpenChange(false)}>
        <Icon icon="material-symbols:close-rounded" />
      </button>
    </div>
    
    <div class="shortcuts-grid">
      {#each shortcuts as item}
        <div class="shortcut-row">
          <span class="shortcut-action">{item.action}</span>
          <kbd class="shortcut-key">{item.key}</kbd>
        </div>
      {/each}
    </div>

    <div class="modal-footer">
      <p>Truco: Pulsa '?' en cualquier momento mientras editas para ver esto.</p>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    z-index: 5000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    pointer-events: auto;
  }

  .modal-content {
    background: var(--bg-glass);
    border: 1px solid var(--line-divider);
    border-radius: 2rem;
    width: 100%;
    max-width: 500px;
    padding: 2.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--primary);
  }

  .header-title h2 {
    font-size: 1.5rem;
    font-weight: 850;
    color: var(--text-primary);
  }

  .close-btn {
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
    transition: all 0.2s;
  }

  .close-btn:hover {
    transform: scale(1.1);
    background: var(--line-divider);
  }

  .shortcuts-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .shortcut-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--btn-regular-bg);
    border-radius: 0.75rem;
    border: 1px solid var(--line-divider);
  }

  .shortcut-action {
    font-size: 0.9375rem;
    font-weight: 600;
    opacity: 0.8;
  }

  .shortcut-key {
    background: var(--card-bg);
    border: 1px solid var(--line-divider);
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--primary);
    box-shadow: 0 2px 0 var(--line-divider);
  }

  .modal-footer {
    margin-top: 2rem;
    text-align: center;
    opacity: 0.5;
    font-size: 0.8rem;
    font-weight: 600;
  }
</style>
