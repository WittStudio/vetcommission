import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — Tema claro premium, alto contraste, estilo Stripe/Linear
───────────────────────────────────────────────────────────────────────────── */
const T = {
  // Base
  bg:          "#f8f9fb",
  bgSecondary: "#f1f3f7",
  surface:     "#ffffff",
  surfaceHover:"#f8f9fb",
  // Borders
  border:      "#e4e7ed",
  borderLight: "#f0f2f6",
  // Text
  textPrimary:  "#0f1623",
  textSecondary:"#4b5563",
  textMuted:    "#9ca3af",
  textInverse:  "#ffffff",
  // Brand
  brand:       "#2563eb",
  brandLight:  "#eff6ff",
  brandDark:   "#1d4ed8",
  // Accents
  emerald:     "#059669",
  emeraldLight:"#ecfdf5",
  amber:       "#d97706",
  amberLight:  "#fffbeb",
  rose:        "#e11d48",
  roseLight:   "#fff1f2",
  violet:      "#7c3aed",
  violetLight: "#f5f3ff",
  // Shadows
  shadowSm:    "0 1px 3px rgba(15,22,35,0.06), 0 1px 2px rgba(15,22,35,0.04)",
  shadowMd:    "0 4px 12px rgba(15,22,35,0.08), 0 2px 6px rgba(15,22,35,0.04)",
  shadowLg:    "0 12px 32px rgba(15,22,35,0.10), 0 4px 12px rgba(15,22,35,0.06)",
  shadowXl:    "0 24px 48px rgba(15,22,35,0.12), 0 8px 20px rgba(15,22,35,0.08)",
};

const CHART_COLORS = ["#2563eb","#059669","#d97706","#7c3aed","#e11d48","#0891b2"];
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const SIDEBAR_W = 240;

const fmt  = v => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
const fmtD = d => { try{ return new Date(d+"T12:00:00").toLocaleDateString("pt-BR") }catch{return d} };
const calcCom = (v,p) => Math.round(v*(p/100)*100)/100;
const now = new Date();

