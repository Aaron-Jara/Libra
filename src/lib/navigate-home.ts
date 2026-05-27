export const LIBRA_NAVIGATE_HOME_EVENT = "libra:navigate-home";

/** Resets overlays, upload state, and narration — used when already on `/`. */
export function dispatchNavigateHome() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LIBRA_NAVIGATE_HOME_EVENT));
  }
}
