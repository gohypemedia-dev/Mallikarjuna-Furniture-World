import "server-only";
import { env } from "@/lib/config";


const maxImageFileSize = 50 * 1024 * 1024; // 50 MB max for images
const maxVideoFileSize = 250 * 1024 * 1024; // 250 MB max for videos & banners
const maxProductImageSize = maxImageFileSize; // Backward compatibility
const allowedImageTypes = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
  "video/x-matroska",
  "video/x-msvideo",
  "video/avi",
  "video/3gpp",
  "video/x-flv",
  "video/mpeg",
]);

const allowedExtensions = new Set([
  "png", "jpg", "jpeg", "webp", "gif", "svg", "avif",
  "mp4", "webm", "mov", "ogg", "mkv", "avi", "m4v", "flv", "3gp", "ts"
]);

export function getR2PublicBaseUrl(): string {
  const url = env.R2_PUBLIC_URL || env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  return url.replace(/\/+$/, "");
}

export function extractR2Key(keyOrUrl?: string | null): string | null {
  if (!keyOrUrl || typeof keyOrUrl !== "string") return null;
  const trimmed = keyOrUrl.trim();
  if (!trimmed) return null;

  // If it's a YouTube embed or external URL (not R2), ignore
  if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) return null;

  // Proxied URL format: /api/media/products/...
  if (trimmed.startsWith("/api/media/")) {
    return trimmed.replace(/^\/api\/media\//, "");
  }

  // Public R2 dev / custom domain format: https://pub-xxx.r2.dev/products/...
  const publicBase = getR2PublicBaseUrl();
  if (publicBase && trimmed.startsWith(publicBase)) {
    return trimmed.slice(publicBase.length).replace(/^\/+/, "");
  }

  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname.includes("r2.dev") || parsed.hostname.includes("cloudflarestorage.com")) {
        return parsed.pathname.replace(/^\/+/, "");
      }
    } catch {}
  }

  // Direct key format: products/...
  if (trimmed.startsWith("products/")) {
    return trimmed;
  }

  return null;
}

function inferMimeType(fileName: string, fallbackType: string): string {
  if (fallbackType && fallbackType !== "application/octet-stream") return fallbackType;
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp4":
    case "m4v":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    case "ogg":
      return "video/ogg";
    case "mkv":
      return "video/x-matroska";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "avif":
      return "image/avif";
    default:
      return fallbackType || "application/octet-stream";
  }
}

function safeFileName(name: string) {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^[-.]+|[-.]+$)/g, "");
  return cleaned || "product-image";
}

export async function uploadProductImage(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isAllowed = allowedImageTypes.has(file.type) || allowedExtensions.has(ext);

  if (!isAllowed) {
    throw new Error("Choose a valid image (PNG, JPG, WebP, GIF) or video (MP4, WebM, MOV).");
  }

  if (file.size === 0) {
    throw new Error("The selected file is empty (0 bytes).");
  }

  const isVideo =
    file.type.startsWith("video/") ||
    ["mp4", "webm", "mov", "ogg", "mkv", "avi", "m4v", "flv", "3gp", "ts"].includes(ext);
  const maxSize = isVideo ? maxVideoFileSize : maxImageFileSize;

  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    throw new Error(
      `${isVideo ? "Video" : "Image"} file is ${sizeMB} MB. Maximum allowed size is ${maxMB} MB.`
    );
  }

  const contentType = inferMimeType(file.name, file.type);
  const key = `products/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  
  // Object storage is not connected: the file is validated but not stored.

  const publicBase = getR2PublicBaseUrl();
  const url = publicBase ? `${publicBase}/${key}` : `/api/media/${key}`;

  return { key, url };
}

export async function getProductMedia(_key: string, _range?: string): Promise<never> {
  throw new Error("Media storage is not connected.");
}

export async function deleteProductMedia(keyOrUrl?: string | null) {
  return extractR2Key(keyOrUrl) !== null;
}

export async function deleteMultipleProductMedia(_keysOrUrls: (string | null | undefined)[]) {
  return;
}
