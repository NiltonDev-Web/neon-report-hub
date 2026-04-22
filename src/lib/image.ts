/**
 * Resize and compress an image File to a JPEG data URL,
 * keeping storage light for IndexedDB. On mobile devices we use
 * smaller dimensions and stronger compression to avoid OOM crashes.
 */
const isMobileDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || (typeof window !== "undefined" && window.innerWidth < 768);
};

export async function fileToCompressedDataURL(
  file: File,
  maxDim?: number,
  quality?: number
): Promise<string> {
  const mobile = isMobileDevice();
  const targetMax = maxDim ?? (mobile ? 900 : 1280);
  const targetQuality = quality ?? (mobile ? 0.65 : 0.78);

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  let { width, height } = img;
  if (width > targetMax || height > targetMax) {
    const ratio = Math.min(targetMax / width, targetMax / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.drawImage(img, 0, 0, width, height);
  const out = canvas.toDataURL("image/jpeg", targetQuality);
  // Free memory aggressively on mobile
  canvas.width = 0;
  canvas.height = 0;
  return out;
}

