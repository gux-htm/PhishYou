import { ArrowRight, Bot, BrainCircuit, Eye, Radar, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const features = [
  { icon: Bot, title: 'Agent-led campaigns', text: 'Brief one intelligence agent with authorized context, goals and guardrails. It helps turn ambiguity into a reviewable campaign plan.' },
  { icon: BrainCircuit, title: 'Adaptive intelligence', text: 'Keep campaign context, observed behavior and operator decisions connected in one workspace rather than scattered across tools.' },
  { icon: Eye, title: 'Observable by design', text: 'Follow campaign state, operator-visible events and review checkpoints without treating the agent as an opaque black box.' },
];

export function Landing() {
  const { theme, toggleTheme } = useTheme();
  return <div className="landing">
    <nav className="landing-nav"><Link to="/" className="brand"><span className="brand-mark"><ShieldCheck size={17}/></span><span>PHISH<span>YOU</span></span></Link><div className="landing-links"><a href="#platform">Platform</a><a href="#workflow">How it works</a><Link to="/login">Sign in</Link></div><div style={{display:'flex',gap:10}}><button className="icon-button" onClick={toggleTheme} aria-label="Switch theme">{theme === 'dark' ? '☼' : '◐'}</button><Link className="button-primary" to="/login">Enter platform <ArrowRight size={16}/></Link></div></nav>
    <section className="landing-hero"><div className="hero-copy"><div className="eyebrow">Human resilience, continuously understood</div><h1 className="display">Security awareness, with an agent that can think alongside you.</h1><p>PhishYou brings campaign context, planning, controlled simulations and after-action intelligence into one deliberate operating environment.</p><div className="hero-actions"><Link to="/login" className="button-primary">Start with the agent <ArrowRight size={17}/></Link><a href="#platform" className="button-secondary">Explore the platform</a></div><div className="trust-line"><span>Authorized simulations</span><span>Operator review</span><span>Guardrails active</span></div></div>
      <div className="agent-orbit" aria-label="PhishYou agent illustration"><div className="orbit-core"><div className="agent-node node-a"><b>CONTEXT</b><small>Indexed</small></div><div className="agent-node node-b"><b>PLAN</b><small>Review ready</small></div><div className="agent-node node-c"><b>SIGNALS</b><small>Observed</small></div><div className="agent-center"><div><Sparkles size={42}/></div></div></div></div>
    </section>
    <section id="platform" className="landing-section"><div className="eyebrow">A calmer command surface</div><h2 className="display" style={{fontSize:'clamp(38px,5vw,66px)',maxWidth:780,margin:'14px 0'}}>Everything important to the campaign. Nothing competing for attention.</h2><div className="feature-grid">{features.map(({icon:Icon,title,text})=><article className="feature-card" key={title}><div className="feature-icon"><Icon size={21}/></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section id="workflow" className="landing-section"><div className="panel" style={{padding:'36px',borderRadius:22,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:28}}><div><div className="eyebrow">01 / Brief</div><h3>Give the campaign its context.</h3><p style={{color:'var(--muted)'}}>Attach approved material or let the agent ask the questions needed to shape a campaign.</p></div><div><div className="eyebrow">02 / Review</div><h3>Turn context into a plan.</h3><p style={{color:'var(--muted)'}}>The plan stays reviewable, scoped and connected to the campaign's guardrails.</p></div><div><div className="eyebrow">03 / Learn</div><h3>Close the feedback loop.</h3><p style={{color:'var(--muted)'}}>Campaign intelligence becomes evidence for stronger coaching and organizational resilience.</p></div></div></section>
    <footer className="landing-footer">© {new Date().getFullYear()} PhishYou · Enterprise security-awareness intelligence</footer>
  </div>;
}
