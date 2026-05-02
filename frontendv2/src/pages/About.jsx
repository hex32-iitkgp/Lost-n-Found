import { use, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./About.css";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import ppo from "../assets/ppo.png";
import { ChevronDown, ChevronRight } from "lucide-react";
import foundIcon from "../assets/found.svg";
import lostIcon from "../assets/lost.svg";
import Header from "../components/Header";

function About() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const [shown, setShown] = useState(false);
  const isLoggedIn = !!localStorage.getItem("token");
  const { user, fetchUser, loadingo } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  window.onload = () => async function () {
    await fetchUser();
    if (!loadingo && user === null && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      alert("Session expired. Please log in again.");
      window.location.href = "/login";
    }
  }();

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      setShown(scrollY > 250);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [shown]);

  function scrollToNextSection() {
    const nextSection = document.querySelector(".problem-band");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  }
  /* ── Canvas interactive rings ── */
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width || window.innerWidth;
      canvas.height = rect.height || window.innerHeight;
      mouseRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
      targetRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      // only track when inside the hero band vertically
      targetRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };
    window.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onMove, { passive: true });

    // Ring config
    const RINGS = [
      { r: 120, opacity: 0.95, color: "212,233,226", lw: 2.0, phase: 0, dot: null },
      { r: 230, opacity: 0.80, color: "203,162,88", lw: 1.6, phase: 1.2, dot: { color: "#cba258", size: 7, speed: 0.018 } },
      { r: 370, opacity: 0.60, color: "212,233,226", lw: 1.3, phase: 2.4, dot: { color: "#d4e9e2", size: 6, speed: -0.011 } },
      { r: 540, opacity: 0.38, color: "212,233,226", lw: 1.0, phase: 3.6, dot: null },
      { r: 740, opacity: 0.20, color: "212,233,226", lw: 0.7, phase: 4.8, dot: null },
    ];

    let angles = RINGS.map((r) => r.phase);
    let t = 0;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;

      // smooth lerp toward mouse
      const lx = mouseRef.current.x + (targetRef.current.x - mouseRef.current.x) * 0.009;
      const ly = (mouseRef.current.y > window.innerHeight ? window.innerHeight : mouseRef.current.y) + (targetRef.current.y - mouseRef.current.y) * 0.009;
      mouseRef.current = { x: lx, y: ly };

      ctx.clearRect(0, 0, W, H);

      // subtle radial bg glow at cursor
      const grd = ctx.createRadialGradient(lx, ly, 0, lx, ly, 340);
      grd.addColorStop(0, "rgba(0,117,74,0.18)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      RINGS.forEach((ring, i) => {
        // ring breathe: radius pulses ±6px
        const breathe = Math.sin(t * 0.6 + ring.phase) * 6;
        const radius = ring.r + breathe;

        // draw ring
        ctx.beginPath();
        ctx.arc(lx, ly, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ring.color},${ring.opacity})`;
        ctx.lineWidth = ring.lw;

        // glow via shadow
        ctx.shadowColor = `rgba(${ring.color},${ring.opacity * 0.8})`;
        ctx.shadowBlur = ring.lw * 14;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // orbiting dot
        if (ring.dot) {
          angles[i] += ring.dot.speed;
          const dx = lx + Math.cos(angles[i]) * radius;
          const dy = ly + Math.sin(angles[i]) * radius;

          ctx.beginPath();
          ctx.arc(dx, dy, ring.dot.size, 0, Math.PI * 2);
          ctx.fillStyle = ring.dot.color;
          ctx.shadowColor = ring.dot.color;
          ctx.shadowBlur = 14;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // center glow dot
      const cg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 28);
      cg.addColorStop(0, "rgba(0,117,74,0.55)");
      cg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(lx, ly, 28, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();

      t += 0.025;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onMove);
    };
  }, []);

  /* ── Scroll-triggered fade-ups ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-root" style={{ userSelect: 'none' }}>
      <Header theme="found" shown={shown} about="true" />
      {/* ── HERO ── */}
      <section className="hero-band" style={{ height: "400px" }}>
        <canvas ref={canvasRef} className="hero-canvas" />
        <div className="hero-noise" />

        <div className="hero-tag fade-up">Lost &amp; Found · Campus Edition</div>

        <h1 className="hero-title fade-up">
          <span className="hero-title-lost">Lost</span>
          <span className="hero-title-amp">&amp;</span>
          <span className="hero-title-found">Found</span>
        </h1>

        <p className="hero-sub fade-up">
          Your institute's smarter way to reunite people with their belongings —
          no chaotic WhatsApp threads, no missed messages.
        </p>
        {(isLoggedIn) ? (
          <div
            onClick={() => { window.location.href = "/home"; }}
            className="flex scale-[1.2] items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md cursor-pointer hover:bg-white/20 hover:scale-[1.3] translate-y-[-42px] transition"
          >
            <div className="relative">
              <img
                src={user?.profile_pic || ppo}
                alt="profile"
                className="w-7 h-7 rounded-full object-cover"
              />
              <span className="status-dot" style={{ position: "absolute", bottom: 0, right: 0, width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "green", border: "2px solid white" }} />
            </div>

            {/* Slightly smaller text */}<div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-white">{(user?.name) ? "Welcome Back," : "Profile"}</span>
              <span className={`text-xs text-white/70 ${(user?.name) ? "" : " hidden"}`}>{(user?.name) ? user?.name : ""}</span>
              {/* Proper dropdown arrow */}

            </div>
            <ChevronRight size={16} className="opacity-80" color="white" />
          </div>
        ) : (
          /* LOGIN BUTTON */
          <button
            onClick={() => window.location.href = "/login"}
            className="flex items-center scale-[1.2] gap-2 px-5 py-2 rounded-full text-white -translate-y-[42px] bg-white/10 backdrop-blur-md transition hover:bg-white/20 hover:scale-[1.2] text-sm font-medium"
          >
            Login / Sign Up
          </button>
        )}
        <div className="hero-scroll-hint fade-up" onClick={scrollToNextSection}>
          <div className="arrowkl-container">
            <span><div className="arrowkl"></div></span>
          </div>
        </div>
      </section>

      {/* ── PROBLEM BAND ── */}
      <section className="problem-band">
        <div className="section-inner">
          <div className="eyebrow fade-up">The Problem</div>
          <h2 className="section-title fade-up">
            WhatsApp groups were never<br />built for this.
          </h2>
          <p className="section-body fade-up">
            Every institution has the same story: someone loses a water bottle,
            posts in the class group, gets buried under 200 unread messages, and
            the item sits unclaimed in a corner for weeks. The information is
            there — it's just invisible.
          </p>

          <div className="stat-row">
            {[
              { num: "∞", label: "Unread messages" },
              { num: "0", label: "Organised results" },
              { num: "?", label: "Items actually returned" },
            ].map((s, i) => (
              <div className="stat-card fade-up" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION BAND ── */}
      <section className="solution-band">
        <div className="solution-deco-circle" />
        <div className="section-inner">
          <div className="eyebrow eyebrow-light fade-up">The Solution</div>
          <h2 className="section-title section-title-light fade-up">
            Two boards. One truth.
          </h2>
          <p className="section-body section-body-light fade-up">
            LOST&amp;FOUND splits the noise into signal — a dedicated space
            filtered to your institute, where every post is a data point, not
            a distraction.
          </p>

          <div className="feature-grid">
            <div className="feature-card fade-up">
              <div className="feature-icon">
                <img src={foundIcon} alt="found" />
              </div>
              <h3 className="feature-heading">Found Board</h3>
              <p className="feature-text">
                Spotted something lying around? Post it here. Your find gets
                catalogued, tagged, and made searchable — so the owner can
                actually locate it.
              </p>
              <div className="feature-tag">Upload what you found</div>
            </div>

            <div className="feature-card fade-up" style={{ animationDelay: "0.12s" }}>
              <div className="feature-icon">
                <img src={lostIcon} alt="lost" />
              </div>
              <h3 className="feature-heading">Lost Board</h3>
              <p className="feature-text">
                Post what you've lost with a description and photo. The community
                can match it and the AI recommends likely candidates from the
                found listings — instantly.
              </p>
              <div className="feature-tag">AI-powered matching ✦</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI HIGHLIGHT ── */}
      <section className="ai-band">
        <div className="section-inner ai-inner">
          <div className="ai-left fade-up">
            <div className="eyebrow">Exclusive Feature</div>
            <h2 className="section-title">
              AI that actually<br />does the searching.
            </h2>
            <p className="section-body">
              When you post a lost item, our AI recommendation engine scans
              every found listing in your institute and surfaces the most likely
              matches ranked by relevance. No manual scrolling. No guesswork.
            </p>
            <ul className="ai-list">
              <li>Describes what it found and why it matches</li>
              <li>Ranks results by similarity score</li>
              <li>Updates as new items are posted</li>
            </ul>
          </div>
          <div className="ai-right fade-up">
            <div className="ai-mock">
              <div className="ai-mock-header">
                <span className="ai-mock-dot red" />
                <span className="ai-mock-dot yellow" />
                <span className="ai-mock-dot green" />
                <span className="ai-mock-title">AI Recommendations</span>
              </div>
              <div className="ai-mock-query">
                <span className="ai-mock-label">Your item:</span>
                <span className="ai-mock-value">"Blue water bottle, Decathlon"</span>
              </div>
              {[
                { pct: 94, item: "Blue Decathlon bottle — Library 2F", time: "2h ago" },
                { pct: 78, item: "Water bottle near Canteen", time: "5h ago" },
                { pct: 61, item: "Blue bottle — Main Gate", time: "1d ago" },
              ].map((r, i) => (
                <div className="ai-result" key={i}>
                  <div className="ai-result-bar-wrap">
                    <div className="ai-result-bar" style={{ width: `${r.pct}%` }} />
                  </div>
                  <div className="ai-result-info">
                    <span className="ai-result-item">{r.item}</span>
                    <span className="ai-result-meta">{r.pct}% match · {r.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-band">
        <div className="section-inner">
          <div className="eyebrow fade-up">How It Works</div>
          <h2 className="section-title fade-up">Three steps. That's it.</h2>

          <div className="steps-row">
            {[
              {
                step: "01",
                title: "Sign up with your institute",
                body: "Your feed is automatically filtered to only show items from within your campus. No noise from other institutions.",
              },
              {
                step: "02",
                title: "Post found or lost items",
                body: "Add a photo, a description, and where you saw it. Takes under 60 seconds.",
              },
              {
                step: "03",
                title: "Let AI do the matching",
                body: "Our recommendation engine does the heavy lifting. You get ranked results, not a scroll-of-shame.",
              },
            ].map((s, i) => (
              <div className="step-card fade-up" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="step-number">{s.step}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="cta-band">
        <div className="cta-noise" />
        <div className="section-inner cta-inner">
          <div className="cta-tag fade-up">Ready?</div>
          <h2 className="cta-title fade-up">
            Your lost item is<br />waiting to be found.
          </h2>
          <p className="cta-sub fade-up">
            Join your campus community on LOST&amp;FOUND and make misplaced things a
            problem of the past.
          </p>
          <button
            className="cta-btn fade-up"
            onClick={() => (navigate("/registration"), document.body.scrollTo({ top: 0 }))}
          >
            Let's Get Started
            <span className="cta-arrow">→</span>
          </button>
        </div>
      </section>

    </div>
  );
}

export default About;