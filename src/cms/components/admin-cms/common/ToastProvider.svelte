<script>
  import { toasts, toastStore } from "../stores/toastStore";
  import Icon from "../../common/Icon.svelte";
  import { flip } from "svelte/animate";
  import { fade, fly } from "svelte/transition";
</script>

<div class="toast-container">
  {#each $toasts as toast (toast.id)}
    <div 
      class="toast-item {toast.type}"
      animate:flip={{ duration: 300 }}
      in:fly={{ y: 20, opacity: 0, duration: 400 }}
      out:fade={{ duration: 200 }}
    >
      <div class="toast-icon">
        {#if toast.type === 'success'}
          <Icon icon="material-symbols:check-circle-rounded" />
        {:else if toast.type === 'error'}
          <Icon icon="material-symbols:error-rounded" />
        {:else if toast.type === 'warning'}
          <Icon icon="material-symbols:warning-rounded" />
        {:else}
          <Icon icon="material-symbols:info-rounded" />
        {/if}
      </div>
      <div class="toast-message">{toast.message}</div>
      <button class="toast-close" onclick={() => toastStore.remove(toast.id)}>
        <Icon icon="material-symbols:close-rounded" />
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    z-index: 10000;
    pointer-events: none;
    max-width: 400px;
  }

  .toast-item {
    pointer-events: auto;
    background: var(--bg-glass);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--line-divider);
    padding: 1rem 1.25rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    color: var(--text-primary);
  }

  .toast-icon {
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .toast-item.success .toast-icon { color: #10b981; }
  .toast-item.error .toast-icon { color: #ef4444; }
  .toast-item.warning .toast-icon { color: #f59e0b; }
  .toast-item.info .toast-icon { color: var(--primary); }

  .toast-message {
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.4;
    flex: 1;
  }

  .toast-close {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    opacity: 0.5;
  }

  .toast-close:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.05);
  }

  :global(.dark) .toast-close:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
