import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, LogIn, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

/* ── Quotes ──────────────────────────────────────────────────────── */
const PALETTE = [
  { accent: "#60a5fa", glow: "rgba(96,165,250,0.18)"  },
  { accent: "#34d399", glow: "rgba(52,211,153,0.18)"  },
  { accent: "#22d3ee", glow: "rgba(34,211,238,0.18)"  },
];

const QUOTES = [
  "Professionalism is not a department, it is our culture.",
  "Your consistency keeps the entire system moving forward.",
  "Consistency, accountability and teamwork makes us great.",
  "When we serve with honesty and consistency, success follows naturally.",
  "Great service is not an event, it is a daily commitment.",
  "Every branch carries the reputation of the entire school.",
  "Great institutions are built by teams that take pride in the details.",
].map((text, i) => ({ text, author: "Rocky Driving School", ...PALETTE[i % PALETTE.length] }));

const INTERVAL = 10000;

/* ── Styles ──────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,900;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  @keyframes auroraA {
    0%,100% { transform: translate(0%,0%) scale(1); }
    33%      { transform: translate(6%,-8%) scale(1.08); }
    66%      { transform: translate(-4%,5%) scale(0.96); }
  }
  @keyframes auroraB {
    0%,100% { transform: translate(0%,0%) scale(1.05); }
    40%      { transform: translate(-7%,6%) scale(0.94); }
    70%      { transform: translate(5%,-4%) scale(1.1); }
  }
  @keyframes auroraC {
    0%,100% { transform: translate(0%,0%) scale(0.98); }
    50%      { transform: translate(8%,8%) scale(1.06); }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes quoteIn {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes quoteOut {
    from { opacity:1; transform:translateY(0); }
    to   { opacity:0; transform:translateY(-12px); }
  }
  @keyframes spin       { to { transform:rotate(360deg); } }
  @keyframes pulseDot   { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
  @keyframes floatStars { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes shimmer    { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes starPop    { 0%{opacity:0;transform:scale(0) rotate(-20deg)} 60%{opacity:1;transform:scale(1.15) rotate(4deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }

  /* ── Inputs ── */
  .lp-input {
    width:100%; padding:11px 14px 11px 40px;
    border-radius:10px; font-size:14px;
    font-family:'DM Sans',sans-serif;
    outline:none; transition:all .18s ease;
    background:rgba(255,255,255,0.07);
    border:1px solid rgba(255,255,255,0.1);
    color:#fff;
  }
  .lp-input::placeholder { color:rgba(255,255,255,0.28); }
  .lp-input:focus {
    background:rgba(255,255,255,0.11);
    border-color:rgba(96,165,250,0.55);
    box-shadow:0 0 0 3px rgba(96,165,250,0.1);
  }

  /* ── Button ── */
  .lp-btn {
    width:100%; padding:12px;
    border-radius:10px;
    font-family:'DM Sans',sans-serif;
    font-size:14px; font-weight:700;
    color:#fff; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:8px;
    transition:all .2s ease;
    background:linear-gradient(135deg,#3b82f6 0%,#2563eb 50%,#4f46e5 100%);
    box-shadow:0 4px 20px rgba(59,130,246,0.5), inset 0 1px 0 rgba(255,255,255,0.18);
    letter-spacing:.01em;
  }
  .lp-btn:hover:not(:disabled) {
    transform:translateY(-1px);
    box-shadow:0 8px 28px rgba(59,130,246,0.65), inset 0 1px 0 rgba(255,255,255,0.18);
  }
  .lp-btn:active:not(:disabled) { transform:translateY(0); }
  .lp-btn:disabled { opacity:.5; cursor:not-allowed; }

  .q-in  { animation:quoteIn  .65s cubic-bezier(.16,1,.3,1) both; }
  .q-out { animation:quoteOut .45s cubic-bezier(.4,0,.6,1)  both; }

  /* ── Layout ── */
  .lp-page {
    min-height:100svh;
    display:flex; align-items:center; justify-content:center;
    padding:16px; position:relative; overflow:hidden;
  }

  /* ── CARD: deeper, richer dark — no more ashy navy ── */
  .lp-card {
    display:flex; width:100%;
    max-width:960px; min-height:600px;
    border-radius:24px; overflow:hidden;
    position:relative; z-index:10;
    animation:fadeIn .5s ease both;
    background:rgba(8,15,35,0.94);
    backdrop-filter:blur(40px) saturate(1.8);
    -webkit-backdrop-filter:blur(40px) saturate(1.8);
    border:1px solid rgba(255,255,255,0.10);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.07) inset,
      0 40px 100px rgba(0,0,0,0.65),
      0 12px 32px rgba(0,0,0,0.45),
      0 2px 8px rgba(0,0,0,0.35);
  }

  .lp-form-panel {
    flex:0 0 50%;
    display:flex; flex-direction:column;
    position:relative; overflow:hidden;
    border-right:1px solid rgba(255,255,255,0.07);
  }
  .lp-logo-area {
    position:relative; z-index:10;
    padding:32px 40px 0;
  }
  .lp-form-area {
    position:relative; z-index:10; flex:1;
    display:flex; flex-direction:column;
    justify-content:center;
    padding:28px 40px 36px;
    animation:fadeUp .5s .12s ease both;
  }
  .lp-heading {
    font-size:32px; font-weight:900;
    color:#fff; letter-spacing:-.03em;
    margin:0 0 6px;
  }

  .lp-quote-panel {
    flex:0 0 50%;
    display:flex; flex-direction:column;
    position:relative; overflow:hidden;
  }

  /* ── Responsive ── */
  @media (max-width:1023px) {
    .lp-form-panel { flex:1 1 100%; border-right:none; }
    .lp-quote-panel { display:none !important; }
  }
  @media (max-width:639px) {
    .lp-page  { padding:0; align-items:stretch; }
    .lp-card  { border-radius:0; min-height:100svh; border:none; box-shadow:none; }
    .lp-logo-area { padding:28px 24px 0; }
    .lp-form-area { padding:20px 24px 32px; justify-content:flex-start; }
    .lp-heading   { font-size:26px; }
  }
  @media (min-width:640px) and (max-width:1023px) {
    .lp-page { padding:24px 16px; align-items:center; }
    .lp-card { border-radius:20px; min-height:auto; }
    .lp-logo-area { padding:28px 32px 0; }
    .lp-form-area { padding:24px 32px 36px; }
    .lp-heading   { font-size:28px; }
  }
