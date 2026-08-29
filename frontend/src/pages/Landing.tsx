import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, BrainCircuit, ShieldCheck, Sparkles, Orbit, ScanLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../design/ThemeProvider';
import './landing-3d.css';

function AgentScene(){
  const sceneRef=useRef<HTMLDivElement>(null);
  const [tilt,setTilt]=useState({x:0,y:0});
  useEffect(()=>{const node=sceneRef.current;if(!node)return;const reset=()=>setTilt({x:0,y:0});node.addEventListener('mouseleave',reset);return()=>node.removeEventListener('mouseleave',reset)},[]);
  const move=(e:React.MouseEvent<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect();setTilt({x:((e.clientY-r.top)/r.height-.5)*-9,y:((e.clientX-r.left)/r.width-.5)*12})};
  return <div ref={sceneRef} onMouseMove={move} className="py-orbital-card py-3d-scene" style={{'--rx':`${tilt.x}deg`,'--ry':`${tilt.y}deg`} as React.CSSProperties}>
    <div className="py-scene-grid"/><div className="py-scene-glow"/><div className="py-orbit py-orbit-a"/><div className="py-orbit py-orbit-b"/><div className="py-orbit py-orbit-c"/>
    <div className="py-3d-orbit py-3d-orbit-a"><span/></div><div className="py-3d-orbit py-3d-orbit-b"><span/></div>
    <div className="py-core"><Bot size={32}/><span>AGENT ONLINE</span><i/></div>
    <div className="py-signal py-signal-a py-floating-panel"><small>CONTEXT</small><b>INDEXED</b><i/></div>
    <div className="py-signal py-signal-b py-floating-panel"><small>PLAN</small><b>READY</b><i/></div>
    <div className="py-signal py-signal-c py-floating-panel"><ScanLine size={15}/><span>LIVE SIGNAL</span></div>
    <div className="py-particle py-p1"/><div className="py-particle py-p2"/><div className="py-particle py-p3"/><div className="py-particle py-p4"/><div className="py-particle py-p5"/>
    <div className="py-scan-plane"/><div className="py-scene-caption"><Orbit size={13}/><span>ADAPTIVE REASONING SPACE</span></div>
  </div>
}

export function Landing(){const {theme,toggleTheme}=useTheme(); return <div className="py-landing"><header className="py-landing-nav"><Link to="/" className="py-brand"><span className="py-brand-mark">P</span><span>PhishYou</span></Link><nav><a href="#platform">Platform</a><a href="#how">How it works</a><Link to="/login">Sign in</Link><button onClick={toggleTheme}>{theme==='dark'?'LIGHT':'DARK'}</button><Link className="py-cta" to="/login">Enter system <ArrowRight size={15}/></Link></nav></header><main className="py-landing-main"><section className="py-hero"><div className="py-hero-copy"><p className="py-eyebrow">AI-NATIVE SECURITY AWARENESS</p><h1>Understand the <em>human layer.</em></h1><p className="py-lede">PhishYou helps authorized security teams design, observe and learn from adaptive awareness simulations—with an AI workspace at the center.</p><div className="py-hero-actions"><Link className="py-primary" to="/login">Explore the platform <ArrowRight size={17}/></Link><a href="#platform">See how it works</a></div></div><AgentScene/></section><section id="platform" className="py-feature-strip py-3d-feature-strip"><article><div className="py-card-depth"><BrainCircuit/><p className="py-eyebrow">01 / REASON</p><h3>Campaign-aware intelligence</h3><p>The agent works from approved campaign context rather than generic prompts.</p></div></article><article><div className="py-card-depth"><ShieldCheck/><p className="py-eyebrow">02 / GOVERN</p><h3>Guardrails stay visible</h3><p>Scope, review and operator controls remain part of the workspace.</p></div></article><article><div className="py-card-depth"><Sparkles/><p className="py-eyebrow">03 / LEARN</p><h3>Turn outcomes into insight</h3><p>Campaign evidence becomes actionable awareness intelligence.</p></div></article></section><section id="how" className="py-process"><p className="py-eyebrow">THE WORKFLOW</p><h2>From context to a defensible campaign.</h2><div className="py-process-grid"><span>01<br/><b>Create</b><small>Name the campaign and define its authorized scope.</small></span><span>02<br/><b>Brief</b><small>Add approved context or let the agent ask what it needs.</small></span><span>03<br/><b>Review</b><small>Inspect the plan and controls before anything begins.</small></span><span>04<br/><b>Learn</b><small>Observe the simulation and turn results into improvement.</small></span></div></section></main><footer>PHISHYOU <span>—</span> HUMAN-CENTRIC SECURITY INTELLIGENCE</footer></div>}
