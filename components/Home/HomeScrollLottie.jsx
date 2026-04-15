'use client';

import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const HOME_SCROLL_LOTTIE_SRC =
  'https://lottie.host/bb158a74-de8f-4a8c-acdc-7f6b6a172a46/5dtbR9E8by.lottie';

export default function HomeScrollLottie({ className = '' }) {
  return (
    <DotLottieReact
      src={HOME_SCROLL_LOTTIE_SRC}
      className={className}
      loop
      autoplay
      style={{ width: '100%', height: '100%' }}
    />
  );
}
