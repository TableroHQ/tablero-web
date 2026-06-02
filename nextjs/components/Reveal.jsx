'use client';
import React from 'react';

/**
 * Reveals its content with a soft fade-up the first time it scrolls into view.
 *
 * - Uses IntersectionObserver; content above the fold animates in immediately.
 * - Falls back to "always visible" when IO is unavailable or the user prefers
 *   reduced motion, so nothing is ever stuck hidden.
 * - Pass `className` to keep grid/layout classes on the wrapper (e.g. col-span).
 *
 * Props: as (tag, default 'div'), delay (ms, for stagger), y (px lift),
 *        once (stay revealed, default true). Extra props are forwarded.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
  y = 18,
  once = true,
  ...rest
}) {
  const ref = React.useRef(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) {
            setShown(false);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms', '--reveal-y': `${y}px` }}
      className={`reveal${shown ? ' reveal-in' : ''}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