/* ─────────────────────────────────────────────────────────────────────────────
   GLOBAL CSS
───────────────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { font-size: 16px; }

  body {
    font-family: 'Geist', -apple-system, sans-serif;
    background: ${T.bg};
    color: ${T.textPrimary};
    -webkit-font-smoothing: antialiased;
    line-height: 1.5;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: #c9d0db; }

  /* ── Inputs ── */
  .vc-input {
    width: 100%;
    height: 38px;
    padding: 0 12px;
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 8px;
    font-family: inherit;
    font-size: 14px;
    color: ${T.textPrimary};
    outline: none;
    transition: border-color 150ms, box-shadow 150ms;
  }
  .vc-input:focus {
    border-color: ${T.brand};
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }
  .vc-input::placeholder { color: ${T.textMuted}; }
  .vc-textarea {
    width: 100%; padding: 10px 12px;
    background: ${T.surface}; border: 1px solid ${T.border};
    border-radius: 8px; font-family: inherit; font-size: 14px;
    color: ${T.textPrimary}; outline: none; resize: vertical;
    transition: border-color 150ms, box-shadow 150ms;
  }
  .vc-textarea:focus { border-color: ${T.brand}; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  select.vc-input { cursor: pointer; }
  select.vc-input option { background: white; color: ${T.textPrimary}; }
  input[type="date"].vc-input, input[type="month"].vc-input { cursor: pointer; }

  /* ── Label ── */
  .vc-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: ${T.textSecondary};
    margin-bottom: 6px;
    letter-spacing: 0.02em;
  }

  /* ── Table ── */
  .vc-table { width: 100%; border-collapse: collapse; }
  .vc-table thead tr {
    border-bottom: 1px solid ${T.border};
  }
  .vc-table thead th {
    padding: 10px 16px;
    font-size: 11px;
    font-weight: 600;
    color: ${T.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: left;
    white-space: nowrap;
    background: ${T.surface};
  }
  .vc-table tbody td {
    padding: 13px 16px;
    font-size: 13.5px;
    color: ${T.textPrimary};
    border-bottom: 1px solid ${T.borderLight};
    vertical-align: middle;
  }
  .vc-table tbody tr:last-child td { border-bottom: none; }
  .vc-table tbody tr { transition: background 100ms; }
  .vc-table tbody tr:hover td { background: ${T.bgSecondary}; }

  /* ── Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-16px); }
    to   { opacity: 1; transform: none; }
  }
  .anim-fade-up  { animation: fadeUp 280ms ease both; }
  .anim-fade-in  { animation: fadeIn 200ms ease both; }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .hide-tablet { display: none !important; }
  }
  @media (max-width: 768px) {
    .hide-mobile { display: none !important; }
    .vc-sidebar { transform: translateX(-100%); }
    .vc-sidebar.open { transform: translateX(0); }
    .vc-main { margin-left: 0 !important; }
    .grid-stats { grid-template-columns: repeat(2, 1fr) !important; }
    .grid-charts { grid-template-columns: 1fr !important; }
    .grid-tables { grid-template-columns: 1fr !important; }
    .grid-form   { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 480px) {
    .grid-stats { grid-template-columns: 1fr !important; }
    .page-padding { padding: 16px !important; }
  }

  /* ── Recharts tooltip ── */
  .recharts-tooltip-wrapper .recharts-default-tooltip {
    background: white !important;
    border: 1px solid ${T.border} !important;
    border-radius: 10px !important;
    box-shadow: ${T.shadowMd} !important;
    font-size: 13px !important;
  }

  /* ── Scrollable table wrapper ── */
  .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .table-scroll::-webkit-scrollbar { height: 4px; }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────────────────── */
const VETS_INIT = [
  { id:1, nome:"Elismael", telefone:"(85) 99999-0001", email:"elismael@clinica.vet", percentual_padrao:20 },
];

const ATEND_INIT = [
  {id:1,  data:"2025-05-05", vet_id:1, paciente_tutor:"Ringo/Luciano",      servico:"Consulta",           valor:120,  perc:20,    obs:""},
  {id:2,  data:"2025-05-05", vet_id:1, paciente_tutor:"Ringo/Luciano",      servico:"Hemo. + Bioq.",       valor:160,  perc:20,    obs:""},
  {id:3,  data:"2025-05-05", vet_id:1, paciente_tutor:"Ringo/Luciano",      servico:"Citopatológico",      valor:140,  perc:20,    obs:""},
  {id:4,  data:"2025-05-05", vet_id:1, paciente_tutor:"Magali/Elaine",      servico:"Consulta",            valor:120,  perc:20,    obs:""},
  {id:5,  data:"2025-05-05", vet_id:1, paciente_tutor:"Luna/Lucas",         servico:"Anestesia Mastec.",   valor:400,  perc:20,    obs:""},
  {id:6,  data:"2025-05-06", vet_id:1, paciente_tutor:"CastraDez",          servico:"Castração (F)",       valor:780,  perc:40,    obs:"6 gatas — Princesa, Jana, Mel, Chiquinha, Branquinha, Aurora"},
  {id:7,  data:"2025-05-06", vet_id:1, paciente_tutor:"Pupy/Juscidalva",    servico:"Consulta",            valor:120,  perc:20,    obs:""},
  {id:8,  data:"2025-05-06", vet_id:1, paciente_tutor:"Rex",                servico:"Eutanasia",           valor:500,  perc:40,    obs:""},
  {id:9,  data:"2025-05-07", vet_id:1, paciente_tutor:"Bella/Jeane",        servico:"Consulta",            valor:120,  perc:20,    obs:""},
  {id:10, data:"2025-05-12", vet_id:1, paciente_tutor:"Mel/Milena",         servico:"Castração (M)",       valor:380,  perc:31.11, obs:""},
  {id:11, data:"2025-05-13", vet_id:1, paciente_tutor:"Atena/Luiz",         servico:"Castração (F)",       valor:180,  perc:31.11, obs:""},
  {id:12, data:"2025-05-13", vet_id:1, paciente_tutor:"Rock/Rafaela",       servico:"Consulta",            valor:120,  perc:20,    obs:""},
  {id:13, data:"2025-05-14", vet_id:1, paciente_tutor:"Mabia/Ednalva",      servico:"Consulta",            valor:120,  perc:20,    obs:""},
  {id:14, data:"2025-05-06", vet_id:1, paciente_tutor:"",                   servico:"Desobstrução",        valor:300,  perc:20,    obs:""},
  {id:15, data:"2025-05-06", vet_id:1, paciente_tutor:"Loly/Marlene",       servico:"Consulta",            valor:120,  perc:20,    obs:""},
  {id:16, data:"2025-06-07", vet_id:1, paciente_tutor:"Lua/Alexadra",       servico:"Av. Cirur.+Hemograma",valor:80,   perc:20,    obs:""},
  {id:17, data:"2025-06-08", vet_id:1, paciente_tutor:"Cachinho/Maria",     servico:"Consulta",            valor:120,  perc:20,    obs:""},
  {id:18, data:"2025-06-09", vet_id:1, paciente_tutor:"Bailly/Daniele",     servico:"Av. Cirur.+Hemograma",valor:80,   perc:20,    obs:""},
  {id:19, data:"2025-06-09", vet_id:1, paciente_tutor:"Dog/Ednoel",         servico:"Vacina V8",           valor:95,   perc:20,    obs:""},
  {id:20, data:"2025-06-14", vet_id:1, paciente_tutor:"Serena/Jessica",     servico:"Consulta + Limpeza",  valor:180,  perc:20,    obs:"Retirada de Miíase"},
  {id:21, data:"2025-06-16", vet_id:1, paciente_tutor:"Eduardo/Marinalva",  servico:"Retorno de intern.",  valor:350,  perc:20,    obs:"Uma diária de internamento"},
  {id:22, data:"2025-06-22", vet_id:1, paciente_tutor:"Bartolomeu/Dienifer",servico:"Consulta",            valor:120,  perc:20,    obs:""},
  {id:23, data:"2025-06-23", vet_id:1, paciente_tutor:"Bartolomeu/Dienifer",servico:"Desobstrução",        valor:590,  perc:20,    obs:"Desobstrução + internamento + cerenia"},
  {id:24, data:"2025-06-28", vet_id:1, paciente_tutor:"Bolota/Edson",       servico:"Consulta+Exames",     valor:1270, perc:20,    obs:"Hemo, erliquiose, babesia. Internação 48h"},
  {id:25, data:"2025-06-29", vet_id:1, paciente_tutor:"Lua/Aline",          servico:"Consulta+Exames",     valor:350,  perc:20,    obs:"Hemo + teste cinomose"},
  {id:26, data:"2025-06-29", vet_id:1, paciente_tutor:"Lua/Raissa",         servico:"Atestado+Vacina",     valor:200,  perc:20,    obs:"Atestado de viagem + antirrabica"},
  {id:27, data:"2025-06-30", vet_id:1, paciente_tutor:"Luna/Edna",          servico:"Castração (F)",       valor:180,  perc:31.11, obs:""},
  {id:28, data:"2025-06-28", vet_id:1, paciente_tutor:"Gato 1/Debora",      servico:"FIV e Felv",          valor:180,  perc:20,    obs:""},
  {id:29, data:"2025-06-28", vet_id:1, paciente_tutor:"Gato 2/Debora",      servico:"FIV e Felv",          valor:180,  perc:20,    obs:""},
];

const SERVICOS = [
  "Consulta","Castração (F)","Castração (M)","Hemo. + Bioq.","Hemo. + Bioq.+Erliq.",
  "Av. Cirur.+Hemograma","Citopatológico","Eutanasia","Desobstrução","Vacina V8",
  "FIV e Felv","Anestesia Mastec.","Retorno de intern.","Sedação","Atestado+Vacina",
  "Consulta + Limpeza","Consulta+Exames","Internamento",
];

/* ─────────────────────────────────────────────────────────────────────────────
   PRIMITIVE COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

// Badge
function Badge({ children, color = "blue" }) {
  const styles = {
    blue:    { bg: T.brandLight,   text: T.brand },
    green:   { bg: T.emeraldLight, text: T.emerald },
    amber:   { bg: T.amberLight,   text: T.amber },
    rose:    { bg: T.roseLight,    text: T.rose },
    violet:  { bg: T.violetLight,  text: T.violet },
    gray:    { bg: T.bgSecondary,  text: T.textSecondary },
  };
  const s = styles[color] || styles.blue;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 9px", borderRadius: 99,
      fontSize: 12, fontWeight: 600,
      background: s.bg, color: s.text,
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

// Button
function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, style = {} }) {
  const sizes = {
    sm: { padding: "5px 12px", fontSize: 13, borderRadius: 7 },
    md: { padding: "8px 16px", fontSize: 14, borderRadius: 9 },
    lg: { padding: "11px 24px", fontSize: 15, borderRadius: 10 },
  };
  const variants = {
    primary: {
      background: T.brand, color: "#fff", border: "none",
      boxShadow: "0 1px 2px rgba(37,99,235,0.3)",
    },
    secondary: {
      background: T.surface, color: T.textPrimary,
      border: `1px solid ${T.border}`, boxShadow: T.shadowSm,
    },
    ghost: {
      background: "transparent", color: T.textSecondary,
      border: "1px solid transparent",
    },
    danger: {
      background: T.roseLight, color: T.rose,
      border: `1px solid rgba(225,29,72,0.2)`,
    },
    success: {
      background: T.emeraldLight, color: T.emerald,
      border: `1px solid rgba(5,150,105,0.2)`,
    },
  };
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        fontFamily: "inherit", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, transition: "all 150ms", whiteSpace: "nowrap",
        ...sizes[size], ...variants[variant], ...style,
      }}
    >{children}</button>
  );
}

// Card
function Card({ children, style = {}, className = "" }) {
  return (
    <div className={`anim-fade-up ${className}`} style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 14, boxShadow: T.shadowSm, ...style,
    }}>{children}</div>
  );
}

// Section header inside card
function SectionHeader({ title, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px 20px 0",
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{title}</h3>
      {action}
    </div>
  );
}

// Field
function Field({ label, children }) {
  return (
    <div>
      {label && <label className="vc-label">{label}</label>}
      {children}
    </div>
  );
}

// Empty State
function EmptyState({ icon = "📭", title, desc }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 24px", gap: 8, textAlign: "center",
    }}>
      <span style={{ fontSize: 36, opacity: 0.4 }}>{icon}</span>
      <p style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary, marginTop: 4 }}>{title}</p>
      {desc && <p style={{ fontSize: 13, color: T.textMuted, maxWidth: 280 }}>{desc}</p>}
    </div>
  );
}

// Modal
function Modal({ title, children, onClose, maxWidth = 560 }) {
  useEffect(() => {
    const h = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="anim-fade-in" style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(15,22,35,0.45)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="anim-fade-up" style={{
        background: T.surface, borderRadius: 16, width: "100%",
        maxWidth, maxHeight: "92vh", overflowY: "auto",
        boxShadow: T.shadowXl, border: `1px solid ${T.border}`,
      }}>
        {/* Modal header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 0",
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: T.textPrimary }}>{title}</h2>
          <button onClick={onClose} style={{
            background: T.bgSecondary, border: "none", cursor: "pointer",
            borderRadius: 8, width: 30, height: 30,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: T.textMuted, transition: "background 150ms",
          }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

// Divider
function Divider() {
  return <div style={{ height: 1, background: T.borderLight, margin: "0" }} />;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────────────────────────────────────── */
function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@clinica.vet");
  const [pass,  setPass]  = useState("admin123");
  const [err,   setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    if (email === "admin@clinica.vet" && pass === "admin123") onLogin();
    else { setErr("E-mail ou senha incorretos."); setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", background: T.bg,
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>
        <div className="anim-fade-up" style={{ width: "100%", maxWidth: 400 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: T.brand,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>🐾</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, lineHeight: 1.2 }}>VetCommission</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>Clínica Veterinária</div>
            </div>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>
            Entrar na sua conta
          </h1>
          <p style={{ fontSize: 14, color: T.textSecondary, marginBottom: 28 }}>
            Controle de atendimentos e comissões
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="E-mail">
              <input className="vc-input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
            </Field>
            <Field label="Senha">
              <input className="vc-input" type="password" value={pass}
                onChange={e => setPass(e.target.value)} placeholder="••••••••"
                onKeyDown={e => e.key === "Enter" && submit()} />
            </Field>

            {err && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, fontSize: 13,
                background: T.roseLight, color: T.rose,
                border: `1px solid rgba(225,29,72,0.2)`,
              }}>{err}</div>
            )}

            <Btn onClick={submit} size="lg" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
              {loading ? "Entrando..." : "Entrar →"}
            </Btn>
          </div>

          <p style={{ fontSize: 12, color: T.textMuted, marginTop: 20, textAlign: "center" }}>
            Demo: admin@clinica.vet / admin123
          </p>
        </div>
      </div>

      {/* Right panel — decorative */}
      <div className="hide-mobile" style={{
        width: 440, background: `linear-gradient(135deg, ${T.brand} 0%, #1e40af 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 48, gap: 32,
      }}>
        {[
          { icon: "📊", title: "Dashboard completo", desc: "Faturamento e comissões em tempo real" },
          { icon: "🐾", title: "Por atendimento", desc: "Registre cada serviço prestado" },
          { icon: "📋", title: "Relatórios", desc: "Exporte em CSV com um clique" },
        ].map((f, i) => (
          <div key={i} style={{
            display: "flex", gap: 16, alignItems: "flex-start",
            background: "rgba(255,255,255,0.1)", borderRadius: 14,
            padding: "18px 20px", width: "100%",
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
            <span style={{ fontSize: 24 }}>{f.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 3 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────────────────────────── */
const NAV = [
  { id: "dashboard",    icon: "⊞", label: "Dashboard" },
  { id: "atendimentos", icon: "🐾", label: "Atendimentos" },
  { id: "veterinarios", icon: "👤", label: "Veterinários" },
  { id: "relatorios",   icon: "↗", label: "Relatórios" },
];

function Sidebar({ page, setPage, open, onClose }) {
  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div onClick={onClose} style={{
          position: "fixed", inset: 0, zIndex: 149,
          background: "rgba(15,22,35,0.4)", backdropFilter: "blur(3px)",
        }} className="hide-desktop" />
      )}

      <aside className={`vc-sidebar`} style={{
        position: "fixed", top: 0, left: 0, zIndex: 150,
        width: SIDEBAR_W, height: "100vh",
        background: T.surface, borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column",
        transition: "transform 250ms cubic-bezier(.4,0,.2,1)",
        ...(open ? { transform: "none" } : {}),
      }}>
        {/* Brand */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, background: T.brand,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, flexShrink: 0, boxShadow: "0 2px 8px rgba(37,99,235,0.35)",
            }}>🐾</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, lineHeight: 1.2 }}>VetCommission</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>Clínica Veterinária</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, padding: "8px 8px 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Menu
          </div>
          {NAV.map(n => {
            const active = page === n.id;
            return (
              <button key={n.id} onClick={() => { setPage(n.id); onClose(); }} style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 10px", borderRadius: 9,
                border: "none", cursor: "pointer", fontFamily: "inherit",
                fontSize: 13.5, fontWeight: active ? 600 : 500,
                transition: "all 120ms",
                background: active ? T.brandLight : "transparent",
                color: active ? T.brand : T.textSecondary,
              }}>
                <span style={{ fontSize: 15, opacity: active ? 1 : 0.7 }}>{n.icon}</span>
                {n.label}
                {active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: T.brand }} />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.borderLight}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: `linear-gradient(135deg,${T.brand},#7c3aed)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>A</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, lineHeight: 1.3 }}>Admin</div>
              <div style={{ fontSize: 11, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>admin@clinica.vet</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TOPBAR
───────────────────────────────────────────────────────────────────────────── */
function Topbar({ title, subtitle, onMenu, onLogout, actions }) {
  return (
    <header style={{
      height: 60, display: "flex", alignItems: "center",
      padding: "0 24px", gap: 16,
      background: T.surface, borderBottom: `1px solid ${T.border}`,
      position: "sticky", top: 0, zIndex: 100,
    }}>
      {/* Hamburger */}
      <button onClick={onMenu} style={{
        display: "none", background: "none", border: "none",
        cursor: "pointer", padding: 4, color: T.textSecondary, fontSize: 20,
      }} className="show-mobile">☰</button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1 }}>{subtitle}</p>}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        {actions}
        <Btn variant="ghost" size="sm" onClick={onLogout}>Sair</Btn>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, delta, accentColor = T.brand, accentBg = T.brandLight }) {
  const deltaPositive = delta == null ? null : delta >= 0;
  return (
    <Card style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: accentBg, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 17,
        }}>{icon}</div>
        {deltaPositive !== null && (
          <Badge color={deltaPositive ? "green" : "rose"}>
            {deltaPositive ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </Badge>
        )}
      </div>
      <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 5, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: T.textPrimary, letterSpacing: "-0.025em", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 5 }}>{sub}</div>}
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CUSTOM CHART TOOLTIP
───────────────────────────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, currency = true }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: "10px 14px", boxShadow: T.shadowMd, fontSize: 13,
    }}>
      <p style={{ fontWeight: 600, color: T.textPrimary, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, lineHeight: 1.6 }}>
          {p.name}: <strong>{currency ? fmt(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────────────────────────── */
function Dashboard({ vets, atends }) {
  const mes = now.getMonth(), ano = now.getFullYear();

  const thisMo = atends.filter(a => {
    const d = new Date(a.data + "T12:00:00");
    return d.getMonth() === mes && d.getFullYear() === ano;
  });
  const lastMo = atends.filter(a => {
    const d = new Date(a.data + "T12:00:00");
    return d.getMonth() === mes - 1 && d.getFullYear() === ano;
  });

  const totFat  = thisMo.reduce((s, a) => s + a.valor, 0);
  const totCom  = thisMo.reduce((s, a) => s + calcCom(a.valor, a.perc), 0);
  const prevFat = lastMo.reduce((s, a) => s + a.valor, 0);
  const prevCom = lastMo.reduce((s, a) => s + calcCom(a.valor, a.perc), 0);
  const ticket  = thisMo.length ? totFat / thisMo.length : 0;

  const delta = (c, p) => p > 0 ? ((c - p) / p) * 100 : null;

  // Últimos 6 meses
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const m = (mes - 5 + i + 12) % 12;
    const y = mes - 5 + i < 0 ? ano - 1 : ano;
    const rows = atends.filter(a => {
      const d = new Date(a.data + "T12:00:00");
      return d.getMonth() === m && d.getFullYear() === y;
    });
    return {
      name: MESES[m],
      Faturamento: rows.reduce((s, a) => s + a.valor, 0),
      Comissão:    rows.reduce((s, a) => s + calcCom(a.valor, a.perc), 0),
    };
  });

  // Top serviços
  const svcMap = {};
  thisMo.forEach(a => { svcMap[a.servico] = (svcMap[a.servico] || 0) + 1; });
  const topSvcs = Object.entries(svcMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const lastAtends = [...atends].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 8);

  return (
    <div className="page-padding" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stat cards */}
      <div className="grid-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard icon="💰" label="Faturamento do mês"   value={fmt(totFat)}  sub={`${thisMo.length} atendimentos`}
          delta={delta(totFat, prevFat)} accentColor={T.brand} accentBg={T.brandLight} />
        <StatCard icon="🏆" label="Comissões do mês"     value={fmt(totCom)}  sub={totFat ? `${((totCom/totFat)*100).toFixed(1)}% do faturamento` : "—"}
          delta={delta(totCom, prevCom)} accentColor={T.emerald} accentBg={T.emeraldLight} />
        <StatCard icon="🐾" label="Atendimentos no mês"  value={thisMo.length} sub={`${new Set(thisMo.map(a=>a.paciente_tutor).filter(Boolean)).size} pacientes únicos`}
          accentColor={T.violet} accentBg={T.violetLight} />
        <StatCard icon="📈" label="Ticket médio"         value={fmt(ticket)}  sub="por atendimento"
          accentColor={T.amber} accentBg={T.amberLight} />
      </div>

      {/* Charts row */}
      <div className="grid-charts" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 14 }}>
        {/* Bar chart */}
        <Card>
          <SectionHeader title="Faturamento & Comissões — últimos 6 meses" />
          <div style={{ padding: "20px 20px 16px" }}>
            {chartData.some(d => d.Faturamento > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={4} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: T.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={44} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Faturamento" fill={T.brand}   radius={[5,5,0,0]} />
                  <Bar dataKey="Comissão"    fill={T.emerald} radius={[5,5,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon="📊" title="Sem dados suficientes para o gráfico" desc="Registre atendimentos para visualizar a evolução mensal" />
            )}
          </div>
        </Card>

        {/* Pie chart */}
        <Card>
          <SectionHeader title="Top serviços do mês" />
          <div style={{ padding: "16px 20px 20px" }}>
            {topSvcs.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={topSvcs} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={3} dataKey="value">
                      {topSvcs.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v + "×", n]} contentStyle={{
                      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12,
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
                  {topSvcs.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: T.textSecondary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>{s.value}×</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState icon="🔬" title="Nenhum atendimento neste mês" />
            )}
          </div>
        </Card>
      </div>

      {/* Tables row */}
      <div className="grid-tables" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Ranking */}
        <Card>
          <SectionHeader title={`Ranking — ${MESES[mes]}/${ano}`} />
          <Divider />
          <div style={{ padding: "0 0 4px" }}>
            {vets.length === 0 ? (
              <EmptyState icon="👤" title="Nenhum veterinário cadastrado" />
            ) : (
              <table className="vc-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>#</th>
                    <th>Veterinário</th>
                    <th className="hide-tablet">Atend.</th>
                    <th>Faturamento</th>
                    <th>Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {vets.map((v, i) => {
                    const rows = thisMo.filter(a => a.vet_id === v.id);
                    const fat = rows.reduce((s, a) => s + a.valor, 0);
                    const com = rows.reduce((s, a) => s + calcCom(a.valor, a.perc), 0);
                    return (
                      <tr key={v.id}>
                        <td style={{ paddingLeft: 20 }}>
                          <span style={{ fontSize: 18 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>Dr. {v.nome}</td>
                        <td className="hide-tablet">{rows.length}</td>
                        <td style={{ color: T.brand, fontWeight: 600 }}>{fmt(fat)}</td>
                        <td><Badge color="green">{fmt(com)}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Recent */}
        <Card>
          <SectionHeader title="Últimos atendimentos" />
          <Divider />
          <div style={{ padding: "0 0 4px" }}>
            {lastAtends.length === 0 ? (
              <EmptyState icon="🐾" title="Nenhum atendimento registrado" desc="Clique em Atendimentos para adicionar o primeiro registro" />
            ) : (
              <div className="table-scroll">
                <table className="vc-table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 20 }}>Data</th>
                      <th>Paciente/Tutor</th>
                      <th>Serviço</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastAtends.map(a => (
                      <tr key={a.id}>
                        <td style={{ paddingLeft: 20, color: T.textMuted, fontSize: 12, whiteSpace: "nowrap" }}>{fmtD(a.data)}</td>
                        <td style={{ fontWeight: 500, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.paciente_tutor || <span style={{ color: T.textMuted }}>—</span>}
                        </td>
                        <td style={{ color: T.textMuted, fontSize: 12, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.servico}</td>
                        <td style={{ color: T.brand, fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(a.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ATENDIMENTOS
───────────────────────────────────────────────────────────────────────────── */
function Atendimentos({ atends, setAtends, vets }) {
  const EMPTY = { data: new Date().toISOString().split("T")[0], vet_id: "", paciente_tutor: "", servico: "", valor: "", perc: "20", obs: "" };
  const [modal, setModal]     = useState(null);
  const [delItem, setDelItem] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [svcFree, setSvcFree] = useState(false);
  const [filters, setFilters] = useState({ vet: "", mes: "", q: "" });

  useEffect(() => {
    if (form.vet_id && modal === "add") {
      const v = vets.find(x => x.id === +form.vet_id);
      if (v) setForm(p => ({ ...p, perc: String(v.percentual_padrao) }));
    }
  }, [form.vet_id]);

  const comissao = useMemo(() => {
    const v = parseFloat(form.valor), p = parseFloat(form.perc);
    return v && p ? calcCom(v, p) : 0;
  }, [form.valor, form.perc]);

  const openAdd  = () => { setForm(EMPTY); setSvcFree(false); setModal("add"); };
  const openEdit = a => { setForm({ ...a, vet_id: String(a.vet_id) }); setSvcFree(!SERVICOS.includes(a.servico)); setModal(a); };

  const save = () => {
    if (!form.data || !form.vet_id || !form.servico || !form.valor) return;
    const entry = { ...form, vet_id: +form.vet_id, valor: parseFloat(form.valor), perc: parseFloat(form.perc) };
    if (modal === "add") setAtends(p => [...p, { ...entry, id: Date.now() }]);
    else setAtends(p => p.map(a => a.id === modal.id ? { ...entry, id: modal.id } : a));
    setModal(null);
  };

  const filtered = useMemo(() => {
    let rows = [...atends].sort((a, b) => new Date(b.data) - new Date(a.data) || b.id - a.id);
    if (filters.vet) rows = rows.filter(a => a.vet_id === +filters.vet);
    if (filters.mes) {
      const [y, m] = filters.mes.split("-").map(Number);
      rows = rows.filter(a => { const d = new Date(a.data + "T12:00:00"); return d.getFullYear() === y && d.getMonth() === m - 1; });
    }
    if (filters.q) rows = rows.filter(a => (a.paciente_tutor + a.servico).toLowerCase().includes(filters.q.toLowerCase()));
    return rows;
  }, [atends, filters]);

  const totFat = filtered.reduce((s, a) => s + a.valor, 0);
  const totCom = filtered.reduce((s, a) => s + calcCom(a.valor, a.perc), 0);

  const percBadge = p => {
    if (p >= 40)  return { color: "amber",  label: "40%" };
    if (p >= 31)  return { color: "violet", label: "31,11%" };
    return              { color: "blue",    label: "20%" };
  };

  return (
    <div className="page-padding" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Filters bar */}
      <Card style={{ padding: "16px 20px" }}>
        <div className="grid-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
          <Field label="Veterinário">
            <select className="vc-input" value={filters.vet} onChange={e => setFilters(p => ({ ...p, vet: e.target.value }))}>
              <option value="">Todos os veterinários</option>
              {vets.map(v => <option key={v.id} value={v.id}>Dr. {v.nome}</option>)}
            </select>
          </Field>
          <Field label="Período">
            <input className="vc-input" type="month" value={filters.mes} onChange={e => setFilters(p => ({ ...p, mes: e.target.value }))} />
          </Field>
          <Field label="Paciente ou serviço">
            <input className="vc-input" placeholder="Buscar..." value={filters.q} onChange={e => setFilters(p => ({ ...p, q: e.target.value }))} />
          </Field>
          <Btn onClick={() => setFilters({ vet: "", mes: "", q: "" })} variant="ghost" size="sm">Limpar</Btn>
        </div>
      </Card>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: T.textMuted }}>Faturamento: </span>
            <span style={{ fontWeight: 700, color: T.brand }}>{fmt(totFat)}</span>
          </div>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: T.textMuted }}>Comissão: </span>
            <span style={{ fontWeight: 700, color: T.emerald }}>{fmt(totCom)}</span>
          </div>
          <div style={{ fontSize: 13, color: T.textMuted }}>{filtered.length} registros</div>
        </div>
        <Btn onClick={openAdd} size="sm">+ Novo atendimento</Btn>
      </div>

      {/* Table */}
      <Card style={{ overflow: "hidden", padding: 0 }}>
        <div className="table-scroll">
          <table className="vc-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Data</th>
                <th>Veterinário</th>
                <th>Paciente/Tutor</th>
                <th>Serviço</th>
                <th>Valor</th>
                <th>%</th>
                <th>Comissão</th>
                <th className="hide-tablet">Observações</th>
                <th style={{ paddingRight: 20 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9}>
                  <EmptyState icon="🐾" title="Nenhum atendimento encontrado"
                    desc={filters.vet || filters.mes || filters.q ? "Tente ajustar os filtros acima" : "Clique em + Novo atendimento para começar"} />
                </td></tr>
              ) : filtered.map(a => {
                const pb = percBadge(a.perc);
                return (
                  <tr key={a.id}>
                    <td style={{ paddingLeft: 20, color: T.textMuted, fontSize: 12.5, whiteSpace: "nowrap" }}>{fmtD(a.data)}</td>
                    <td style={{ fontWeight: 500 }}>Dr. {vets.find(v => v.id === a.vet_id)?.nome || "—"}</td>
                    <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.paciente_tutor || <span style={{ color: T.textMuted }}>—</span>}
                    </td>
                    <td style={{ color: T.textSecondary, fontSize: 12.5, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.servico}</td>
                    <td style={{ color: T.brand, fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(a.valor)}</td>
                    <td><Badge color={pb.color}>{pb.label}</Badge></td>
                    <td style={{ color: T.emerald, fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(calcCom(a.valor, a.perc))}</td>
                    <td className="hide-tablet" style={{ color: T.textMuted, fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.obs || <span style={{ color: T.borderLight }}>—</span>}
                    </td>
                    <td style={{ paddingRight: 20 }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Btn variant="ghost" size="sm" onClick={() => openEdit(a)}>Editar</Btn>
                        <Btn variant="danger" size="sm" onClick={() => setDelItem(a)}>✕</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {modal && (
        <Modal title={modal === "add" ? "Novo atendimento" : "Editar atendimento"} onClose={() => setModal(null)} maxWidth={600}>
          <div className="grid-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Data *">
              <input className="vc-input" type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
            </Field>
            <Field label="Veterinário *">
              <select className="vc-input" value={form.vet_id} onChange={e => setForm(p => ({ ...p, vet_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {vets.map(v => <option key={v.id} value={v.id}>Dr. {v.nome}</option>)}
              </select>
            </Field>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Paciente / Tutor">
                <input className="vc-input" value={form.paciente_tutor}
                  onChange={e => setForm(p => ({ ...p, paciente_tutor: e.target.value }))} placeholder="Ex: Ringo/Luciano" />
              </Field>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="vc-label">Serviço *</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <Btn size="sm" variant={!svcFree ? "primary" : "secondary"} onClick={() => setSvcFree(false)}>Lista</Btn>
                <Btn size="sm" variant={svcFree ? "primary" : "secondary"} onClick={() => setSvcFree(true)}>Digitar livre</Btn>
              </div>
              {svcFree
                ? <input className="vc-input" value={form.servico} onChange={e => setForm(p => ({ ...p, servico: e.target.value }))} placeholder="Digite o serviço..." />
                : <select className="vc-input" value={form.servico} onChange={e => setForm(p => ({ ...p, servico: e.target.value }))}>
                    <option value="">Selecione o serviço...</option>
                    {SERVICOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
              }
            </div>
            <Field label="Valor (R$) *">
              <input className="vc-input" type="number" step="0.01" min="0"
                value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} placeholder="0,00" />
            </Field>
            <Field label="% Comissão *">
              <select className="vc-input" value={form.perc} onChange={e => setForm(p => ({ ...p, perc: e.target.value }))}>
                <option value="20">20% — Consultas / Exames / Vacinas</option>
                <option value="31.11">31,11% — Castrações</option>
                <option value="40">40% — Cirurgias / Eutanásia</option>
              </select>
            </Field>

            {/* Comissão preview */}
            <div style={{
              gridColumn: "1/-1", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: T.emeraldLight, borderRadius: 10, padding: "12px 16px",
              border: `1px solid rgba(5,150,105,0.2)`,
            }}>
              <span style={{ fontSize: 13, color: T.emerald, fontWeight: 500 }}>💡 Comissão calculada</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: T.emerald }}>{fmt(comissao)}</span>
            </div>

            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Observações">
                <textarea className="vc-textarea" rows={2} value={form.obs}
                  onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} placeholder="Detalhes do atendimento..." />
              </Field>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Btn variant="secondary" size="sm" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn size="sm" onClick={save}>Salvar atendimento</Btn>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {delItem && (
        <Modal title="Confirmar exclusão" onClose={() => setDelItem(null)} maxWidth={440}>
          <p style={{ fontSize: 14, color: T.textSecondary, marginBottom: 20 }}>
            Excluir o atendimento de <strong style={{ color: T.textPrimary }}>{delItem.servico}</strong>
            {delItem.paciente_tutor ? ` para ${delItem.paciente_tutor}` : ""} ({fmt(delItem.valor)})?
            <br /><span style={{ fontSize: 12, color: T.textMuted, marginTop: 4, display: "block" }}>Essa ação não pode ser desfeita.</span>
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="secondary" size="sm" onClick={() => setDelItem(null)}>Cancelar</Btn>
            <Btn variant="danger" size="sm" onClick={() => { setAtends(p => p.filter(a => a.id !== delItem.id)); setDelItem(null); }}>
              Excluir
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   VETERINÁRIOS
───────────────────────────────────────────────────────────────────────────── */
function Veterinarios({ vets, setVets, atends }) {
  const EMPTY = { nome: "", telefone: "", email: "", percentual_padrao: 20 };
  const [modal, setModal] = useState(null);
  const [delItem, setDelItem] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const openAdd  = () => { setForm(EMPTY); setModal("add"); };
  const openEdit = v => { setForm({ ...v }); setModal(v); };
  const save = () => {
    if (!form.nome) return;
    if (modal === "add") setVets(p => [...p, { ...form, id: Date.now(), percentual_padrao: +form.percentual_padrao }]);
    else setVets(p => p.map(v => v.id === modal.id ? { ...form, id: modal.id, percentual_padrao: +form.percentual_padrao } : v));
    setModal(null);
  };

  const stats = id => {
    const rows = atends.filter(a => a.vet_id === id);
    return { fat: rows.reduce((s, a) => s + a.valor, 0), com: rows.reduce((s, a) => s + calcCom(a.valor, a.perc), 0), qtd: rows.length };
  };

  return (
    <div className="page-padding" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn size="sm" onClick={openAdd}>+ Novo veterinário</Btn>
      </div>

      <Card style={{ overflow: "hidden", padding: 0 }}>
        <div className="table-scroll">
          <table className="vc-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Veterinário</th>
                <th className="hide-mobile">Telefone</th>
                <th className="hide-tablet">E-mail</th>
                <th>% Padrão</th>
                <th>Atendimentos</th>
                <th>Faturamento</th>
                <th>Comissão total</th>
                <th style={{ paddingRight: 20 }}></th>
              </tr>
            </thead>
            <tbody>
              {vets.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon="👤" title="Nenhum veterinário cadastrado" desc="Clique em + Novo veterinário para adicionar" /></td></tr>
              ) : vets.map(v => {
                const st = stats(v.id);
                return (
                  <tr key={v.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                          background: `linear-gradient(135deg,${T.brand},${T.violet})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: "#fff",
                        }}>{v.nome.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>Dr. {v.nome}</div>
                          <div style={{ fontSize: 11, color: T.textMuted }}>#{v.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hide-mobile" style={{ color: T.textSecondary, fontSize: 13 }}>{v.telefone || "—"}</td>
                    <td className="hide-tablet" style={{ color: T.textSecondary, fontSize: 13 }}>{v.email || "—"}</td>
                    <td><Badge color="blue">{v.percentual_padrao}%</Badge></td>
                    <td style={{ color: T.textPrimary }}>{st.qtd}</td>
                    <td style={{ color: T.brand, fontWeight: 600 }}>{fmt(st.fat)}</td>
                    <td><Badge color="green">{fmt(st.com)}</Badge></td>
                    <td style={{ paddingRight: 20 }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Btn variant="ghost" size="sm" onClick={() => openEdit(v)}>Editar</Btn>
                        <Btn variant="danger" size="sm" onClick={() => setDelItem(v)}>✕</Btn>
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
        <Modal title={modal === "add" ? "Novo veterinário" : "Editar veterinário"} onClose={() => setModal(null)} maxWidth={500}>
          <div className="grid-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Nome completo *">
                <input className="vc-input" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Elismael" />
              </Field>
            </div>
            <Field label="Telefone">
              <input className="vc-input" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 90000-0000" />
            </Field>
            <Field label="E-mail">
              <input className="vc-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="vet@clinica.com" />
            </Field>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="% Comissão padrão">
                <select className="vc-input" value={form.percentual_padrao} onChange={e => setForm(p => ({ ...p, percentual_padrao: +e.target.value }))}>
                  <option value={20}>20% — Padrão</option>
                  <option value={31.11}>31,11% — Castração</option>
                  <option value={40}>40% — Cirurgia</option>
                </select>
              </Field>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Btn variant="secondary" size="sm" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn size="sm" onClick={save}>Salvar</Btn>
          </div>
        </Modal>
      )}

      {delItem && (
        <Modal title="Excluir veterinário?" onClose={() => setDelItem(null)} maxWidth={420}>
          <p style={{ fontSize: 14, color: T.textSecondary, marginBottom: 20 }}>
            Excluir <strong style={{ color: T.textPrimary }}>Dr. {delItem.nome}</strong>? Os atendimentos não serão excluídos.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="secondary" size="sm" onClick={() => setDelItem(null)}>Cancelar</Btn>
            <Btn variant="danger" size="sm" onClick={() => { setVets(p => p.filter(v => v.id !== delItem.id)); setDelItem(null); }}>Excluir</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   RELATÓRIOS
───────────────────────────────────────────────────────────────────────────── */
function Relatorios({ atends, vets }) {
  const [vet,  setVet]  = useState("");
  const [mes,  setMes]  = useState("");
  const [busca,setBusca]= useState("");

  const filtered = useMemo(() => {
    let rows = [...atends].sort((a, b) => new Date(b.data) - new Date(a.data));
    if (vet)  rows = rows.filter(a => a.vet_id === +vet);
    if (mes) {
      const [y, m] = mes.split("-").map(Number);
      rows = rows.filter(a => { const d = new Date(a.data + "T12:00:00"); return d.getFullYear() === y && d.getMonth() === m - 1; });
    }
    if (busca) rows = rows.filter(a => (a.paciente_tutor + a.servico).toLowerCase().includes(busca.toLowerCase()));
    return rows;
  }, [atends, vet, mes, busca]);

  const totFat  = filtered.reduce((s, a) => s + a.valor, 0);
  const totCom  = filtered.reduce((s, a) => s + calcCom(a.valor, a.perc), 0);
  const totCom10= totCom * 0.90;

  const porVet = vets.map(v => {
    const rows = filtered.filter(a => a.vet_id === v.id);
    const fat = rows.reduce((s, a) => s + a.valor, 0);
    const com = rows.reduce((s, a) => s + calcCom(a.valor, a.perc), 0);
    return { ...v, fat, com, com10: com * 0.9, qtd: rows.length };
  }).filter(v => v.qtd > 0).sort((a, b) => b.fat - a.fat);

  const timeline = useMemo(() => {
    const byD = {};
    filtered.forEach(a => { byD[a.data] = (byD[a.data] || 0) + a.valor; });
    return Object.entries(byD).sort().map(([d, v]) => ({ data: fmtD(d), valor: v }));
  }, [filtered]);

  const exportCSV = () => {
    const h = ["Data","Veterinário","Paciente/Tutor","Serviço","Valor","% Comissão","Valor Comissão","Comissão -10%","Observações"];
    const rows = filtered.map(a => {
      const com = calcCom(a.valor, a.perc);
      return [fmtD(a.data), `Dr. ${vets.find(v => v.id === a.vet_id)?.nome || ""}`,
        a.paciente_tutor, a.servico,
        a.valor.toFixed(2).replace(".", ","), a.perc,
        com.toFixed(2).replace(".", ","), (com * 0.9).toFixed(2).replace(".", ","),
        a.obs];
    });
    const csv = "\uFEFF" + [h, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "comissoes_vet.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="page-padding" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Filters */}
      <Card style={{ padding: "16px 20px" }}>
        <div className="grid-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
          <Field label="Veterinário">
            <select className="vc-input" value={vet} onChange={e => setVet(e.target.value)}>
              <option value="">Todos</option>
              {vets.map(v => <option key={v.id} value={v.id}>Dr. {v.nome}</option>)}
            </select>
          </Field>
          <Field label="Período">
            <input className="vc-input" type="month" value={mes} onChange={e => setMes(e.target.value)} />
          </Field>
          <Field label="Buscar">
            <input className="vc-input" placeholder="Paciente ou serviço..." value={busca} onChange={e => setBusca(e.target.value)} />
          </Field>
          <Btn variant="success" size="sm" onClick={exportCSV} style={{ whiteSpace: "nowrap" }}>
            ↓ Exportar CSV
          </Btn>
        </div>
      </Card>

      {/* KPI row */}
      <div className="grid-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { icon: "💰", label: "Faturamento",    value: fmt(totFat),   color: T.brand,   bg: T.brandLight },
          { icon: "🏆", label: "Comissão total", value: fmt(totCom),   color: T.emerald, bg: T.emeraldLight },
          { icon: "📉", label: "Comissão -10%",  value: fmt(totCom10), color: T.amber,   bg: T.amberLight },
          { icon: "🐾", label: "Atendimentos",   value: filtered.length, color: T.violet, bg: T.violetLight },
        ].map((k, i) => (
          <Card key={i} style={{ padding: "16px 18px" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 10 }}>{k.icon}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 3, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary }}>{k.value}</div>
          </Card>
        ))}
      </div>

      {/* Por veterinário */}
      <Card style={{ overflow: "hidden", padding: 0 }}>
        <SectionHeader title="Resumo por veterinário" />
        <Divider />
        <div className="table-scroll">
          <table className="vc-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Veterinário</th>
                <th>Atendimentos</th>
                <th>Faturamento</th>
                <th>Comissão</th>
                <th>Comissão -10%</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {porVet.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon="📊" title="Nenhum dado para os filtros selecionados" /></td></tr>
              ) : porVet.map(v => (
                <tr key={v.id}>
                  <td style={{ paddingLeft: 20, fontWeight: 600 }}>Dr. {v.nome}</td>
                  <td>{v.qtd}</td>
                  <td style={{ color: T.brand, fontWeight: 600 }}>{fmt(v.fat)}</td>
                  <td style={{ color: T.emerald, fontWeight: 700 }}>{fmt(v.com)}</td>
                  <td style={{ color: T.amber, fontWeight: 600 }}>{fmt(v.com10)}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 60, height: 6, background: T.bgSecondary, borderRadius: 99 }}>
                        <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg,${T.brand},${T.emerald})`,
                          width: `${v.fat ? Math.min(100, (v.com / v.fat) * 100 * 4) : 0}%` }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary }}>
                        {v.fat ? ((v.com / v.fat) * 100).toFixed(1) : "0"}%
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
      {timeline.length > 1 && (
        <Card>
          <SectionHeader title="Evolução do faturamento" />
          <div style={{ padding: "20px 20px 16px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} vertical={false} />
                <XAxis dataKey="data" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={44}
                  tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="valor" name="Faturamento" stroke={T.brand} strokeWidth={2.5}
                  dot={{ fill: T.brand, strokeWidth: 0, r: 3.5 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Detail table */}
      <Card style={{ overflow: "hidden", padding: 0 }}>
        <SectionHeader title={`Detalhamento completo — ${filtered.length} registros`} />
        <Divider />
        <div className="table-scroll">
          <table className="vc-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Data</th>
                <th>Veterinário</th>
                <th>Paciente/Tutor</th>
                <th>Serviço</th>
                <th>Valor</th>
                <th>%</th>
                <th>Comissão</th>
                <th>Com. -10%</th>
                <th className="hide-tablet" style={{ paddingRight: 20 }}>Observações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9}><EmptyState icon="📋" title="Nenhum dado encontrado" desc="Ajuste os filtros acima para visualizar os dados" /></td></tr>
              ) : filtered.map(a => {
                const com = calcCom(a.valor, a.perc);
                return (
                  <tr key={a.id}>
                    <td style={{ paddingLeft: 20, color: T.textMuted, fontSize: 12.5, whiteSpace: "nowrap" }}>{fmtD(a.data)}</td>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>Dr. {vets.find(v => v.id === a.vet_id)?.nome || "—"}</td>
                    <td style={{ fontSize: 13, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.paciente_tutor || "—"}</td>
                    <td style={{ color: T.textSecondary, fontSize: 12, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.servico}</td>
                    <td style={{ color: T.brand, fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(a.valor)}</td>
                    <td style={{ color: T.textMuted, fontSize: 12 }}>{a.perc}%</td>
                    <td style={{ color: T.emerald, fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(com)}</td>
                    <td style={{ color: T.amber, fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(com * 0.9)}</td>
                    <td className="hide-tablet" style={{ paddingRight: 20, color: T.textMuted, fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.obs || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{
            display: "flex", gap: 24, padding: "14px 20px",
            borderTop: `1px solid ${T.borderLight}`, flexWrap: "wrap",
            background: T.bgSecondary,
          }}>
            {[
              { label: "Faturamento", value: fmt(totFat),   color: T.brand },
              { label: "Comissão",    value: fmt(totCom),   color: T.emerald },
              { label: "Com. -10%",  value: fmt(totCom10), color: T.amber },
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 13 }}>
                <span style={{ color: T.textMuted }}>{s.label}: </span>
                <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   APP ROOT
───────────────────────────────────────────────────────────────────────────── */
const PAGE_INFO = {
  dashboard:    { title: "Dashboard",       sub: () => `${MESES[now.getMonth()]} ${now.getFullYear()} · Visão geral` },
  atendimentos: { title: "Atendimentos",    sub: (a) => `${a.length} registros no sistema` },
  veterinarios: { title: "Veterinários",    sub: (_, v) => `${v.length} cadastrados` },
  relatorios:   { title: "Relatórios",      sub: () => "Análise detalhada e exportação" },
};

export default function App() {
  const [logged,   setLogged]   = useState(false);
  const [page,     setPage]     = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [vets,     setVets]     = useState(VETS_INIT);
  const [atends,   setAtends]   = useState(ATEND_INIT);

  // Close sidebar on nav
  const navigate = useCallback(p => { setPage(p); setMenuOpen(false); }, []);

  const pi  = PAGE_INFO[page];
  const sub = pi?.sub(atends, vets);

  if (!logged) return <><style>{CSS}</style><Login onLogin={() => setLogged(true)} /></>;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: T.bg }}>
        <Sidebar page={page} setPage={navigate} open={menuOpen} onClose={() => setMenuOpen(false)} />

        {/* Main area */}
        <div className="vc-main" style={{
          marginLeft: SIDEBAR_W, flex: 1, minWidth: 0,
          display: "flex", flexDirection: "column", minHeight: "100vh",
        }}>
          <Topbar
            title={pi?.title} subtitle={sub}
            onMenu={() => setMenuOpen(o => !o)}
            onLogout={() => setLogged(false)}
          />
          <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            {page === "dashboard"    && <Dashboard    vets={vets}  atends={atends} />}
            {page === "atendimentos" && <Atendimentos atends={atends} setAtends={setAtends} vets={vets} />}
            {page === "veterinarios" && <Veterinarios vets={vets}  setVets={setVets} atends={atends} />}
            {page === "relatorios"   && <Relatorios   atends={atends} vets={vets} />}
          </main>
        </div>
      </div>
    </>
  );
}
