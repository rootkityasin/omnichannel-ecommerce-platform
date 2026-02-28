export type MenuCachePayload = {
  domain: string;
  timestamp: number;
  products: unknown[];
  categories: unknown[];
};

const MENU_CACHE_KEY = "crabkhai-menu-cache";
const MENU_CACHE_TTL_MS = 10 * 60 * 1000;

export const readMenuCache = (domain: string) => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(MENU_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MenuCachePayload;
    if (!parsed?.timestamp || !parsed?.domain) return null;
    if (parsed.domain !== domain) return null;
    if (Date.now() - parsed.timestamp > MENU_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const writeMenuCache = (payload: MenuCachePayload) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(MENU_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors
  }
};
