const DONE_PREFIX = "sama_onboarding_done:";
export const ONBOARDING_STEP_KEY = "sama_onboarding_step";

function key(address: string) {
  return `${DONE_PREFIX}${address.toLowerCase()}`;
}

export function onboardingDone(address: string | null | undefined): boolean {
  if (!address) return false;
  try {
    return window.localStorage.getItem(key(address)) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingDone(address: string) {
  try {
    window.localStorage.setItem(key(address), "1");
  } catch {
    // Blocked storage: the backend remains the source of truth in live mode.
  }
}

export function clearOnboardingCache(address: string | null | undefined) {
  try {
    if (address) window.localStorage.removeItem(key(address));
    window.sessionStorage.removeItem(ONBOARDING_STEP_KEY);
  } catch {
    // Private mode or blocked storage.
  }
}
