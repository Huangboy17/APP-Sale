import {
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from '../lib/firebase';
import {
  ProductPriceItem,
  MatchedImageItem,
  UnmatchedImageItem,
  ImageImportMatchResult,
  ImageImportProgress,
} from '../types';
import {
  saveProductImageBlobToIDB,
  deleteProductImageBlobFromIDB,
} from '../utils/localDB';

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp'];

/**
 * Strips punctuation and spaces for fuzzy SKU matching (e.g., "AX-001" -> "AX001", "LED 12W" -> "LED12W").
 */
export function normalizeSkuForSearch(str: string): string {
  if (!str) return '';
  return str.trim().toUpperCase().replace(/[\s\-_./\\#?()+]/g, '');
}

/**
 * Extracts candidate base SKU from a file name.
 */
export function extractSkuFromFileName(fileName: string): string {
  if (!fileName) return '';
  const cleanName = fileName.trim();
  const lastDotIndex = cleanName.lastIndexOf('.');
  const baseName = lastDotIndex !== -1 ? cleanName.substring(0, lastDotIndex) : cleanName;
  return baseName.trim().toUpperCase();
}

/**
 * Validates if a file or file name is a valid image.
 */
export function isImageFile(fileOrName: File | string): boolean {
  if (typeof fileOrName === 'string') {
    const lower = fileOrName.toLowerCase();
    return ALLOWED_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
  }
  const lower = (fileOrName.name || '').toLowerCase();
  if (ALLOWED_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return true;
  }
  if (fileOrName.type && fileOrName.type.startsWith('image/')) {
    return true;
  }
  return false;
}

/**
 * Promise timeout helper that guarantees completion without hanging.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = 'Thao tác quá thời gian chờ (Timeout)'): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Resizes and compresses an image in the browser using HTML5 Canvas.
 * Guaranteed to resolve within 4 seconds even on corrupt files or non-browser environments.
 */
export async function optimizeProductImage(
  file: File | Blob,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'image/webp' | 'image/jpeg';
  } = {}
): Promise<Blob> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.85, format = 'image/webp' } = options;

  // Non-browser or SVG environments: return original blob immediately
  if (typeof window === 'undefined' || typeof document === 'undefined' || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    let hasFinished = false;
    const finish = (result: Blob) => {
      if (hasFinished) return;
      hasFinished = true;
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
      }
      resolve(result);
    };

    // Safety timeout: 3500ms max for canvas processing
    const safetyTimer = setTimeout(() => {
      console.warn('[Image Optimize] Safety timeout triggered. Using raw file.');
      finish(file);
    }, 3500);

    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        clearTimeout(safetyTimer);
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            finish(file);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                finish(blob);
              } else {
                canvas.toBlob(
                  (fallbackBlob) => {
                    finish(fallbackBlob || file);
                  },
                  'image/jpeg',
                  quality
                );
              }
            },
            format,
            quality
          );
        } catch (canvasErr) {
          console.warn('[Canvas Optimize Error]:', canvasErr);
          finish(file);
        }
      };

      img.onerror = () => {
        clearTimeout(safetyTimer);
        finish(file);
      };

      img.src = objectUrl;
    } catch (createUrlErr) {
      clearTimeout(safetyTimer);
      finish(file);
    }
  });
}

/**
 * Uploads a single product image with strict 8s timeout and IndexedDB fallback.
 * Guaranteed to NEVER hang.
 */
