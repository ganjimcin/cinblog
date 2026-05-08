<script lang="ts">
import { onMount } from "svelte";

import { getPostUrl } from "@utils/url";
import { getCategoryPathLabel, getCategoryPathParts, isBookCategory } from "@utils/category";
import { parseTags } from "@utils/tag";
import { i18n } from "@i18n/translation";
import I18nKey from "@i18n/i18nKey";


interface Post {
    id: string;
    data: {
        title: string;
        tags: string[];
        category?: string | string[] | null;
        published: Date | string;
        routeName?: string;
        book?: {
            id?: string;
            chapter?: number;
            part?: number;
            saga?: string;
            title?: string;
        };
    };
}

interface Group {
    year: number;
    posts: Post[];
}

interface Props {
    sortedPosts?: Post[];
    initialCategories?: string[];
    initialTags?: string[];
    initialUncategorized?: string | null;
}

let { 
    sortedPosts = [], 
    initialCategories = [], 
    initialTags = [], 
    initialUncategorized = null 
}: Props = $props();

let tags = $state<string[]>(initialTags);
let categories = $state<string[]>(initialCategories);
let uncategorized = $state<string | null>(initialUncategorized);

onMount(() => {
    // Sincronizar con la URL real en caso de que cambie dinámicamente
    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
        tags = params.has("tag") ? params.getAll("tag") : [];
        categories = params.has("category") ? params.getAll("category") : [];
        uncategorized = params.get("uncategorized");
    }
});

function formatDate(date: Date | string) {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${month}-${day}`;
}

function formatTag(tagList: string[]) {
    return tagList.map((t) => `#${t}`).join(" ");
}

function isCategoryMatch(category: string | string[] | null | undefined, targets: string[]) {
    const postParts = getCategoryPathParts(category);
    if (!postParts || postParts.length === 0) return false;
    return targets.some((target) => {
        const targetParts = target
            .split(" / ")
            .map((part) => part.trim())
            .filter((part) => part.length > 0);
        if (targetParts.length === 0) return false;
        if (targetParts.length > postParts.length) return false;
        return targetParts.every((part, index) => part === postParts[index]);
    });
}

let groups = $derived.by(() => {
    let filteredPosts = sortedPosts.map((post) => ({
        ...post,
        data: {
            ...post.data,
            published: new Date(post.data.published),
        },
    }));

    if (tags.length > 0) {
        filteredPosts = filteredPosts.filter(
            (post) =>
            {
                const postTags = parseTags(post.data.tags);
                return postTags.some((tag) => tags.includes(tag));
            }
        );
    }

    if (categories.length > 0) {
        filteredPosts = filteredPosts.filter(
            (post) => isCategoryMatch(post.data.category, categories),
        );
    }

    if (uncategorized !== null) {
        filteredPosts = filteredPosts.filter((post) => !getCategoryPathLabel(post.data.category));
    }

    // Si estamos filtrando por una categoría de libro, ordenar ascendente (Capítulo 1 primero)
    // De lo contrario, mantener el orden descendente habitual del blog
    const isBook = categories.length === 1 && isBookCategory(categories[0]);

    filteredPosts = filteredPosts.slice().sort((a, b) => {
        if (isBook) {
            return a.data.published.getTime() - b.data.published.getTime();
        }
        return b.data.published.getTime() - a.data.published.getTime();
    });

    if (isBook) {
        // En modo libro, no agrupamos por año, sino que tratamos todo como una sola secuencia
        return [{
            year: 0, // Ignorado en el renderizado de modo libro
            posts: filteredPosts
        }];
    }

    const grouped = filteredPosts.reduce(
        (acc, post) => {
            const year = post.data.published.getFullYear();
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(post);
            return acc;
        },
        {} as Record<number, Post[]>,
    );

    const groupedPostsArray = Object.keys(grouped).map((yearStr) => ({
        year: Number.parseInt(yearStr, 10),
        posts: grouped[Number.parseInt(yearStr, 10)],
    }));

    groupedPostsArray.sort((a, b) => b.year - a.year);

    return groupedPostsArray;
});
</script>

<div>
    {#each groups as group}
        <div>
            {#if group.year > 0}
                <div class="flex flex-row w-full items-center h-15">
                    <div class="w-[15%] md:w-[10%] transition text-2xl font-bold text-right text-75">
                        {group.year}
                    </div>
                    <div class="w-[15%] md:w-[10%]">
                        <div class="h-3 w-3 bg-none rounded-full outline-solid outline-(--primary) mx-auto outline-offset-2 z-50 outline-3"></div>
                    </div>
                    <div class="w-[70%] md:w-[80%] transition text-left text-50">
                        {group.posts.length} {i18n(group.posts.length === 1 ? I18nKey.postCount : I18nKey.postsCount)}
                    </div>
                </div>
            {:else}
                <!-- Book Mode: Visual Title for the Story -->
                <div class="flex flex-row w-full items-center h-16 mb-6">
                    <div class="w-[15%] md:w-[10%] text-right pr-4">
                        <div class="inline-block p-2 rounded-lg bg-(--primary) text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M6.5 2h11c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2h-11c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2m0 2v16h11V4h-11m2 3h7v2h-7V7m0 4h7v2h-7v-2m0 4h7v2h-7v-2Z"/></svg>
                        </div>
                    </div>
                    <div class="flex-1 text-left">
                        <h2 class="text-2xl font-bold text-90">{categories[0]}</h2>
                        <p class="text-sm text-50 italic">{group.posts.length} capítulos publicados</p>
                    </div>
                </div>
            {/if}

            {#each group.posts as post, i}
                <a href={getPostUrl(post)}
                    aria-label={post.data.title}
                    class="group btn-plain block! h-12 w-full rounded-lg hover:text-[initial] mb-1"
                >
                    <div class="flex flex-row justify-start items-center h-full">
                        <!-- date or chapter index -->
                        <div class="w-[15%] md:w-[10%] transition text-sm text-right text-50 font-mono">
                            {#if group.year > 0}
                                {formatDate(post.data.published)}
                            {:else if post.data.book && (post.data.book.chapter || post.data.book.part)}
                                {post.data.book.chapter ? `Cap. ${post.data.book.chapter}` : ""}
                                {post.data.book.part ? ` (${post.data.book.part})` : ""}
                            {:else}
                                Cap. {i + 1}
                            {/if}
                        </div>
                        <!-- dot and line -->
                        <div class="w-[15%] md:w-[10%] relative dash-line h-full flex items-center">
                            <div class="transition-all mx-auto w-1.5 h-1.5 rounded-full group-hover:scale-125
                                bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-(--primary)
                                outline-4 z-50
                                outline-(--card-bg)
                                group-hover:outline-(--btn-plain-bg-hover)
                                group-active:outline-(--btn-plain-bg-active)"
                            ></div>
                        </div>
                        <!-- post title -->
                        <div class="w-[70%] md:max-w-[65%] md:w-[65%] text-left font-bold
                            group-hover:translate-x-1 transition-all group-hover:text-(--primary)
                            text-75 pr-8 whitespace-nowrap text-ellipsis overflow-hidden"
                        >
                            {post.data.title}
                            {#if post.data.book?.saga}
                                <span class="ml-2 text-xs font-normal text-30 italic">[{post.data.book.saga}]</span>
                            {/if}
                        </div>
                        <!-- tag list -->
                        <div class="hidden md:block md:w-[15%] text-left text-sm transition whitespace-nowrap text-ellipsis overflow-hidden text-30"
                        >
                            {formatTag(post.data.tags)}
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/each}
</div>