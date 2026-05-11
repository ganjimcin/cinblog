import { visit } from "unist-util-visit";

/**
 * Remark plugin to replace curly quotes with straight quotes.
 * This helps remark-directive parse attributes correctly when they
 * are copied from rich text editors.
 */
export function remarkFixQuotes() {
    return (tree) => {
        visit(tree, "text", (node) => {
            // Normalizar comillas y caracteres raros en TODO el post para evitar errores de red/renderizado
            if (node.value) {
                // 1. Normalizar comillas inteligentes (todos los tipos)
                node.value = node.value.replace(/[“”‘’"']/g, (m) => {
                    if (['“', '”', '"'].includes(m)) return '"';
                    if (['‘', '’', "'"].includes(m)) return "'";
                    return m;
                });

                // 2. Corregir caracteres de encoding rotos comunes (si aparecen)
                // Ej:  o secuencias UTF-8 mal interpretadas
                node.value = node.value.replace(/\uFFFD/g, (m) => {
                    // Intentar adivinar por contexto si es una tilde o signo
                    return ''; // Por ahora eliminamos el carácter nulo
                });

                // 3. Normalizar atributos de directivas específicamente (dentro de { })
                if (node.value.includes(":::") && node.value.includes("{")) {
                    node.value = node.value.replace(/\{([^{}]+)\}/g, (match, attrs) => {
                        // Dentro de los atributos, comas -> espacios para que remark-directive no falle
                        return '{' + attrs.replace(/,/g, ' ') + '}';
                    });
                }
            }
        });
    };
}
