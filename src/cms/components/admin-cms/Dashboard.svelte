<script>
  import { onMount } from "svelte";
  import Icon from "../common/Icon.svelte";
  import { cmsFetch as ghFetch } from "./utils/api";
  import { parsePost } from "./utils/parser";
  import { formatDate } from "./utils/formatter";
  import DashboardHeader from "./dashboard/DashboardHeader.svelte";
  import DashboardSidebar from "./dashboard/DashboardSidebar.svelte";
  import PostCard from "./dashboard/PostCard.svelte";

  let { githubToken, isMock = false, cmsConfig, onEditPost, onNewPost } = $props();

  // Mapeo dinámico basado en config.yml
  const pathMap = $derived.by(() => {
    const map = {};
    if (cmsConfig?.collections) {
      cmsConfig.collections.forEach(c => {
        if (c.folder) map[c.name] = c.folder;
        else if (c.files) map[c.name] = "files_collection"; // Marca para colecciones de archivos
      });
    }
    return map;
  });

  let allPostsData = $state([]);
  let currentContentType = $state("posts");
  let currentLayout = $state(localStorage.getItem("cms_layout") || "grid");
  let activeCategory = $state("all");
  let searchTerm = $state("");
  let sortMode = $state("newest");
  let isLoading = $state(false);

  let filteredPosts = $derived.by(() => {
    let filtered = allPostsData.filter((p) => {
      const titleMatch = (p.fm.title || p.name)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const categoryMatch =
        activeCategory === "all" ||
        (p.fm.category || "Sin categoría") === activeCategory;
      return titleMatch && categoryMatch;
    });
    if (sortMode === "newest")
      filtered.sort(
        (a, b) => new Date(b.fm.published || 0) - new Date(a.fm.published || 0),
      );
    else if (sortMode === "oldest")
      filtered.sort(
        (a, b) => new Date(a.fm.published || 0) - new Date(b.fm.published || 0),
      );
    else if (sortMode === "title")
      filtered.sort((a, b) =>
        (a.fm.title || a.name).localeCompare(b.fm.title || b.name),
      );
    return filtered;
  });

  let categories = $derived.by(() => {
    const cats = {};
    allPostsData.forEach((p) => {
      const cat = p.fm.category || "Sin categoría";
      cats[cat] = (cats[cat] || 0) + 1;
    });
    return cats;
  });

  onMount(() => {
    loadContent(currentContentType);
  });

  async function loadContent(type) {
    isLoading = true;
    currentContentType = type;
    console.log("Cargando contenido para tipo:", type);

    try {
      if (!cmsConfig?.collections) {
        console.error("Configuración de colecciones faltante en cmsConfig");
        return;
      }
      const collection = cmsConfig.collections.find(c => c.name === type);
      if (!collection) {
        console.error("Colección no encontrada:", type);
        return;
      }

      if (collection.files) {
        console.log("Cargando colección de archivos:", collection.files);
        // Manejo de colecciones tipo 'files' (Ej: ajustes, páginas estáticas)
        allPostsData = await Promise.all(
          collection.files.map(async (file) => {
            try {
              const fetchPath = `contents/${file.file}`;
              console.log("Fetch file:", fetchPath);
              const data = await ghFetch(fetchPath, githubToken);
              
              const decoded = decodeURIComponent(escape(atob(data.content)));
              let fm = {};
              if (file.file.endsWith(".json")) {
                fm = JSON.parse(decoded);
              } else {
                fm = parsePost(decoded).fm;
              }

              return {
                name: file.label || file.name,
                path: file.file,
                sha: data.sha,
                fm: fm || { title: file.label },
                isFileConfig: true
              };
            } catch (err) {
              console.error(`Error cargando archivo individual ${file.file}:`, err);
              return {
                name: file.label,
                path: file.file,
                sha: null,
                fm: { title: file.label, category: "Error" },
                isFileConfig: true
              };
            }
          })
        );
      } else {
        // Manejo de carpetas
        const path = pathMap[type];
        if (!path || path === "files_collection") {
           console.error("Ruta inválida para carpeta:", path);
           allPostsData = [];
           return;
        }

        console.log("Listando carpeta:", path);
        const files = await ghFetch(`contents/${path}`, githubToken);
        
        let mdFiles = [];
        
        // Función recursiva para obtener todos los archivos markdown en subcarpetas
        async function getRecursiveFiles(currentFiles, folderPath) {
          let results = [];
          for (const f of currentFiles) {
            if (f.type === "dir") {
              const subFiles = await ghFetch(`contents/${f.path}`, githubToken);
              const nested = await getRecursiveFiles(subFiles, f.path);
              results = [...results, ...nested];
            } else if (
              f.name.endsWith(".md") || 
              f.name.endsWith(".mdx") || 
              f.name.endsWith(".json")
            ) {
              results.push(f);
            }
          }
          return results;
        }

        if (collection.nested) {
           // Si es anidado, buscamos el archivo principal en cada subcarpeta
           mdFiles = await Promise.all(files.filter(f => f.type === "dir").map(async f => {
             const subPath = `${path}/${f.name}`;
             const subFiles = await ghFetch(`contents/${subPath}`, githubToken);
             const indexFile = subFiles.find(sf => 
               sf.name === "index.md" || 
               sf.name === "index.mdx" || 
               sf.name === "intro.json" ||
               sf.name.toLowerCase() === f.name.toLowerCase() + ".md"
             );
             return indexFile || null;
           }));
           mdFiles = mdFiles.filter(f => f !== null);
        } else {
           // Búsqueda recursiva para encontrar posts en subcarpetas
           mdFiles = await getRecursiveFiles(files, path);
        }

        console.log("Archivos encontrados:", mdFiles.length);

        allPostsData = await Promise.all(
          mdFiles.map(async (file) => {
            try {
              const data = await ghFetch(`contents/${file.path}`, githubToken);
              const decoded = decodeURIComponent(escape(atob(data.content)));
              let fm = {};
              if (file.path.endsWith(".json")) {
                fm = JSON.parse(decoded);
              } else {
                fm = parsePost(decoded).fm;
              }
              return { ...file, fm, sha: data.sha };
            } catch (e) {
              console.error(`Error parseando ${file.path}:`, e);
              return { ...file, fm: { title: file.name }, sha: null };
            }
          }),
        );
      }

      // Auto-carga si es una colección de archivos únicos (como ajustes)
      if (collection?.files?.length === 1 && allPostsData.length === 1 && type === "settings") {
         onEditPost(allPostsData[0]);
      }
    } catch (err) {
      console.error("Error cargando contenido:", err);
      allPostsData = [];
    } finally {
      isLoading = false;
    }
  }

  function updateLayoutUI(layout) {
    currentLayout = layout;
    localStorage.setItem("cms_layout", layout);
  }
