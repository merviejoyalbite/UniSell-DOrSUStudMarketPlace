import type { ImageSource, Listing } from '../types';

/**
 * Resolve where one listing photo came from.
 *
 * New records store `imageSources` beside `images`. Older camera listings were
 * created before that field existed, so their base64 `data:image` value is
 * treated as a camera photo. Seeded illustrations are never labelled as seller
 * photos because `imageType === "sample"` wins.
 */
export function getImageSourceAt(
  listing: Listing,
  index: number,
): ImageSource | undefined {
  const declared = listing.imageSources?.[index];
  if (declared) return declared;

  if (listing.imageType === 'sample') return undefined;
  if (listing.imageType === 'camera') return 'camera';

  const value =
    listing.images?.[index] ?? (index === 0 ? listing.image : undefined);

  return value?.trim().startsWith('data:image') ? 'camera' : undefined;
}

/** Source of the first photo, which is the cover shown in the feed. */
export function getCoverImageSource(
  listing: Listing,
): ImageSource | undefined {
  return getImageSourceAt(listing, 0);
}

export function getImageSourceLabel(source: ImageSource): string {
  return source === 'gallery' ? 'From gallery' : 'Taken with camera';
}