`;

/* ── Light aurora on plain background ────────────────────────────── */
function AuroraBackground() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:0,
      background:"#eef2ff",
      overflow:"hidden", pointerEvents:"none",
    }}>
      <div style={{
        position:"absolute", width:"72vw", height:"72vw",
        top:"-22%", left:"-14%",
        background:"radial-gradient(ellipse, rgba(148,163,252,0.65) 0%, transparent 65%)",
        animation:"auroraA 24s ease-in-out infinite", willChange:"transform",
      }} />
      <div style={{
        position:"absolute", width:"66vw", height:"66vw",
        bottom:"-28%", right:"-16%",
        background:"radial-gradient(ellipse, rgba(192,170,252,0.55) 0%, transparent 65%)",
        animation:"auroraB 30s ease-in-out infinite", willChange:"transform",
      }} />
      <div style={{
        position:"absolute", width:"52vw", height:"52vw",
        top:"38%", left:"32%",
        background:"radial-gradient(ellipse, rgba(167,220,252,0.45) 0%, transparent 60%)",
        animation:"auroraC 20s ease-in-out infinite", willChange:"transform",
      }} />
    </div>
  );
}

/* ── Five stars ───────────────────────────────────────────────────── */
function FiveStars({ color, size = 14 }) {
  return (
    <div style={{ display:"flex", gap:4, alignItems:"center" }}>
      {[0,1,2,3,4].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={color}
          style={{ animation:`starPop .4s ${.06*i}s both`, filter:`drop-shadow(0 0 4px ${color}88)` }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

/* ── Quote dots ───────────────────────────────────────────────────── */
function QuoteDots({ total, active, accent, onSelect }) {
  return (
    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
      {Array.from({ length:total }).map((_,i) => (
        <button key={i} onClick={() => onSelect(i)} style={{
          border:"none",
          background: i === active ? accent : "rgba(255,255,255,0.15)",
          borderRadius:99,
          width: i === active ? 22 : 6, height:6,
          cursor:"pointer", padding:0,
          transition:"all .3s cubic-bezier(.34,1.56,.64,1)",
        }} />
      ))}
    </div>
  );
}

/* ── Quote panel ──────────────────────────────────────────────────── */
function QuotePanel() {
  const [idx,      setIdx]      = useState(0);
  const [phase,    setPhase]    = useState("in");
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const rafRef   = useRef(null);

  const q = QUOTES[idx];

  const advance = (nextIdx) => {
    setPhase("out");
    setTimeout(() => {
      setIdx(nextIdx !== undefined ? nextIdx : (i) => (i + 1) % QUOTES.length);
      setPhase("in");
      resetProgress();
    }, 460);
  };

  const resetProgress = () => {
    setProgress(0);
    startRef.current = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const tick = (now) => {
      const pct = Math.min(((now - startRef.current) / INTERVAL) * 100, 100);
      setProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    resetProgress();
    timerRef.current = setInterval(() => advance(), INTERVAL);
    return () => {
      clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [idx]);

  const handleDot = (i) => {
    if (i === idx) return;
    clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    advance(i);
  };

  const keywords = ["professionalism","consistency","accountability","teamwork","honesty","commitment","reputation","details","service","great"];

  return (
    <div className="lp-quote-panel">
      {/* Accent glow wash */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background:`radial-gradient(ellipse 80% 65% at 70% 25%, ${q.glow.replace("0.18","0.28")} 0%, transparent 65%)`,
        transition:"background .9s ease",
      }} />

      {/* Giant decorative quote mark */}
      <div style={{
        position:"absolute", top:8, right:16,
        fontSize:200, lineHeight:1,
        fontFamily:"'Georgia',serif",
        color:q.accent, opacity:.07,
        pointerEvents:"none", userSelect:"none",
        transition:"color .7s ease", fontWeight:900,
      }}>"</div>

      {/* Top bar */}
      <div style={{
        position:"relative", zIndex:10,
        padding:"26px 30px 0",
        display:"flex", alignItems:"center", gap:8,
      }}>
        <div style={{
          width:7, height:7, borderRadius:"50%",
          background:q.accent,
          animation:"pulseDot 2.2s ease-in-out infinite",
          transition:"background .6s ease",
          boxShadow:`0 0 8px ${q.accent}`,
        }} />
        <span style={{
          fontSize:9, fontFamily:"'DM Mono',monospace",
          fontWeight:500, letterSpacing:".2em", textTransform:"uppercase",
          color:"rgba(255,255,255,0.3)",
        }}>
          Culture & Values
        </span>
        <span style={{
          marginLeft:"auto", fontSize:9,
          fontFamily:"'DM Mono',monospace",
          color:"rgba(255,255,255,0.2)", letterSpacing:".12em",
        }}>
          {String(idx+1).padStart(2,"0")} / {String(QUOTES.length).padStart(2,"0")}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        position:"relative", zIndex:10,
        margin:"14px 30px 0",
        height:2, borderRadius:99,
        background:"rgba(255,255,255,0.08)", overflow:"hidden",
      }}>
        <div style={{
          height:"100%", borderRadius:99,
          background:q.accent, width:`${progress}%`,
          transition:"background .6s ease", opacity:.75,
        }} />
      </div>

      {/* Quote content */}
      <div style={{
        position:"relative", zIndex:10, flex:1,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"20px 36px 16px", gap:20,
      }}>
        {/* Stars with glow */}
        <div style={{ animation:"floatStars 4s ease-in-out infinite" }}>
          <FiveStars color={q.accent} size={15} key={idx} />
        </div>

        {/* Quote block */}
        <div
          key={`q-${idx}-${phase}`}
          className={phase === "in" ? "q-in" : "q-out"}
          style={{ textAlign:"center", maxWidth:310 }}
        >
          {/* Opening mark */}
          <span style={{
            display:"block", fontSize:56, lineHeight:.5,
            fontFamily:"'Georgia',serif",
            color:q.accent, opacity:.75,
            marginBottom:14,
            transition:"color .6s ease",
            textShadow:`0 0 20px ${q.accent}55`,
          }}>"</span>

          {/* Quote text */}
          <p style={{
            fontFamily:"'DM Sans',sans-serif",
            fontSize:19, fontWeight:800,
            lineHeight:1.5, color:"rgba(255,255,255,0.95)",
            letterSpacing:"-.02em",
            margin:"0 0 18px",
            textShadow:"0 1px 12px rgba(0,0,0,0.3)",
          }}>
            {q.text.split(" ").map((word, wi) => {
              const isKey = keywords.some(k => word.toLowerCase().replace(/[^a-z]/g,"").includes(k));
              return isKey ? (
                <span key={wi} style={{
                  background:`linear-gradient(90deg, ${q.accent}, ${q.accent}cc, ${q.accent})`,
                  backgroundSize:"200% auto",
                  WebkitBackgroundClip:"text",
                  WebkitTextFillColor:"transparent",
                  animation:"shimmer 2.5s linear infinite",
                  filter:`drop-shadow(0 0 8px ${q.accent}55)`,
                }}>
                  {word}{" "}
                </span>
              ) : (
                <span key={wi}>{word} </span>
              );
            })}
          </p>

          {/* Author */}
          <p style={{
            fontFamily:"'DM Mono',monospace",
            fontSize:10, fontWeight:500,
            color:q.accent, letterSpacing:".18em",
            textTransform:"uppercase",
            margin:0, opacity:.85,
            transition:"color .6s ease",
          }}>
            — {q.author}
          </p>
        </div>

        {/* Accent line */}
        <div style={{
          width:48, height:2, borderRadius:99,
          background:q.accent, opacity:.55,
          boxShadow:`0 0 10px ${q.accent}`,
          transition:"background .6s ease, box-shadow .6s ease",
        }} />
      </div>

      {/* Bottom nav */}
      <div style={{
        position:"relative", zIndex:10,
        padding:"0 30px 28px",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <QuoteDots total={QUOTES.length} active={idx} accent={q.accent} onSelect={handleDot} />
      </div>
    </div>
  );
}

/* ── Login page ──────────────────────────────────────────────────── */
export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        toast.error("Invalid username or password");
      }
    } catch (err) {
      if (err.status === 401) {
        toast.error("Invalid username or password");
      } else {
        toast.error("Connection error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <AuroraBackground />

      <div className="lp-page" style={{ fontFamily:"'DM Sans',sans-serif" }}>
        <div className="lp-card">

          {/* ── Left: Form ── */}
          <div className="lp-form-panel">
            <div className="lp-logo-area">
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{
                  width:34, height:34, borderRadius:"50%", padding:2,
                  background:"linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))",
                  border:"1px solid rgba(255,255,255,0.1)",
                  flexShrink:0,
                }}>
                  <div style={{
                    width:"100%", height:"100%", borderRadius:"50%",
                    overflow:"hidden", background:"#fff",
                  }}>
                    <img src="/fiveStarLogo.webp" alt="Rocky"
                      style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  </div>
                </div>
                <span style={{
                  fontSize:13, fontWeight:700,
                  color:"rgba(255,255,255,0.55)",
                  letterSpacing:"-.01em",
                  fontFamily:"'DM Sans',sans-serif",
                }}>
                  Rocky Driving School
                </span>
              </div>
            </div>

            <div className="lp-form-area">
              <div style={{ marginBottom:30 }}>
                <p style={{
                  fontSize:10, fontWeight:500,
                  letterSpacing:".18em", textTransform:"uppercase",
                  color:"rgba(147,197,253,0.9)", margin:"0 0 10px",
                  fontFamily:"'DM Mono',monospace",
                }}>
                  Staff Portal
                </p>
                <h1 className="lp-heading">Welcome back</h1>
                <p style={{
                  fontSize:13, color:"rgba(255,255,255,0.35)",
                  margin:0, lineHeight:1.6,
                }}>
                  Sign in with your credentials to continue
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div>
                  <label style={{
                    display:"block", marginBottom:6,
                    fontSize:10, fontWeight:500,
                    letterSpacing:".14em", textTransform:"uppercase",
                    color:"rgba(255,255,255,0.32)",
                    fontFamily:"'DM Mono',monospace",
                  }}>Username</label>
                  <div style={{ position:"relative" }}>
                    <User style={{
                      position:"absolute", left:12, top:"50%",
                      transform:"translateY(-50%)",
                      width:14, height:14, color:"rgba(255,255,255,0.25)",
                    }} />
                    <input className="lp-input" type="text"
                      placeholder="Enter your username" value={username}
                      onChange={e => setUsername(e.target.value)}
                      required autoComplete="username" />
                  </div>
                </div>

                <div>
                  <label style={{
                    display:"block", marginBottom:6,
                    fontSize:10, fontWeight:500,
                    letterSpacing:".14em", textTransform:"uppercase",
                    color:"rgba(255,255,255,0.32)",
                    fontFamily:"'DM Mono',monospace",
                  }}>Password</label>
                  <div style={{ position:"relative" }}>
                    <Lock style={{
                      position:"absolute", left:12, top:"50%",
                      transform:"translateY(-50%)",
                      width:14, height:14, color:"rgba(255,255,255,0.25)",
                    }} />
                    <input className="lp-input" type="password"
                      placeholder="Enter your password" value={password}
                      onChange={e => setPassword(e.target.value)}
                      required autoComplete="current-password" />
                  </div>
                </div>

                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:-4 }}>
                  <Link to="/forgot-password" style={{
                    fontSize:12, fontWeight:600,
                    color:"rgba(147,197,253,0.85)", textDecoration:"none",
                  }}
                    onMouseEnter={e => e.target.style.textDecoration="underline"}
                    onMouseLeave={e => e.target.style.textDecoration="none"}
                  >
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" disabled={loading} className="lp-btn" style={{ marginTop:6 }}>
                  {loading ? (
                    <><Loader2 style={{ width:15, height:15, animation:"spin 1s linear infinite" }} /> Signing in…</>
                  ) : (
                    <><LogIn style={{ width:15, height:15 }} /> Sign in</>
                  )}
                </button>
              </form>

              <div style={{
                marginTop:32, paddingTop:20,
                borderTop:"1px solid rgba(255,255,255,0.06)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <span style={{
                  fontSize:10, color:"rgba(255,255,255,0.18)",
                  fontFamily:"'DM Mono',monospace",
                }}>
                  © {new Date().getFullYear()} Rocky Driving School
                </span>
              </div>
            </div>
          </div>

          {/* ── Right: Quote panel ── */}
          <QuotePanel />
        </div>
      </div>
    </>
  );
}