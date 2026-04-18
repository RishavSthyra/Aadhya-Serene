const HOME_REFRESH_LOADER_FLAG = '__aadhyaHomeRefreshLoaderShownInDocument';
const HOME_PRELOADER_COMPLETE_FLAG = '__aadhyaHomePreloaderComplete';
export const HOME_PRELOADER_COMPLETE_EVENT = 'home-preloader-complete';

export function shouldShowHomeRefreshLoader() {
  if (typeof window === 'undefined') {
    return true;
  }

  return !window[HOME_REFRESH_LOADER_FLAG];
}

export function markHomeRefreshLoaderSeen() {
  if (typeof window === 'undefined') {
    return;
  }

  window[HOME_REFRESH_LOADER_FLAG] = true;
}

export function isHomePreloaderComplete() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window[HOME_PRELOADER_COMPLETE_FLAG] === true;
}

export function setHomePreloaderComplete(complete) {
  if (typeof window === 'undefined') {
    return;
  }

  const nextValue = complete === true;
  const prevValue = window[HOME_PRELOADER_COMPLETE_FLAG] === true;

  window[HOME_PRELOADER_COMPLETE_FLAG] = nextValue;

  if (nextValue && !prevValue) {
    window.dispatchEvent(new CustomEvent(HOME_PRELOADER_COMPLETE_EVENT));
  }
}
