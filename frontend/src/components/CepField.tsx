import React, { useEffect, useState } from 'react';
import { getErrorMessage } from '../services/api';
import { CepAddress, lookupCep, maskCep, placeLabel } from '../services/address';
import { onlyDigits } from '../services/format';
import { Icon } from './Icon';
import { TextField } from './ui';

interface Props {
  value: string;
  onChange: (masked: string) => void;
  onResolved?: (address: CepAddress | null) => void;
  label?: string;
  hint?: string;
  autoFocus?: boolean;
}

/** CEP input that looks the address up as soon as the 8 digits are typed. */
export const CepField: React.FC<Props> = ({ value, onChange, onResolved, label = 'CEP', hint, autoFocus }) => {
  const [address, setAddress] = useState<CepAddress | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const digits = onlyDigits(value);

  useEffect(() => {
    setError('');
    if (digits.length !== 8) {
      setAddress(null);
      onResolved?.(null);
      return;
    }
    let active = true;
    setLoading(true);
    lookupCep(digits)
      .then((a) => {
        if (!active) return;
        setAddress(a);
        onResolved?.(a);
      })
      .catch((err) => {
        if (!active) return;
        setAddress(null);
        onResolved?.(null);
        setError(getErrorMessage(err, 'Não encontramos esse CEP.'));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // onResolved is a callback prop; re-running on its identity would repeat the lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  return (
    <div className="stack gap-2">
      <TextField
        label={label}
        inputMode="numeric"
        autoComplete="postal-code"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(maskCep(e.target.value))}
        error={error || undefined}
        hint={address ? undefined : hint}
        trailing={loading ? <span className="field__trailing"><span className="btn__spinner" aria-hidden /></span> : undefined}
      />
      {address && (
        <p className="cep-result animate-rise" role="status">
          <Icon name="map-pin" size={16} />
          <span>
            {address.street && <strong>{address.street} · </strong>}
            {placeLabel(address)}
          </span>
        </p>
      )}
    </div>
  );
};
