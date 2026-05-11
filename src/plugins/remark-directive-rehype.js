import { visit } from "unist-util-visit";
import { h } from "hastscript";

export function parseDirectiveNode() {
    console.log('[Plugin Initialized]: remark-directive-rehype (Passive Mode with Normalization)');
    return (tree) => {
        if (!tree) return;

        // 1. Normalización de comillas en posibles directivas
        // Esto corrige casos donde se copian comillas inteligentes de Word/iOS/Android
        visit(tree, "text", (node) => {
            if (node.value && node.value.includes(":::")) {
                // Solo normalizamos las comillas si la línea parece una directiva (empieza por :::)
                // para no alterar el texto literario del post
                const lines = node.value.split('\n');
                const normalizedLines = lines.map(line => {
                    if (line.trim().startsWith(':::')) {
                        return line.replace(/[“”]/g, '"');
                    }
                    return line;
                });
                node.value = normalizedLines.join('\n');
            }
        });
        
        // 2. Procesado estándar de directivas (detectadas nativamente por remark-directive)
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