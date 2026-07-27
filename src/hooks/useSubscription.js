/**
 * The paid tier is disabled — the app is fully open, no account is gated.
 * Kept as a hook (same { isPro, loading } shape) so every existing call site
 * keeps working unchanged; this is the single source every paywall check
 * reads from, so returning isPro: true here unlocks the whole app at once.
 */
export function useSubscription() {
  return { isPro: true, loading: false };
}