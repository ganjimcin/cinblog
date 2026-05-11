/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * Creates a Movie Card component.
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} properties.title - The title of the movie.
 * @param {string} properties.originalTitle - The original title.
 * @param {string} properties.age - Age rating.
 * @param {string} properties.recAge - Recommended age.
 * @param {string} properties.cover - Cover image URL.
 * @param {string} properties.imdbId - IMDb ID.
 * @param {string} properties.url - Alternative URL.
 * @returns {import('mdast').Parent} The created Movie Card component.
 */
export function MovieCardComponent(properties) {
    // Helper to clean quotes
    const cleanValue = (val) => {
        if (typeof val !== 'string') return val;
        return val.replace(/^[“”"']+|[“”"']+$/g, "").trim();
    };

    const title = cleanValue(properties.title) || "Título";
    const originalTitle = cleanValue(properties.originalTitle) || title;
    const age = cleanValue(properties.age) || "";
    const recAge = cleanValue(properties.recAge) || "";
    const imdbId = cleanValue(properties.imdbId) || "";
    
    let coverUrl = cleanValue(properties.cover || properties.url) || "";
    
    let linkUrl = properties.url || "#";
    if (linkUrl === "#" && imdbId) {
        linkUrl = `https://www.imdb.com/title/${imdbId}`;
    }

    return h("div", { class: "card-movie" }, [
        h("a", { href: linkUrl, target: "_blank", class: "card-movie-link no-styling" }, [
            h("div", { 
                class: "movie-poster", 
                style: coverUrl ? `background-image: url('${coverUrl}')` : "" 
            }, [
                h("div", { class: "movie-poster-overlay" })
            ]),
            h("div", { class: "movie-details" }, [
                h("div", { class: "movie-header" }, [
                    h("div", { class: "movie-title-row" }, [
                        h("h3", { class: "movie-card-title" }, title),
                        h("div", { class: "movie-badges-col" }, [
                            age ? h("span", { class: "movie-age-badge" }, age) : null,
                            recAge ? h("span", { class: "movie-rec-age-badge", title: "Edad recomendada" }, `⭐ ${recAge}`) : null,
                        ].filter(Boolean))
                    ]),
                    h("div", { class: "movie-original-title" }, originalTitle)
                ])
            ])
        ])
    ]);
}
