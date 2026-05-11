/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * Creates an admonition component.
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} [properties.title] - An optional title.
 * @param {('tip'|'note'|'important'|'caution'|'warning')} type - The admonition type.
 * @param {import('mdast').RootContent[]} children - The children elements of the component.
 * @returns {import('mdast').Parent} The created admonition component.
 */
export function AdmonitionComponent(properties, children, type) {
    console.log(`[AdmonitionComponent]: Rendering type "${type}"`, { props: properties, childrenCount: children?.length });
    if (!Array.isArray(children) || children.length === 0)
        return h(
            "div",
            { class: "hidden" },
            'Invalid admonition directive. (Admonition directives must be of block type ":::note{name="name"} <content> :::")',
        );

    let label = null;
    if (properties?.["has-directive-label"]) {
        label = children[0]; // The first child is the label
        // biome-ignore lint/style/noParameterAssign: <check later>
        children = children.slice(1);
        label.tagName = "div"; // Change the tag <p> to <div>
    }

    // Safety: Remove trailing ":::" from the last child if it's text
    if (children.length > 0) {
        const lastChild = children[children.length - 1];
        if (lastChild.type === "text" && lastChild.value.trim().endsWith(":::")) {
            lastChild.value = lastChild.value.trim().slice(0, -3).trim();
        } else if (lastChild.children?.length > 0) {
            // Also check nested last child (e.g. inside a <p>)
            const lastNested = lastChild.children[lastChild.children.length - 1];
            if (lastNested.type === "text" && lastNested.value.trim().endsWith(":::")) {
                lastNested.value = lastNested.value.trim().slice(0, -3).trim();
            }
        }
    }

    if (type === "spoiler") {
        return h("details", { class: "admonition bdm-spoiler" }, [
            h("summary", { class: "bdm-title" }, label ? label : "SPOILER (Clic para revelar)"),
            h("div", { class: "bdm-content" }, children),
        ]);
    }

    if (type === "indent") {
        return h("div", { class: "admonition bdm-indent" }, children);
    }

    return h("blockquote", { class: `admonition bdm-${type}` }, [
        h("span", { class: "bdm-title" }, label ? label : type.toUpperCase()),
        ...children,
    ]);
}
