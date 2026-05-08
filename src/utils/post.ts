import { type CollectionEntry, getCollection } from "astro:content";

import { CATEGORY_SEPARATOR, type CategoryPath, getCategoryPathParts, getCategoryPathLabel, isBookCategory } from "@utils/category";
export { isBookCategory };
import { parseTags, type Tag } from "@utils/tag";
import { getCategoryUrl } from "@utils/url";
import { i18n } from "@i18n/translation";
import I18nKey from "@i18n/i18nKey";



// // Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
    const allBlogPosts = await getCollection("posts", ({ data }) => {
        return import.meta.env.PROD ? data.draft !== true : true;
    });

    const sorted = allBlogPosts.sort((a, b) => {
        // 首先按置顶状态排序，置顶文章在前
        if (a.data.pinned && !b.data.pinned) return -1;
        if (!a.data.pinned && b.data.pinned) return 1;

        // 如果置顶状态相同，则按发布日期排序
        const dateA = new Date(a.data.published);
        const dateB = new Date(b.data.published);
        return dateA > dateB ? -1 : 1;
    });
    return sorted;
}

export async function getSortedPosts() {
    const allPosts = await getRawSortedPosts();

    for (const post of allPosts) {
        const category = post.data.category;
        
        if (isBookCategory(category)) {
            // Para libros, la navegación es cronológica dentro de la misma categoría
            const categoryPosts = allPosts
                .filter(p => getCategoryPathLabel(p.data.category) === getCategoryPathLabel(category))
                .sort((a, b) => {
                    // Priorizar orden por capítulo y parte si existe la info de libro
                    if (a.data.book && b.data.book) {
                        if (a.data.book.chapter !== b.data.book.chapter) {
                            return (a.data.book.chapter ?? 0) - (b.data.book.chapter ?? 0);
                        }
                        if (a.data.book.part !== b.data.book.part) {
                            return (a.data.book.part ?? 0) - (b.data.book.part ?? 0);
                        }
                    }
                    // Si no hay info de libro o es la misma, usar fecha (ascendente para libros)
                    const dateA = new Date(a.data.published);
                    const dateB = new Date(b.data.published);
                    return dateA > dateB ? 1 : -1;
                });
            
            const index = categoryPosts.findIndex(p => p.id === post.id);
            if (index > 0) {
                post.data.nextSlug = categoryPosts[index - 1].id;
                post.data.nextTitle = categoryPosts[index - 1].data.title;
            }
            if (index < categoryPosts.length - 1) {
                post.data.prevSlug = categoryPosts[index + 1].id;
                post.data.prevTitle = categoryPosts[index + 1].data.title;
            }
        } else {
            // Navegación global por defecto (descendente)
            const index = allPosts.findIndex(p => p.id === post.id);
            if (index < allPosts.length - 1) {
                post.data.prevSlug = allPosts[index + 1].id;
                post.data.prevTitle = allPosts[index + 1].data.title;
            }
            if (index > 0) {
                post.data.nextSlug = allPosts[index - 1].id;
                post.data.nextTitle = allPosts[index - 1].data.title;
            }
        }
    }

    return allPosts;
}
export type PostForList = {
    id: string;
    data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
    const sortedFullPosts = await getRawSortedPosts();

    // delete post.body
    const sortedPostsList = sortedFullPosts.map((post) => ({
        id: post.id,
        data: post.data,
    }));

    return sortedPostsList;
}
export async function getTagList(): Promise<Tag[]> {
    const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
        return import.meta.env.PROD ? data.draft !== true : true;
    });

    const countMap: { [key: string]: number } = {};
    allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
        const tags = parseTags(post.data.tags);
        tags.forEach((tag: string) => {
            if (!countMap[tag]) countMap[tag] = 0;
            countMap[tag]++;
        });
    });

    // sort tags
    const keys: string[] = Object.keys(countMap).sort((a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
    name: string;
    count: number;
    url: string;
};

export type CategoryTreeItem = {
    name: string;
    count: number;
    url: string;
    path: CategoryPath;
    children: CategoryTreeItem[];
};

export async function getCategoryList(): Promise<Category[]> {
    const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
        return import.meta.env.PROD ? data.draft !== true : true;
    });
    const count: { [key: string]: number } = {};
    allBlogPosts.forEach((post: { data: { category: string | string[] | null } }) => {
        const categoryParts = getCategoryPathParts(post.data.category);
        if (!categoryParts) {
            const ucKey = i18n(I18nKey.uncategorized);
            count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
            return;
        }

        const categoryName = categoryParts.join(CATEGORY_SEPARATOR);
        count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
    });

    const lst = Object.keys(count).sort((a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    const ret: Category[] = [];
    for (const c of lst) {
        ret.push({
            name: c,
            count: count[c],
            url: getCategoryUrl(c),
        });
    }
    return ret;
}

export async function getCategoryTree(): Promise<CategoryTreeItem[]> {
    const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
        return import.meta.env.PROD ? data.draft !== true : true;
    });

    type CategoryTreeInternal = {
        name: string;
        count: number;
        path: CategoryPath;
        children: Map<string, CategoryTreeInternal>;
    };

    const root = new Map<string, CategoryTreeInternal>();
    const uncategorizedKey = i18n(I18nKey.uncategorized);

    for (const post of allBlogPosts) {
        const rawParts = getCategoryPathParts(post.data.category);
        const categoryParts = rawParts && rawParts.length > 0 ? rawParts : [uncategorizedKey];
        let currentLevel = root;
        let currentPath: string[] = [];

        for (const rawName of categoryParts) {
            const name = rawName.trim();
            if (!name) continue;
            currentPath = [...currentPath, name];
            let node = currentLevel.get(name);
            if (!node) {
                node = {
                    name,
                    count: 0,
                    path: currentPath,
                    children: new Map<string, CategoryTreeInternal>(),
                };
                currentLevel.set(name, node);
            }
            node.count += 1;
            currentLevel = node.children;
        }
    }

    const buildTree = (level: Map<string, CategoryTreeInternal>): CategoryTreeItem[] => {
        const sorted = Array.from(level.values()).sort((a, b) =>
            a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
        );
        return sorted.map((node) => ({
            name: node.name,
            count: node.count,
            path: node.path,
            url: getCategoryUrl(node.path),
            children: buildTree(node.children),
        }));
    };

    return buildTree(root);
}