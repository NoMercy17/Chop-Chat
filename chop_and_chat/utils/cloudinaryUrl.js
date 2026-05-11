import { env } from './env';

/**
 * Builds a Cloudinary delivery URL with transformation parameters injected.
 * Works with full Cloudinary URLs (stored secure_url) or bare public IDs.
 *
 * @param {string|null} urlOrPublicId - Cloudinary secure_url or a public_id string
 * @param {object} options
 * @param {number} [options.width]
 * @param {number} [options.height]
 * @param {string} [options.crop]     - e.g. 'fill', 'fit', 'thumb'
 * @param {string} [options.gravity]  - e.g. 'face', 'auto', 'center'
 * @param {string} [options.quality]  - default 'auto'
 * @param {string} [options.format]   - default 'auto'
 * @returns {string|null}
 */
export function getCloudinaryUrl(urlOrPublicId, options = {}) {
  if (!urlOrPublicId) return null;

  const { width, height, crop, gravity, quality = 'auto', format = 'auto' } = options;

  const parts = [];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (width && height && crop) parts.push(`c_${crop}`);
  if (gravity) parts.push(`g_${gravity}`);
  parts.push(`q_${quality}`);
  parts.push(`f_${format}`);

  const transform = parts.join(',');

  if (urlOrPublicId.includes('res.cloudinary.com')) {
    const uploadIdx = urlOrPublicId.indexOf('/upload/');
    if (uploadIdx === -1) return urlOrPublicId;
    const base = urlOrPublicId.slice(0, uploadIdx + 8);
    const rest = urlOrPublicId.slice(uploadIdx + 8);
    return `${base}${transform}/${rest}`;
  }

  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return urlOrPublicId;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${urlOrPublicId}`;
}