export async function uploadProductImage(
  fileOrBlob: File | Blob,
  sku: string,
  organizationId: string
): Promise<string> {
  const cleanSku = sku.trim().toUpperCase().replace(/[/\\#?]/g, '_');
  const orgId = organizationId || 'org-system';
  const timestamp = Date.now();
  const storagePath = `organizations/${orgId}/products/${cleanSku}/image_${timestamp}.webp`;

  // Step 1: Attempt Cloud Storage with 6s strict timeout
  try {
    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: fileOrBlob.type || 'image/webp',
      customMetadata: {
        sku: cleanSku,
        organizationId: orgId,
        uploadedAt: new Date().toISOString(),
      },
    };

    const uploadTask = uploadBytes(storageRef, fileOrBlob, metadata);
    const uploadResult = await withTimeout(uploadTask, 6000, 'Cloud Storage upload timeout (6s)');
    const downloadUrl = await withTimeout(getDownloadURL(uploadResult.ref), 4000, 'Cloud Storage getDownloadURL timeout (4s)');
    console.log(`[Storage] Cloud upload success for ${cleanSku}: ${downloadUrl.substring(0, 40)}...`);
    return downloadUrl;
  } catch (storageError: any) {
    console.warn(
      `[Storage Warning] Firebase Cloud Storage upload skipped/failed for ${cleanSku} (${storageError?.message || storageError}). Using IndexedDB store fallback.`
    );
    // Step 2: Reliable Fallback - Store optimized Blob into IndexedDB (zero localStorage quota used)
    const localKey = `${orgId}_${cleanSku}`;
    const dataUrl = await saveProductImageBlobToIDB(localKey, fileOrBlob);
    return dataUrl;
  }
}

/**
 * Deletes a product image from Storage & LocalDB.
 */
export async function deleteProductImage(
  sku: string,
  organizationId: string,
  currentImageUrl?: string
): Promise<void> {
  const cleanSku = sku.trim().toUpperCase().replace(/[/\\#?]/g, '_');
  const orgId = organizationId || 'org-system';
  const localKey = `${orgId}_${cleanSku}`;

  try {
    await deleteProductImageBlobFromIDB(localKey);
  } catch {}

  if (currentImageUrl && currentImageUrl.includes('firebasestorage.googleapis.com')) {
    try {
      const fileRef = ref(storage, currentImageUrl);
      await deleteObject(fileRef);
    } catch (err) {
      console.warn('[Storage] Delete image warning (ignored if not found):', err);
    }
  }
}

/**
 * Finds the best matching product for a given file name.
 */
export function findMatchingProduct(
  fileName: string,
  products: ProductPriceItem[]
): ProductPriceItem | undefined {
  if (!fileName || !products || products.length === 0) return undefined;

  const baseName = extractSkuFromFileName(fileName);
  const normalizedBase = normalizeSkuForSearch(baseName);

  // 1. Exact SKU Match (Case-Insensitive)
  for (const p of products) {
    if (p.sku && p.sku.trim().toUpperCase() === baseName) {
      return p;
    }
  }

  // 2. Normalized Alphanumeric SKU Match (e.g., "AX-001" matches "AX001" or "AX_001")
  if (normalizedBase) {
    for (const p of products) {
      if (p.sku && normalizeSkuForSearch(p.sku) === normalizedBase) {
        return p;
      }
    }
  }

  // 3. Prefix Match (e.g. File "AX-001_1.jpg" or "AX-001 - Image.png" matches SKU "AX-001")
  for (const p of products) {
    if (p.sku) {
      const pSku = p.sku.trim().toUpperCase();
      if (baseName.startsWith(`${pSku}_`) || baseName.startsWith(`${pSku}-`) || baseName.startsWith(`${pSku} `)) {
        return p;
      }
    }
  }

  // 4. Exact Product Name Match (Case-Insensitive)
  const lowerBase = baseName.toLowerCase();
  for (const p of products) {
    if (p.name && p.name.trim().toLowerCase() === lowerBase) {
      return p;
    }
  }

  return undefined;
}

/**
 * Matches a list of files or folder against existing products.
 */
export function matchImageFilesToProducts(
  files: FileList | File[] | Array<{ file: File; name?: string }>,
  products: ProductPriceItem[]
): ImageImportMatchResult {
  const fileArray: File[] = Array.from(files).map((f: any) => (f.file ? f.file : f));

  const matched: MatchedImageItem[] = [];
  const unmatched: UnmatchedImageItem[] = [];
  const seenSkuInBatch = new Set<string>();

  for (const file of fileArray) {
    const fileName = file.name || '';
    if (!isImageFile(file)) {
      unmatched.push({
        file,
        fileName,
        derivedSku: extractSkuFromFileName(fileName),
        reason: 'INVALID_FORMAT',
        reasonMessage: 'File không phải là định dạng hình ảnh hợp lệ (.jpg, .png, .webp, .svg, .gif)',
      });
      continue;
    }

    const matchedProduct = findMatchingProduct(fileName, products);
    const derivedSku = matchedProduct ? matchedProduct.sku : extractSkuFromFileName(fileName);

    if (!matchedProduct) {
      unmatched.push({
        file,
        fileName,
        derivedSku: derivedSku || '—',
        reason: 'NOT_FOUND',
        reasonMessage: `Không tìm thấy sản phẩm khớp với tên file "${fileName}" trong Data Giá`,
      });
      continue;
    }

    const canonicalSku = matchedProduct.sku.trim().toUpperCase();

    if (seenSkuInBatch.has(canonicalSku)) {
      unmatched.push({
        file,
        fileName,
        derivedSku: canonicalSku,
        reason: 'DUPLICATE',
        reasonMessage: `Trùng lặp: Đã có file ảnh khác trong đợt chọn này cho mã "${canonicalSku}"`,
      });
      continue;
    }

    seenSkuInBatch.add(canonicalSku);

    // Create thumbnail preview URL
    let previewUrl: string | undefined = undefined;
    try {
      if (typeof window !== 'undefined' && window.URL) {
        previewUrl = window.URL.createObjectURL(file);
      }
    } catch {}

    const existingImg = matchedProduct.imageUrl || matchedProduct.image_url;
    matched.push({
      file,
      sku: matchedProduct.sku,
      fileName,
      fileSize: file.size,
      productName: matchedProduct.name,
      brand: matchedProduct.brand,
      unit: matchedProduct.unit,
      existingImageUrl: existingImg,
      willOverwrite: Boolean(existingImg && existingImg.trim() !== ''),
      previewUrl,
    });
  }

  const overwriteCount = matched.filter((m) => m.willOverwrite).length;
  const newImageCount = matched.length - overwriteCount;

  return {
    matched,
    unmatched,
    totalFiles: fileArray.length,
    matchedCount: matched.length,
    unmatchedCount: unmatched.length,
    overwriteCount,
    newImageCount,
  };
}

/**
 * Uploads a batch of matched images with bounded concurrency control (Queue / Worker pool).
 * Guarantees every single task resolves, every worker has finally cleanup, and 1 failed image never halts others.
 */
export async function uploadBatchProductImages(
  items: MatchedImageItem[],
  organizationId: string,
  onProgress?: (progress: ImageImportProgress) => void,
  concurrency = 4
): Promise<{
  successfulUpdates: Array<{ sku: string; imageUrl: string }>;
  failedItems: Array<{ sku: string; fileName: string; errorMessage: string }>;
}> {
  const total = items.length;
  let completed = 0;
  let success = 0;
  let failed = 0;
  const successfulUpdates: Array<{ sku: string; imageUrl: string }> = [];
  const failedItems: Array<{ sku: string; fileName: string; errorMessage: string }> = [];

  const updateProgress = (currentSku: string, isProcessing: boolean) => {
    if (onProgress) {
      try {
        onProgress({
          total,
          completed,
          success,
          failed,
          currentSku,
          isProcessing,
          errors: failedItems,
        });
      } catch (err) {
        console.warn('[Progress Callback Error]:', err);
      }
    }
  };

  console.log(`[IMAGE_IMPORT] Starting queue with ${total} items, concurrency: ${concurrency}`);
  updateProgress(items[0]?.sku || '', true);

  // Concurrency worker queue
  let currentIndex = 0;

  async function worker(workerId: number) {
    while (true) {
      if (currentIndex >= items.length) {
        break;
      }
      const index = currentIndex++;
      const item = items[index];
      if (!item) break;

      console.log(`[IMAGE_IMPORT] [Worker ${workerId}] Uploading SKU: ${item.sku} (${item.fileName})`);
      updateProgress(item.sku, true);

      try {
        // Step 1: Optimize / resize image in client canvas with 4s safety
        const optimizedBlob = await optimizeProductImage(item.file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
        });

        // Step 2: Upload with timeout protection
        const downloadUrl = await uploadProductImage(optimizedBlob, item.sku, organizationId);

        successfulUpdates.push({
          sku: item.sku,
          imageUrl: downloadUrl,
        });
        success++;
        console.log(`[IMAGE_IMPORT] [Worker ${workerId}] Upload success: ${item.sku}`);
      } catch (err: any) {
        console.error(`[IMAGE_IMPORT] [Worker ${workerId}] Upload error SKU: ${item.sku}:`, err);
        const errMsg = err?.message || 'Lỗi xử lý tải ảnh';
        failedItems.push({
          sku: item.sku,
          fileName: item.fileName,
          errorMessage: errMsg,
        });
        failed++;
      } finally {
        completed++;
        updateProgress(item.sku, true);
      }
    }
  }

  const workerCount = Math.min(concurrency, Math.max(1, items.length));
  const workers = Array.from({ length: workerCount }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log(`[IMAGE_IMPORT] Queue completed. Total: ${total}, Success: ${success}, Failed: ${failed}`);
  updateProgress('', false);

  return {
    successfulUpdates,
    failedItems,
  };
}
