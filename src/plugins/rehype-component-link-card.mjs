/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * Creates a Link Card component.
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} properties.url - The URL of the link.
 * @param {string} [properties.title] - The title of the link.
 * @param {string} [properties.desc] - The description of the link.
 * @param {string} [properties.img] - An optional preview image URL.
 * @param {import('mdast').RootContent[]} children - The children elements (ignored for this component).
 * @returns {import('mdast').Parent} The created Link Card component.
 */
export function LinkCardComponent(properties, children) {
    const url = properties.url;
    if (!url) {
        return h("div", { class: "hidden" }, 'Invalid link. ("url" attribute is required)');
    }

    const title = properties.title || url;
    const desc = properties.desc || "";
    const img = properties.img || "";
    
    // Extract domain for the bottom label
    let domain = "";
    try {
        domain = new URL(url).hostname;
    } catch (e) {
        domain = url;
    }

    const cardUuid = `LC${Math.random().toString(36).slice(-6)}`;

    const nTitle = h("div", { class: "lc-title" }, title);
    const nDesc = h("div", { class: "lc-desc" }, desc);
    const nUrl = h("div", { class: "lc-url-container" }, [
        h("img", { 
            class: "lc-favicon", 
            src: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
            alt: "" 
        }),
        h("span", { class: "lc-domain" }, domain)
    ]);

    const nTextContent = h("div", { class: "lc-text" }, [
        nTitle,
        nDesc,
        nUrl
    ]);

    const nImage = img ? h("div", { class: "lc-image-container" }, [
        h("img", { class: "lc-image", src: img, alt: title })
    ]) : null;

    return h(
        `a#${cardUuid}-card`,
        {
            class: `card-link no-styling ${img ? 'has-image' : 'no-image'}`,
            href: url,
            target: "_blank",
            rel: "noopener noreferrer"
        },
        [
            nTextContent,
            nImage
        ].filter(Boolean)
    );
}
