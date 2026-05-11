import { visit } from "unist-util-visit";
import { h } from "hastscript";

export function parseDirectiveNode() {
    console.log('[Plugin Initialized]: remark-directive-rehype (Passive Mode)');
    return (tree) => {
        if (!tree) return;
        
        // Procesado estándar de directivas (detectadas nativamente por remark-directive)
        visit(tree, (node) => {
            if (
                node.type === "containerDirective" ||
                node.type === "leafDirective" ||
                node.type === "textDirective"
            ) {
                if (!node.data) node.data = {};
                node.data.hName = node.name;
                node.data.hProperties = node.attributes || {};
                console.log(`[Standard Directive]: ${node.name} (${node.type})`);
            }
        });
    };
}