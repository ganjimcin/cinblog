<script>
  import Icon from "../../common/Icon.svelte";
  import { fade } from "svelte/transition";

  let {
    // Basic
    category = $bindable(),
    published = $bindable(),
    description = $bindable(),
    tags = $bindable(),
    cover = $bindable(),
    coverInContent = $bindable(),

    // Connection info for ImageSelector
    githubToken,
    isMock,
    cmsConfig,

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
    imdbId = $bindable(),
    ageRating = $bindable(),
    title = $bindable(),
    content = $bindable(),
    isVisible = false,
  } = $props();

  import ImageSelector from "./ImageSelector.svelte";

  let showAdvanced = $state(false);

  // Lógica para añadir categorías personalizadas
  let showAddCategory = $state(false);
  let newCategoryName = $state("");
  let extraOptions = $state([]);
  
  // Estados para la ficha manual
  let manualTitle = $state("");
  let manualOriginal = $state("");
  let manualAge = $state("");
  let manualRecAge = $state("");
  let manualCover = $state("");

  const categoryOptions = $derived.by(() => {
    const baseOptions =
      cmsConfig?.collections
        ?.find((c) => c.name === "posts")
        ?.fields?.find((f) => f.name === "category")?.options || [];
    return [...new Set([...baseOptions, ...extraOptions])];
  });

  function confirmAddCategory() {
    if (newCategoryName.trim()) {
      if (!categoryOptions.includes(newCategoryName.trim())) {
        extraOptions = [...extraOptions, newCategoryName.trim()];
      }
      category = newCategoryName.trim();
      newCategoryName = "";
      showAddCategory = false;
    }
  }

  let isImporting = $state(false);

  async function importFromImdb() {
    if (!imdbId || !imdbId.trim().startsWith("tt")) {
      alert("Introduce un ID de IMDb válido (ej: tt1234567)");
      return;
    }

    isImporting = true;
    try {
      const cleanId = imdbId.trim();
      
      // 1. Obtener datos de Wikidata (Directo, sin proxy para máxima velocidad)
      const query = `
        SELECT ?itemLabel ?itemDescription ?image ?originalTitle ?ageLabel WHERE {
          ?item wdt:P345 "${cleanId}".
          OPTIONAL { ?item wdt:P18 ?image. }
          OPTIONAL { ?item wdt:P1476 ?originalTitle. }
          OPTIONAL { 
            { ?item p:P2879 [ ps:P2879 ?ageItem; pq:P17 wd:Q29 ]. ?ageItem rdfs:label ?ageLabel. FILTER(LANG(?ageLabel) = "es") }
            UNION 
            { ?item wdt:P2879 ?ageItem. ?ageItem rdfs:label ?ageLabel. FILTER(LANG(?ageLabel) = "es" || LANG(?ageLabel) = "en") }
            UNION
            { ?item wdt:P1657 ?ageItem. ?ageItem rdfs:label ?ageLabel. FILTER(LANG(?ageLabel) = "en") }
          }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
        }
        LIMIT 5
      `;
      
      const wikidataUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
      const wikiResp = await fetch(wikidataUrl);
      const wikiData = await wikiResp.json();
      const wikiRes = wikiData.results.bindings[0] || {};

      // 2. Intentar obtener el PÓSTER REAL (vía Proxy)
      let imdbPoster = "";
      try {
        const suggestUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://v3.sg.media-imdb.com/suggestion/x/${cleanId}.json`)}`;
        const suggestResp = await fetch(suggestUrl);
        const suggestData = await suggestResp.json();
        const imdbSuggest = JSON.parse(suggestData.contents);
        if (imdbSuggest.d?.[0]?.i?.[0]) imdbPoster = imdbSuggest.d[0].i[0];
      } catch (e) {
        console.warn("Fallo al obtener póster de IMDb, usando fallback de Wikidata");
        if (wikiRes.image?.value) {
           imdbPoster = wikiRes.image.value.replace("http://", "https://");
        }
      }

      // 3. Tabla de conversión de edades
      const ageMap = {
        'G': 'Apta (EE.UU.)',
        'PG': '+7 (EE.UU.)',
        'PG-13': '+12 (EE.UU.)',
        'R': '+18 (EE.UU.)',
        'NC-17': '+18 (EE.UU.)',
        'TV-MA': '+18 (EE.UU.)',
        'TV-14': '+14 (EE.UU.)',
        'TV-PG': '+7 (EE.UU.)'
      };

      let rawAge = "";
      for (const r of wikiData.results.bindings) {
        if (r.ageLabel?.value) { rawAge = r.ageLabel.value; break; }
      }

      description = wikiRes.itemDescription?.value || "";
      ageRating = ageMap[rawAge] || rawAge || "";
      
      const movieTitle = wikiRes.itemLabel?.value || "Sin Título";
      const original = wikiRes.originalTitle?.value || movieTitle;

      // Sincronizar con campos manuales
      manualTitle = movieTitle;
      manualOriginal = original;
      manualAge = ageRating;
      manualRecAge = ""; // Limpiar por defecto al importar nuevo
      manualCover = imdbPoster;
      
      const movieCard = `:::movie{title="${manualTitle}",originalTitle="${manualOriginal}",age="${manualAge}",recAge="${manualRecAge}",cover="${manualCover}",imdbId="${cleanId}"}\n\n`;
      
      if (!content.includes(':::movie')) {
        content = movieCard + content;
      }
      console.log("IMDb/Wikidata Import Success");
    } catch (err) {
      alert("Error al importar: " + err.message);
    } finally {
      isImporting = false;
    }
  }
