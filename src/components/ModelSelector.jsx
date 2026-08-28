import { useState, useEffect } from 'react';
import { Cpu, Settings, Save, Info, Sparkles, Brain } from 'lucide-react';

const MODELS = [
  { id:'gemini-3.6-flash', label:'Gemini 3.6 Flash', provider:'Google', desc:'Fast vision, free tier default' },
  { id:'gemini-2.5-pro', label:'Gemini 2.5 Pro', provider:'Google', desc:'Higher quality, slower' },
  { id:'openrouter/auto', label:'OpenRouter Auto', provider:'OpenRouter', desc:'Routes to best available' },
  { id:'anthropic/claude-3.5-sonnet', label:'Claude 3.5 Sonnet', provider:'Anthropic via OpenRouter', desc:'Best reasoning' },
  { id:'openai/gpt-4o', label:'GPT-4o', provider:'OpenAI via OpenRouter', desc:'Vision strong' },
  { id:'deepseek/deepseek-chat', label:'DeepSeek V3', provider:'DeepSeek via OpenRouter', desc:'Natum-style decision' },
];

export default function ModelSelector({ onClose }){
  const [selected, setSelected] = useState(()=> localStorage.getItem('chartai_model')||'gemini-3.6-flash');
  const [customPrompt, setCustomPrompt] = useState(()=> localStorage.getItem('chartai_custom_prompt')||'');
  const [temp, setTemp] = useState(()=> Number(localStorage.getItem('chartai_temp')||'0'));
  const [openRouterKey, setOpenRouterKey] = useState(()=> localStorage.getItem('chartai_openrouter_key')||'');

  const save = ()=>{
    localStorage.setItem('chartai_model', selected);
    localStorage.setItem('chartai_custom_prompt', customPrompt);
    localStorage.setItem('chartai_temp', String(temp));
    if(openRouterKey) localStorage.setItem('chartai_openrouter_key', openRouterKey);
    onClose && onClose();
  };

  return (
    <div className="modal-panel p-0 overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{borderColor:'var(--border)'}}>
        <div className="flex items-center gap-3"><div className="icon-tile icon-tile-accent !w-9 !h-9"><Cpu size={18}/></div><div><h3 className="font-semibold text-main">Model & Prompt</h3><p className="text-[11px]" style={{color:'var(--muted)'}}>Multi-model + custom rules</p></div></div>
        <button onClick={save} className="btn-primary !px-4 !py-2 !text-xs"><Save size={14}/>Save</button>
      </div>
      <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
        <div>
          <p className="label mb-2 flex items-center gap-1.5"><Brain size={12} className="tone-accent"/>Select Model</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODELS.map(m=> (
              <button key={m.id} onClick={()=>setSelected(m.id)} className="text-left card-flat transition-colors hover:!border-[color:var(--border-hover)]" style={selected===m.id? {background:'var(--accent-glow)', borderColor:'rgba(41,98,255,0.35)'}:{}}>
                <p className="text-xs font-semibold text-main">{m.label}</p><p className="text-[10px]" style={{color:'var(--muted)'}}>{m.provider} • {m.desc}</p>
                {selected===m.id && <span className="text-[10px] font-semibold tone-accent">● Selected</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block"><span className="label block mb-1">Temperature: {temp}</span> <input type="range" min="0" max="1" step="0.1" value={temp} onChange={e=>setTemp(Number(e.target.value))} className="w-full accent-[color:var(--accent)]"/></label>
          <label className="block"><span className="label block mb-1">OpenRouter Key (for Claude/GPT/DeepSeek)</span><input value={openRouterKey} onChange={e=>setOpenRouterKey(e.target.value)} placeholder="sk-or-..." className="field"/></label>
        </div>
        <div>
          <p className="label mb-1 flex items-center gap-1.5"><Settings size={12}/> Custom Prompt / Rules (appended to system prompt)</p>
          <textarea value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} rows={6} placeholder="e.g. Always prefer London kill zone. Ignore M1 if HTF is ranging. Require 2:1 minimum RR. Use conservative ratings." className="field"/>
          <p className="text-[10px] mt-1 flex items-center gap-1" style={{color:'var(--muted)'}}><Info size={10}/> Leave empty to use pure ICT prompt. Max ~800 chars recommended.</p>
        </div>
        <div className="card-flat flex gap-2 items-start" style={{background:'var(--accent-glow)', borderColor:'rgba(41,98,255,0.25)'}}><Sparkles size={14} className="tone-accent shrink-0 mt-0.5"/><p className="text-xs text-secondary">Tip: Use custom prompt to enforce your playbook — e.g. "Only A/B setups, FVG must be unfilled, London/NY session only".</p></div>
      </div>
    </div>
  );
}
