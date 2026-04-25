<script>
  import { onMount } from "svelte";
  import Icon from "../../common/Icon.svelte";
  import { cmsFetch as ghFetch } from "../utils/api";
  import { optimizeImage } from "../utils/images";
  import { slugify } from "../utils/formatter";

  let { 
    githubToken, 
    isMock = false, 
    cmsConfig, 
    value = $bindable(), 
    onSelect 
  } = $props();

  let images = $state([]);
  let isLoading = $state(false);
  let isUploading = $state(false);
  let showGallery = $state(false);
  let error = $state(null);

  const mediaFolder = $derived((cmsConfig?.media_folder || "public/assets/images").replace(/\/$/, ""));
  const publicFolder = $derived((cmsConfig?.public_folder || "/assets/images").replace(/\/$/, ""));

  async function loadImages() {
    if (!githubToken && !isMock) return;
    isLoading = true;
    error = null;
    try {
      const data = await ghFetch(`contents/${mediaFolder}`, githubToken);
      if (Array.isArray(data)) {
        images = data.filter(f => f.type === 'file' && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name));
      } else {
        images = [];
      }
    } catch (err) {
      console.error("Error loading images:", err);
      error = "No se pudieron cargar las imágenes.";
    } finally {
      isLoading = false;
    }
  }

  async function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    isUploading = true;
    error = null;
    try {
      const optimized = file.type.startsWith('image/') ? await optimizeImage(file) : null;
      const base64 = optimized ? optimized.base64 : await fileToBase64(file);
      const fileName = optimized ? optimized.fileName : file.name;

      const cleanName = `${slugify(fileName.split('.')[0])}.${fileName.split('.').pop()}`;
      const finalName = `${Date.now()}-${cleanName}`;
      const path = `${mediaFolder}/${finalName}`;
      const publicPath = `${publicFolder}/${finalName}`;

      await ghFetch(`contents/${path}`, githubToken, {
        method: "PUT",
        body: JSON.stringify({
          message: `CMS: Upload image ${finalName}`,
          content: base64,
        }),
      });

      await loadImages();
      selectImage(publicPath);
    } catch (err) {
      error = "Error al subir: " + err.message;
    } finally {
      isUploading = false;
      event.target.value = '';
    }
  }

  async function deleteImage(imageFile, event) {
    event.stopPropagation();
    if (!confirm(`¿Estás seguro de que quieres eliminar ${imageFile.name}?`)) return;

    try {
      await ghFetch(`contents/${imageFile.path}`, githubToken, {
        method: "DELETE",
        body: JSON.stringify({
          message: `CMS: Delete image ${imageFile.name}`,
          sha: imageFile.sha
        }),
      });
      await loadImages();
      if (value === `${publicFolder}/${imageFile.name}`) {
         value = "";
      }
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function selectImage(url) {
    value = url;
    showGallery = false;
    if (onSelect) onSelect(url);
  }

  onMount(() => {
    if (showGallery) loadImages();
  });

  $effect(() => {
    if (showGallery && images.length === 0 && !isLoading) {
      loadImages();
    }
  });

  function getThumbnailUrl(img) {
    if (isMock) return "https://picsum.photos/200/200";
    return img.download_url || `/api/cms/read?path=${img.path}`;
  }
</script>

<div class="image-selector">
  <label class="field-label">Imagen de Portada</label>
  
  <div class="selected-preview">
    {#if value}
      <div class="preview-card">
        <img src={value} alt="Preview" />
        <button class="remove-btn" onclick={() => value = ""} title="Quitar imagen">
          <Icon icon="material-symbols:close-rounded" />
        </button>
      </div>
    {:else}
      <button class="empty-preview" onclick={() => showGallery = true}>
        <Icon icon="material-symbols:add-photo-alternate-outline-rounded" size="2xl" />
        <span>Seleccionar Imagen</span>
      </button>
    {/if}
  </div>

  <div class="input-with-button">
    <input type="text" bind:value={value} placeholder="URL de la imagen..." />
    <button class="gallery-toggle" onclick={() => showGallery = !showGallery}>
      <Icon icon="material-symbols:grid-view-outline-rounded" />
    </button>
  </div>

  {#if showGallery}
    <div class="gallery-overlay" onclick={() => showGallery = false}>
      <div class="gallery-modal" onclick={(e) => e.stopPropagation()}>
        <div class="gallery-header">
          <h3>Galería de Imágenes</h3>
          <div class="header-actions">
            <label class="upload-btn">
              {#if isUploading}
                <Icon icon="svg-spinners:ring-resize" />
              {:else}
                <Icon icon="material-symbols:upload-rounded" />
                <span>Subir</span>
              {/if}
              <input type="file" accept="image/*" onchange={handleUpload} disabled={isUploading} hidden />
            </label>
            <button class="close-modal" onclick={() => showGallery = false}>
              <Icon icon="material-symbols:close-rounded" />
            </button>
          </div>
        </div>

        <div class="gallery-content">
          {#if isLoading}
            <div class="loading-state">
              <Icon icon="svg-spinners:ring-resize" size="xl" />
              <p>Cargando imágenes...</p>
            </div>
          {:else if error}
            <div class="error-state">
              <p>{error}</p>
              <button onclick={loadImages}>Reintentar</button>
            </div>
          {:else if images.length === 0}
            <div class="empty-state">
              <p>No hay imágenes en la carpeta de medios.</p>
            </div>
          {:else}
            <div class="image-grid">
              {#each images as img}
                <button class="image-item" onclick={() => selectImage(`${publicFolder}/${img.name}`)}>
                  <img src={getThumbnailUrl(img)} alt={img.name} loading="lazy" />
                  <div class="image-info">
                    <span class="image-name">{img.name}</span>
                    <button class="delete-img-btn" onclick={(e) => deleteImage(img, e)} title="Eliminar definitivamente">
                      <Icon icon="material-symbols:delete-outline-rounded" />
                    </button>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .image-selector {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .field-label {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    opacity: 0.5;
    letter-spacing: 0.05em;
  }

  .selected-preview {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: 1rem;
    overflow: hidden;
    background: var(--btn-regular-bg);
    border: 2px dashed var(--line-divider);
    transition: all 0.2s;
  }

  .selected-preview:hover {
    border-color: var(--primary);
  }

  .preview-card {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .preview-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(255, 255, 255, 0.9);
    color: #ef4444;
    border: none;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transition: all 0.2s;
  }

  .remove-btn:hover {
    transform: scale(1.1);
    background: white;
  }

  .empty-preview {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-weight: 600;
  }

  .input-with-button {
    display: flex;
    gap: 0.5rem;
  }

  .input-with-button input {
    flex: 1;
    background: var(--btn-regular-bg);
    border: 1px solid var(--line-divider);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: var(--text-primary);
    font-size: 0.85rem;
    outline: none;
  }

  .gallery-toggle {
    background: var(--btn-regular-bg);
    border: 1px solid var(--line-divider);
    border-radius: 0.75rem;
    width: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-primary);
    transition: all 0.2s;
  }

  .gallery-toggle:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  /* Modal */
  .gallery-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .gallery-modal {
    background: var(--card-bg);
    width: 100%;
    max-width: 900px;
    max-height: 80vh;
    border-radius: 2rem;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    border: 1px solid var(--line-divider);
  }

  .gallery-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--line-divider);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .gallery-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 800;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .upload-btn {
    background: var(--primary);
    color: white;
    padding: 0.6rem 1.2rem;
    border-radius: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .upload-btn:hover {
    filter: brightness(1.1);
    transform: translateY(-2px);
  }

  .close-modal {
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
  }

  .gallery-content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
    min-height: 300px;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1.5rem;
  }

  .image-item {
    background: var(--btn-regular-bg);
    border: 1px solid var(--line-divider);
    border-radius: 1rem;
    overflow: hidden;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .image-item:hover {
    transform: translateY(-4px);
    border-color: var(--primary);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  }

  .image-item img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    background: #000;
  }

  .image-info {
    padding: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .image-name {
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-secondary);
  }

  .delete-img-btn {
    background: transparent;
    border: none;
    color: #ef4444;
    padding: 0.4rem;
    border-radius: 0.5rem;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s;
  }

  .image-item:hover .delete-img-btn {
    opacity: 1;
  }

  .delete-img-btn:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .loading-state, .empty-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    color: var(--text-secondary);
    font-weight: 600;
  }

  .error-state p { color: #ef4444; }
</style>
