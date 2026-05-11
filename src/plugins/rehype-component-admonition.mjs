import { h } from "hastscript";

export function AdmonitionComponent(properties, children, type = "note") {
    const title = properties.title || type.toUpperCase();
    
    if (type === "spoiler") {
        return h("details", { class: "callout callout-spoiler", "data-callout": "spoiler" }, [
            h("summary", { class: "callout-title" }, [
                h("div", { class: "callout-icon" }),
                h("div", { class: "callout-title-inner" }, title)
            ]),
            h("div", { class: "callout-content" }, children)
        ]);
    }
    
    return h("div", { class: "callout", "data-callout": type }, [
        h("div", { class: "callout-title" }, [
            h("div", { class: "callout-icon" }),
            h("div", { class: "callout-title-inner" }, title)
        ]),
        h("div", { class: "callout-content" }, children)
    ]);
}
