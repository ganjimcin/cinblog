<script>
  import FieldRenderer from './FieldRenderer.svelte';
  import Icon from "../../common/Icon.svelte";

  let { 
    field, 
    value = $bindable(), 
    onUpload = null,
    githubToken = null,
    isMock = false,
    cmsConfig = null
  } = $props();

  import ImageSelector from "./ImageSelector.svelte";


  const stableId = Math.random().toString(36).slice(2, 6);
  const fieldId = $derived(`field-${field.name}-${stableId}`);
  let localPreview = $state(null);
  let isUploading = $state(false);

  // Asegurar que el valor tenga la estructura por defecto de forma segura
  if (field.widget === 'object' && !value) value = {};
  if (field.widget === 'list' && !value) value = [];

  $effect(() => {
    if (field.widget === 'object' && !value) value = {};
    if (field.widget === 'list' && !value) value = [];
  });

  function addItem() {
    const newItem = {};
    if (field.fields) {
      field.fields.forEach(f => {
        if (f.widget === 'list') newItem[f.name] = [];
        else if (f.widget === 'object') newItem[f.name] = {};
        else newItem[f.name] = f.default || "";
      });
    } else {
        // Simple list of values (default to string)
        value = [...value, ""];
        return;
    }
    value = [...value, newItem];
  }

  function removeItem(index) {
    value = value.filter((_, i) => i !== index);
  }

  async function handleFileChange(e, item = null, fieldName = null) {
    if (!onUpload) return;
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      isUploading = true;
      // Vista previa inmediata para mejorar el UX mientras se sube/despliega
      if (field.widget === 'image') {
        if (localPreview) URL.revokeObjectURL(localPreview);
        localPreview = URL.createObjectURL(file);
      }

      const path = await onUpload(file);
      if (item && fieldName) {
        item[fieldName] = path;
      } else {
        value = path;
      }
    } catch (err) {
      alert("Error en la subida: " + err.message);
    } finally {
      isUploading = false;
    }
  }
</script>

