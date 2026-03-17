import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { createClient } from "@supabase/supabase-js";

/* ── SUPABASE CLIENT ─────────────────────────────────────────────────────── */
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPA_KEY = import.meta.env.VITE_SUPABASE_KEY || "";
const sb = createClient(SUPA_URL, SUPA_KEY);

/* ── DB HELPERS ─────────────────────────────────────────────────────────── */
async function dbGetVets() {
  const { data, error } = await sb.from("veterinarios").select("*").order("nome");
  if (error) throw error;
  return data || [];
}
async function dbSaveVet(form, id = null) {
  const p = { nome:form.nome, telefone:form.telefone, email:form.email, percentual_padrao:+form.percentual_padrao };
  if (id) {
    const { data, error } = await sb.from("veterinarios").update(p).eq("id",id).select().single();
    if (error) throw error; return data;
  }
  const { data, error } = await sb.from("veterinarios").insert(p).select().single();
  if (error) throw error; return data;
}
async function dbDeleteVet(id) {
  const { error } = await sb.from("veterinarios").delete().eq("id",id);
  if (error) throw error;
}
async function dbGetAtends() {
  const { data, error } = await sb.from("atendimentos").select("*").order("data",{ascending:false});
  if (error) throw error;
  return (data||[]).map(a => ({ ...a, vet_id: a.veterinario_id, obs: a.obs||"", paciente_tutor: a.paciente_tutor||"" }));
}
async function dbSaveAtend(form, id = null) {
  const p = { data:form.data, veterinario_id:form.vet_id, paciente_tutor:form.paciente_tutor,
    servico:form.servico, valor:+form.valor, perc:+form.perc, obs:form.obs };
  if (id) {
    const { data, error } = await sb.from("atendimentos").update(p).eq("id",id).select().single();
    if (error) throw error; return { ...data, vet_id: data.veterinario_id };
  }
  const { data, error } = await sb.from("atendimentos").insert(p).select().single();
  if (error) throw error; return { ...data, vet_id: data.veterinario_id };
}
async function dbDeleteAtend(id) {
  const { error } = await sb.from("atendimentos").delete().eq("id",id);
  if (error) throw error;
}

/* ── TOKENS ─────────────────────────────────────────────────────────────── */
const T = {
  bg:"#f8f9fb", bgSecondary:"#f1f3f7", surface:"#ffffff",
  border:"#e4e7ed", borderLight:"#f0f2f6",
  textPrimary:"#0f1623", textSecondary:"#4b5563", textMuted:"#9ca3af",
  brand:"#2563eb", brandLight:"#eff6ff", brandDark:"#1d4ed8",
  emerald:"#059669", emeraldLight:"#ecfdf5",
  amber:"#d97706", amberLight:"#fffbeb",
  rose:"#e11d48", roseLight:"#fff1f2",
  violet:"#7c3aed", violetLight:"#f5f3ff",
  shadowSm:"0 1px 3px rgba(15,22,35,0.06),0 1px 2px rgba(15,22,35,0.04)",
  shadowMd:"0 4px 12px rgba(15,22,35,0.08),0 2px 6px rgba(15,22,35,0.04)",
  shadowXl:"0 24px 48px rgba(15,22,35,0.12),0 8px 20px rgba(15,22,35,0.08)",
};

const COLORS = ["#2563eb","#059669","#d97706","#7c3aed","#e11d48","#0891b2"];
const MESES  = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const SW     = 220; // sidebar width

const fmt    = v => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
const fmtD   = d => { try{ return new Date(d+"T12:00:00").toLocaleDateString("pt-BR") }catch{ return d } };
const calcC  = (v,p) => Math.round(v*(p/100)*100)/100;
const now    = new Date();

