<script>
  import { onMount } from "svelte";
  import Icon from "../common/Icon.svelte";
  import Login from "./Login.svelte";
  import Dashboard from "./Dashboard.svelte";
  import Editor from "./Editor.svelte";
  import ToastProvider from "./common/ToastProvider.svelte";
  import { getDeviceID } from "./utils/device";

  let githubToken = $state(null);
  let isMock = $state(false);
  let isLoggedIn = $state(false);
  let currentView = $state("dashboard");
  let postToEdit = $state(null);
  const siteTitle = "Rain and Tea";
  let cmsConfig = $state(null);
  let isLoadingConfig = $state(true);
  let isDark = $state(true);

  function toggleTheme() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute("data-theme", "github-dark");
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute("data-theme", "github-light");
      localStorage.setItem('theme', 'light');
    }
  }

  onMount(async () => {
    // Inicializar estado del tema
    isDark = document.documentElement.classList.contains('dark');
    
    // CmsApp.svelte - Carga de la configuración del CMS
    try {
      // Usamos una ruta más robusta para config.yml
      const configPath = window.location.pathname.endsWith('/') 
        ? './config.yml' 
        : './admin/config.yml';
      
      console.log("Cargando config desde:", configPath);
      const response = await fetch(configPath);
      
      if (!response.ok) {
        // Reintento con ruta absoluta si falla
        const altResponse = await fetch('/admin/config.yml');
        if (!altResponse.ok) throw new Error(`Fallaron todas las rutas de config: ${response.status}`);
        const yamlText = await altResponse.text();
        cmsConfig = jsyaml.load(yamlText);
      } else {
        const yamlText = await response.text();
        cmsConfig = jsyaml.load(yamlText);
      }
      
      console.log("CMS Config cargada correctamente:", cmsConfig);
    } catch (e) {
      console.error("Error crítico cargando config.yml:", e);
      // Fallback mínimo para que no crashée
      cmsConfig = { collections: [] };
    } finally {
      isLoadingConfig = false;
    }
    const encryptedToken = localStorage.getItem("github_pat_encrypted");
    
    if (encryptedToken) {
        // Intentamos autologin usando la huella digital del dispositivo
        const deviceKey = await getDeviceID();
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedToken, deviceKey);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            
            if (decrypted) {
                githubToken = decrypted;
                isLoggedIn = true;
                isMock = decrypted === "mock-token";

                // Manejo de navegación inicial
                const params = new URLSearchParams(window.location.search);
                const view = params.get("view");
                const path = params.get("path");
                if (view === "editor" && path) {
                   currentView = "editor";
                   postToEdit = { path, name: path.split("/").pop() };
                }
            } else {
                currentView = "login";
            }
        } catch (e) {
            console.error("No se pudo descifrar el token en este dispositivo.");
            currentView = "login";
        }
    } else {
      currentView = "login";
    }

    // Mantener historial...
    window.onpopstate = (event) => {
      if (event.state) {
        currentView = event.state.view;
        postToEdit = event.state.post;
      } else {
        currentView = "dashboard";
        postToEdit = null;
      }
    };
  });

  function updateHistory(view, post = null) {
    const url = new URL(window.location);
    if (view === "dashboard") {
      url.searchParams.delete("view");
      url.searchParams.delete("path");
    } else {
      url.searchParams.set("view", view);
      if (post) url.searchParams.set("path", post.path);
    }
    // Usamos snapshot para evitar el error de clonación de Proxy
    window.history.pushState(
      { view, post: post ? $state.snapshot(post) : null },
      "",
      url,
    );
  }

  function handleLoginSuccess(data) {
    githubToken = data.token;
    isMock = !!data.isMock;
    isLoggedIn = true;
    currentView = "dashboard";
    updateHistory("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("github_pat_encrypted");
    githubToken = null;
    isLoggedIn = false;
    currentView = "login";
    window.history.pushState({}, "", window.location.pathname);
  }

  function handleEditPost(post) {
    postToEdit = post;
    currentView = "editor";
    updateHistory("editor", post);
  }

  function handleNewPost() {
    postToEdit = null;
    currentView = "editor";
    updateHistory("editor");
  }

  function handleDashboardClick() {
    currentView = "dashboard";
    postToEdit = null;
    updateHistory("dashboard");
  }
</script>

<header id="navbar">
  <div class="nav-inner">
    <a href="/" class="logo-link">
      <div class="logo-icon-container">
        <Icon icon="material-symbols:eco-outline" style="font-size: 2rem;" />
      </div>
      <span>{siteTitle}</span>
    </a>

    {#if isLoggedIn}
      <div class="nav-actions">
        <button
          onclick={handleDashboardClick}
          class="cms-btn-icon"
          title="Dashboard"
        >
          <Icon icon="material-symbols:dashboard-outline-rounded" />
        </button>

        <button
          onclick={toggleTheme}
          class="cms-btn-icon"
          title={isDark ? "Modo Claro" : "Modo Oscuro"}
        >
          <Icon icon={isDark ? "lucide:sun" : "lucide:moon"} />
        </button>

        <button
          onclick={handleLogout}
          class="cms-btn-icon btn-logout"
          title="Cerrar Sesión"
        >
          <Icon icon="material-symbols:logout-rounded" />
        </button>
      </div>
    {/if}
  </div>
</header>

<main>
  {#if isLoadingConfig}
    <div class="cms-global-loading">
      <Icon icon="svg-spinners:ring-resize" />
      <p>Cargando configuración...</p>
    </div>
  {:else if !isLoggedIn}
    <Login onLoginSuccess={handleLoginSuccess} />
  {:else if currentView === "dashboard"}
    <Dashboard
      {githubToken}
      isMock={isMock}
      {cmsConfig}
      onEditPost={handleEditPost}
      onNewPost={handleNewPost}
    />
  {:else if currentView === "editor"}
    <Editor
      {githubToken}
      isMock={isMock}
      {cmsConfig}
      post={postToEdit}
      onPostSaved={handleDashboardClick}
      onPostCancelled={handleDashboardClick}
    />
  {/if}
  <ToastProvider />
</main>

<style>
  .cms-global-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
    gap: 1rem;
    color: var(--primary);
  }
  .cms-global-loading p {
    font-weight: 600;
    opacity: 0.7;
  }
  #navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4.5rem;
    background: var(--bg-glass);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid var(--line-divider);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-inner {
    width: 90%;
    max-width: none;
    padding: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: var(--text-primary);
    font-weight: 800;
    font-size: 1.25rem;
    transition: all 0.2s;
  }

  .logo-link:hover {
    transform: translateY(-1px);
    opacity: 0.8;
  }

  .logo-icon-container {
    color: var(--primary);
    display: flex;
    align-items: center;
  }

  .cms-btn-icon {
    width: 2.75rem;
    height: 2.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    background: var(--btn-regular-bg);
    border: 1px solid var(--line-divider);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.5rem;
  }

  .cms-btn-icon:hover {
    background: var(--card-bg);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .btn-logout {
    color: #ef4444 !important;
    border-color: rgba(239, 68, 68, 0.2) !important;
  }

  main {
    min-height: 100vh;
    padding-top: 4.5rem;
    display: flex;
    flex-direction: column;
    width: 100%;
    background: var(--page-bg);
  }
</style>