</script>

<aside class="cms-sidebar-metadata" class:visible={isVisible}>
  <div class="cms-sidebar-inner">
    <div class="cms-sidebar-header">
      <Icon icon="material-symbols:settings-outline-rounded" />
      <h3>Ajustes del Post</h3>
    </div>

    <div class="cms-sidebar-scroll">
      <div class="cms-sidebar-section">
        <div class="cms-sidebar-label-row">
          <label for="cms-meta-category">Categoría</label>
          <button
            class="cms-btn-mini-inline"
            onclick={() => (showAddCategory = !showAddCategory)}
            title="Añadir nueva categoría"
            type="button"
          >
            <Icon
              icon={showAddCategory
                ? "material-symbols:close-rounded"
                : "material-symbols:add-rounded"}
            />
          </button>
        </div>

        {#if showAddCategory}
          <div class="cms-add-option-row">
            <input
              type="text"
              bind:value={newCategoryName}
              placeholder="Nueva categoría..."
              onkeydown={(e) => e.key === "Enter" && confirmAddCategory()}
              autofocus
            />
            <button
              class="cms-btn-mini success"
              onclick={confirmAddCategory}
              title="Confirmar"
              type="button"
            >
              <Icon icon="material-symbols:check-rounded" />
            </button>
          </div>
        {:else}
          <select id="cms-meta-category" bind:value={category}>
            {#each categoryOptions as opt}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
        {/if}
      </div>

      {#if category === "Anim-Acción"}
        <div class="cms-sidebar-section imdb-section" in:fade>
          <div class="cms-sidebar-label-row">
            <label for="cms-meta-imdb">IMDb ID</label>
            <button
              class="cms-btn-mini-inline 🪄"
              onclick={importFromImdb}
              disabled={isImporting}
              title="Importar datos de IMDb"
            >
              <Icon
                icon={isImporting
                  ? "svg-spinners:ring-resize"
                  : "material-symbols:magic-button-outline-rounded"}
              />
            </button>
          </div>
          <input
            type="text"
            id="cms-meta-imdb"
            bind:value={imdbId}
            placeholder="tt1234567"
          />
        </div>

          <div class="cms-manual-card-fields">
             <div class="cms-sidebar-label-row">
               <label for="m-title">Título Ficha</label>
             </div>
             <input type="text" id="m-title" bind:value={manualTitle} placeholder="Ej: Mario Bros" />

             <div class="cms-sidebar-label-row mt-2">
               <label for="m-orig">Título Original</label>
             </div>
             <input type="text" id="m-orig" bind:value={manualOriginal} placeholder="Original title" />

             <div class="cms-sidebar-label-row mt-2">
               <label for="m-age">Edad Oficial</label>
             </div>
             <input type="text" id="m-age" bind:value={manualAge} placeholder="Ej: +7" />

             <div class="cms-sidebar-label-row mt-2">
               <label for="m-rec-age">Edad Recomendada</label>
             </div>
             <input type="text" id="m-rec-age" bind:value={manualRecAge} placeholder="Ej: +10" />

             <div class="cms-sidebar-label-row mt-2">
               <label for="m-cover">URL Carátula</label>
             </div>
             <input type="text" id="m-cover" bind:value={manualCover} placeholder="https://..." />

             <button 
               class="cms-btn-manual-insert mt-3"
               onclick={() => {
                 const card = `:::movie{title="${manualTitle}",originalTitle="${manualOriginal}",age="${manualAge}",recAge="${manualRecAge}",cover="${manualCover}",imdbId="${imdbId}"}\n\n`;
                 content = card + content;
               }}
               type="button"
             >
               <Icon icon="material-symbols:add-box-outline" />
               Insertar Ficha
             </button>
          </div>
      {/if}

      <div class="cms-sidebar-section">
        <label for="cms-meta-date">Fecha</label>
        <input type="date" id="cms-meta-date" bind:value={published} />
      </div>

      <div class="cms-sidebar-section">
        <label for="cms-meta-tags">Etiquetas</label>
        <input
          type="text"
          id="cms-meta-tags"
          bind:value={tags}
          placeholder="astro, svelte..."
        />
      </div>

      <div class="cms-sidebar-section">
        <ImageSelector bind:value={cover} {githubToken} {isMock} {cmsConfig} />
      </div>

      <div class="cms-sidebar-section">
        <label class="cms-checkbox-label">
          <input type="checkbox" bind:checked={coverInContent} />
          <span>Habilitar en post</span>
        </label>
      </div>

      <div class="cms-sidebar-section">
        <label for="cms-meta-desc">Descripción / SEO</label>
        <textarea
          id="cms-meta-desc"
          bind:value={description}
          rows="4"
          placeholder="Resumen..."
        ></textarea>
      </div>

      <button
        class="cms-sidebar-toggle-adv"
        onclick={() => (showAdvanced = !showAdvanced)}
        type="button"
      >
        {showAdvanced ? "Ocultar Avanzado" : "Ver Avanzado"}
      </button>

      {#if showAdvanced}
        <div class="cms-advanced-group">
          <div class="cms-sidebar-section">
            <label for="cms-meta-slug">Slug</label>
            <input
              type="text"
              id="cms-meta-slug"
              bind:value={slug}
              placeholder="url-amigable"
            />
          </div>
          <div class="cms-sidebar-section">
            <label for="cms-meta-author">Autor</label>
            <input type="text" id="cms-meta-author" bind:value={author} />
          </div>
          <div class="cms-sidebar-section">
            <label for="cms-meta-lang">Idioma</label>
            <input
              type="text"
              id="cms-meta-lang"
              bind:value={lang}
              placeholder="es"
            />
          </div>
          <div class="cms-sidebar-section">
            <label for="cms-meta-icon">Icono</label>
            <input
              type="text"
              id="cms-meta-icon"
              bind:value={icon}
              placeholder="home"
            />
          </div>

          <div class="cms-checkbox-list">
            <label
              ><input type="checkbox" bind:checked={draft} /> Borrador</label
            >
            <label><input type="checkbox" bind:checked={pinned} /> Fijado</label
            >
            <label
              ><input type="checkbox" bind:checked={comment} /> Comentarios</label
            >
            <label
              ><input type="checkbox" bind:checked={inNavbar} /> En Navbar</label
            >
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
    z-index: 1050;
    display: flex;
    flex-direction: column;
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.05);
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
    font-size: 0.75rem;
    font-weight: 850;
    text-transform: uppercase;
    color: var(--text-secondary);
    letter-spacing: 0.05em;
  }

  .cms-sidebar-section input,
  .cms-sidebar-section textarea {
    background: var(--input-bg);
    border: 1px solid var(--line-divider);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: var(--text-primary);
    font-size: 0.95rem;
    font-weight: 500;
    outline: none;
    transition: all 0.2s;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
  }

  .cms-sidebar-section input:focus,
  .cms-sidebar-section textarea:focus {
    border-color: var(--primary);
    background: var(--card-bg);
    box-shadow: 0 0 0 4px oklch(from var(--primary) l c h / 0.1);
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

  .cms-checkbox-list label,
  .cms-checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
  }

  .cms-sidebar-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .cms-btn-mini-inline {
    background: var(--primary);
    color: var(--text-on-primary);
    border: none;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.8rem;
    opacity: 0.8;
    transition: all 0.2s;
  }
  .cms-btn-mini-inline:hover {
    opacity: 1;
    transform: scale(1.1);
  }

  .cms-add-option-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .cms-add-option-row input {
    flex: 1;
    font-size: 0.85rem !important;
    padding: 0.4rem 0.6rem !important;
  }

  .cms-btn-mini.success {
    background: #10b981;
    color: white;
    border: none;
    border-radius: 4px;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  select {
    background: var(--input-bg);
    border: 1px solid var(--line-divider);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: var(--text-primary);
    font-size: 0.95rem;
    font-weight: 500;
    outline: none;
    transition: all 0.2s;
    width: 100%;
  }

  .imdb-section {
    background: oklch(from var(--primary) l c h / 0.05);
    padding: 1rem;
    border-radius: 1rem;
    border: 1px dashed var(--primary);
  }

  .mt-2 {
    margin-top: 0.5rem;
  }

  .cms-btn-mini-inline.🪄 {
    background: #8b5cf6;
    color: white;
  }
  .cms-manual-card-fields {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--line-divider);
    background: rgba(var(--primary-rgb, 100, 100, 255), 0.03);
    margin-left: -1rem;
    margin-right: -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
    border-radius: 0 0 0.5rem 0.5rem;
  }

  .cms-manual-card-fields label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.7;
    font-weight: 700;
  }

  .cms-manual-card-fields input {
    margin-bottom: 0.7rem;
    background: var(--card-bg);
    border-color: var(--line-divider);
    font-size: 0.9rem;
    padding: 0.8rem 1rem;
    border-radius: 0.8rem;
    height: auto;
  }

  .cms-btn-manual-insert {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--primary);
    color: var(--text-on-primary);
    border: none;
    border-radius: 0.6rem;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 1rem;
    box-shadow: 0 4px 12px rgba(var(--primary-rgb, 100, 100, 255), 0.2);
  }

  .cms-btn-manual-insert:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(var(--primary-rgb, 100, 100, 255), 0.3);
    filter: brightness(1.1);
  }

  .cms-btn-manual-insert:active {
    transform: translateY(0);
  }
</style>
