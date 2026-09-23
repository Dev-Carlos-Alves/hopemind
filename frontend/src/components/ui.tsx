import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, IconName } from './Icon';

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

/* ───────────── Button ───────────── */
type ButtonVariant = 'filled' | 'tinted' | 'gray' | 'plain' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  loading?: boolean;
  icon?: IconName;
  iconRight?: IconName;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'filled',
  size = 'md',
  block,
  loading,
  icon,
  iconRight,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    className={cx('btn', `btn--${variant}`, size !== 'md' && `btn--${size}`, block && 'btn--block', className)}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...rest}
  >
    {loading ? <span className="btn__spinner" aria-hidden /> : icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
    {children}
    {!loading && iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} />}
  </button>
);

/* ───────────── Text field with floating label ───────────── */
interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  hint?: string;
  error?: string;
  trailing?: React.ReactNode;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, hint, error, trailing, className, id, type = 'text', ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hintId = `${inputId}-hint`;
    return (
      <div className={cx('field', type === 'date' && 'field--date', error && 'field--invalid', className)}>
        <input
          ref={ref}
          id={inputId}
          type={type}
          className="field__input"
          placeholder=" "
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? hintId : undefined}
          style={trailing ? { paddingRight: 52 } : undefined}
          {...rest}
        />
        <label htmlFor={inputId} className="field__label">
          {label}
        </label>
        {trailing}
        {(error || hint) && (
          <p id={hintId} className="field__hint">
            {error || hint}
          </p>
        )}
      </div>
    );
  },
);
TextField.displayName = 'TextField';

export const PasswordField: React.FC<Omit<TextFieldProps, 'type' | 'trailing'>> = (props) => {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          className="field__trailing"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={20} />
        </button>
      }
    />
  );
};

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, options, id, className, ...rest }) => {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={cx('field field--select', className)}>
      <select id={selectId} className="field__input" {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <label htmlFor={selectId} className="field__label">
        {label}
      </label>
    </div>
  );
};

/* ───────────── Segmented control ───────────── */
interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
  size?: 'md' | 'lg';
  className?: string;
}

export function Segmented<T extends string>({ value, onChange, options, label, size = 'md', className }: SegmentedProps<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx('segmented', size === 'lg' && 'segmented--lg', className)}
      onKeyDown={onKeyDown}
    >
      <span
        className="segmented__thumb"
        aria-hidden
        style={{ width: `calc((100% - 4px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          className="segmented__item"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ───────────── Avatar (initials on a deterministic brand gradient) ───────────── */
const AVATAR_GRADIENTS: Array<[string, string]> = [
  ['#9fd48c', '#3a7733'],
  ['#f2c98f', '#c47a2c'],
  ['#e9c987', '#9a7428'],
  ['#a7d7c5', '#2f7a64'],
  ['#f5b8a0', '#c0573a'],
  ['#b9c9f0', '#4a64b0'],
];

export function initials(name: string) {
  const parts = name
    .replace(/\(.*?\)/g, '')
    .replace(/^(dra?\.?|dr\.?)\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter((p) => /\p{L}/u.test(p));
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ name, size = 'md' }) => {
  const hash = Array.from(name).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const [a1, a2] = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
  return (
    <span
      className={cx('avatar', size !== 'md' && `avatar--${size}`)}
      style={{ '--a1': a1, '--a2': a2 } as React.CSSProperties}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
};

/* ───────────── Sheet (dialog on desktop, bottom sheet on mobile) ───────────── */
interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ open, onClose, title, children, footer }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="sheet__grabber" aria-hidden />
        <div className="sheet__header">
          <h2 id={titleId} className="t-title-3">
            {title}
          </h2>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={16} strokeWidth={2.4} />
          </button>
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};

/* ───────────── Skeleton, empty state, mascot ───────────── */
export const Skeleton: React.FC<{ width?: number | string; height?: number | string; radius?: number; className?: string }> = ({
  width = '100%',
  height = 16,
  radius,
  className,
}) => <span className={cx('skeleton', className)} style={{ display: 'block', width, height, borderRadius: radius }} aria-hidden />;

export const Mascot: React.FC<{ size?: number; className?: string }> = ({ size = 112, className }) => (
  <img src="/images/mascote.png" alt="" width={size} height={size} className={cx('mascot', className)} />
);

export const EmptyState: React.FC<{ title: string; text?: string; action?: React.ReactNode }> = ({ title, text, action }) => (
  <div className="empty">
    <Mascot className="empty__art" />
    <h3 className="t-title-3">{title}</h3>
    {text && <p className="empty__text">{text}</p>}
    {action}
  </div>
);

/* ───────────── Page header ───────────── */
export const PageHeader: React.FC<{ eyebrow?: string; title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }> = ({
  eyebrow,
  title,
  subtitle,
  actions,
}) => {
  useLayoutEffect(() => {
    document.title = `${title} · HopeMind`;
  }, [title]);
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
        <h1 className="t-large-title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
};

export { cx };