</script>

<div class="cms-dashboard-wrapper">
  <div class="cms-container">
    <!-- Top Bar mejorada y alineada -->
    <DashboardHeader 
      bind:searchTerm={searchTerm}
      bind:currentLayout={currentLayout}
      bind:sortMode={sortMode}
      onNewPost={onNewPost}
      onUpdateLayout={updateLayoutUI}
    />

    <div class="cms-main-layout">
      <!-- Sidebar robusto -->
      <DashboardSidebar 
        pathMap={pathMap}
        currentContentType={currentContentType}
        activeCategory={activeCategory}
        allPostsCount={allPostsData.length}
        categories={categories}
        {cmsConfig}
        onLoadContent={loadContent}
        onChangeCategory={(cat) => (activeCategory = cat)}
      />

      <!-- Área de contenido con grid corregido -->
      <main class="cms-content">
        {#if isLoading}
          <div class="cms-loading-container">
            <Icon icon="svg-spinners:ring-resize" />
            <p>Cargando contenido...</p>
          </div>
        {:else if filteredPosts.length === 0}
          <div class="cms-empty-state">
            <Icon icon="material-symbols:search-off-rounded" />
            <p>No se encontraron publicaciones.</p>
          </div>
        {:else}
          <div class="cms-post-list-{currentLayout}">
            {#each filteredPosts as post}
              <PostCard 
                {post} 
                layout={currentLayout} 
                onEdit={onEditPost} 
              />
            {/each}
          </div>
        {/if}
      </main>
    </div>
  </div>
</div>

<style>
  .cms-dashboard-wrapper {
    background: var(--page-bg);
    min-height: 100vh;
    padding: 2.5rem 0;
  }

  .cms-container {
    width: 90%;
    max-width: none;
    margin: 0 auto;
    padding: 0;
  }

  .cms-main-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 3rem;
    align-items: start;
    margin-top: 1rem;
  }

  .cms-post-list-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 1.75rem;
  }

  .cms-post-list-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .cms-loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10rem 0;
    gap: 2rem;
    color: var(--primary);
    font-size: 3rem;
  }

  .cms-loading-container p {
    font-size: 1.1rem;
    font-weight: 700;
    opacity: 0.7;
  }

  .cms-empty-state {
    text-align: center;
    padding: 10rem 0;
    opacity: 0.3;
  }

  @media (max-width: 1100px) {
    .cms-main-layout {
      grid-template-columns: 1fr;
    }
    .cms-sidebar {
      position: static;
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
</style>
