import { ArrowUp, Paperclip, Sparkles } from 'lucide-react';
import { useState } from 'react';
export function AgentComposer({ placeholder = 'Ask PhishYou anything about your security program…', compact = false }: { placeholder?: string; compact?: boolean }) {
 const [value, setValue] = useState('');
 return <div className={'py-agent-composer ' + (compact ? 'is-compact' : '')}><div className="py-agent-prompt"><Sparkles size={18}/><textarea value={value} onChange={e=>setValue(e.target.value)} rows={compact ? 1 : 3} placeholder={placeholder}/><button className="py-icon-button" aria-label="Attach context"><Paperclip size={18}/></button><button className="py-send" aria-label="Send prompt"><ArrowUp size={18}/></button></div><div className="py-agent-hints"><span>Campaign-aware</span><span>Context indexed</span><span>Authorized simulation only</span></div></div>
}
