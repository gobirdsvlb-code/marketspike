import React from 'react';

type Variant = 'default' | 'excited' | 'happy' | 'sad' | 'cool' | 'charging';

const INK = '#1e2140';
const INDIGO = '#6366f1';
const INDIGO_DARK = '#4338ca';
const GOLD = '#fbbf24';
const GOLD_DARK = '#d49a06';
const MUZZLE = '#ffe3d9';

/** Spike the bull. Flat shapes only: no gradients, glows or strokes on the body. */
export function SpikeMascot({
  className = '',
  variant = 'default',
}: {
  className?: string;
  variant?: Variant;
}) {
  const eyes = () => {
    switch (variant) {
      case 'excited':
      case 'happy':
        return (
          <g stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none">
            <path d="M56 100 Q72 82 88 100" />
            <path d="M112 100 Q128 82 144 100" />
          </g>
        );
      case 'cool':
        return (
          <g>
            <rect x="48" y="84" width="46" height="30" rx="12" fill={INK} />
            <rect x="106" y="84" width="46" height="30" rx="12" fill={INK} />
            <rect x="92" y="92" width="16" height="6" fill={INK} />
            <path d="M58 92 L70 92" stroke="#fff" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
            <path d="M116 92 L128 92" stroke="#fff" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
          </g>
        );
      case 'sad':
        return (
          <g>
            <circle cx="72" cy="100" r="18" fill="#fff" />
            <circle cx="128" cy="100" r="18" fill="#fff" />
            <circle cx="74" cy="106" r="9" fill={INK} />
            <circle cx="126" cy="106" r="9" fill={INK} />
            <circle cx="77" cy="102" r="3" fill="#fff" />
            <circle cx="129" cy="102" r="3" fill="#fff" />
            <path d="M58 122 Q54 134 60 138 Q68 134 62 122 Z" fill="#38bdf8" />
          </g>
        );
      default:
        return (
          <g>
            <circle cx="72" cy="100" r="18" fill="#fff" />
            <circle cx="128" cy="100" r="18" fill="#fff" />
            <circle cx="76" cy="102" r="9" fill={INK} />
            <circle cx="124" cy="102" r="9" fill={INK} />
            <circle cx="79" cy="98" r="3.2" fill="#fff" />
            <circle cx="127" cy="98" r="3.2" fill="#fff" />
          </g>
        );
    }
  };

  const brows = () => {
    if (variant === 'sad')
      return <path d="M54 76 L84 82 M146 76 L116 82" stroke={INDIGO_DARK} strokeWidth="6" strokeLinecap="round" />;
    if (variant === 'charging')
      return <path d="M54 80 L86 90 M146 80 L114 90" stroke={INK} strokeWidth="7" strokeLinecap="round" />;
    return null;
  };

  const mouth = () => {
    switch (variant) {
      case 'sad':
        return <path d="M86 158 Q100 148 114 158" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />;
      case 'charging':
        return <path d="M88 154 H112" stroke={INK} strokeWidth="5" strokeLinecap="round" />;
      case 'excited':
      case 'happy':
      case 'cool':
        return <path d="M82 150 Q100 170 118 150 Z" fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth="4" />;
      default:
        return <path d="M86 152 Q100 164 114 152" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />;
    }
  };

  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full ${className}`} role="img" aria-label="Spike the bull">
      {/* ground shadow */}
      <ellipse cx="100" cy="188" rx="52" ry="7" fill={INK} fillOpacity="0.08" />

      {/* horns */}
      <path d="M44 74 C14 74 6 40 18 18 C24 40 46 46 62 50 Z" fill={GOLD} />
      <path d="M156 74 C186 74 194 40 182 18 C176 40 154 46 138 50 Z" fill={GOLD} />
      <path d="M18 18 C24 40 46 46 62 50 L56 58 C40 54 22 46 18 18 Z" fill={GOLD_DARK} />
      <path d="M182 18 C176 40 154 46 138 50 L144 58 C160 54 178 46 182 18 Z" fill={GOLD_DARK} />

      {/* ears */}
      <ellipse cx="30" cy="96" rx="20" ry="12" transform="rotate(-18 30 96)" fill={INDIGO_DARK} />
      <ellipse cx="170" cy="96" rx="20" ry="12" transform="rotate(18 170 96)" fill={INDIGO_DARK} />

      {/* head */}
      <path d="M38 88 C38 40 162 40 162 88 L162 128 C162 164 134 184 100 184 C66 184 38 164 38 128 Z" fill={INDIGO} />
      {/* head underside, same trick as the buttons */}
      <path d="M44 150 C54 172 76 184 100 184 C124 184 146 172 156 150 C146 162 126 170 100 170 C74 170 54 162 44 150 Z" fill={INDIGO_DARK} />

      {/* tuft */}
      <path d="M84 52 C84 36 100 30 108 40 C114 34 126 40 120 54 C108 50 96 50 84 52 Z" fill={INDIGO_DARK} />

      {/* muzzle */}
      <ellipse cx="100" cy="146" rx="42" ry="30" fill={MUZZLE} />
      <ellipse cx="84" cy="136" rx="5.5" ry="7.5" fill={INK} />
      <ellipse cx="116" cy="136" rx="5.5" ry="7.5" fill={INK} />

      {eyes()}
      {brows()}
      {mouth()}

      {variant === 'charging' && (
        <g fill="#fff" stroke={INK} strokeOpacity=".12" strokeWidth="2">
          <circle cx="48" cy="150" r="7" />
          <circle cx="36" cy="140" r="4" />
          <circle cx="152" cy="150" r="7" />
          <circle cx="164" cy="140" r="4" />
        </g>
      )}
    </svg>
  );
}

/** Drop-in for the old 🐂 emoji: scales with the surrounding font-size. */
export function SpikeEmoji({ variant = 'default' }: { variant?: Variant }) {
  return (
    <span className="inline-block w-[1.1em] h-[1.1em] align-middle">
      <SpikeMascot variant={variant} />
    </span>
  );
}
