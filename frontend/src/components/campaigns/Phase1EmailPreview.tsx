import { useState } from 'react';
import { Bot, RefreshCw, Save, Sparkles } from 'lucide-react';
import type { EmailPreview } from '../../mocks/emailPreviews';
import type { MockTarget } from '../../mocks/targets';

interface Phase1EmailPreviewProps {
  target: MockTarget;
  preview: EmailPreview;
  onChange: (preview: EmailPreview) => void;
  onRegenerate: () => void;
}

const inputClass =
  'w-full rounded-xl border border-[#2D3748] bg-[#1D232D] px-3 py-2.5 text-sm text-[#F5F7FB] outline-none transition focus:border-[#2FD9C7] focus:ring-2 focus:ring-[#2FD9C7]/20';

export function Phase1EmailPreview({ target, preview, onChange, onRegenerate }: Phase1EmailPreviewProps) {
  const [saved, setSaved] = useState(false);

  const update = (changes: Partial<EmailPreview>) => {
    setSaved(false);
    onChange({ ...preview, ...changes });
  };

  const markSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <article className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2FD9C7]">
            <Bot className="h-4 w-4" aria-hidden="true" />
            AI-personalized preview
          </div>
          <h3 className="mt-2 text-lg font-bold text-[#F5F7FB]">{target.name}</h3>
          <p className="mt-1 text-xs text-[#7A8595]">
            {target.department} · {target.role} · {target.email}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#3D4860] bg-[#2D3748] px-3 py-2 text-xs font-semibold text-[#F5F7FB] transition hover:bg-[#232D39]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Regenerate
          </button>
          <button
            type="button"
            onClick={markSaved}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#2FD9C7] px-3 py-2 text-xs font-bold text-[#0F1219] transition hover:bg-[#4FE5D3]"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {saved ? 'Saved' : 'Save edits'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#7A8595]">Subject</span>
            <input value={preview.subject} onChange={(event) => update({ subject: event.target.value })} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#7A8595]">Email body</span>
            <textarea
              rows={12}
              value={preview.body}
              onChange={(event) => update({ body: event.target.value })}
              className={`${inputClass} resize-y leading-6`}
            />
          </label>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#A78BFA]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Personalization reasoning
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-[#A8B4C4]">
              {preview.personalizationSummary.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </section>

          <section className="rounded-xl border border-[#2FD9C7]/20 bg-[#2FD9C7]/[0.05] p-4">
            <div className="text-xs font-semibold text-[#2FD9C7]">Simulation deliverability reasoning</div>
            <p className="mt-2 text-xs leading-5 text-[#A8B4C4]">{preview.deliverabilityReasoning}</p>
          </section>

          <div className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/[0.05] p-4 text-xs leading-5 text-[#F6BF5C]">
            This is a controlled awareness simulation. The preview is individualized per target; it is not a broadcast template.
          </div>
        </aside>
      </div>
    </article>
  );
}
