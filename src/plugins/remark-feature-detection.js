import { visit } from "unist-util-visit";

export function remarkFeatureDetection() {
    return (tree, { data }) => {
        let hasMath = false;
        let hasMermaid = false;

        visit(tree, (node) => {
            if (node.type === 'math' || node.type === 'inlineMath') {
                hasMath = true;
            }
            if (node.type === 'code' && node.lang === 'mermaid') {
                hasMermaid = true;
            }
            // Also check for existing mermaid nodes if another plugin already transformed them
            if (node.type === 'mermaid') {
                hasMermaid = true;
            }
        });

        data.astro.frontmatter.hasMath = hasMath;
        data.astro.frontmatter.hasMermaid = hasMermaid;
    };
}
