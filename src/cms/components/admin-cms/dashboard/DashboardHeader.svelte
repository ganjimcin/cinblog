<script>
  import Icon from "../../common/Icon.svelte";
  import SearchBar from "./SearchBar.svelte";

  let { 
    searchTerm = $bindable(), 
    currentLayout = $bindable(), 
    sortMode = $bindable(),
    onNewPost,
    onUpdateLayout
  } = $props();
</script>

<header class="cms-top-bar">
  <div class="cms-top-bar-left">
    <SearchBar bind:value={searchTerm} />

    <div class="cms-view-switcher">
      <button
        class:active={currentLayout === "grid"}
        onclick={() => onUpdateLayout("grid")}
        title="Cuadrícula"
      >
        <Icon icon="material-symbols:grid-view-rounded" />
      </button>
      <button
        class:active={currentLayout === "list"}
        onclick={() => onUpdateLayout("list")}
        title="Lista"
      >
        <Icon icon="material-symbols:view-list-rounded" />
      </button>
    </div>
  </div>

  <div class="cms-top-bar-right">
    <div class="cms-select-wrapper">
      <select bind:value={sortMode} class="cms-select">
        <option value="newest">Más recientes</option>
        <option value="oldest">Más antiguos</option>
        <option value="title">Título (A-Z)</option>
      </select>
    </div>
    
    <button class="cms-btn-primary scale-animation" onclick={onNewPost}>
      <Icon icon="material-symbols:add-rounded" class="mr-2" /> 
      <span>Nueva Entrada</span>
    </button>
  </div>
</header>

<style>
  .cms-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
    margin-bottom: 2.5rem;
    background: var(--card-bg);
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-large);
    border: 1px solid var(--line-divider);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
    backdrop-filter: blur(10px);
  }

  .cms-top-bar-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex: 1;
  }

  .cms-top-bar-right {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .cms-view-switcher {
    display: flex;
    background: var(--btn-regular-bg);
    padding: 0.35rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--line-divider);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  }

  .cms-view-switcher button {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all 0.2s;
    font-size: 1.4rem;
  }

  .cms-view-switcher button.active {
    background: var(--card-bg);
    color: var(--primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .cms-select-wrapper {
    position: relative;
  }

  .cms-select {
    background: var(--btn-regular-bg);
    border: 1px solid var(--line-divider);
    padding: 0 1.25rem;
    height: 3rem;
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    outline: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 700;
    appearance: none;
    min-width: 160px;
    transition: all 0.2s;
  }

  .cms-select:hover {
    border-color: var(--text-secondary);
  }

  .cms-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.875rem 1.5rem;
    border-radius: var(--radius-lg);
    font-weight: 750;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    background: var(--primary);
    color: var(--text-on-primary);
    border: none;
    font-size: 1.1rem;
    box-shadow: 0 8px 20px oklch(from var(--primary) l c h / 0.2);
  }

  .cms-btn-primary:hover {
    transform: translateY(-2px) scale(1.02);
    filter: brightness(1.1);
    box-shadow: 0 12px 25px oklch(from var(--primary) l c h / 0.3);
  }

  :global(.mr-2) {
    margin-right: 0.5rem;
  }

  @media (max-width: 1100px) {
    .cms-top-bar {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
  }
</style>
