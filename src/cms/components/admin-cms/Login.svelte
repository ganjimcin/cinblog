<script>
    import { onMount, tick } from "svelte";
    import Icon from "../common/Icon.svelte";
    import { TURNSTILE_SITE_KEY } from "../../constants/config";
    import { getDeviceID } from "./utils/device";

    let { onLoginSuccess } = $props();
    let githubTokenInput = $state("");
    let turnstileToken = $state("");
    let isTransitioning = $state(false);

    onMount(() => {
        if (TURNSTILE_SITE_KEY && window.turnstile) {
            window.turnstile.render("#turnstile-widget", {
                sitekey: TURNSTILE_SITE_KEY,
                callback: (token) => {
                    turnstileToken = token;
                },
                theme: "dark"
            });
        }
    });

    async function handleLogin() {
        const token = githubTokenInput.trim();
        if (token) {
            if (TURNSTILE_SITE_KEY && !turnstileToken) {
                alert("Por favor, completa el reto de seguridad (CAPTCHA).");
                return;
            }

            isTransitioning = true;
            
            // Simular un poco de delay para la animación de entrada
            await new Promise(r => setTimeout(r, 600));

            const deviceKey = await getDeviceID();
            const encrypted = CryptoJS.AES.encrypt(token, deviceKey).toString();
            localStorage.setItem("github_pat_encrypted", encrypted);
            
            if (onLoginSuccess) onLoginSuccess({ token });
        }
    }

    const isLoginDisabled = $derived(
        !githubTokenInput.trim() || (!!TURNSTILE_SITE_KEY && !turnstileToken)
    );
</script>

<div id="login-screen" class:transitioning={isTransitioning}>
    <div class="login-bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
    </div>

    <div class="login-container">
        <div class="login-card onload-animation">
            <div class="login-card-inner">
                <div class="logo-area">
                    <div class="logo-icon-wrapper">
                        <Icon icon="material-symbols:eco-outline" class="logo-icon" />
                    </div>
                    <h1 class="login-title">Admin Console</h1>
                    <p class="login-subtitle">Accede para gestionar tu contenido</p>
                </div>

                <div class="login-form">
                    <div class="input-group">
                        <label for="github-token" class="input-label">GitHub personal token</label>
                        <div class="input-wrapper">
                            <input
                                type="password"
                                id="github-token"
                                bind:value={githubTokenInput}
                                placeholder="ghp_xxxxxxxxxxxx"
                                class="login-input"
                            />
                        </div>
                    </div>

                    {#if TURNSTILE_SITE_KEY}
                        <div class="turnstile-container">
                            <div id="turnstile-widget"></div>
                        </div>
                    {/if}

                    <div class="actions-area">
                        <button
                            onclick={handleLogin}
                            class="login-btn-primary"
                            disabled={isLoginDisabled || isTransitioning}
                        >
                            {#if isTransitioning}
                                <Icon icon="svg-spinners:ring-resize" class="mr-2" />
                                Entrando...
                            {:else}
                                <Icon icon="material-symbols:check-circle" class="mr-2" />
                                Iniciar Sesión
                            {/if}
                        </button>

                        <!--
                        <div class="divider">
                            <span>o también</span>
                        </div>

                        <button
                            onclick={() => {
                                isTransitioning = true;
                                setTimeout(() => onLoginSuccess?.({ token: 'mock-token', isMock: true }), 600);
                            }}
                            class="login-btn-secondary"
                            disabled={isTransitioning}
                        >
                            <Icon icon="material-symbols:dashboard-outline-rounded" class="mr-2" />
                            Modo de Prueba Local
                        </button>
                        -->
                    </div>
                </div>

                <footer class="login-footer">
                    <Icon icon="material-symbols:lock-person-outline-rounded" class="footer-icon" />
                    Tus credenciales nunca salen de tu navegador
                </footer>
            </div>
        </div>
    </div>
</div>

<style>
    #login-screen {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--page-bg);
        overflow: hidden;
        z-index: 9999;
        transition: opacity 0.6s ease;
    }

    #login-screen.transitioning {
        opacity: 0;
        pointer-events: none;
    }

    /* Background Shapes */
    .login-bg-shapes {
        position: absolute;
        inset: 0;
        z-index: -1;
        filter: blur(140px);
        opacity: 0.45;
    }

    .shape {
        position: absolute;
        border-radius: 50%;
        animation: float-shapes 25s infinite alternate ease-in-out;
    }

    .shape-1 {
        width: 300px;
        height: 300px;
        background: var(--primary);
        top: -100px;
        right: -100px;
    }

    .shape-2 {
        width: 600px;
        height: 600px;
        background: #f59e0b;
        bottom: -200px;
        left: -200px;
        animation-delay: -8s;
    }

    .shape-3 {
        width: 400px;
        height: 400px;
        background: #3b82f6;
        bottom: 10%;
        right: 20%;
        animation-delay: -12s;
    }

    @keyframes float-shapes {
        from { transform: translate(0, 0) scale(1); }
        to { transform: translate(40px, 40px) scale(1.1); }
    }

    .login-container {
        width: 100%;
        max-width: 440px;
        padding: 1.5rem;
    }

    .login-card {
        background: var(--bg-glass);
        backdrop-filter: blur(24px);
        border: 1px solid var(--line-divider);
        border-radius: 2rem;
        padding: 3rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
    }

    .logo-area {
        text-align: center;
        margin-bottom: 2.5rem;
    }

    .logo-icon-wrapper {
        width: 4.5rem;
        height: 4.5rem;
        background: var(--btn-regular-bg);
        color: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 1.25rem;
        margin: 0 auto 1.5rem;
        font-size: 2.5rem;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
    }

    .login-title {
        font-size: 1.75rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }

    .login-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        opacity: 0.8;
    }

    .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .input-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding-left: 0.25rem;
        color: var(--text-secondary);
    }

    .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
    }

    .login-input {
        width: 100%;
        background: var(--input-bg);
        border: 1px solid var(--line-divider);
        padding: 0.875rem 1.25rem;
        border-radius: 0.75rem;
        color: var(--text-primary);
        font-size: 1rem;
        transition: all 0.2s;
        outline: none;
    }

    .login-input:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 4px oklch(from var(--primary) l c h / 0.1);
    }

    .turnstile-container {
        display: flex;
        justify-content: center;
        margin: -0.5rem 0;
    }

    .actions-area {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .login-btn-primary {
        background: var(--primary);
        color: white;
        border: none;
        padding: 1rem;
        border-radius: 0.75rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 1rem;
    }

    .login-btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(0.5);
    }

    .login-btn-primary:not(:disabled):hover {
        filter: brightness(1.1);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px oklch(from var(--primary) l c h / 0.3);
    }

    .divider {
        display: flex;
        align-items: center;
        gap: 1rem;
        color: var(--text-secondary);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        opacity: 0.3;
        margin: 0.5rem 0;
    }

    .divider::before, .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--line-divider);
    }

    .login-btn-secondary {
        background: transparent;
        color: var(--text-primary);
        border: 1px solid var(--line-divider);
        padding: 0.875rem;
        border-radius: 0.75rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.9375rem;
    }

    .login-btn-secondary:hover {
        background: var(--btn-regular-bg);
        border-color: var(--text-secondary);
    }

    .login-footer {
        margin-top: 2.5rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        opacity: 0.6;
    }

    :global(.mr-2) { margin-right: 0.5rem; }

    /* Animation */
    .onload-animation {
        animation: card-appear 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes card-appear {
        from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
</style>
