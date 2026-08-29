import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const navigate = useNavigate(); const { theme, toggleTheme } = useTheme(); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const submit=(e:FormEvent)=>{e.preventDefault(); navigate('/dashboard')};
  return <main className="auth-page"><button className="icon-button" style={{position:'fixed',right:22,top:22}} onClick={toggleTheme} aria-label="Switch theme">{theme==='dark'?'☼':'◐'}</button><section className="auth-card"><Link to="/" className="brand"><span className="brand-mark"><ShieldCheck size={17}/></span><span>PHISH<span>YOU</span></span></Link><div className="eyebrow" style={{marginTop:34}}>Operator access</div><h1 className="display">Welcome back.</h1><p>Enter your workspace and continue where your campaigns left off.</p><form onSubmit={submit}><div className="auth-field"><label htmlFor="email">WORK EMAIL</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required/></div><div className="auth-field"><label htmlFor="password">PASSWORD</label><input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/></div><button className="button-primary auth-submit" type="submit">Enter command workspace <ArrowRight size={17}/></button></form><div style={{marginTop:24,paddingTop:18,borderTop:'1px solid var(--line)',display:'flex',gap:10,color:'var(--faint)',fontSize:12}}><LockKeyhole size={16}/><span>Authentication and access controls are applied before campaign operations begin.</span></div></section></main>;
}
