<script>
  import { formatDate } from "../utils/formatter";
  import Icon from "../../common/Icon.svelte";
  let { post, layout = "grid", onEdit } = $props();
</script>

<div
  class="cms-post-card"
  class:list-layout={layout === "list"}
  onclick={() => onEdit(post)}
  onkeydown={(e) => (e.key === "Enter" || e.key === " ") && onEdit(post)}
  role="button"
  tabindex="0"
>
  <div class="cms-post-card-content">
    {#if (post.fm.cover || post.fm.image) && layout === "grid"}
      <div class="cms-post-card-thumbnail">
        <img src={post.fm.cover || post.fm.image} alt={post.fm.title} loading="lazy" />
      </div>
    {/if}

    <div class="cms-post-card-header">
      <div class="cms-post-card-title-row">
        <h3 class="cms-post-card-title">
          {post.fm.title || post.name}
        </h3>
        <div class="cms-post-card-badges">
          {#if post.fm.pinned}
            <span class="badge badge-pinned" title="Fijado">
              <Icon icon="material-symbols:keep-outline-rounded" />
            </span>
          {/if}
          {#if post.fm.draft}
            <span class="badge badge-draft">Borrador</span>
          {:else}
            <span class="badge badge-published">Publicado</span>
          {/if}
        </div>
      </div>
      <div class="cms-post-card-meta">
        <span class="cms-post-date">{formatDate(post.fm.published)}</span>
        <span class="cms-post-dot">·</span>
        <span class="cms-post-category"
          >{post.fm.category || "Sin categoría"}</span
        >
      </div>
    </div>
    
    {#if layout === "grid"}
      <p class="cms-post-card-desc">
        {post.fm.description || "Sin descripción disponible."}
      </p>
    {/if}
  </div>
</div>

<style>
  .cms-post-card {
    background: var(--card-bg);
    border: 1px solid var(--line-divider);
    border-radius: var(--radius-large);
    padding: 2rem;
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
    position: relative;
    overflow: hidden;
  }

  .cms-post-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--primary);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .cms-post-card:hover {
    border-color: var(--primary);
    transform: translateY(-6px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
  }

  .cms-post-card:hover::before {
    opacity: 1;
  }

  .cms-post-card.list-layout {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2.5rem;
  }

  .cms-post-card-title {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 850;
    line-height: 1.3;
    color: var(--text-primary);
    transition: color 0.2s;
  }

  .cms-post-card:hover .cms-post-card-title {
    color: var(--primary);
  }

  .cms-post-card-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
    opacity: 0.6;
    font-weight: 600;
    margin-top: 0.5rem;
  }

  .cms-post-card-desc {
    font-size: 0.95rem;
    opacity: 0.7;
    line-height: 1.7;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: var(--text-primary);
  }

  /* New UX Phase 2 Styles */
  .cms-post-card-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
  }

  .cms-post-card-thumbnail {
    width: 100%;
    height: 180px;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--btn-regular-bg);
  }

  .cms-post-card-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .cms-post-card:hover .cms-post-card-thumbnail img {
    transform: scale(1.05);
  }

  .cms-post-card-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .cms-post-card-badges {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .badge {
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.25rem 0.6rem;
    border-radius: 2rem;
    white-space: nowrap;
  }

  .badge-draft {
    background: oklch(from var(--primary) l c h / 0.1);
    color: var(--primary);
    border: 1px solid oklch(from var(--primary) l c h / 0.2);
  }

  .badge-published {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .badge-pinned {
    color: #f59e0b;
    font-size: 1.25rem;
    padding: 0;
  }

  .cms-post-dot {
    opacity: 0.5;
  }
</style>
