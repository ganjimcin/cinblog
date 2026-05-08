import { visit } from "unist-util-visit";

export function parseDirectiveNode() {
    console.log('[Plugin Initialized]: remark-directive-rehype');
    return (tree) => {
        if (!tree) return;
        
        visit(tree, (node) => {
            if (!node || !node.type) return;
            
            // Chivato para ver qué está pasando
            if (node.type === "text" && node.value && node.value.includes(":::")) {
                console.log(`[Text with ::: Found]: ${node.value.substring(0, 20)}...`);
            }

            if (
                node.type === "containerDirective" ||
                node.type === "leafDirective" ||
                node.type === "textDirective"
            ) {
                console.log(`[Directive Found]: ${node.name} (${node.type})`);
                if (!node.data) node.data = {};
                node.data.hName = node.name;
                node.data.hProperties = node.attributes || {};
            }
        });

    };
}