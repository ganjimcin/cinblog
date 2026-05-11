import { visit } from "unist-util-visit";

/**
 * Remark plugin to replace curly quotes with straight quotes.
 * This helps remark-directive parse attributes correctly when they
 * are copied from rich text editors.
 */
export function remarkFixQuotes() {
    return (tree) => {
        visit(tree, "text", (node) => {
            // Only process if it looks like a directive with attributes
            if (node.value.includes(":::") && node.value.includes("{") && node.value.includes("}")) {
                // 1. Normalize curly quotes
                node.value = node.value.replace(/[“”]/g, '"');
                
                // 2. Normalize commas in attributes (remark-directive expects spaces)
                // We find the content inside { } and replace commas with spaces
                node.value = node.value.replace(/\{([^{}]+)\}/g, (match, attrs) => {
                    return '{' + attrs.replace(/,/g, ' ') + '}';
                });
            }
        });
    };
}
