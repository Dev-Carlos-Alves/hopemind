import React, { useId } from 'react';
import { AnswerValue, Answers, PERIODS, QuestionDef, WEEKDAYS } from '../services/questionnaire';
import { Icon } from './Icon';
import { cx, TextField } from './ui';

interface Props {
  question: QuestionDef;
  value: AnswerValue | undefined;
  answers: Answers;
  onChange: (value: AnswerValue | undefined) => void;
  error?: string;
  /** Labels for matrix rows (they come from another question's options). */
  rowLabels?: Record<string, string>;
}

const ScaleRow: React.FC<{
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  minLabel: string;
  maxLabel: string;
  allowNotApplicable?: boolean;
  label: string;
}> = ({ value, onChange, minLabel, maxLabel, allowNotApplicable, label }) => (
  <div className="scale">
    <div className="scale__track" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n}${n === 1 ? ` — ${minLabel}` : n === 5 ? ` — ${maxLabel}` : ''}`}
          className="scale__dot"
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
    <div className="scale__labels" aria-hidden>
      <span>{minLabel}</span>
      <span>{maxLabel}</span>
    </div>
    {allowNotApplicable && (
      <button type="button" className="chip scale__na" aria-pressed={value === null} onClick={() => onChange(null)}>
        Não se aplica
      </button>
    )}
  </div>
);

export const QuestionField: React.FC<Props> = ({ question: q, value, answers, onChange, error, rowLabels }) => {
  const promptId = useId();

  let control: React.ReactNode = null;

  switch (q.type) {
    case 'single':
      control = (
        <div className="stack gap-2" role="radiogroup" aria-labelledby={promptId}>
          {q.options!.map((o) => {
            const checked = value === o.value;
            return (
              <button key={o.value} type="button" role="radio" aria-checked={checked} className="option" onClick={() => onChange(o.value)}>
                <span className="option__mark">{checked && <Icon name="check" size={14} strokeWidth={3} />}</span>
                <span className="option__text">{o.label}</span>
              </button>
            );
          })}
        </div>
      );
      break;

    case 'multi': {
      const selected = (value as string[] | undefined) ?? [];
      const atLimit = !!q.maxSelections && selected.length >= q.maxSelections;
      const toggle = (v: string) => {
        if (selected.includes(v)) return onChange(selected.filter((x) => x !== v));
        if (q.exclusive?.includes(v)) return onChange([v]);
        const next = selected.filter((x) => !q.exclusive?.includes(x));
        if (q.maxSelections && next.length >= q.maxSelections) return;
        onChange([...next, v]);
      };
      control = (
        <div className="stack gap-2">
          <div className="chips" role="group" aria-labelledby={promptId}>
            {q.options!.map((o) => {
              const on = selected.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  className="chip"
                  aria-pressed={on}
                  disabled={!on && atLimit && !q.exclusive?.includes(o.value)}
                  onClick={() => toggle(o.value)}
                >
                  {on && <Icon name="check" size={15} strokeWidth={2.6} />}
                  {o.label}
                </button>
              );
            })}
          </div>
          {q.maxSelections && (
            <p className="t-footnote t-secondary">
              {selected.length} de {q.maxSelections} selecionadas
            </p>
          )}
        </div>
      );
      break;
    }

    case 'scale':
      control = (
        <ScaleRow
          label={q.prompt}
          value={value as number | null | undefined}
          onChange={onChange}
          minLabel={q.scale!.minLabel}
          maxLabel={q.scale!.maxLabel}
          allowNotApplicable={q.scale!.allowNotApplicable}
        />
      );
      break;

    case 'schedule': {
      const selected = new Set((value as string[] | undefined) ?? []);
      const toggle = (slot: string) => {
        const next = new Set(selected);
        if (next.has(slot)) next.delete(slot);
        else next.add(slot);
        onChange(Array.from(next));
      };
      control = (
        <div className="schedule" role="group" aria-labelledby={promptId}>
          <span />
          {WEEKDAYS.map((d) => (
            <span key={d.value} className="schedule__day">
              {d.label}
            </span>
          ))}
          {PERIODS.map((p) => (
            <React.Fragment key={p.value}>
              <span className="schedule__period">
                {p.label}
                <small>{p.hint}</small>
              </span>
              {WEEKDAYS.map((d) => {
                const slot = `${d.value}-${p.value}`;
                const on = selected.has(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    className="schedule__cell"
                    aria-pressed={on}
                    aria-label={`${d.label}, ${p.label}`}
                    onClick={() => toggle(slot)}
                  >
                    {on && <Icon name="check" size={16} strokeWidth={2.6} />}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      );
      break;
    }

    case 'text':
      control =
        (q.maxLength ?? 0) > 120 ? (
          <textarea
            className="textarea"
            aria-labelledby={promptId}
            rows={4}
            maxLength={q.maxLength}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escreva com suas palavras (opcional)"
          />
        ) : (
          <TextField
            label="Cidade"
            maxLength={q.maxLength}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            autoComplete="address-level2"
          />
        );
      break;

    case 'matrix': {
      const rows = (answers[q.rowsFrom!] as string[] | undefined) ?? [];
      const levels = (value as Record<string, number> | undefined) ?? {};
      control = rows.length ? (
        <div className="group__body matrix">
          {rows.map((row) => (
            <div key={row} className="matrix__row">
              <span className="t-callout" style={{ fontWeight: 600 }}>
                {rowLabels?.[row] ?? row}
              </span>
              <ScaleRow
                label={`Experiência em ${rowLabels?.[row] ?? row}`}
                value={levels[row]}
                onChange={(n) => onChange({ ...levels, [row]: n as number })}
                minLabel={q.scale!.minLabel}
                maxLabel={q.scale!.maxLabel}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="t-callout t-secondary">Selecione as demandas acima para informar sua experiência.</p>
      );
      break;
    }
  }

  return (
    <div className={cx('question', error && 'question--invalid')} data-code={q.code}>
      <div className="question__head">
        <p id={promptId} className="t-headline question__prompt">
          {q.prompt}
          {!q.required && <span className="question__optional">Opcional</span>}
        </p>
        {q.help && <p className="t-subhead t-secondary">{q.help}</p>}
      </div>
      {control}
      {error && (
        <p className="question__error" role="alert">
          <Icon name="alert" size={14} /> {error}
        </p>
      )}
    </div>
  );
};
