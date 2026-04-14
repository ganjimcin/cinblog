<script>
  let { 
    title = $bindable(), 
    category = $bindable(), 
    published = $bindable(), 
    description = $bindable() 
  } = $props();
</script>

<section class="cms-top-settings-panel">
  <div class="cms-settings-grid">
    <div class="cms-settings-col">
      <input type="text" bind:value={title} class="cms-input-large" placeholder="Escribe el título aquí..." />
      <div class="cms-form-row">
        <div class="cms-form-group">
          <span class="cms-label">Categoría</span>
          <input type="text" bind:value={category} class="cms-input" placeholder="Ej: Tecnología" />
        </div>
        <div class="cms-form-group">
          <span class="cms-label">Fecha</span>
          <input type="date" bind:value={published} class="cms-input" />
        </div>
      </div>
    </div>
    <div class="cms-settings-col">
      <div class="cms-form-group">
        <span class="cms-label">Descripción SEO</span>
        <textarea bind:value={description} class="cms-input" rows="3" placeholder="Resumen del post..."></textarea>
      </div>
    </div>
  </div>
</section>

<style>
  .cms-top-settings-panel {
    background: var(--card-bg);
    border-bottom: 1px solid var(--line-divider);
    padding: 2rem 0;
  }

  .cms-settings-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 2.5rem;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2.5rem;
  }

  .cms-input-large {
    width: 100%;
    background: transparent;
    border: none;
    font-size: 1.75rem;
    font-weight: 900;
    margin-bottom: 1rem;
    outline: none;
    color: var(--text-primary);
  }

  .cms-form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
  }

  .cms-form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .cms-label {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.5;
  }

  .cms-input {
    background: var(--btn-regular-bg);
    border: 1px solid var(--line-divider);
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    color: var(--text-primary);
    outline: none;
    font-size: 0.9rem;
  }
</style>
