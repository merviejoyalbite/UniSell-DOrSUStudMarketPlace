import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Base URL for the mock REST API (json-server).
 *
 * Resolution order:
 *   1. EXPO_PUBLIC_API_URL, when set (recommended for physical phones/builds).
 *   2. The Expo dev-server host from Constants.expoConfig.hostUri, with port 3001.
 *   3. Android emulator (10.0.2.2) or the local simulator/web fallback.
 *
 * A physical phone must never use localhost, 127.0.0.1 or port 3000. The Expo
 * host is the LAN address the phone is already using to load the JS bundle, so
 * reusing that host is what makes the mock API reachable without hardcoding an
 * IP in source.
 */

const API_PORT = 3001;

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

/** Return the hostname from an Expo `hostUri` such as `192.168.1.20:8081`. */
function getExpoHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri?.trim();
  if (!hostUri) return null;

  const withoutProtocol = hostUri.replace(/^[a-z]+:\/\//i, '');
  const hostAndPort = withoutProtocol.split('/')[0];
  if (!hostAndPort) return null;

  // Keep IPv6 addresses bracketed: [fe80::1]:8081 -> [fe80::1].
  if (hostAndPort.startsWith('[')) {
    const closingBracket = hostAndPort.indexOf(']');
    return closingBracket === -1 ? null : hostAndPort.slice(0, closingBracket + 1);
  }

  return hostAndPort.split(':')[0] || null;
}

function getHostname(baseUrl: string): string {
  const withoutProtocol = baseUrl.replace(/^https?:\/\//i, '');
  const hostAndPort = withoutProtocol.split('/')[0];

  if (hostAndPort.startsWith('[')) {
    const closingBracket = hostAndPort.indexOf(']');
    return closingBracket === -1 ? hostAndPort : hostAndPort.slice(0, closingBracket + 1);
  }

  return hostAndPort.split(':')[0] || '';
}

/**
 * Normalise a configured URL and reject the stale `:3000` port. The mock API
 * is always started on 3001 by `npm run api`.
 */
function normalizeConfiguredUrl(rawUrl: string): string {
  const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `http://${rawUrl}`;
  const trimmed = stripTrailingSlashes(withProtocol);
  const fixedPort = trimmed.replace(/:3000(?=\/|$)/, `:${API_PORT}`);

  if (fixedPort !== trimmed) {
    console.warn(
      `[UniSell API] EXPO_PUBLIC_API_URL used port 3000. Using port ${API_PORT} instead: ${fixedPort}`,
    );
  }

  return fixedPort;
}

type BaseUrlSource = 'env' | 'expo-host' | 'android-emulator' | 'localhost';

interface BaseUrlResolution {
  url: string;
  source: BaseUrlSource;
}

function resolveBaseUrl(): BaseUrlResolution {
  const expoHost = getExpoHost();
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    const normalized = normalizeConfiguredUrl(configuredUrl);
    const configuredHost = getHostname(normalized);

    // If someone leaves localhost in .env, replace it with the LAN host that
    // Expo is already serving to the phone. This keeps a physical phone working.
    if (Platform.OS !== 'web' && LOOPBACK_HOSTS.has(configuredHost)) {
      if (expoHost && !LOOPBACK_HOSTS.has(expoHost)) {
        console.warn(
          `[UniSell API] EXPO_PUBLIC_API_URL points at ${configuredHost} on native. ` +
            `Using the Expo host instead: http://${expoHost}:${API_PORT}`,
        );
        return { url: `http://${expoHost}:${API_PORT}`, source: 'expo-host' };
      }

      console.warn(
        '[UniSell API] EXPO_PUBLIC_API_URL points at a loopback address. ' +
          'A physical phone cannot reach localhost; use the laptop LAN IP.',
      );
    }

    return { url: normalized, source: 'env' };
  }

  if (expoHost) {
    return { url: `http://${expoHost}:${API_PORT}`, source: 'expo-host' };
  }

  if (Platform.OS === 'android') {
    // Android emulator only. A standalone Android build should set
    // EXPO_PUBLIC_API_URL at build time.
    return { url: `http://10.0.2.2:${API_PORT}`, source: 'android-emulator' };
  }

  // Web and the iOS simulator can reach the host machine directly.
  return { url: `http://localhost:${API_PORT}`, source: 'localhost' };
}

const resolution = resolveBaseUrl();

export const API_BASE_URL = resolution.url;
export const API_BASE_URL_SOURCE = resolution.source;

if (__DEV__) {
  console.info(
    `[UniSell API] Base URL: ${API_BASE_URL} (source: ${API_BASE_URL_SOURCE}); ` +
      `Expo host: ${getExpoHost() ?? 'not available'}`,
  );
}

/** Requests fail fast so the UI can show an error state instead of hanging. */
const REQUEST_TIMEOUT_MS = 6000;

/** Error type shared by every API call. */
export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const requestUrl = `${API_BASE_URL}${path}`;
  const method = init.method ?? 'GET';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // GET/DELETE requests have no body, so they do not need a Content-Type.
    // Omitting it keeps them "simple" CORS requests and avoids a preflight
    // round-trip on the demo's json-server. Writes still send JSON.
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(init.body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
    };

    const response = await fetch(requestUrl, {
      ...init,
      headers: {
        ...headers,
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(`Request failed with status ${response.status}.`, response.status);
    }

    // DELETE requests may not return a body; guard before parsing.
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(
        `[UniSell API] ${method} ${requestUrl} failed | ` +
          `status=${error.status ?? 'NO_RESPONSE'} | error=${error.message}`,
      );
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      console.error(
        `[UniSell API] ${method} ${requestUrl} timed out | ` +
          `status=NO_RESPONSE | error=Timeout after ${REQUEST_TIMEOUT_MS}ms`,
      );
      throw new ApiError(`The server at ${API_BASE_URL} took too long to respond.`);
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[UniSell API] ${method} ${requestUrl} failed | ` +
        `status=NO_RESPONSE | error=${message}`,
    );
    throw new ApiError(
      `Could not reach the UniSell mock API at ${API_BASE_URL}. Start it with npm run api.`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Tiny wrapper around fetch.
 * Screens never call fetch directly - they go through a feature API file
 * (listingsApi.ts / authApi.ts), which uses this client.
 */
export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
