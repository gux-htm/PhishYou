import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound(){return <main className="not-found"><section className="not-found-card"><div className="eyebrow">Navigation signal lost</div><div className="not-found-code">404</div><h1 className="display">This route doesn't exist.</h1><p>The page may have moved, or the address may be outside the current workspace.</p><div style={{display:'flex',gap:10,justifyContent:'center',marginTop:28,flexWrap:'wrap'}}><Link className="button-primary" to="/dashboard"><Compass size={17}/> Go to agent home</Link><Link className="button-secondary" to="/"><ArrowLeft size={17}/> Return to site</Link></div></section></main>}
