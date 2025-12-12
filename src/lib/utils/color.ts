export async function getAverageColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('#000000');

      // Resize to 1x1 pixel to get the average automatically
      canvas.width = 1;
      canvas.height = 1;
      
      // Draw image
      ctx.drawImage(img, 0, 0, 1, 1);
      
      // Get pixel data
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      
      // Convert to Hex
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    }

    img.onerror = (e) => {
      console.error('Could not extract color', e);
      resolve('#1e293b'); // Default Slate-800
    }
  })
}