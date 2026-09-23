import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { api, getErrorMessage } from '../services/api';
import { CepAddress, maskCep, placeLabel, ProfileAddress, saveAddress } from '../services/address';
import { CepField } from './CepField';
import { Icon } from './Icon';
import { Button, Skeleton, TextField } from './ui';

interface Props {
  title: string;
  footer?: React.ReactNode;
  /** Opens the form right away (used when the address is missing and needed). */
  startEditing?: boolean;
  onSaved?: (address: ProfileAddress) => void;
}

/** Shows the address on the profile and lets the user change it by CEP. */
export const AddressCard: React.FC<Props> = ({ title, footer, startEditing, onSaved }) => {
  const toast = useToast();
  const [address, setAddress] = useState<ProfileAddress | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(!!startEditing);
  const [cep, setCep] = useState('');
  const [number, setNumber] = useState('');
  const [resolved, setResolved] = useState<CepAddress | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<ProfileAddress>('/auth/me')
      .then((res) => {
        setAddress(res.data);
        setCep(maskCep(res.data.cep ?? ''));
        setNumber(res.data.addressNumber ?? '');
        if (!res.data.cep) setEditing(true);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolved) return;
    setSaving(true);
    try {
      const saved = await saveAddress(cep, number);
      setAddress(saved);
      setEditing(false);
      toast.success('Endereço atualizado.');
      onSaved?.(saved);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Não foi possível salvar o endereço.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="group">
      <h3 className="group__header">{title}</h3>
      <div className="group__body">
        {!loaded ? (
          <div className="list-row">
            <Skeleton width={30} height={30} radius={8} />
            <Skeleton width="50%" height={14} />
          </div>
        ) : editing ? (
          <form className="address-form" onSubmit={save}>
            <div className="field-grid">
              <CepField value={cep} onChange={setCep} onResolved={setResolved} autoFocus={!startEditing} />
              <TextField label="Número (opcional)" value={number} onChange={(e) => setNumber(e.target.value)} maxLength={20} />
            </div>
            <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
              {address?.cep && (
                <Button variant="gray" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" loading={saving} disabled={!resolved}>
                Salvar endereço
              </Button>
            </div>
          </form>
        ) : (
          <div className="list-row" style={{ '--row-inset': '58px' } as React.CSSProperties}>
            <span className="list-row__icon" style={{ background: '#c0573a' }}>
              <Icon name="map-pin" size={17} strokeWidth={2} />
            </span>
            <span className="list-row__label">
              <span className="t-body">{address ? placeLabel(address) : '—'}</span>
              <span className="t-footnote t-secondary" style={{ display: 'block' }}>
                {[address?.street, address?.addressNumber].filter(Boolean).join(', ')} · CEP {address?.cep}
              </span>
            </span>
            <Button variant="plain" size="sm" onClick={() => setEditing(true)}>
              Alterar
            </Button>
          </div>
        )}
      </div>
      {footer && <p className="group__footer">{footer}</p>}
    </section>
  );
};
