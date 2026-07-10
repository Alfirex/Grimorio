/**
 * Convierte una imagen subida en un avatar cuadrado comprimido (data-URL JPEG).
 * Se guarda directamente en Firestore, sin necesidad de Firebase Storage.
 */
export function fileToAvatar(file: File, size = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas no disponible"));
        return;
      }
      // Recorte cuadrado centrado
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

/**
 * Comprime una imagen a data-URL JPEG manteniendo la proporción, con un lado
 * máximo dado. Para handouts del máster (retratos, cartas, mapas de región…);
 * cabe holgadamente en el límite de 1 MB por documento de Firestore.
 */
export function fileToHandout(file: File, maxSide = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas no disponible"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
      // Margen de seguridad frente al límite de documento de Firestore
      if (dataUrl.length > 900_000) {
        reject(new Error("La imagen queda demasiado pesada incluso comprimida"));
        return;
      }
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}
