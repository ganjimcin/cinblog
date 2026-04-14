<script>
  import Icon from "../../common/Icon.svelte";
  
  let { 
    // Basic (title removed as it will be in the main editor area)
    category = $bindable(), 
    published = $bindable(), 
    description = $bindable(),
    tags = $bindable(),
    image = $bindable(),
    // Advanced
    slug = $bindable(),
    author = $bindable(),
    lang = $bindable(),
    updated = $bindable(),
    licenseName = $bindable(),
    licenseUrl = $bindable(),
    sourceLink = $bindable(),
    draft = $bindable(),
    pinned = $bindable(),
    comment = $bindable(),
    inNavbar = $bindable(),
    icon = $bindable(),
    isVisible = false
  } = $props();

  let showAdvanced = $state(false);
</script>

<aside class="cms-sidebar-metadata" class:visible={isVisible}>
  <div class="cms-sidebar-inner">
    <div class="cms-sidebar-header">
      <Icon icon="material-symbols:settings-outline-rounded" />
      <h3>Ajustes del Post</h3>
    </div>

    <div class="cms-sidebar-scroll">
      <div class="cms-sidebar-section">
        <label for="cms-meta-category">Categoría</label>
        <input type="text" id="cms-meta-category" bind:value={category} placeholder="Ej: Tutoriales" />
      </div>

      <div class="cms-sidebar-section">
        <label for="cms-meta-date">Fecha</label>
        <input type="date" id="cms-meta-date" bind:value={published} />
      </div>

      <div class="cms-sidebar-section">
        <label for="cms-meta-tags">Etiquetas</label>
        <input type="text" id="cms-meta-tags" bind:value={tags} placeholder="astro, svelte..." />
      </div>

      <div class="cms-sidebar-section">
        <label for="cms-meta-image">Imagen Portada (URL)</label>
        <input type="text" id="cms-meta-image" bind:value={image} placeholder="https://..." />
      </div>

      <div class="cms-sidebar-section">
        <label for="cms-meta-desc">Descripción / SEO</label>
        <textarea id="cms-meta-desc" bind:value={description} rows="4" placeholder="Resumen..."></textarea>
      </div>

      <button class="cms-sidebar-toggle-adv" onclick={() => showAdvanced = !showAdvanced} type="button">
        {showAdvanced ? "Ocultar Avanzado" : "Ver Avanzado"}
      </button>

      {#if showAdvanced}
        <div class="cms-advanced-group">
          <div class="cms-sidebar-section">
            <label for="cms-meta-slug">Slug</label>
            <input type="text" id="cms-meta-slug" bind:value={slug} placeholder="url-amigable" />
          </div>
          <div class="cms-sidebar-section">
            <label for="cms-meta-author">Autor</label>
            <input type="text" id="cms-meta-author" bind:value={author} />
          </div>
          <div class="cms-sidebar-section">
            <label for="cms-meta-lang">Idioma</label>
            <input type="text" id="cms-meta-lang" bind:value={lang} placeholder="es" />
          </div>
          <div class="cms-sidebar-section">
            <label for="cms-meta-icon">Icono</label>
            <input type="text" id="cms-meta-icon" bind:value={icon} placeholder="home" />
          </div>
          
          <div class="cms-checkbox-list">
            <label><input type="checkbox" bind:checked={draft} /> Borrador</label>
            <label><input type="checkbox" bind:checked={pinned} /> Fijado</label>
            <label><input type="checkbox" bind:checked={comment} /> Comentarios</label>
            <label><input type="checkbox" bind:checked={inNavbar} /> En Navbar</label>
          </div>
        </div>
      {/if}
    </div>
  </div>
</aside>

<style>
  .cms-sidebar-metadata {
    width: 320px;
    background: var(--card-bg);
    border-left: 1px solid var(--line-divider);
    height: calc(100vh - 4.5rem);
    position: fixed;
    right: -320px;
    top: 4.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 90;
    display: flex;
    flex-direction: column;
    box-shadow: -10px 0 30px rgba(0,0,0,0.05);
  }

  .cms-sidebar-metadata.visible {
    right: 0;
  }

  .cms-sidebar-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .cms-sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--line-divider);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .cms-sidebar-header :global(.mr-2) {
    margin-right: 0.5rem;
  }

  .cms-sidebar-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 800;
  }

  .cms-sidebar-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .cms-sidebar-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .cms-sidebar-section label {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    opacity: 0.5;
    letter-spacing: 0.05em;
  }

  .cms-sidebar-section input, .cms-sidebar-section textarea {
    background: var(--btn-regular-bg);
    border: 1px solid var(--line-divider);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: var(--text-primary);
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s;
  }

  .cms-sidebar-section input:focus, .cms-sidebar-section textarea:focus {
    border-color: var(--primary);
    background: var(--card-bg);
  }

  .cms-sidebar-toggle-adv {
    background: transparent;
    border: 1px dashed var(--line-divider);
    border-radius: 0.75rem;
    padding: 0.75rem;
    cursor: pointer;
    font-weight: 700;
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-top: 1rem;
  }

  .cms-checkbox-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 1rem;
    background: var(--btn-regular-bg);
    border-radius: 0.75rem;
  }

  .cms-checkbox-list label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
  }

  .cms-checkbox-list input {
    accent-color: var(--primary);
  }
</style>
