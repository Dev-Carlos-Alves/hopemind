import React from 'react';

const paths = {
  home: (
    <>
      <path d="M3.5 10.2 12 3.5l8.5 6.7" />
      <path d="M5.5 8.8V19a1.5 1.5 0 0 0 1.5 1.5h3.5v-5.5h3v5.5H17a1.5 1.5 0 0 0 1.5-1.5V8.8" />
    </>
  ),
  sparkles: (
    <>
      <path d="M11 3.5 12.6 8a3 3 0 0 0 1.9 1.9L19 11.5 14.5 13a3 3 0 0 0-1.9 1.9L11 19.5 9.4 15a3 3 0 0 0-1.9-1.9L3 11.5 7.5 10a3 3 0 0 0 1.9-1.9Z" />
      <path d="M19 3v4M21 5h-4" />
    </>
  ),
  heart: (
    <path d="M12 20.3s-7.8-4.6-7.8-10.5A4.3 4.3 0 0 1 8.5 5.5c1.5 0 2.8.8 3.5 2 .7-1.2 2-2 3.5-2a4.3 4.3 0 0 1 4.3 4.3c0 5.9-7.8 10.5-7.8 10.5Z" />
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4.5" width="14" height="16.5" rx="2.5" />
      <path d="M9 4.5V4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v.5M9 11h6M9 15h4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  logout: <path d="M14 4.5h3.5A2.5 2.5 0 0 1 20 7v10a2.5 2.5 0 0 1-2.5 2.5H14M10 16.5 5.5 12 10 7.5M5.5 12H15" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.8-4.8" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  'chevron-right': <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  'chevron-left': <path d="M14.5 5.5 8 12l6.5 6.5" />,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  plus: <path d="M12 5v14M5 12h14" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6.5" width="12.5" height="11" rx="2.5" />
      <path d="m15.5 10.5 5.5-3v9l-5.5-3" />
    </>
  ),
  'map-pin': (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 5.8v5.4c0 4.5 3 8.3 7 9.8 4-1.5 7-5.3 7-9.8V5.8Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 4.3 2.9 17.2A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.4 3.2M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.3-.5 4.6-1.2" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3.5 3.5l17 17" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  phone: (
    <path d="M20.5 16.4v2.6a1.8 1.8 0 0 1-2 1.8A17.6 17.6 0 0 1 3.2 5.5 1.8 1.8 0 0 1 5 3.5h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.9.4 1.7.7 2.5a1.8 1.8 0 0 1-.4 1.9L8.6 10.5a14 14 0 0 0 4.9 4.9l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.6 2.5.7a1.8 1.8 0 0 1 1.5 1.8Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />,
  brain: (
    <>
      <path d="M9 4.5a3 3 0 0 0-3 3v.2A3 3 0 0 0 4 10.5a3 3 0 0 0 1 2.3A3 3 0 0 0 6 18a3 3 0 0 0 3 2 2.5 2.5 0 0 0 3-2V6.5a2.5 2.5 0 0 0-3-2Z" />
      <path d="M15 4.5a3 3 0 0 1 3 3v.2a3 3 0 0 1 2 2.8 3 3 0 0 1-1 2.3 3 3 0 0 1-1 5.2 3 3 0 0 1-3 2 2.5 2.5 0 0 1-3-2" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-13.5 15-14-.5 10-6 15-14 15" />
      <path d="M5 19c2.5-4 5.5-6.5 9-8.5" />
    </>
  ),
  message: <path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.5a8.5 8.5 0 1 1 15.6-4.5Z" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  sliders: <path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 4.5v5M8 14.5v5" />,
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  'credit-card': (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  badge: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.3-1.5 7.2 5-2.5 5 2.5-1.5-7.2" />
    </>
  ),
} satisfies Record<string, React.ReactNode>;

export type IconName = keyof typeof paths;

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, strokeWidth = 1.8, className, label }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    focusable="false"
  >
    {paths[name]}
  </svg>
);
