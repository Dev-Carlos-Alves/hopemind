import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { api, getErrorMessage } from '../services/api';
import { Button, Sheet, TextField } from './ui';

/** What the professional profile looks like in GET /api/auth/me and PATCH /api/auth/me/profile. */
export interface ProfessionalProfile {
  crp: string;
  specialty: string;
  therapeuticApproach: string;
  biography?: string | null;
  sessionFee: string | number;
  contactLink?: string | null;
}

interface Props {
  open: boolean;
  profile: ProfessionalProfile | null;
  onClose: () => void;
  onSaved: (profile: ProfessionalProfile) => void;
}

const BIO_MAX = 2000;

/** US-11: the psychologist edits what patients see in their recommendations. */
export const ProfessionalProfileSheet: React.FC<Props> = ({ open, profile, onClose, onSaved }) => {
  const toast = useToast();
  const [specialty, setSpecialty] = useState('');
  const [approach, setApproach] = useState('');
  const [biography, setBiography] = useState('');
  const [fee, setFee] = useState('');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !profile) return;
    setSpecialty(profile.specialty ?? '');
    setApproach(profile.therapeuticApproach ?? '');
    setBiography(profile.biography ?? '');
    setFee(String(Number(profile.sessionFee ?? 0)));
    setLink(profile.contactLink ?? '');
    setError('');
  }, [open, profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.patch<ProfessionalProfile>('/auth/me/profile', {
        specialty: specialty.trim(),
        therapeuticApproach: approach.trim(),
        biography: biography.trim(),
        sessionFee: fee.replace(',', '.'),
        contactLink: link.trim(),
      });
      onSaved(res.data);
      toast.success('Perfil profissional atualizado.');
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível salvar o perfil.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Perfil profissional"
      footer={
        <Button type="submit" form="professional-profile" block size="lg" loading={saving}>
          Salvar alterações
        </Button>
      }
    >
      <form id="professional-profile" className="stack gap-4" onSubmit={save} noValidate>
        {error && (
          <p className="banner banner--danger" role="alert">
            {error}
          </p>
        )}
        <TextField label="Especialidade" value={specialty} onChange={(e) => setSpecialty(e.target.value)} required maxLength={255} />
        <TextField label="Abordagem terapêutica" value={approach} onChange={(e) => setApproach(e.target.value)} required maxLength={255} />
        <div className="field">
          <textarea
            id="professional-biography"
            className="field__input field__textarea"
            placeholder=" "
            value={biography}
            maxLength={BIO_MAX}
            rows={5}
            onChange={(e) => setBiography(e.target.value)}
          />
          <label htmlFor="professional-biography" className="field__label">
            Biografia
          </label>
          <p className="field__hint">
            {biography.length}/{BIO_MAX} · Como você trabalha e quem você atende.
          </p>
        </div>
        <TextField label="Valor da sessão (R$)" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d.,]/g, ''))} />
        <TextField
          label="Link de contato"
          type="url"
          inputMode="url"
          placeholder="https://wa.me/55..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
          hint="WhatsApp, site ou agenda online. Deixe em branco para não exibir."
        />
      </form>
    </Sheet>
  );
};
