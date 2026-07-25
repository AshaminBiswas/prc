/**
 * Client-side image optimization utility.
 * Resizes large images to max dimensions and compresses them into web-optimized WebP
 * (or JPEG fallback) before uploading to Supabase Storage.
 */

export type ImageOptimizationOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default: 0.85)
  mimeType?: "image/webp" | "image/jpeg";
};

export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  // Skip non-raster or special formats (SVG, GIF, PDF)
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  const {
    maxWidth = 1200,
    maxHeight = 1600,
    quality = 0.85,
    mimeType = "image/webp",
  } = options;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      // High quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const targetMime = mimeType;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // Generate file extension
          const ext = targetMime === "image/webp" ? "webp" : "jpg";
          const originalNameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
          const newFileName = `${originalNameWithoutExt}.${ext}`;

          const optimizedFile = new File([blob], newFileName, {
            type: targetMime,
            lastModified: Date.now(),
          });

          // Log compression savings
          console.log(
            `[ImageOptimizer] "${file.name}" (${(file.size / 1024).toFixed(1)} KB) ➔ "${optimizedFile.name}" (${(optimizedFile.size / 1024).toFixed(1)} KB)`
          );

          resolve(optimizedFile);
        },
        targetMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Optimizes an array of files in parallel.
 */
export async function optimizeImages(
  files: File[],
  options?: ImageOptimizationOptions
): Promise<File[]> {
  return Promise.all(files.map((file) => optimizeImage(file, options)));
}
