'use client';

import { useEffect } from 'react';

export default function ThankYouUrlCleaner() {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      window.history.replaceState(window.history.state, '', '/thank-you');
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return null;
}
