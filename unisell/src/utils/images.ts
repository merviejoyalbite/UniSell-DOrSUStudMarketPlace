import { API_BASE_URL } from '../api/apiClient';

/**
 * Resolve a listing image value for expo-image.
 *
 * Two sources are supported:
 *   - Camera captures: `data:image/jpeg;base64,...` is used unchanged.
 *   - Seeded illustrations: `/images/<file>.jpg` is served by json-server, so
 *     the relative path is prefixed with the current API base URL.
 *
 * Absolute URLs and local file/content URIs are passed through. Empty values
 * become `null`, which lets the caller show the category placeholder.
 */
export function resolveImageUri(
  value: string | null | undefined,
): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `${API_BASE_URL}${trimmed}`;
  }

  return `${API_BASE_URL}/${trimmed}`;
}

/** Resolve and filter an array of image values, preserving order. */
export function resolveImageUris(
  values: Array<string | null | undefined> | null | undefined,
): string[] {
  return (values ?? [])
    .map(resolveImageUri)
    .filter((uri): uri is string => Boolean(uri));
}
