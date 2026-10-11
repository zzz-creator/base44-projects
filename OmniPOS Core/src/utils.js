// Utility re-exports for @/utils alias compatibility
export { cn, isIframe } from './lib/utils.js';

/**
 * Creates a page URL path for navigation.
 * Usage: createPageUrl("POS") => "/POS"
 */
export function createPageUrl(pageName) {
  return `/${pageName}`;
}