/* ── GLOBAL CSS ─────────────────────────────────────────────────────────── */
/* ROOT FIX:
   - html/body overflow-x:hidden → nunca gera scroll horizontal
   - #root display:flex height:100vh → flex container raiz
   - .vc-sidebar position:fixed width:220px → fora do fluxo
   - .vc-main margin-left:220px min-width:0 → ocupa o restante SEM estourar
   - min-width:0 é ESSENCIAL em flex para evitar que filho empurre o container
*/
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    font-family: 'Geist', -apple-system, sans-serif;
    background: ${T.bg};
    color: ${T.textPrimary};
    -webkit-font-smoothing: antialiased;
    line-height: 1.5;
    overflow-x: hidden;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  #root {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
  }

  /* ✅ FIX #3 — sidebar fora do fluxo, largura fixa */
  .vc-sidebar {
    position: fixed;
    top: 0; left: 0;
    width: ${SW}px;
    height: 100vh;
    background: ${T.surface};
    border-right: 1px solid ${T.border};
    display: flex;
    flex-direction: column;
    z-index: 100;
    transition: transform 250ms cubic-bezier(.4,0,.2,1);
    flex-shrink: 0;
  }

  .vc-main {
    margin-left: ${SW}px;
    flex: 1 1 0%;
    min-width: 0;
    width: calc(100% - ${SW}px);
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .vc-scroll {
    flex: 1;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* ✅ FIX #6 — todas as páginas têm largura máxima centralizada */
  .page {
    width: 100%;
    padding: 20px 24px;
    box-sizing: border-box;
  }

  /* ✅ FIX #7 — tabelas nunca estouram, sempre com wrapper scroll */
  .tbl-wrap {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .tbl-wrap table {
    min-width: 600px;      /* mínimo aceitável, não mais que isso */
    width: 100%;
    border-collapse: collapse;
  }
  /* ✅ FIX #8 — células truncam texto longo */
  .tbl-wrap td, .tbl-wrap th {
    white-space: nowrap;
  }
  .tbl-cell-clip {
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Inputs */
  .vc-input {
    width: 100%; height: 38px; padding: 0 12px;
    background: ${T.surface}; border: 1px solid ${T.border};
    border-radius: 8px; font-family: inherit; font-size: 14px;
    color: ${T.textPrimary}; outline: none;
    transition: border-color 150ms, box-shadow 150ms;
  }
  .vc-input:focus { border-color: ${T.brand}; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
  .vc-input::placeholder { color: ${T.textMuted}; }
  select.vc-input { cursor: pointer; }
  select.vc-input option { background: white; }
  .vc-textarea {
    width: 100%; padding: 10px 12px;
    background: ${T.surface}; border: 1px solid ${T.border};
    border-radius: 8px; font-family: inherit; font-size: 14px;
    color: ${T.textPrimary}; outline: none; resize: vertical;
    transition: border-color 150ms;
  }
  .vc-textarea:focus { border-color: ${T.brand}; }
  .vc-label {
    display: block; font-size: 12px; font-weight: 600;
    color: ${T.textSecondary}; margin-bottom: 6px;
  }

  /* Table base */
  .vc-tbl { width: 100%; border-collapse: collapse; }
  .vc-tbl thead th {
    padding: 10px 14px; font-size: 11px; font-weight: 600;
    color: ${T.textMuted}; text-transform: uppercase;
    letter-spacing: .06em; text-align: left;
    border-bottom: 1px solid ${T.border}; white-space: nowrap;
    background: ${T.surface};
  }
  .vc-tbl tbody td {
    padding: 12px 14px; font-size: 13px;
    border-bottom: 1px solid ${T.borderLight}; vertical-align: middle;
  }
  .vc-tbl tbody tr:last-child td { border-bottom: none; }
  .vc-tbl tbody tr:hover td { background: ${T.bgSecondary}; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }

  /* Animations */
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .fu { animation: fadeUp 260ms ease both; }
  .fi { animation: fadeIn 200ms ease both; }

  /* RESPONSIVE */
  @media (max-width: 1100px) {
    .grid-chart { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 900px) {
    .grid-2col { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 768px) {
    .vc-sidebar { transform: translateX(-100%); }
    .vc-sidebar.open { transform: translateX(0); }
    .vc-main { margin-left: 0 !important; width: 100% !important; }
    .col-hide-sm { display: none !important; }
    .grid-4col { grid-template-columns: repeat(2,1fr) !important; }
    .grid-2col { grid-template-columns: 1fr !important; }
    .grid-chart { grid-template-columns: 1fr !important; }
    .filters-grid { grid-template-columns: 1fr !important; }
    .page { padding: 12px 14px !important; }
    .tbl-wrap table { min-width: 400px !important; }
  }
  @media (max-width: 480px) {
    .grid-4col { grid-template-columns: 1fr !important; }
    .page { padding: 10px 12px !important; }
    .tbl-wrap table { min-width: 320px !important; }
  }

  /* Recharts tooltip */
  .recharts-tooltip-wrapper .recharts-default-tooltip {
    background: white !important; border: 1px solid ${T.border} !important;
    border-radius: 10px !important; box-shadow: ${T.shadowMd} !important;
    font-size: 13px !important;
  }
`;

/* ── DATA ──────────────────────────────────────────────────────────────── */
const VETS_INIT  = [];
const ATEND_INIT = [];
// Dados carregados do Supabase — ver dbGetAtends() acima
const SERVICOS = [
  "Consulta","Castração (F)","Castração (M)","Hemo. + Bioq.","Hemo. + Bioq.+Erliq.",
  "Av. Cirur.+Hemograma","Citopatológico","Eutanasia","Desobstrução","Vacina V8",
  "FIV e Felv","Anestesia Mastec.","Retorno de intern.","Sedação","Atestado+Vacina",
  "Consulta + Limpeza","Consulta+Exames","Internamento",
];

/* ── PRIMITIVES ─────────────────────────────────────────────────────────── */
function Badge({ children, color="blue" }) {
  const s = {
    blue:  { bg:T.brandLight,   tx:T.brand },
    green: { bg:T.emeraldLight, tx:T.emerald },
    amber: { bg:T.amberLight,   tx:T.amber },
    rose:  { bg:T.roseLight,    tx:T.rose },
    violet:{ bg:T.violetLight,  tx:T.violet },
    gray:  { bg:T.bgSecondary,  tx:T.textSecondary },
  }[color] || { bg:T.brandLight, tx:T.brand };
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",padding:"2px 9px",
      borderRadius:99,fontSize:12,fontWeight:600,
      background:s.bg,color:s.tx,whiteSpace:"nowrap",
    }}>{children}</span>
  );
}

function Btn({ children, onClick, variant="primary", size="md", disabled=false, style={} }) {
  const sz = { sm:{padding:"5px 12px",fontSize:13,borderRadius:7}, md:{padding:"8px 16px",fontSize:14,borderRadius:9} };
  const vr = {
    primary: { background:T.brand, color:"#fff", border:"none", boxShadow:"0 1px 2px rgba(37,99,235,.3)" },
    secondary:{ background:T.surface, color:T.textPrimary, border:`1px solid ${T.border}`, boxShadow:T.shadowSm },
    ghost:   { background:"transparent", color:T.textSecondary, border:"1px solid transparent" },
    danger:  { background:T.roseLight, color:T.rose, border:"1px solid rgba(225,29,72,.2)" },
    success: { background:T.emeraldLight, color:T.emerald, border:"1px solid rgba(5,150,105,.2)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,
      fontFamily:"inherit",fontWeight:600,cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?.5:1,transition:"all 150ms",whiteSpace:"nowrap",
      flexShrink:0,
      ...sz[size],...vr[variant],...style,
    }}>{children}</button>
  );
}

function Card({ children, style={}, pad=true }) {
  return (
    <div className="fu" style={{
      background:T.surface, border:`1px solid ${T.border}`,
      borderRadius:14, boxShadow:T.shadowSm,
      /* ✅ FIX — cards nunca estouram largura do pai */
      width:"100%", minWidth:0, overflow:"hidden",
      ...(pad ? {} : {}), ...style,
    }}>{children}</div>
  );
}

function CardHeader({ title, action }) {
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px 0" }}>
      <h3 style={{ fontSize:14,fontWeight:600,color:T.textPrimary }}>{title}</h3>
      {action}
    </div>
  );
}

function Divider() { return <div style={{ height:1,background:T.borderLight }} />; }

function Field({ label, children }) {
  return (
    <div style={{ minWidth:0 }}>
      {label && <label className="vc-label">{label}</label>}
      {children}
    </div>
  );
}

function Empty({ icon="📭", title, desc }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"40px 24px",gap:8,textAlign:"center" }}>
      <span style={{ fontSize:32,opacity:.35 }}>{icon}</span>
      <p style={{ fontSize:14,fontWeight:600,color:T.textSecondary,marginTop:4 }}>{title}</p>
      {desc && <p style={{ fontSize:13,color:T.textMuted,maxWidth:260 }}>{desc}</p>}
    </div>
  );
}

function Modal({ title, children, onClose, maxWidth=540 }) {
  useEffect(() => {
    const h = e => e.key==="Escape" && onClose();
    window.addEventListener("keydown",h);
    return () => window.removeEventListener("keydown",h);
  },[onClose]);
  return (
    <div className="fi" onClick={e=>e.target===e.currentTarget&&onClose()} style={{
      position:"fixed",inset:0,zIndex:2000,
      background:"rgba(15,22,35,.45)",backdropFilter:"blur(6px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,
    }}>
      <div className="fu" style={{
        background:T.surface,borderRadius:16,width:"100%",maxWidth,
        maxHeight:"92vh",overflowY:"auto",overflowX:"hidden",
        boxShadow:T.shadowXl,border:`1px solid ${T.border}`,
      }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 22px 0" }}>
          <h2 style={{ fontSize:16,fontWeight:700,color:T.textPrimary }}>{title}</h2>
          <button onClick={onClose} style={{
            background:T.bgSecondary,border:"none",cursor:"pointer",
            borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:14,color:T.textMuted,
          }}>✕</button>
        </div>
        <div style={{ padding:"18px 22px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:T.surface,border:`1px solid ${T.border}`,
      borderRadius:10,padding:"10px 14px",boxShadow:T.shadowMd,fontSize:13 }}>
      <p style={{ fontWeight:600,color:T.textPrimary,marginBottom:5 }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color,lineHeight:1.7 }}>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

/* ── LOGIN ──────────────────────────────────────────────────────────────── */
function Login({ onLogin }) {
  const [tab,setTab]     = useState("login"); // "login" | "register"
  const [email,setEmail] = useState("");
  const [pass,setPass]   = useState("");
  const [nome,setNome]   = useState("");
  const [err,setErr]     = useState("");
  const [ok,setOk]       = useState("");
  const [loading,setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setOk(""); setLoading(true);
    try {
      if (tab === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error) setErr("E-mail ou senha incorretos.");
        else onLogin();
      } else {
        if (!nome.trim()) { setErr("Digite seu nome."); setLoading(false); return; }
        const { error } = await sb.auth.signUp({
          email, password: pass,
          options: { data: { nome } }
        });
        if (error) setErr(error.message);
        else setOk("Conta criada! Verifique seu e-mail para confirmar.");
      }
    } catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh",display:"flex",background:T.bg,overflow:"hidden" }}>
      <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
        <div className="fu" style={{ width:"100%",maxWidth:400 }}>
          {/* Logo */}
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:28 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:T.brand,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>🐾</div>
            <div>
              <div style={{ fontSize:15,fontWeight:700,color:T.textPrimary }}>VetCommission</div>
              <div style={{ fontSize:11,color:T.textMuted }}>Clínica Veterinária</div>
            </div>
          </div>

          {/* Tabs login/cadastro */}
          <div style={{ display:"flex",borderRadius:10,background:T.bgSecondary,padding:4,marginBottom:24,gap:4 }}>
            {[["login","Entrar"],["register","Criar conta"]].map(([t,l])=>(
              <button key={t} onClick={()=>{setTab(t);setErr("");setOk("");}} style={{
                flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",
                fontFamily:"inherit",fontSize:13,fontWeight:600,transition:"all 150ms",
                background:tab===t?T.surface:T.transparent,
                color:tab===t?T.textPrimary:T.textMuted,
                boxShadow:tab===t?T.shadowSm:"none",
              }}>{l}</button>
            ))}
          </div>

          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            {tab==="register" && (
              <Field label="Seu nome">
                <input className="vc-input" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Dr. Elismael"/>
              </Field>
            )}
            <Field label="E-mail">
              <input className="vc-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/>
            </Field>
            <Field label="Senha">
              <input className="vc-input" type="password" value={pass} onChange={e=>setPass(e.target.value)}
                placeholder="Mínimo 6 caracteres" onKeyDown={e=>e.key==="Enter"&&submit()}/>
            </Field>

            {err && <div style={{ padding:"10px 14px",borderRadius:8,fontSize:13,
              background:T.roseLight,color:T.rose,border:"1px solid rgba(225,29,72,.2)" }}>{err}</div>}
            {ok && <div style={{ padding:"10px 14px",borderRadius:8,fontSize:13,
              background:T.emeraldLight,color:T.emerald,border:"1px solid rgba(5,150,105,.2)" }}>{ok}</div>}

            <Btn onClick={submit} disabled={loading} style={{ width:"100%",marginTop:4 }}>
              {loading ? (tab==="login"?"Entrando...":"Criando conta...") : (tab==="login"?"Entrar →":"Criar conta →")}
            </Btn>
          </div>

          <p style={{ fontSize:12,color:T.textMuted,marginTop:16,textAlign:"center" }}>
            {tab==="login"
              ? <span>Não tem conta? <button onClick={()=>setTab("register")} style={{background:"none",border:"none",cursor:"pointer",color:T.brand,fontWeight:600,fontSize:12}}>Criar conta grátis</button></span>
              : <span>Já tem conta? <button onClick={()=>setTab("login")} style={{background:"none",border:"none",cursor:"pointer",color:T.brand,fontWeight:600,fontSize:12}}>Entrar</button></span>
            }
          </p>
        </div>
      </div>
      <div className="col-hide-sm" style={{
        width:400,background:`linear-gradient(135deg,${T.brand} 0%,#1e40af 100%)`,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        padding:40,gap:20,flexShrink:0,
      }}>
        {[
          {icon:"📊",t:"Dashboard completo",d:"Faturamento e comissões em tempo real"},
          {icon:"🐾",t:"Por atendimento",d:"Registre cada serviço prestado"},
          {icon:"📋",t:"Relatórios",d:"Exporte em CSV com um clique"},
        ].map((f,i)=>(
          <div key={i} style={{ display:"flex",gap:14,alignItems:"flex-start",
            background:"rgba(255,255,255,.1)",borderRadius:12,padding:"16px 18px",width:"100%",
            border:"1px solid rgba(255,255,255,.15)" }}>
            <span style={{ fontSize:22 }}>{f.icon}</span>
            <div>
              <div style={{ fontSize:13,fontWeight:600,color:"#fff",marginBottom:2 }}>{f.t}</div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,.7)" }}>{f.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── SIDEBAR ────────────────────────────────────────────────────────────── */
const NAV = [
  {id:"dashboard",   icon:"⊞", label:"Dashboard"},
  {id:"atendimentos",icon:"🐾",label:"Atendimentos"},
  {id:"veterinarios",icon:"👤",label:"Veterinários"},
  {id:"relatorios",  icon:"↗", label:"Relatórios"},
];

function Sidebar({ page, setPage, open, onClose }) {
  return (
    <>
      {open && (
        <div onClick={onClose} className="col-hide-sm" style={{
          position:"fixed",inset:0,zIndex:99,background:"rgba(15,22,35,.4)",backdropFilter:"blur(3px)",
        }}/>
      )}
      <aside className={`vc-sidebar${open?" open":""}`}>
        <div style={{ padding:"18px 18px 14px",borderBottom:`1px solid ${T.borderLight}` }}>
          <div style={{ display:"flex",alignItems:"center",gap:9 }}>
            <div style={{ width:32,height:32,borderRadius:9,background:T.brand,flexShrink:0,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,
              boxShadow:"0 2px 8px rgba(37,99,235,.3)" }}>🐾</div>
            <div>
              <div style={{ fontSize:13.5,fontWeight:700,color:T.textPrimary,lineHeight:1.2 }}>VetCommission</div>
              <div style={{ fontSize:10,color:T.textMuted }}>Clínica Veterinária</div>
            </div>
          </div>
        </div>
        <nav style={{ flex:1,padding:"10px 10px",display:"flex",flexDirection:"column",gap:2 }}>
          <div style={{ fontSize:10,fontWeight:700,color:T.textMuted,padding:"6px 8px 3px",
            textTransform:"uppercase",letterSpacing:".07em" }}>Menu</div>
          {NAV.map(n => {
            const on = page===n.id;
            return (
              <button key={n.id} onClick={()=>{setPage(n.id);onClose();}} style={{
                display:"flex",alignItems:"center",gap:9,width:"100%",
                padding:"9px 10px",borderRadius:9,border:"none",cursor:"pointer",
                fontFamily:"inherit",fontSize:13,fontWeight:on?600:500,transition:"all 120ms",
                background:on?T.brandLight:"transparent",
                color:on?T.brand:T.textSecondary,
              }}>
                <span style={{ fontSize:14,opacity:on?1:.7 }}>{n.icon}</span>
                {n.label}
                {on && <div style={{ marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:T.brand }}/>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding:"14px 18px",borderTop:`1px solid ${T.borderLight}` }}>
          <div style={{ display:"flex",alignItems:"center",gap:9 }}>
            <div style={{ width:30,height:30,borderRadius:"50%",flexShrink:0,
              background:`linear-gradient(135deg,${T.brand},${T.violet})`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:12,fontWeight:700,color:"#fff" }}>A</div>
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize:12,fontWeight:600,color:T.textPrimary,lineHeight:1.2 }}>Admin</div>
              <div style={{ fontSize:10,color:T.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                admin@clinica.vet
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ── TOPBAR ─────────────────────────────────────────────────────────────── */
function Topbar({ title, sub, onMenu, onLogout, actions }) {
  return (
    /* ✅ FIX — topbar não usa width:100vw, usa width:100% dentro do flex pai */
    <header style={{
      minHeight:56,display:"flex",alignItems:"center",padding:"10px 20px",gap:12,
      background:T.surface,borderBottom:`1px solid ${T.border}`,
      flexShrink:0,flexWrap:"nowrap",
    }}>
      <button onClick={onMenu} style={{
        background:"none",border:"none",cursor:"pointer",padding:"4px 8px",
        color:T.textSecondary,fontSize:20,display:"flex",alignItems:"center",flexShrink:0,
      }}>☰</button>
      <div style={{ flex:1,minWidth:0,overflow:"hidden" }}>
        <h1 style={{ fontSize:15,fontWeight:700,color:T.textPrimary,lineHeight:1.3,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{title}</h1>
        {sub && <p style={{ fontSize:11,color:T.textMuted,lineHeight:1.3,marginTop:1,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{sub}</p>}
      </div>
      <div style={{ display:"flex",gap:8,alignItems:"center",flexShrink:0 }}>
        {actions}
        <Btn variant="ghost" size="sm" onClick={onLogout}>Sair</Btn>
      </div>
    </header>
  );
}

/* ── STAT CARD ──────────────────────────────────────────────────────────── */
function Stat({ icon, label, value, sub, delta, abg=T.brandLight }) {
  return (
    <Card style={{ padding:"16px" }} className="stat-card-inner">
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12 }}>
        <div style={{ width:36,height:36,borderRadius:10,background:abg,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>{icon}</div>
        {delta!=null && (
          <Badge color={delta>=0?"green":"rose"}>
            {delta>=0?"▲":"▼"} {Math.abs(delta).toFixed(1)}%
          </Badge>
        )}
      </div>
      <div style={{ fontSize:12,color:T.textMuted,fontWeight:500,marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:22,fontWeight:700,color:T.textPrimary,letterSpacing:"-.025em",lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:11,color:T.textMuted,marginTop:4 }}>{sub}</div>}
    </Card>
  );
}

/* ── DASHBOARD ──────────────────────────────────────────────────────────── */
function Dashboard({ vets, atends }) {
  const mes=now.getMonth(), ano=now.getFullYear();
  const thisMo = atends.filter(a=>{ const d=new Date(a.data+"T12:00:00"); return d.getMonth()===mes&&d.getFullYear()===ano; });
  const lastMo = atends.filter(a=>{ const d=new Date(a.data+"T12:00:00"); return d.getMonth()===mes-1&&d.getFullYear()===ano; });
  const totFat=thisMo.reduce((s,a)=>s+a.valor,0);
  const totCom=thisMo.reduce((s,a)=>s+calcC(a.valor,a.perc),0);
  const prevFat=lastMo.reduce((s,a)=>s+a.valor,0);
  const prevCom=lastMo.reduce((s,a)=>s+calcC(a.valor,a.perc),0);
  const ticket=thisMo.length?totFat/thisMo.length:0;
  const dFat=prevFat?((totFat-prevFat)/prevFat)*100:null;
  const dCom=prevCom?((totCom-prevCom)/prevCom)*100:null;

  const chartData = Array.from({length:6},(_,i)=>{
    const m=(mes-5+i+12)%12, y=mes-5+i<0?ano-1:ano;
    const r=atends.filter(a=>{const d=new Date(a.data+"T12:00:00");return d.getMonth()===m&&d.getFullYear()===y;});
    return {name:MESES[m],Faturamento:r.reduce((s,a)=>s+a.valor,0),Comissão:r.reduce((s,a)=>s+calcC(a.valor,a.perc),0)};
  });

  const svcMap={};
  thisMo.forEach(a=>{svcMap[a.servico]=(svcMap[a.servico]||0)+1;});
  const topSvcs=Object.entries(svcMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,value])=>({name,value}));
  const lastA=[...atends].sort((a,b)=>new Date(b.data)-new Date(a.data)).slice(0,7);

  return (
    <div className="page">
      {/* Stats */}
      <div className="grid-4col fu" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:18 }}>
        <Stat icon="💰" label="Faturamento do mês"  value={fmt(totFat)}  sub={`${thisMo.length} atendimentos`}  delta={dFat} abg={T.brandLight}/>
        <Stat icon="🏆" label="Comissões do mês"    value={fmt(totCom)}  sub={totFat?`${((totCom/totFat)*100).toFixed(1)}% do fat.`:"—"} delta={dCom} abg={T.emeraldLight}/>
        <Stat icon="🐾" label="Atendimentos no mês" value={thisMo.length} sub={`${new Set(thisMo.map(a=>a.paciente_tutor).filter(Boolean)).size} pacientes únicos`} abg={T.violetLight}/>
        <Stat icon="📈" label="Ticket médio"        value={fmt(ticket)}  sub="por atendimento" abg={T.amberLight}/>
      </div>

      {/* Charts */}
      <div className="grid-chart" style={{ display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14,minWidth:0 }}>
        <Card>
          <CardHeader title="Faturamento & Comissões — últimos 6 meses"/>
          <div style={{ padding:"16px 16px 12px" }}>
            {chartData.some(d=>d.Faturamento>0) ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chartData} barGap={3} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:T.textMuted,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false} width={40}
                    tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Bar dataKey="Faturamento" fill={T.brand}   radius={[4,4,0,0]}/>
                  <Bar dataKey="Comissão"    fill={T.emerald} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty icon="📊" title="Sem dados suficientes para o gráfico"
                desc="Registre atendimentos para visualizar a evolução mensal"/>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Top serviços do mês"/>
          <div style={{ padding:"14px 16px 16px" }}>
            {topSvcs.length>0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={topSvcs} cx="50%" cy="50%" innerRadius={40} outerRadius={64}
                      paddingAngle={3} dataKey="value">
                      {topSvcs.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v,n)=>[v+"×",n]} contentStyle={{
                      background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,
                    }}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:"flex",flexDirection:"column",gap:6,marginTop:6 }}>
                  {topSvcs.map((s,i)=>(
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:7,minWidth:0 }}>
                      <div style={{ width:7,height:7,borderRadius:2,background:COLORS[i%COLORS.length],flexShrink:0 }}/>
                      <span style={{ fontSize:11,color:T.textSecondary,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.name}</span>
                      <span style={{ fontSize:11,fontWeight:700,color:T.textPrimary,flexShrink:0 }}>{s.value}×</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <Empty icon="🔬" title="Nenhum atendimento neste mês"/>}
          </div>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid-2col" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
        <Card>
          <CardHeader title={`Ranking — ${MESES[mes]}/${ano}`}/>
          <Divider/>
          {vets.length===0 ? <Empty icon="👤" title="Nenhum veterinário cadastrado"/> : (
            <div className="tbl-wrap">
              <table className="vc-tbl">
                <thead><tr>
                  <th style={{paddingLeft:16}}>#</th>
                  <th>Veterinário</th>
                  <th>Atend.</th>
                  <th>Faturamento</th>
                  <th>Comissão</th>
                </tr></thead>
                <tbody>
                  {vets.map((v,i)=>{
                    const r=thisMo.filter(a=>a.vet_id===v.id);
                    const fat=r.reduce((s,a)=>s+a.valor,0);
                    const com=r.reduce((s,a)=>s+calcC(a.valor,a.perc),0);
                    return (
                      <tr key={v.id}>
                        <td style={{paddingLeft:16}}><span style={{fontSize:16}}>{i===0?"🥇":i===1?"🥈":"🥉"}</span></td>
                        <td style={{fontWeight:600}}>Dr. {v.nome}</td>
                        <td>{r.length}</td>
                        <td style={{color:T.brand,fontWeight:600}}>{fmt(fat)}</td>
                        <td><Badge color="green">{fmt(com)}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Últimos atendimentos"/>
          <Divider/>
          {lastA.length===0 ? (
            <Empty icon="🐾" title="Nenhum atendimento registrado"
              desc="Clique em Atendimentos para adicionar o primeiro registro"/>
          ) : (
            <div className="tbl-wrap">
              <table className="vc-tbl">
                <thead><tr>
                  <th style={{paddingLeft:16}}>Data</th>
                  <th>Paciente/Tutor</th>
                  <th>Serviço</th>
                  <th>Valor</th>
                </tr></thead>
                <tbody>
                  {lastA.map(a=>(
                    <tr key={a.id}>
                      <td style={{paddingLeft:16,color:T.textMuted,fontSize:12}}>{fmtD(a.data)}</td>
                      <td className="tbl-cell-clip">{a.paciente_tutor||"—"}</td>
                      <td className="tbl-cell-clip" style={{color:T.textMuted,fontSize:12}}>{a.servico}</td>
                      <td style={{color:T.brand,fontWeight:600}}>{fmt(a.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ── ATENDIMENTOS ───────────────────────────────────────────────────────── */
function Atendimentos({ atends, setAtends, vets, onSave, onDelete }) {
  const E={data:new Date().toISOString().split("T")[0],vet_id:"",paciente_tutor:"",servico:"",valor:"",perc:"20",obs:""};
  const [modal,setModal]=useState(null);
  const [del,setDel]=useState(null);
  const [form,setForm]=useState(E);
  const [svcFree,setSvcFree]=useState(false);
  const [fl,setFl]=useState({vet:"",mes:"",q:""});

  useEffect(()=>{
    if(form.vet_id&&modal==="add"){
      const v=vets.find(x=>x.id===+form.vet_id);
      if(v) setForm(p=>({...p,perc:String(v.percentual_padrao)}));
    }
  },[form.vet_id]);

  const com=useMemo(()=>{
    const v=parseFloat(form.valor),p=parseFloat(form.perc);
    return v&&p?calcC(v,p):0;
  },[form.valor,form.perc]);

  const openAdd=()=>{setForm(E);setSvcFree(false);setModal("add");};
  const openEdit=a=>{setForm({...a,vet_id:String(a.vet_id)});setSvcFree(!SERVICOS.includes(a.servico));setModal(a);};
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.data||!form.vet_id||!form.servico||!form.valor) return;
    setSaving(true);
    try {
      await onSave(form, modal === "add" ? null : modal.id);
      setModal(null);
    } catch(e) { alert("Erro ao salvar: " + e.message); }
    finally { setSaving(false); }
  };

  const filtered=useMemo(()=>{
    let r=[...atends].sort((a,b)=>new Date(b.data)-new Date(a.data)||b.id-a.id);
    if(fl.vet) r=r.filter(a=>a.vet_id===+fl.vet);
    if(fl.mes){const[y,m]=fl.mes.split("-").map(Number);r=r.filter(a=>{const d=new Date(a.data+"T12:00:00");return d.getFullYear()===y&&d.getMonth()===m-1;});}
    if(fl.q) r=r.filter(a=>(a.paciente_tutor+a.servico).toLowerCase().includes(fl.q.toLowerCase()));
    return r;
  },[atends,fl]);

  const totFat=filtered.reduce((s,a)=>s+a.valor,0);
  const totCom=filtered.reduce((s,a)=>s+calcC(a.valor,a.perc),0);
  const pb=p=>p>=40?{c:"amber",l:"40%"}:p>=31?{c:"violet",l:"31,11%"}:{c:"blue",l:"20%"};

  return (
    <div className="page">
      {/* Filters */}
      <Card style={{marginBottom:14,padding:"14px 16px"}}>
        {/* ✅ FIX — grid com 1fr para cada coluna, sem min-width fixo */}
        <div className="filters-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:10,alignItems:"flex-end"}}>
          <Field label="Veterinário">
            <select className="vc-input" value={fl.vet} onChange={e=>setFl(p=>({...p,vet:e.target.value}))}>
              <option value="">Todos</option>
              {vets.map(v=><option key={v.id} value={v.id}>Dr. {v.nome}</option>)}
            </select>
          </Field>
          <Field label="Período">
            <input className="vc-input" type="month" value={fl.mes} onChange={e=>setFl(p=>({...p,mes:e.target.value}))}/>
          </Field>
          <Field label="Buscar">
            <input className="vc-input" placeholder="Paciente ou serviço..." value={fl.q} onChange={e=>setFl(p=>({...p,q:e.target.value}))}/>
          </Field>
          <Btn variant="ghost" size="sm" onClick={()=>setFl({vet:"",mes:"",q:""})}>Limpar</Btn>
        </div>
      </Card>

      {/* Toolbar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:12}}>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",minWidth:0}}>
          <span style={{fontSize:13,color:T.textSecondary}}>Faturamento: <strong style={{color:T.brand}}>{fmt(totFat)}</strong></span>
          <span style={{fontSize:13,color:T.textSecondary}}>Comissão: <strong style={{color:T.emerald}}>{fmt(totCom)}</strong></span>
          <span style={{fontSize:13,color:T.textMuted}}>{filtered.length} registros</span>
        </div>
        <Btn size="sm" onClick={openAdd}>+ Novo atendimento</Btn>
      </div>

      {/* Table — ✅ FIX: overflow-x somente no wrapper, tabela com min-width controlado */}
      <Card>
        <div className="tbl-wrap">
          <table className="vc-tbl" style={{minWidth:620}}>
            <thead><tr>
              <th style={{paddingLeft:16}}>Data</th>
              <th>Veterinário</th>
              <th>Paciente/Tutor</th>
              <th>Serviço</th>
              <th>Valor</th>
              <th>%</th>
              <th>Comissão</th>
              <th className="col-hide-sm">Obs.</th>
              <th style={{paddingRight:16}}></th>
            </tr></thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={9}>
                  <Empty icon="🐾" title="Nenhum atendimento encontrado"
                    desc={fl.vet||fl.mes||fl.q?"Tente ajustar os filtros":"Clique em + Novo atendimento para começar"}/>
                </td></tr>
              ) : filtered.map(a=>{
                const b=pb(a.perc);
                return (
                  <tr key={a.id}>
                    <td style={{paddingLeft:16,color:T.textMuted,fontSize:12}}>{fmtD(a.data)}</td>
                    <td style={{fontWeight:500,fontSize:13}}>Dr. {vets.find(v=>v.id===a.vet_id)?.nome||"—"}</td>
                    <td className="tbl-cell-clip">{a.paciente_tutor||<span style={{color:T.textMuted}}>—</span>}</td>
                    <td className="tbl-cell-clip" style={{color:T.textSecondary,fontSize:12}}>{a.servico}</td>
                    <td style={{color:T.brand,fontWeight:600}}>{fmt(a.valor)}</td>
                    <td><Badge color={b.c}>{b.l}</Badge></td>
                    <td style={{color:T.emerald,fontWeight:600}}>{fmt(calcC(a.valor,a.perc))}</td>
                    <td className="col-hide-sm tbl-cell-clip" style={{color:T.textMuted,fontSize:11,maxWidth:140}}>{a.obs||"—"}</td>
                    <td style={{paddingRight:16}}>
                      <div style={{display:"flex",gap:4}}>
                        <Btn variant="ghost" size="sm" onClick={()=>openEdit(a)}>Editar</Btn>
                        <Btn variant="danger" size="sm" onClick={()=>setDel(a)}>✕</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <Modal title={modal==="add"?"Novo atendimento":"Editar atendimento"} onClose={()=>setModal(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Data *">
              <input className="vc-input" type="date" value={form.data} onChange={e=>setForm(p=>({...p,data:e.target.value}))}/>
            </Field>
            <Field label="Veterinário *">
              <select className="vc-input" value={form.vet_id} onChange={e=>setForm(p=>({...p,vet_id:e.target.value}))}>
                <option value="">Selecione...</option>
                {vets.map(v=><option key={v.id} value={v.id}>Dr. {v.nome}</option>)}
              </select>
            </Field>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Paciente / Tutor">
                <input className="vc-input" value={form.paciente_tutor} onChange={e=>setForm(p=>({...p,paciente_tutor:e.target.value}))} placeholder="Ex: Ringo/Luciano"/>
              </Field>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <label className="vc-label">Serviço *</label>
              <div style={{display:"flex",gap:6,marginBottom:7}}>
                <Btn size="sm" variant={!svcFree?"primary":"secondary"} onClick={()=>setSvcFree(false)}>Lista</Btn>
                <Btn size="sm" variant={svcFree?"primary":"secondary"} onClick={()=>setSvcFree(true)}>Digitar</Btn>
              </div>
              {svcFree
                ? <input className="vc-input" value={form.servico} onChange={e=>setForm(p=>({...p,servico:e.target.value}))} placeholder="Digite o serviço..."/>
                : <select className="vc-input" value={form.servico} onChange={e=>setForm(p=>({...p,servico:e.target.value}))}>
                    <option value="">Selecione...</option>
                    {SERVICOS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
              }
            </div>
            <Field label="Valor (R$) *">
              <input className="vc-input" type="number" step="0.01" min="0" value={form.valor}
                onChange={e=>setForm(p=>({...p,valor:e.target.value}))} placeholder="0,00"/>
            </Field>
            <Field label="% Comissão *">
              <select className="vc-input" value={form.perc} onChange={e=>setForm(p=>({...p,perc:e.target.value}))}>
                <option value="20">20% — Consultas / Exames</option>
                <option value="31.11">31,11% — Castrações</option>
                <option value="40">40% — Cirurgias / Eutanásia</option>
              </select>
            </Field>
            <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",justifyContent:"space-between",
              background:T.emeraldLight,borderRadius:10,padding:"11px 14px",border:"1px solid rgba(5,150,105,.2)"}}>
              <span style={{fontSize:13,color:T.emerald,fontWeight:500}}>💡 Comissão calculada</span>
              <span style={{fontSize:20,fontWeight:800,color:T.emerald}}>{fmt(com)}</span>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Observações">
                <textarea className="vc-textarea" rows={2} value={form.obs}
                  onChange={e=>setForm(p=>({...p,obs:e.target.value}))} placeholder="Detalhes do atendimento..."/>
              </Field>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18}}>
            <Btn variant="secondary" size="sm" onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn size="sm" onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</Btn>
          </div>
        </Modal>
      )}
      {del && (
        <Modal title="Confirmar exclusão" onClose={()=>setDel(null)} maxWidth={400}>
          <p style={{fontSize:14,color:T.textSecondary,marginBottom:18}}>
            Excluir <strong style={{color:T.textPrimary}}>{del.servico}</strong>
            {del.paciente_tutor?` — ${del.paciente_tutor}`:""} ({fmt(del.valor)})?
          </p>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <Btn variant="secondary" size="sm" onClick={()=>setDel(null)}>Cancelar</Btn>
            <Btn variant="danger" size="sm" onClick={async()=>{ await onDelete(del.id); setDel(null); }}>Excluir</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── VETERINÁRIOS ───────────────────────────────────────────────────────── */
function Veterinarios({ vets, setVets, atends, onSave, onDelete }) {
  const E={nome:"",telefone:"",email:"",percentual_padrao:20};
  const [modal,setModal]=useState(null);
  const [del,setDel]=useState(null);
  const [form,setForm]=useState(E);

  const openAdd=()=>{setForm(E);setModal("add");};
  const openEdit=v=>{setForm({...v});setModal(v);};
  const [saving,setSaving]=useState(false);
  const save=async()=>{
    if(!form.nome) return;
    setSaving(true);
    try {
      await onSave(form, modal==="add" ? null : modal.id);
      setModal(null);
    } catch(e) { alert("Erro ao salvar: "+e.message); }
    finally { setSaving(false); }
  };
  const st=id=>{
    const r=atends.filter(a=>a.vet_id===id);
    return{fat:r.reduce((s,a)=>s+a.valor,0),com:r.reduce((s,a)=>s+calcC(a.valor,a.perc),0),qtd:r.length};
  };

  return (
    <div className="page">
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
        <Btn size="sm" onClick={openAdd}>+ Novo veterinário</Btn>
      </div>
      <Card>
        <div className="tbl-wrap">
          <table className="vc-tbl" style={{minWidth:560}}>
            <thead><tr>
              <th style={{paddingLeft:16}}>Veterinário</th>
              <th className="col-hide-sm">Telefone</th>
              <th className="col-hide-sm">E-mail</th>
              <th>% Padrão</th>
              <th>Atendimentos</th>
              <th>Faturamento</th>
              <th>Comissão</th>
              <th style={{paddingRight:16}}></th>
            </tr></thead>
            <tbody>
              {vets.length===0 ? (
                <tr><td colSpan={8}><Empty icon="👤" title="Nenhum veterinário cadastrado" desc="Clique em + Novo veterinário"/></td></tr>
              ) : vets.map(v=>{
                const s=st(v.id);
                return (
                  <tr key={v.id}>
                    <td style={{paddingLeft:16}}>
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,
                          background:`linear-gradient(135deg,${T.brand},${T.violet})`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:12,fontWeight:700,color:"#fff"}}>{v.nome.charAt(0)}</div>
                        <div>
                          <div style={{fontWeight:600,fontSize:13}}>Dr. {v.nome}</div>
                          <div style={{fontSize:10,color:T.textMuted}}>#{v.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="col-hide-sm" style={{color:T.textSecondary,fontSize:12}}>{v.telefone||"—"}</td>
                    <td className="col-hide-sm" style={{color:T.textSecondary,fontSize:12}}>{v.email||"—"}</td>
                    <td><Badge color="blue">{v.percentual_padrao}%</Badge></td>
                    <td>{s.qtd}</td>
                    <td style={{color:T.brand,fontWeight:600}}>{fmt(s.fat)}</td>
                    <td><Badge color="green">{fmt(s.com)}</Badge></td>
                    <td style={{paddingRight:16}}>
                      <div style={{display:"flex",gap:4}}>
                        <Btn variant="ghost" size="sm" onClick={()=>openEdit(v)}>Editar</Btn>
                        <Btn variant="danger" size="sm" onClick={()=>setDel(v)}>✕</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <Modal title={modal==="add"?"Novo veterinário":"Editar veterinário"} onClose={()=>setModal(null)} maxWidth={460}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Nome completo *">
                <input className="vc-input" value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder="Elismael"/>
              </Field>
            </div>
            <Field label="Telefone">
              <input className="vc-input" value={form.telefone} onChange={e=>setForm(p=>({...p,telefone:e.target.value}))} placeholder="(00) 90000-0000"/>
            </Field>
            <Field label="E-mail">
              <input className="vc-input" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="vet@clinica.com"/>
            </Field>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="% Comissão padrão">
                <select className="vc-input" value={form.percentual_padrao} onChange={e=>setForm(p=>({...p,percentual_padrao:+e.target.value}))}>
                  <option value={20}>20% — Padrão</option>
                  <option value={31.11}>31,11% — Castração</option>
                  <option value={40}>40% — Cirurgia</option>
                </select>
              </Field>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18}}>
            <Btn variant="secondary" size="sm" onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn size="sm" onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</Btn>
          </div>
        </Modal>
      )}
      {del && (
        <Modal title="Excluir veterinário?" onClose={()=>setDel(null)} maxWidth={380}>
          <p style={{fontSize:14,color:T.textSecondary,marginBottom:18}}>
            Excluir <strong style={{color:T.textPrimary}}>Dr. {del.nome}</strong>? Os atendimentos não serão excluídos.
          </p>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <Btn variant="secondary" size="sm" onClick={()=>setDel(null)}>Cancelar</Btn>
            <Btn variant="danger" size="sm" onClick={async()=>{ await onDelete(del.id); setDel(null); }}>Excluir</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── RELATÓRIOS ─────────────────────────────────────────────────────────── */
function Relatorios({ atends, vets }) {
  const [vet,setVet]=useState("");
  const [mes,setMes]=useState("");
  const [busca,setBusca]=useState("");

  const filtered=useMemo(()=>{
    let r=[...atends].sort((a,b)=>new Date(b.data)-new Date(a.data));
    if(vet) r=r.filter(a=>a.vet_id===+vet);
    if(mes){const[y,m]=mes.split("-").map(Number);r=r.filter(a=>{const d=new Date(a.data+"T12:00:00");return d.getFullYear()===y&&d.getMonth()===m-1;});}
    if(busca) r=r.filter(a=>(a.paciente_tutor+a.servico).toLowerCase().includes(busca.toLowerCase()));
    return r;
  },[atends,vet,mes,busca]);

  const totFat=filtered.reduce((s,a)=>s+a.valor,0);
  const totCom=filtered.reduce((s,a)=>s+calcC(a.valor,a.perc),0);
  const totCom10=totCom*0.9;

  const porVet=vets.map(v=>{
    const r=filtered.filter(a=>a.vet_id===v.id);
    const fat=r.reduce((s,a)=>s+a.valor,0);
    const com=r.reduce((s,a)=>s+calcC(a.valor,a.perc),0);
    return{...v,fat,com,com10:com*0.9,qtd:r.length};
  }).filter(v=>v.qtd>0).sort((a,b)=>b.fat-a.fat);

  const timeline=useMemo(()=>{
    const byD={};
    filtered.forEach(a=>{byD[a.data]=(byD[a.data]||0)+a.valor;});
    return Object.entries(byD).sort().map(([d,v])=>({data:fmtD(d),valor:v}));
  },[filtered]);

  const exportCSV=()=>{
    const h=["Data","Veterinário","Paciente/Tutor","Serviço","Valor","% Comissão","Valor Comissão","Comissão -10%","Observações"];
    const rows=filtered.map(a=>{
      const c=calcC(a.valor,a.perc);
      return[fmtD(a.data),`Dr. ${vets.find(v=>v.id===a.vet_id)?.nome||""}`,
        a.paciente_tutor,a.servico,
        a.valor.toFixed(2).replace(".",","),a.perc,
        c.toFixed(2).replace(".",","),
        (c*0.9).toFixed(2).replace(".",","),
        a.obs];
    });
    const csv="\uFEFF"+[h,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(";")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="comissoes_vet.csv";a.click();URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      {/* Filters */}
      <Card style={{marginBottom:14,padding:"14px 16px"}}>
        <div className="filters-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:10,alignItems:"flex-end"}}>
          <Field label="Veterinário">
            <select className="vc-input" value={vet} onChange={e=>setVet(e.target.value)}>
              <option value="">Todos</option>
              {vets.map(v=><option key={v.id} value={v.id}>Dr. {v.nome}</option>)}
            </select>
          </Field>
          <Field label="Período">
            <input className="vc-input" type="month" value={mes} onChange={e=>setMes(e.target.value)}/>
          </Field>
          <Field label="Buscar">
            <input className="vc-input" placeholder="Paciente ou serviço..." value={busca} onChange={e=>setBusca(e.target.value)}/>
          </Field>
          <Btn variant="success" size="sm" onClick={exportCSV}>↓ Exportar CSV</Btn>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid-4col" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14}}>
        {[
          {icon:"💰",label:"Faturamento",    value:fmt(totFat),   abg:T.brandLight},
          {icon:"🏆",label:"Comissão total", value:fmt(totCom),   abg:T.emeraldLight},
          {icon:"📉",label:"Comissão -10%",  value:fmt(totCom10), abg:T.amberLight},
          {icon:"🐾",label:"Atendimentos",   value:filtered.length,abg:T.violetLight},
        ].map((k,i)=>(
          <Card key={i} style={{padding:"14px 16px"}}>
            <div style={{width:32,height:32,borderRadius:9,background:k.abg,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,marginBottom:8}}>{k.icon}</div>
            <div style={{fontSize:11,color:T.textMuted,marginBottom:3,fontWeight:500}}>{k.label}</div>
            <div style={{fontSize:18,fontWeight:700,color:T.textPrimary}}>{k.value}</div>
          </Card>
        ))}
      </div>

      {/* Resumo por vet */}
      <Card style={{marginBottom:14}}>
        <CardHeader title="Resumo por veterinário"/>
        <Divider/>
        <div className="tbl-wrap">
          <table className="vc-tbl" style={{minWidth:480}}>
            <thead><tr>
              <th style={{paddingLeft:16}}>Veterinário</th>
              <th>Atend.</th>
              <th>Faturamento</th>
              <th>Comissão</th>
              <th>Com. -10%</th>
              <th>%</th>
            </tr></thead>
            <tbody>
              {porVet.length===0 ? (
                <tr><td colSpan={6}><Empty icon="📊" title="Nenhum dado para os filtros selecionados"/></td></tr>
              ) : porVet.map(v=>(
                <tr key={v.id}>
                  <td style={{paddingLeft:16,fontWeight:600}}>Dr. {v.nome}</td>
                  <td>{v.qtd}</td>
                  <td style={{color:T.brand,fontWeight:600}}>{fmt(v.fat)}</td>
                  <td style={{color:T.emerald,fontWeight:700}}>{fmt(v.com)}</td>
                  <td style={{color:T.amber,fontWeight:600}}>{fmt(v.com10)}</td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:52,height:5,background:T.bgSecondary,borderRadius:99,flexShrink:0}}>
                        <div style={{height:"100%",borderRadius:99,background:`linear-gradient(90deg,${T.brand},${T.emerald})`,
                          width:`${v.fat?Math.min(100,(v.com/v.fat)*100*4):0}%`}}/>
                      </div>
                      <span style={{fontSize:11,fontWeight:600,color:T.textSecondary}}>
                        {v.fat?((v.com/v.fat)*100).toFixed(1):0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Line chart */}
      {timeline.length>1 && (
        <Card style={{marginBottom:14}}>
          <CardHeader title="Evolução do faturamento"/>
          <div style={{padding:"16px 14px 12px"}}>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} vertical={false}/>
                <XAxis dataKey="data" tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false} width={38}
                  tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<ChartTip/>}/>
                <Line type="monotone" dataKey="valor" name="Faturamento" stroke={T.brand}
                  strokeWidth={2.5} dot={{fill:T.brand,strokeWidth:0,r:3}} activeDot={{r:5}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Detail table */}
      <Card>
        <CardHeader title={`Detalhamento — ${filtered.length} registros`}/>
        <Divider/>
        {/* ✅ FIX RELATÓRIOS — tbl-wrap com min-width controlado, sem colunas fixas grandes */}
        <div className="tbl-wrap">
          <table className="vc-tbl" style={{minWidth:580}}>
            <thead><tr>
              <th style={{paddingLeft:16}}>Data</th>
              <th>Veterinário</th>
              <th>Paciente/Tutor</th>
              <th>Serviço</th>
              <th>Valor</th>
              <th>%</th>
              <th>Comissão</th>
              <th>-10%</th>
              <th className="col-hide-sm" style={{paddingRight:16}}>Obs.</th>
            </tr></thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={9}><Empty icon="📋" title="Nenhum dado encontrado" desc="Ajuste os filtros acima"/></td></tr>
              ) : filtered.map(a=>{
                const c=calcC(a.valor,a.perc);
                return (
                  <tr key={a.id}>
                    <td style={{paddingLeft:16,color:T.textMuted,fontSize:11}}>{fmtD(a.data)}</td>
                    <td style={{fontWeight:500,fontSize:12}}>Dr. {vets.find(v=>v.id===a.vet_id)?.nome||"—"}</td>
                    <td className="tbl-cell-clip" style={{fontSize:12}}>{a.paciente_tutor||"—"}</td>
                    <td className="tbl-cell-clip" style={{color:T.textSecondary,fontSize:11}}>{a.servico}</td>
                    <td style={{color:T.brand,fontWeight:600,fontSize:13}}>{fmt(a.valor)}</td>
                    <td style={{color:T.textMuted,fontSize:11}}>{a.perc}%</td>
                    <td style={{color:T.emerald,fontWeight:600,fontSize:13}}>{fmt(c)}</td>
                    <td style={{color:T.amber,fontWeight:600,fontSize:12}}>{fmt(c*0.9)}</td>
                    <td className="col-hide-sm tbl-cell-clip" style={{paddingRight:16,color:T.textMuted,fontSize:11}}>{a.obs||"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length>0 && (
          <div style={{display:"flex",gap:20,padding:"12px 18px",borderTop:`1px solid ${T.borderLight}`,
            background:T.bgSecondary,flexWrap:"wrap"}}>
            {[
              {l:"Faturamento",v:fmt(totFat),c:T.brand},
              {l:"Comissão",v:fmt(totCom),c:T.emerald},
              {l:"Com. -10%",v:fmt(totCom10),c:T.amber},
            ].map((s,i)=>(
              <span key={i} style={{fontSize:12,color:T.textMuted}}>
                {s.l}: <strong style={{color:s.c}}>{s.v}</strong>
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── APP ROOT ────────────────────────────────────────────────────────────── */
export default function App() {
  const [logged,  setLogged]  = useState(false);
  const [checking,setChecking]= useState(true); // checar sessão ativa ao abrir
  const [page,    setPage]    = useState("dashboard");
  const [menu,    setMenu]    = useState(false);
  const [vets,    setVets]    = useState([]);
  const [atends,  setAtends]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  const navigate = useCallback(p => { setPage(p); setMenu(false); }, []);

  // ── Checar se já há sessão ativa (ao abrir o app não precisa logar de novo)
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) setLogged(true);
      setChecking(false);
    });
    // Listener de mudança de auth
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setLogged(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Carrega dados do Supabase quando faz login
  useEffect(() => {
    if (!logged) return;
    setLoading(true);
    setDbError(null);
    Promise.all([dbGetVets(), dbGetAtends()])
      .then(([v, a]) => { setVets(v); setAtends(a); })
      .catch(e => setDbError("Erro ao conectar com o banco: " + e.message))
      .finally(() => setLoading(false));
  }, [logged]);

  const handleLogout = async () => {
    await sb.auth.signOut();
    setLogged(false); setVets([]); setAtends([]);
  };

  const INFO = {
    dashboard:   { title:"Dashboard",     sub:`${MESES[now.getMonth()]} ${now.getFullYear()} · Visão geral` },
    atendimentos:{ title:"Atendimentos",  sub:`${atends.length} registros` },
    veterinarios:{ title:"Veterinários",  sub:`${vets.length} cadastrados` },
    relatorios:  { title:"Relatórios",    sub:"Análise e exportação" },
  };

  // Checando sessão — spinner inicial
  if (checking) return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
        flexDirection:"column", gap:12, background:T.bg }}>
        <div style={{ width:32, height:32, borderRadius:"50%",
          border:`3px solid ${T.brandLight}`, borderTopColor:T.brand,
          animation:"spin 0.8s linear infinite" }}/>
        <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
        <p style={{ fontSize:13, color:T.textMuted }}>Carregando...</p>
      </div>
    </>
  );

  if (!logged) return <><style>{CSS}</style><Login onLogin={() => setLogged(true)} /></>;

  return (
    <>
      <style>{CSS}</style>
      <Sidebar page={page} setPage={navigate} open={menu} onClose={() => setMenu(false)} />
      <div className="vc-main">
        <Topbar
          title={INFO[page].title}
          sub={INFO[page].sub}
          onMenu={() => setMenu(o => !o)}
          onLogout={handleLogout}
        />
        <div className="vc-scroll">
          {/* Erro de conexão com banco */}
          {dbError && (
            <div style={{ margin:24, padding:"14px 18px", borderRadius:10,
              background:"#fff1f2", border:"1px solid rgba(225,29,72,.2)",
              color:"#e11d48", fontSize:13, fontWeight:500 }}>
              ⚠️ {dbError}
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
              height:"60vh", flexDirection:"column", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:"50%",
                border:`3px solid ${T.brandLight}`, borderTopColor:T.brand,
                animation:"spin 0.8s linear infinite" }} />
              <p style={{ fontSize:13, color:T.textMuted }}>Carregando dados...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <>
              {page === "dashboard"    && <Dashboard    vets={vets} atends={atends} />}
              {page === "atendimentos" && (
                <Atendimentos
                  atends={atends} vets={vets}
                  setAtends={setAtends}
                  onSave={async (form, id) => {
                    const saved = await dbSaveAtend(form, id);
                    if (id) setAtends(p => p.map(a => a.id === id ? saved : a));
                    else    setAtends(p => [saved, ...p]);
                  }}
                  onDelete={async (id) => {
                    await dbDeleteAtend(id);
                    setAtends(p => p.filter(a => a.id !== id));
                  }}
                />
              )}
              {page === "veterinarios" && (
                <Veterinarios
                  vets={vets} atends={atends}
                  setVets={setVets}
                  onSave={async (form, id) => {
                    const saved = await dbSaveVet(form, id);
                    if (id) setVets(p => p.map(v => v.id === id ? saved : v));
                    else    setVets(p => [...p, saved]);
                  }}
                  onDelete={async (id) => {
                    await dbDeleteVet(id);
                    setVets(p => p.filter(v => v.id !== id));
                  }}
                />
              )}
              {page === "relatorios"   && <Relatorios atends={atends} vets={vets} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}
