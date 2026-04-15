'use client';

import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const HOME_SCROLL_LOTTIE_SRC =
  'https://lottie.host/bb158a74-de8f-4a8c-acdc-7f6b6a172a46/5dtbR9E8by.lottie';

export default function HomeScrollLottie() {
  return (
    <DotLottieReact
      src={HOME_SCROLL_LOTTIE_SRC}
      className='pb-5'
      loop
      autoplay
      style={{ width: '5%', height: '5%' }}
    />
  );
}
