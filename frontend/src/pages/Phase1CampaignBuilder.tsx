import { FormEvent, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Mail, Plus, RefreshCw, ShieldCheck, Trash2, WandSparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Phase1EmailPreview } from '../components/campaigns/Phase1EmailPreview';
import { buildEmailPreview, type EmailPreview } from '../mocks/emailPreviews';
import { createPhase1Campaign } from '../mocks/usePhase1Mocks';
import type { MockTarget } from '../mocks/targets';

interface DraftTarget extends MockTarget {}

const STEPS = [
  { label: 'Campaign', description: 'Goal and scenario' },
  { label: 'Targets', description: 'Per-target context' },
  { label: 'Emails', description: 'AI previews' },
  { label: 'Spoofing', description: 'AI sender recommendation' },
  { label: 'Review', description: 'Launch' },
];

const TARGET_SEED: DraftTarget = {
  id: 'draft-target-1',
  name: '',
  email: '',
  department: '',
  role: '',
  personalContext: '',
};

const card = 'rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6';
const input = 'w-full rounded-xl border border-[#2D3748] bg-[#1D232D] px-3 py-2.5 text-sm text-[#F5F7FB] outline-none transition focus:border-[#2FD9C7] focus:ring-2 focus:ring-[#2FD9C7]/20';
const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2FD9C7] px-4 py-2.5 text-sm font-bold text-[#0F1219] transition hover:bg-[#4FE5D3] disabled:cursor-not-allowed disabled:opacity-40';
const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#3D4860] bg-[#2D3748] px-4 py-2.5 text-sm font-semibold text-[#F5F7FB] transition hover:bg-[#232D39]';

function makeDraftTarget(index: number): DraftTarget {
  return { ...TARGET_SEED, id: `draft-target-${Date.now()}-${index}` };
}

export default function Phase1CampaignBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('');
  const [organizationContext, setOrganizationContext] = useState('');
  const [scenarioContext, setScenarioContext] = useState('');
  const [timingContext, setTimingContext] = useState('');
  const [targets, setTargets] = useState<DraftTarget[]>([]);
  const [newTarget, setNewTarget] = useState<DraftTarget>(makeDraftTarget(0));
  const [previews, setPreviews] = useState<EmailPreview[]>([]);
  const [spoofing, setSpoofing] = useState({
    aiRecommended: true,
    recommendation: 'The AI recommends a simulation-only sender identity that resembles the target’s expected internal security workflow while avoiding impersonation of an actual individual.',
    senderName: 'Meridian Security Operations',
    senderEmail: 'security-awareness@sim.meridian.example',
    replyTo: 'awareness-team@meridian.example',
    overridden: false,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [launching, setLaunching] = useState(false);

  const stepValid = useMemo(() => {
    const campaign = name.trim().length >= 3 && campaignGoal.trim().length >= 5 && organizationContext.trim().length >= 10;
    const targetList = targets.length > 0 && targets.every((target) => target.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target.email) && target.department.trim() && target.role.trim() && target.personalContext.trim().length >= 5);
    const emailList = targets.length > 0 && previews.length === targets.length && previews.every((preview) => preview.subject.trim() && preview.body.trim());
    const spoofingValid = spoofing.senderName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(spoofing.senderEmail) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(spoofing.replyTo);
    return [campaign, targetList, emailList, Boolean(spoofingValid), campaign && targetList && emailList && Boolean(spoofingValid)];
  }, [name, campaignGoal, organizationContext, targets, previews, spoofing]);

  function validateCurrentStep(): boolean {
    const nextErrors: string[] = [];
    if (step === 0) {
      if (name.trim().length < 3) nextErrors.push('Campaign name must be at least 3 characters.');
      if (campaignGoal.trim().length < 5) nextErrors.push('Campaign Goal must clearly describe the intended target action.');
      if (organizationContext.trim().length < 10) nextErrors.push('Add organization context so the AI can individualize the campaign.');
    }
    if (step === 1 && !stepValid[1]) nextErrors.push('Add at least one complete target with name, email, department, role, and personal context.');
    if (step === 2 && !stepValid[2]) nextErrors.push('Generate and review an individualized email preview for every target.');
    if (step === 3 && !stepValid[3]) nextErrors.push('Sender name, simulation email, and Reply-To must all be valid email configuration values.');
    setErrors(nextErrors);
    return nextErrors.length === 0;
  }

  function next() {
    if (!validateCurrentStep()) return;
    if (step === 1) {
      setPreviews((current) => targets.map((target) => current.find((preview) => preview.targetId === target.id) ?? buildEmailPreview(target, campaignGoal, organizationContext)));
    }
    setErrors([]);
    setStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  function addTarget(event: FormEvent) {
    event.preventDefault();
    setErrors([]);
    if (newTarget.name.trim().length < 2) return setErrors(['Enter the target’s name.']);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTarget.email)) return setErrors(['Enter a valid target email address.']);
    if (!newTarget.department.trim() || !newTarget.role.trim()) return setErrors(['Department and role are required.']);
    if (newTarget.personalContext.trim().length < 5) return setErrors(['Add at least one sentence of personal context so the AI can individualize the email.']);
    if (targets.some((target) => target.email.toLowerCase() === newTarget.email.toLowerCase())) return setErrors(['That target email is already on the campaign.']);
    setTargets((current) => [...current, newTarget]);
    setNewTarget(makeDraftTarget(targets.length + 1));
  }

  function regeneratePreview(target: MockTarget) {
    setPreviews((current) => {
      const currentPreview = current.find((preview) => preview.targetId === target.id);
      const version = (currentPreview?.version ?? 1) + 1;
      const next = buildEmailPreview(target, campaignGoal, organizationContext, version);
      return current.map((preview) => (preview.targetId === target.id ? next : preview)).concat(currentPreview ? [] : [next]);
    });
  }

  function removeTarget(targetId: string) {
    setTargets((current) => current.filter((target) => target.id !== targetId));
    setPreviews((current) => current.filter((preview) => preview.targetId !== targetId));
  }

  function handleLaunch() {
    if (!stepValid[4]) {
      setErrors(['Resolve all review items before launching.']);
      return;
    }
    setLaunching(true);
    try {
      const campaign = createPhase1Campaign({
        name,
        campaignGoal,
        organizationContext,
        scenarioContext,
        timingContext,
        targets,
        emailPreviews: previews,
        spoofing,
      });
      navigate(`/campaigns/${campaign.id}/live`);
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="text-[10px] font-bold uppercase tracking-[.2em] text-[#2FD9C7]">Phase 1 campaign studio</div>
        <h1 className="mt-2 text-4xl font-black tracking-[-.05em] text-[#F5F7FB]">Create an individualized simulation.</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#A8B4C4]">The AI uses campaign context and each target’s profile to craft separate emails. This flow is a controlled simulation workspace, not a broadcast composer.</p>
      </header>

      <div className="mb-6 grid gap-2 md:grid-cols-5">
        {STEPS.map((item, index) => (
          <button key={item.label} type="button" onClick={() => index < step && setStep(index)} className="rounded-xl border p-3 text-left transition" style={{ borderColor: index === step ? '#2FD9C7' : '#2D3748', background: index === step ? 'rgba(47,217,199,.06)' : '#15191F' }}>
            <div className="flex items-center gap-2 text-xs font-bold text-[#F5F7FB]"><span className="font-mono text-[#2FD9C7]">0{index + 1}</span>{item.label}</div>
            <div className="mt-1 text-[11px] text-[#7A8595]">{item.description}</div>
          </button>
        ))}
      </div>

      {errors.length > 0 && (
        <div role="alert" className="mb-6 rounded-xl border border-[#FF4757]/30 bg-[#FF4757]/[0.06] p-4 text-sm text-[#FF9AA4]">
          {errors.map((error) => <div key={error} className="flex gap-2 py-1"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>)}
        </div>
      )}

      {step === 0 && (
        <section className={card}>
          <div className="flex items-start gap-3"><WandSparkles className="mt-1 h-5 w-5 text-[#2FD9C7]" /><div><h2 className="text-xl font-bold text-[#F5F7FB]">Campaign intent</h2><p className="mt-1 text-sm text-[#7A8595]">Define exactly what the simulation should measure. The Campaign Goal is the intended target action.</p></div></div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#7A8595]">Campaign name *</span><input className={input} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Q3 finance payment-verification exercise" /></label>
            <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#2FD9C7]">Campaign Goal *</span><input className={input} value={campaignGoal} onChange={(event) => setCampaignGoal(event.target.value)} placeholder="e.g. click the simulation link" /></label>
            <label className="block lg:col-span-2"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#7A8595]">Organization context *</span><textarea className={`${input} resize-y leading-6`} rows={4} value={organizationContext} onChange={(event) => setOrganizationContext(event.target.value)} placeholder="What team, process, or organizational situation is being simulated?" /></label>
            <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#7A8595]">Scenario context</span><textarea className={`${input} resize-y leading-6`} rows={4} value={scenarioContext} onChange={(event) => setScenarioContext(event.target.value)} placeholder="Describe the scenario the AI should use when writing individualized emails." /></label>
            <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#7A8595]">Timing context</span><textarea className={`${input} resize-y leading-6`} rows={4} value={timingContext} onChange={(event) => setTimingContext(event.target.value)} placeholder="Mention timing or business-calendar details that matter to the exercise." /></label>
          </div>
          <div className="mt-6 rounded-xl border border-[#2FD9C7]/20 bg-[#2FD9C7]/[.05] p-4 text-xs leading-5 text-[#A8B4C4]"><ShieldCheck className="mr-2 inline h-4 w-4 text-[#2FD9C7]" />The AI uses this context per target. It does not turn the campaign into a single broadcast message.</div>
        </section>
      )}

      {step === 1 && (
        <section className={card}>
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-[#F5F7FB]">Target roster and personal context</h2><p className="mt-1 text-sm text-[#7A8595]">Every target gets separate context so the generated email can be individualized.</p></div><span className="text-xs font-mono text-[#2FD9C7]">{targets.length} targets</span></div>
          <form onSubmit={addTarget} className="mt-6 grid gap-3 rounded-xl border border-dashed border-[#3D4860] bg-[#1D232D]/50 p-4 lg:grid-cols-6">
            <input className={input} value={newTarget.name} onChange={(event) => setNewTarget({ ...newTarget, name: event.target.value })} placeholder="Full name" />
            <input className={input} value={newTarget.email} onChange={(event) => setNewTarget({ ...newTarget, email: event.target.value })} placeholder="Email" type="email" />
            <input className={input} value={newTarget.department} onChange={(event) => setNewTarget({ ...newTarget, department: event.target.value })} placeholder="Department" />
            <input className={input} value={newTarget.role} onChange={(event) => setNewTarget({ ...newTarget, role: event.target.value })} placeholder="Role" />
            <textarea className={`${input} lg:col-span-2`} rows={2} value={newTarget.personalContext} onChange={(event) => setNewTarget({ ...newTarget, personalContext: event.target.value })} placeholder="Personal context: responsibilities, working habits, relevant situation…" />
            <button className={`${primary} lg:col-span-6`} type="submit"><Plus className="h-4 w-4" />Add target</button>
          </form>
          <div className="mt-5 space-y-3">
            {targets.map((target) => (
              <article key={target.id} className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4">
                <div className="flex items-start gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2FD9C7]/10 text-[#2FD9C7]"><Mail className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-[#F5F7FB]">{target.name}</h3><span className="text-xs text-[#7A8595]">{target.department} · {target.role}</span></div><div className="mt-1 text-xs text-[#7A8595]">{target.email}</div><p className="mt-2 text-sm leading-5 text-[#A8B4C4]">{target.personalContext}</p></div><button type="button" onClick={() => removeTarget(target.id)} className="text-[#7A8595] transition hover:text-[#FF4757]" aria-label={`Remove ${target.name}`}><Trash2 className="h-4 w-4" /></button></div>
              </article>
            ))}
            {targets.length === 0 && <div className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-8 text-center text-sm text-[#7A8595]">Add at least one target to continue.</div>}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5">
          <div className={card}><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-[#F5F7FB]">AI-generated email previews</h2><p className="mt-1 text-sm text-[#7A8595]">Each target receives a distinct preview built from their own context and the Campaign Goal.</p></div><button className={secondary} type="button" onClick={() => setPreviews(targets.map((target) => buildEmailPreview(target, campaignGoal, organizationContext, (previews.find((item) => item.targetId === target.id)?.version ?? 1) + 1)))}><RefreshCw className="h-4 w-4" />Regenerate all</button></div></div>
          {targets.map((target) => {
            const preview = previews.find((item) => item.targetId === target.id) ?? buildEmailPreview(target, campaignGoal, organizationContext);
            return <Phase1EmailPreview key={target.id} target={target} preview={preview} onChange={(next) => setPreviews((current) => [...current.filter((item) => item.targetId !== target.id), next])} onRegenerate={() => regeneratePreview(target)} />;
          })}
        </section>
      )}

      {step === 3 && (
        <section className={card}>
          <div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-5 w-5 text-[#2FD9C7]" /><div><h2 className="text-xl font-bold text-[#F5F7FB]">AI spoofing recommendation</h2><p className="mt-1 text-sm text-[#7A8595]">The AI decides whether a simulation sender strategy is useful from the campaign context. You can override the recommendation here.</p></div></div>
          <div className="mt-6 rounded-xl border border-[#2FD9C7]/25 bg-[#2FD9C7]/[.05] p-5"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#2FD9C7]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2FD9C7]">AI recommendation</span><span className="text-xs text-[#A8B4C4]">{spoofing.aiRecommended ? 'Recommended for this campaign' : 'Not recommended'}</span></div><p className="mt-3 text-sm leading-6 text-[#A8B4C4]">{spoofing.recommendation}</p></div>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <label><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#7A8595]">Spoofed sender name *</span><input className={input} value={spoofing.senderName} onChange={(event) => setSpoofing({ ...spoofing, senderName: event.target.value, overridden: true })} /></label>
            <label><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#7A8595]">Spoofed email address/domain *</span><input className={input} value={spoofing.senderEmail} onChange={(event) => setSpoofing({ ...spoofing, senderEmail: event.target.value, overridden: true })} type="email" /></label>
            <label><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#7A8595]">Reply-To address *</span><input className={input} value={spoofing.replyTo} onChange={(event) => setSpoofing({ ...spoofing, replyTo: event.target.value, overridden: true })} type="email" /></label>
          </div>
          {spoofing.overridden && <div className="mt-4 text-xs text-[#F6BF5C]">Sender configuration has been overridden from the AI recommendation.</div>}
          <div className="mt-6 rounded-xl border border-[#FF4757]/25 bg-[#FF4757]/[.06] p-4 text-sm leading-6 text-[#FF9AA4]"><AlertTriangle className="mr-2 inline h-4 w-4" />Authorized simulation only. Use simulation-controlled identities and domains. Do not use this configuration for impersonation outside an authorized exercise.</div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-5">
          <section className={card}><h2 className="text-xl font-bold text-[#F5F7FB]">Review before launch</h2><div className="mt-5 grid gap-4 lg:grid-cols-3"><div className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4"><div className="text-[10px] uppercase tracking-wider text-[#7A8595]">Campaign Goal</div><div className="mt-2 text-sm font-semibold text-[#F5F7FB]">{campaignGoal}</div></div><div className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4"><div className="text-[10px] uppercase tracking-wider text-[#7A8595]">Targets</div><div className="mt-2 text-sm font-semibold text-[#F5F7FB]">{targets.length} individualized recipients</div></div><div className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4"><div className="text-[10px] uppercase tracking-wider text-[#7A8595]">Spoofing</div><div className="mt-2 text-sm font-semibold text-[#F5F7FB]">{spoofing.aiRecommended ? 'AI recommended' : 'AI not recommended'} · {spoofing.overridden ? 'overridden' : 'default strategy'}</div></div></div></section>
          <section className={card}><h3 className="text-lg font-bold text-[#F5F7FB]">Launch readiness</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="flex items-center gap-2 text-sm text-[#A8B4C4]"><CheckCircle2 className="h-4 w-4 text-[#06D369]" /> Campaign name and goal defined</div><div className="flex items-center gap-2 text-sm text-[#A8B4C4]"><CheckCircle2 className="h-4 w-4 text-[#06D369]" /> Per-target context captured</div><div className="flex items-center gap-2 text-sm text-[#A8B4C4]"><CheckCircle2 className="h-4 w-4 text-[#06D369]" /> Individual email preview for every target</div><div className="flex items-center gap-2 text-sm text-[#A8B4C4]"><CheckCircle2 className="h-4 w-4 text-[#06D369]" /> Spoofing strategy reviewed</div></div></section>
          <div className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/[.05] p-4 text-xs leading-5 text-[#F6BF5C]">Launching starts the mock live-monitor journey. The mock layer produces staged delivery, open, click, and form-submission events so the entire Phase 1 flow can be exercised without a backend.</div>
        </section>
      )}

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#2D3748] pt-5">
        <button type="button" className={secondary} onClick={() => (step === 0 ? navigate('/campaigns') : setStep((value) => value - 1))}><ArrowLeft className="h-4 w-4" />{step === 0 ? 'Cancel' : 'Back'}</button>
        {step < STEPS.length - 1 ? <button type="button" className={primary} onClick={next}>Continue <ArrowRight className="h-4 w-4" /></button> : <button type="button" className={primary} onClick={handleLaunch} disabled={launching}>{launching ? 'Launching…' : 'Launch campaign'} <ArrowRight className="h-4 w-4" /></button>}
      </footer>
    </div>
  );
}
