import React, { useEffect, useRef, useState } from 'react';

type Timer = number;

export const useAfterResize = () => {
  const width = document.body.clientWidth;
  const height = document.body.clientHeight;
  const [windowSize, setWindowSize] = useState({ width, height });
  const timer = useRef<Timer | null>(null);
  const onResize = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => {
      const width = document.body.clientWidth;
      const height = document.body.clientHeight;
      setWindowSize({ width, height });
    }, 200);
  };

  useEffect(() => {
    window.addEventListener('resize', onResize, false);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return windowSize;
};
