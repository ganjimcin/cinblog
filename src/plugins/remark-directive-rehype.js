import { visit } from "unist-util-visit";
import { h } from "hastscript";

export function parseDirectiveNode() {
    return (tree) => {
        if (!tree) return;
        
        // 1. Normalización de comillas
        visit(tree, "text", (node) => {
            if (node.value && node.value.includes(":::")) {
                node.value = node.value.replace(/[“”]/g, '"');
            }
        });

        // 2. Rescate de Párrafos (Backup si remark-directive falla)
        visit(tree, "paragraph", (node, index, parent) => {
            if (!node.children || node.children.length === 0) return;
            
            const firstChild = node.children[0];
            if (firstChild.type !== "text" || !firstChild.value.trim().startsWith(":::")) return;

            // Reconstruir texto completo
            let fullText = "";
            for (const child of node.children) {
                if (child.type === "text") fullText += child.value;
                else if (child.type === "link") fullText += child.url;
                else if (child.value) fullText += child.value;
            }

            const line = fullText.trim();
            const cleanLine = line.replace(/[“”]/g, '"');

            // Regex mejorado para capturar nombre, atributos y contenido opcional
            const match = cleanLine.match(/^:::\s*(?<name>[a-zA-Z0-9_-]+)(?:\{(?<attrs>.*)\})?\s*(?<content>.*)$/s);
            
            if (match) {
                const directiveNode = {
                    type: "leafDirective",
                    name: match.groups.name,
                    attributes: {},
                    children: [],
                    data: {
                        hName: match.groups.name,
                        hProperties: {}
                    }
                };

                if (match.groups.attrs) {
                    let attrStr = match.groups.attrs;
                    if (attrStr.endsWith('}')) attrStr = attrStr.slice(0, -1);
                    
                    const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^ \s{}]+))/g;
                    let attrMatch;
                    while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
                        const key = attrMatch[1];
                        const val = attrMatch[2] || attrMatch[3] || attrMatch[4];
                        directiveNode.attributes[key] = val;
                    }
                }
                
                directiveNode.data.hProperties = directiveNode.attributes;

                if (match.groups.content) {
                    const cleanContent = match.groups.content.replace(/:::$/, '').trim();
                    directiveNode.children = [{ type: 'text', value: cleanContent }];
                }

                parent.children[index] = directiveNode;
                return "skip";
            }
        });

        // 3. Procesado estándar
        visit(tree, (node) => {
            if (
                node.type === "containerDirective" ||
                node.type === "leafDirective" ||
                node.type === "textDirective"
            ) {
                if (!node.data) node.data = {};
                node.data.hName = node.name;
                node.data.hProperties = node.attributes || {};
            }
        });
    };
}