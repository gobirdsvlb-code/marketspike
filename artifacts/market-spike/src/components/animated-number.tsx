import React, { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format?: 'currency' | 'number' | 'percent';
  className?: string;
  decimals?: number;
}

export function AnimatedNumber({ value, format = 'number', className = '', decimals = 0 }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "-20px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, value, isInView]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        let formattedValue = "";
        if (format === 'currency') {
          formattedValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(latest);
        } else if (format === 'percent') {
          formattedValue = `${latest > 0 ? '+' : ''}${latest.toFixed(decimals)}%`;
        } else {
          formattedValue = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(latest);
        }
        ref.current.textContent = formattedValue;
      }
    });
  }, [springValue, format, decimals]);

  return <span ref={ref} className={className} />;
}
