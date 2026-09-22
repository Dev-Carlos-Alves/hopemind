import React from 'react';

export type IconName =
  | 'user'
  | 'calendar'
  | 'search'
  | 'check'
  | 'heart'
  | 'brain'
  | 'settings'
  | 'logout'
  | 'star'
  | 'filter'
  | 'plus'
  | 'list';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 18,
  color = 'currentColor',
  className = '',
}) => {
  const renderPath = () => {
    switch (name) {
      case 'user':
        return (
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        );
      case 'calendar':
        return (
          <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18" />
        );
      case 'search':
        return (
          <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" />
        );
      case 'check':
        return <polyline points="20 6 9 17 4 12" />;
      case 'heart':
        return (
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        );
      case 'brain':
        return (
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2zm5 0A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2z" />
        );
      case 'settings':
        return (
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4 1.5l1.4 1.1-1.5 2.6-1.7-.7c-.4.4-.9.7-1.4 1l-.3 1.8h-3l-.3-1.8c-.5-.3-1-.6-1.4-1l-1.7.7-1.5-2.6 1.4-1.1c-.1-.5-.1-1 0-1.5l-1.4-1.1 1.5-2.6 1.7.7c.4-.4.9-.7 1.4-1l.3-1.8h3l.3 1.8c.5.3 1 .6 1.4 1l1.7-.7 1.5 2.6-1.4 1.1c.1.5.1 1 0 1.5z" />
        );
      case 'logout':
        return (
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        );
      case 'star':
        return (
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        );
      case 'filter':
        return <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />;
      case 'plus':
        return <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" />;
      case 'list':
        return <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />;
      default:
        return null;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {renderPath()}
    </svg>
  );
};
