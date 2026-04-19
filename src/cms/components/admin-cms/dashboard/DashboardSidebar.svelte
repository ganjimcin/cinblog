<script>
  import Icon from "../../common/Icon.svelte";

  let { 
    pathMap, 
    currentContentType, 
    activeCategory, 
    allPostsCount, 
    categories, 
    onLoadContent, 
    onChangeCategory,
    cmsConfig
  } = $props();

  const defaultIcons = {
    posts: "material-symbols:article-outline",
    pages: "material-symbols:description-outline",
    settings: "material-symbols:settings-outline",
  };

  function getCollection(type) {
    return cmsConfig?.collections?.find(c => c.name === type);
  }

  function getLabel(type) {
    const col = getCollection(type);
    return col?.label || (type.charAt(0).toUpperCase() + type.slice(1));
  }

  function getIcon(type) {
    const col = getCollection(type);
    return col?.icon || defaultIcons[type] || "material-symbols:folder-open-outline";
  }
</script>

<aside class="cms-sidebar">
  <nav class="cms-nav-group">
    <div class="cms-nav-title">Contenido</div>
    {#each Object.keys(pathMap) as type}
      <button
        class="cms-nav-item"
        class:active={type === currentContentType}
        onclick={() => onLoadContent(type)}
      >
        <div class="cms-nav-left">
          <Icon icon={getIcon(type)} class="cms-nav-icon" />
          <span class="cms-nav-label">{getLabel(type)}</span>
        </div>
      </button>
    {/each}
  </nav>

  <nav class="cms-nav-group">
    <div class="cms-nav-title">Filtros</div>
    <button
      class="cms-nav-item"
      class:active={activeCategory === "all"}
      onclick={() => onChangeCategory("all")}
    >
      <div class="cms-nav-left">
        <Icon icon="material-symbols:all-inclusive" class="cms-nav-icon" />
        <span class="cms-nav-label">Todas</span>
      </div>
      <span class="cms-nav-count">{allPostsCount}</span>
    </button>
    
    {#if Object.keys(categories).length > 0}
      <div class="cms-nav-divider"></div>
      {#each Object.entries(categories) as [cat, count]}
        <button
          class="cms-nav-item"
          class:active={activeCategory === cat}
          onclick={() => onChangeCategory(cat)}
        >
          <div class="cms-nav-left">
              <Icon icon="material-symbols:label-outline-rounded" class="cms-nav-icon" />
              <span class="cms-nav-label">{cat}</span>
          </div>
          <span class="cms-nav-count">{count}</span>
        </button>
      {/each}
    {/if}
  </nav>
</aside>

<style>
  .cms-sidebar {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    position: sticky;
    top: 6.5rem;
  }

  .cms-nav-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .cms-nav-title {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.4;
    padding: 0.5rem 1.25rem;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .cms-nav-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.875rem 1.25rem;
    border-radius: var(--radius-lg);
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    text-align: left;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 600;
    font-size: 0.95rem;
  }

  .cms-nav-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  :global(.cms-nav-icon) {
    font-size: 1.35rem;
    opacity: 0.7;
    transition: all 0.2s;
  }

  .cms-nav-item:hover {
    background: var(--btn-regular-bg);
    transform: translateX(6px);
  }

  .cms-nav-item:hover :global(.cms-nav-icon) {
    opacity: 1;
    color: var(--primary);
  }

  .cms-nav-item.active {
    background: var(--primary);
    color: white;
    box-shadow: 0 4px 15px oklch(from var(--primary) l c h / 0.25);
  }

  .cms-nav-item.active :global(.cms-nav-icon) {
    opacity: 1;
    color: white;
  }

  .cms-nav-count {
    font-size: 0.75rem;
    background: var(--btn-regular-bg);
    padding: 0.2rem 0.6rem;
    border-radius: 2rem;
    font-weight: 700;
    transition: all 0.2s;
    min-width: 2rem;
    text-align: center;
  }

  .cms-nav-item.active .cms-nav-count {
    background: rgba(255, 255, 255, 0.25);
    color: white;
  }

  .cms-nav-divider {
    height: 1px;
    background: var(--line-divider);
    margin: 0.5rem 1.25rem;
    opacity: 0.5;
  }

  @media (max-width: 1100px) {
    .cms-sidebar {
      position: static;
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
</style>
