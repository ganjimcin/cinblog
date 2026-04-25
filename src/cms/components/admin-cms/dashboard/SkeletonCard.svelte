<script>
  let { layout = "grid" } = $props();
</script>

<div class="skeleton-card" class:list-layout={layout === "list"}>
  {#if layout === "grid"}
    <div class="skeleton-thumbnail shimmer"></div>
  {/if}
  <div class="skeleton-header">
    <div class="skeleton-title shimmer"></div>
    <div class="skeleton-meta shimmer"></div>
  </div>
  {#if layout === "grid"}
    <div class="skeleton-desc shimmer"></div>
    <div class="skeleton-desc shimmer" style="width: 60%"></div>
  {/if}
</div>

<style>
  .skeleton-card {
    background: var(--card-bg);
    border: 1px solid var(--line-divider);
    border-radius: var(--radius-large);
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    height: 100%;
  }

  .skeleton-card.list-layout {
    flex-direction: row;
    padding: 1.5rem 2.5rem;
    align-items: center;
    gap: 2rem;
  }

  .shimmer {
    background: linear-gradient(
      90deg,
      var(--btn-regular-bg) 25%,
      var(--line-divider) 50%,
      var(--btn-regular-bg) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .skeleton-thumbnail {
    width: 100%;
    height: 180px;
    border-radius: var(--radius-md);
  }

  .skeleton-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }

  .skeleton-title {
    height: 1.5rem;
    width: 80%;
  }

  .skeleton-meta {
    height: 0.8rem;
    width: 40%;
  }

  .skeleton-desc {
    height: 0.9rem;
    width: 100%;
  }
</style>
