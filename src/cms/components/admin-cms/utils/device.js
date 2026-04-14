/**
 * Genera un identificador único basado en el hardware de audio.
 * Es invisible para el usuario y muy estable en el mismo dispositivo/navegador.
 */
export async function getDeviceID() {
    try {
        // Creamos un contexto de audio offline (no suena nada por los altavoces)
        const audioContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
        
        // Creamos un oscilador y un compresor de dinámica
        // La forma en que el hardware procesa la compresión es lo que genera la firma única
        const oscillator = audioContext.createOscillator();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
        compressor.knee.setValueAtTime(40, audioContext.currentTime);
        compressor.ratio.setValueAtTime(12, audioContext.currentTime);
        compressor.attack.setValueAtTime(0, audioContext.currentTime);
        compressor.release.setValueAtTime(0.25, audioContext.currentTime);

        oscillator.connect(compressor);
        compressor.connect(audioContext.destination);
        oscillator.start(0);

        // Renderizamos el audio en memoria
        const renderedBuffer = await audioContext.startRendering();
        const audioData = renderedBuffer.getChannelData(0);
        
        // Calculamos un hash basado en los valores de la onda procesada
        // Sumamos los valores absolutos de una muestra específica para mayor estabilidad
        let sum = 0;
        for (let i = 4500; i < 5000; i++) {
            sum += Math.abs(audioData[i]);
        }
        
        // Convertimos el resultado en una clave SHA-256 usando CryptoJS
        return CryptoJS.SHA256(sum.toString()).toString();
    } catch (e) {
        console.error("Device ID generation falló:", e);
        // Fallback muy básico si el navegador bloquea el audio offline
        return CryptoJS.SHA256(navigator.userAgent).toString();
    }
}
