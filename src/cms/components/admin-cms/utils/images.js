/**
 * Utilidades para el procesamiento de imágenes en el cliente.
 */

/**
 * Optimiza una imagen: la redimensiona si es muy grande y la convierte a WebP.
 * @param {File} file El archivo original
 * @param {number} maxWidth Ancho máximo permitido
 * @param {number} quality Calidad de compresión (0.1 a 1.0)
 * @returns {Promise<{base64: string, fileName: string, width: number, height: number}>}
 */
export async function optimizeImage(file, maxWidth = 1600, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Redimensionado proporcional si excede el máximo
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                // Aseguramos calidad en el redimensionado
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, 0, 0, width, height);

                // Convertimos a WebP
                // Nota: toDataURL devuelve "data:image/webp;base64,..."
                const dataUrl = canvas.toDataURL("image/webp", quality);
                const base64 = dataUrl.split(",")[1];
                
                // Generamos un nombre limpio con extensión webp
                const cleanName = file.name
                    .replace(/\.[^/.]+$/, "") // Quita la extensión original
                    .replace(/[^a-zA-Z0-9]/g, "-") // Reemplaza no-alfanuméricos por guiones
                    .toLowerCase();
                
                const fileName = `${cleanName}.webp`;

                resolve({
                    base64,
                    fileName,
                    width: Math.round(width),
                    height: Math.round(height)
                });
            };
            img.onerror = () => reject(new Error("Error al cargar la imagen en el navegador."));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Error al leer el archivo."));
        reader.readAsDataURL(file);
    });
}
