<script>
  import Icon from "../../common/Icon.svelte";
  let { value = $bindable() } = $props();
</script>

<div class="cms-search-box">
  <Icon icon="material-symbols:search-rounded" class="search-icon" />
  <input
    type="text"
    bind:value={value}
    placeholder="Buscar en el contenido..."
  />
</div>

<style>
  .cms-search-box {
    flex: 1;
    max-width: 440px;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    background: var(--btn-regular-bg);
    padding: 0 1.25rem;
    height: 3rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--line-divider);
    transition: all 0.2s;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  }

  .cms-search-box:focus-within {
    background: var(--card-bg);
    border-color: var(--primary);
    box-shadow: 0 4px 12px oklch(from var(--primary) l c h / 0.1);
  }

  .cms-search-box input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    width: 100%;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .cms-search-box input::placeholder {
    opacity: 0.4;
  }

  :global(.search-icon) {
    font-size: 1.25rem;
    opacity: 0.5;
    color: var(--text-secondary);
  }
</style>
