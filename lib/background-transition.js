const BACKGROUND_TRANSITION_STATE_KEY = "__aadhyaBackgroundTransition";
const SKIP_APARTMENTS_REPLAY_KEY = "__aadhyaSkipApartmentsReplayOnce";

export function setBackgroundTransitionState(layout, active) {
  if (typeof window === "undefined") return;

  window[BACKGROUND_TRANSITION_STATE_KEY] = {
    layout,
    active,
    updatedAt: Date.now(),
  };
}

export function getBackgroundTransitionState() {
  if (typeof window === "undefined") {
    return { layout: null, active: false };
  }

  return (
    window[BACKGROUND_TRANSITION_STATE_KEY] ?? {
      layout: null,
      active: false,
    }
  );
}

export function isBackgroundTransitionActive(layout) {
  const state = getBackgroundTransitionState();

  if (!state.active) return false;
  if (!layout) return true;

  return state.layout === layout;
}

export function skipNextApartmentsReplay() {
  if (typeof window === "undefined") return;

  window[SKIP_APARTMENTS_REPLAY_KEY] = true;
}

export function consumeSkipNextApartmentsReplay() {
  if (typeof window === "undefined") return false;

  const shouldSkip = window[SKIP_APARTMENTS_REPLAY_KEY] === true;
  window[SKIP_APARTMENTS_REPLAY_KEY] = false;
  return shouldSkip;
}
