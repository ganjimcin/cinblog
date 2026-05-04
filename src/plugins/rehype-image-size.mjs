import { visit } from "unist-util-visit";

/**
 * Rehype plugin to support image resizing using the syntax ![alt|size](url)
 * It extracts the size from the alt text and applies it as a width property.
 */
export function rehypeImageSize() {
    return (tree) => {
        visit(tree, "element", (node) => {
            if (node.tagName === "img") {
                const alt = node.properties.alt;
                if (alt && alt.includes("|")) {
                    const parts = alt.split("|");
                    const newAlt = parts[0].trim();
                    const size = parts[parts.length - 1].trim(); // Take the last part as size
                    
                    if (size && ( /^\d+$/.test(size) || /^\d+(px|em|rem|%|vw|vh)$/.test(size) )) {
                        node.properties.alt = newAlt;
                        const width = /^\d+$/.test(size) ? `${size}px` : size;
                        
                        node.properties.width = size.replace(/[^0-9]/g, '');
                        node.properties.style = node.properties.style 
                            ? `${node.properties.style}; width: ${width}; height: auto;`
                            : `width: ${width}; height: auto;`;
                    }
                }
            }
        });
    };
}
