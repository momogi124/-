

/**
 * Processes an image source into a normalized brightness map.
 * Returns a 1D array of brightness values (0-1) and dimensions.
 */
export const extractBrightnessMap = (
  imageSrc: string,
  samplesX: number,
  samplesY: number
): Promise<{ data: Float32Array; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = samplesX;
      canvas.height = samplesY;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      try {
        // Draw image to fit the sampling grid
        ctx.drawImage(img, 0, 0, samplesX, samplesY);
        
        const imgData = ctx.getImageData(0, 0, samplesX, samplesY);
        const pixels = imgData.data;
        const brightnessMap = new Float32Array(samplesX * samplesY);

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          // Standard luminance formula
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          brightnessMap[i / 4] = brightness;
        }

        resolve({
          data: brightnessMap,
          width: samplesX,
          height: samplesY
        });
      } catch (e: any) {
        reject(new Error(e.message || "Canvas processing failed"));
      }
    };

    img.onerror = (e) => {
      reject(new Error("Failed to load image. Check CORS or URL validity."));
    };

    // Add cache buster to prevent CORS errors from cached responses
    if (imageSrc.startsWith('http')) {
      try {
        const url = new URL(imageSrc);
        if (!url.searchParams.has('cb')) {
             url.searchParams.set('cb', Date.now().toString());
        }
        img.src = url.toString();
      } catch (e) {
        img.src = imageSrc;
      }
    } else {
      img.src = imageSrc;
    }
  });
};