{#if field.widget === 'object'}
  <div class="cms-field-object">
    <div class="cms-field-label">{field.label || field.name}</div>
    <div class="cms-field-object-content">
      {#if value}
        {#each field.fields as subfield}
            <FieldRenderer 
              field={subfield} 
              bind:value={value[subfield.name]} 
              {onUpload} 
              {githubToken}
              {isMock}
              {cmsConfig}
            />
        {/each}
      {/if}
    </div>
  </div>

{:else if field.widget === 'list'}
  <div class="cms-field-list">
    <div class="cms-field-list-header">
       <div class="cms-field-label">{field.label || field.name}</div>
       <button class="cms-btn-mini" onclick={addItem}>
         <Icon icon="material-symbols:add-rounded" />
       </button>
    </div>
    
    <div class="cms-field-list-items">
      {#each value as item, i (i)}
        <div class="cms-field-list-item">
          <div class="cms-item-index">{i + 1}</div>
          <div class="cms-item-content">
            {#if item !== undefined && item !== null}
              {#if field.fields}
                {#each field.fields as subfield}
                  <FieldRenderer 
                    field={subfield} 
                    bind:value={item[subfield.name]} 
                    {onUpload} 
                    {githubToken}
                    {isMock}
                    {cmsConfig}
                  />
                {/each}
              {:else if field.field}
                <FieldRenderer 
                    field={field.field} 
                    bind:value={value[i]} 
                    {onUpload} 
                    {githubToken}
                    {isMock}
                    {cmsConfig}
                  />
              {:else}
                <!-- Default for simple string/value lists -->
                <FieldRenderer 
                    field={{ name: 'item', widget: 'string' }} 
                    bind:value={value[i]} 
                    {onUpload} 
                    {githubToken}
                    {isMock}
                    {cmsConfig}
                  />
              {/if}
            {/if}
          </div>
          <button class="cms-btn-remove" onclick={() => removeItem(i)}>
            <Icon icon="material-symbols:delete-outline-rounded" />
          </button>
        </div>
      {/each}
    </div>
  </div>

{:else if field.widget === 'select'}
  <div class="cms-field-item">
    <label for={fieldId}>{field.label || field.name}</label>
    <select id={fieldId} bind:value={value}>
      {#each field.options as opt}
        <option value={typeof opt === 'string' ? opt : opt.value}>
          {typeof opt === 'string' ? opt : opt.label}
        </option>
      {/each}
    </select>
  </div>

{:else if field.widget === 'image' || field.widget === 'file'}
  <div class="cms-field-item">
    {#if field.widget === 'image'}
      <ImageSelector 
        bind:value={value} 
        {githubToken} 
        {isMock} 
        {cmsConfig} 
      />
    {:else}
      <div class="cms-field-header">
        <label for={fieldId}>{field.label || field.name}</label>
        {#if value}
          <span class="view-status">
            <Icon icon="material-symbols:check-circle-outline-rounded" /> Listo
          </span>
        {/if}
      </div>

      <div class="cms-upload-box">
        <div class="cms-upload-input-row">
          <input type="text" id={fieldId} bind:value={value} placeholder="Ruta del archivo..." class="cms-path-input" />
          
          <label class="cms-upload-btn" class:disabled={isUploading}>
            <Icon icon={isUploading ? "svg-spinners:ring-resize" : "material-symbols:upload-rounded"} />
            <span>{isUploading ? "Subiendo..." : "Subir"}</span>
            <input type="file" class="hidden-input" onchange={(e) => handleFileChange(e)} disabled={isUploading} />
          </label>
        </div>
      </div>
    {/if}
  </div>

{:else if field.widget === 'boolean'}
  <div class="cms-field-item-checkbox">
    <input type="checkbox" bind:checked={value} id={field.name} />
    <label for={field.name}>{field.label || field.name}</label>
  </div>

{:else if field.widget === 'datetime'}
  <div class="cms-field-item">
    <label for={fieldId}>{field.label || field.name}</label>
    <input type="date" id={fieldId} bind:value={value} />
  </div>

{:else if field.widget === 'markdown' || field.widget === 'text'}
  <div class="cms-field-item">
    <label for={fieldId}>{field.label || field.name}</label>
    <textarea 
      id={fieldId} 
      bind:value={value} 
      rows={field.widget === 'markdown' ? 15 : 5}
      placeholder={field.placeholder || ""}
    ></textarea>
    {#if field.widget === 'markdown'}
      <div class="cms-field-hint">Soporta formato Markdown</div>
    {/if}
  </div>

{:else}
  <div class="cms-field-item">
    <label for={fieldId}>{field.label || field.name}</label>
    <input type="text" id={fieldId} bind:value={value} placeholder={field.placeholder || ""} />
  </div>
{/if}

<style>
  .cms-field-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .cms-field-label {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    opacity: 0.5;
    margin-bottom: 0.5rem;
  }
  label {
    font-size: 0.75rem;
    font-weight: 700;
    opacity: 0.8;
  }
  input[type="text"], input[type="date"], select, textarea {
    background: var(--btn-regular-bg);
    border: 1px solid var(--line-divider);
    border-radius: 0.75rem;
    padding: 0.6rem 0.8rem;
    color: var(--text-primary);
    font-size: 0.9rem;
    outline: none;
  }

  .cms-field-hint {
    font-size: 0.7rem;
    opacity: 0.5;
    font-style: italic;
    margin-top: -0.25rem;
  }

  .cms-field-item-checkbox {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .cms-field-object {
    background: rgba(0,0,0,0.02);
    border: 1px solid var(--line-divider);
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .cms-field-list {
    margin-bottom: 1.5rem;
  }
  .cms-field-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  .cms-field-list-item {
    display: flex;
    gap: 1rem;
    background: var(--card-bg);
    border: 1px solid var(--line-divider);
    border-radius: 1rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
    position: relative;
  }
  .cms-item-index {
    background: var(--primary);
    color: var(--text-on-primary);
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 800;
    flex-shrink: 0;
  }
  .cms-item-content {
    flex: 1;
  }

  .cms-btn-mini {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--primary);
    color: var(--text-on-primary);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cms-btn-remove {
    background: transparent;
    color: #ef4444;
    border: none;
    cursor: pointer;
    opacity: 0.5;
  }
  .cms-btn-remove:hover { opacity: 1; }

  .cms-field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .view-status {
    font-size: 0.7rem;
    font-weight: 700;
    color: #10b981;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    opacity: 0.8;
  }

  .cms-upload-box {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .cms-upload-input-row {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }

  .cms-path-input {
    flex: 1;
  }

  .cms-upload-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.25rem;
    background: var(--primary);
    color: var(--text-on-primary);
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .cms-upload-btn:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px oklch(from var(--primary) l c h / 0.25);
  }

  .cms-upload-btn.disabled {
    opacity: 0.7;
    pointer-events: none;
    cursor: wait;
  }

  .hidden-input {
    display: none;
  }

  .cms-image-preview-container {
    position: relative;
    width: fit-content;
    max-width: 100%;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--line-divider);
    background: var(--card-bg);
  }

  .cms-image-preview {
    max-width: 100%;
    max-height: 200px;
    display: block;
    object-fit: contain;
  }

  .cms-remove-image-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .cms-remove-image-btn:hover {
    background: #ef4444;
    transform: scale(1.1);
  }
</style>
