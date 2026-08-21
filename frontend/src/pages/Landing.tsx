import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { authenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (authenticated) {
      navigate('/dashboard');
    }
  }, [authenticated, navigate]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const menuItems = [
    { label: 'Capabilities', href: '#capabilities' },
    { label: 'Workflow', href: '#workflow' },
    { label: 'Teams', href: '#teams' },
    { label: 'Contact', href: '#contact' },
  ];

  const departments = [
    { name: 'Finance', emoji: '💰' },
    { name: 'Trading', emoji: '📈' },
    { name: 'Lending', emoji: '🏦' },
    { name: 'Compliance', emoji: '✅' },
  ];

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400&family=JetBrains+Mono:wght@300;400;500&display=swap');

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          html {
            scroll-behavior: smooth;
          }

          body {
            background: #000;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          :root {
            --bg: #000000;
            --text: #ffffff;
            --text-dim: rgba(255,255,255,0.62);
            --text-dimmer: rgba(255,255,255,0.42);
            --line: rgba(255,255,255,0.14);
            --line-strong: rgba(255,255,255,0.26);
            --fill-ghost: rgba(255,255,255,0.05);
            --fill-solid: rgba(255,255,255,0.10);
            --gutter: clamp(20px, 5vw, 100px);
            --ease-premium: cubic-bezier(0.16, 1, 0.3, 1);
            --font-display: "Sora", "Helvetica Neue", Helvetica, Arial, sans-serif;
            --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
          }

          .hero {
            position: relative;
            width: 100%;
            height: 100vh;
            height: 100svh;
            min-height: 640px;
            overflow: hidden;
            display: grid;
            grid-template-rows: auto 1fr auto;
            isolation: isolate;
            background: var(--bg);
          }

          @media (max-height: 640px) {
            .hero {
              min-height: 100svh;
            }
          }

          .hero__media {
            position: absolute;
            inset: 0;
            z-index: -1;
            background: var(--bg);
          }

          .hero__media video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
          }

          .hero__media::before {
            content: '';
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            background: linear-gradient(to right, transparent 0%, transparent 45%, rgba(0,0,0,0.45) 72%, rgba(0,0,0,0.72) 100%),
                        linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 22%, transparent 78%, rgba(0,0,0,0.65) 100%);
          }

          @media (max-width: 720px) {
            .hero__media::before {
              background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.75) 100%);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .hero__media video {
              display: none;
            }

            .hero__media {
              background-image: url('https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260806_132328_5f9029c8-218f-4489-82b6-29ff2849920e.png');
              background-size: cover;
              background-position: center;
            }

            .hero__media::before {
              display: none;
            }
          }

          /* NAVBAR */
          .hero__header {
            position: relative;
            z-index: 60;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: clamp(20px, 2.4vw, 34px) var(--gutter);
            gap: 32px;
            padding-top: max(clamp(20px, 2.4vw, 34px), env(safe-area-inset-top));
            padding-right: max(var(--gutter), env(safe-area-inset-right));
            padding-left: max(var(--gutter), env(safe-area-inset-left));
          }

          .hero__logo {
            font-family: var(--font-display);
            font-weight: 200;
            font-size: clamp(20px, 1.75vw, 30px);
            letter-spacing: 0.16em;
            color: var(--text);
            text-decoration: none;
            line-height: 1;
            white-space: nowrap;
          }

          .hero__nav {
            display: flex;
            align-items: center;
            gap: clamp(24px, 3.2vw, 62px);
            margin-left: auto;
          }

          .hero__nav-links {
            display: none;
            gap: clamp(20px, 2.8vw, 56px);
            align-items: center;
          }

          @media (min-width: 901px) {
            .hero__nav-links {
              display: flex;
            }
          }

          .hero__nav-link {
            font-family: var(--font-mono);
            font-weight: 400;
            font-size: clamp(11px, 0.78vw, 14px);
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: var(--text);
            text-decoration: none;
            transition: color 0.25s ease;
          }

          .hero__nav-link:hover {
            color: var(--text-dim);
          }

          .hero__nav-link:focus-visible {
            outline: 1px solid rgba(255,255,255,0.7);
            outline-offset: 3px;
          }

          .hero__cta-nav {
            display: none;
            padding: clamp(12px,1vw,17px) clamp(20px,1.8vw,32px);
            border: 1px solid var(--line-strong);
            background: transparent;
            color: var(--text);
            font-family: var(--font-mono);
            font-weight: 400;
            font-size: clamp(11px, 0.78vw, 14px);
            letter-spacing: 0.22em;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.25s ease, border-color 0.25s ease;
          }

          @media (min-width: 901px) {
            .hero__cta-nav {
              display: block;
            }
          }

          .hero__cta-nav:hover {
            background: var(--fill-ghost);
            border-color: rgba(255,255,255,0.5);
          }

          .hero__cta-nav:focus-visible {
            outline: 1px solid rgba(255,255,255,0.7);
            outline-offset: 3px;
          }

          .hero__hamburger {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 44px;
            height: 44px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            position: relative;
          }

          @media (min-width: 901px) {
            .hero__hamburger {
              display: none;
            }
          }

          .hero__hamburger span {
            position: absolute;
            width: 22px;
            height: 1px;
            background: var(--text);
            transition: transform 0.45s var(--ease-premium), opacity 0.25s ease;
          }

          .hero__hamburger span:nth-child(1) {
            top: 16px;
          }

          .hero__hamburger span:nth-child(2) {
            top: 22px;
          }

          .hero__hamburger span:nth-child(3) {
            top: 28px;
          }

          .hero__hamburger.is-open span:nth-child(1) {
            transform: rotate(45deg) translateY(8px);
            top: 22px;
          }

          .hero__hamburger.is-open span:nth-child(2) {
            opacity: 0;
            transform: scaleX(0);
          }

          .hero__hamburger.is-open span:nth-child(3) {
            transform: rotate(-45deg) translateY(-8px);
            top: 22px;
          }

          .hero__hamburger:focus-visible {
            outline: 1px solid rgba(255,255,255,0.7);
            outline-offset: 3px;
          }

          /* MOBILE MENU */
          .mobile-menu {
            position: fixed;
            inset: 0;
            z-index: 50;
            background: rgba(4,4,6,0.94);
            backdrop-filter: blur(28px) saturate(140%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: clamp(16px, 4vw, 32px);
            clip-path: circle(3% at calc(100% - 42px) 42px);
            opacity: 0;
            pointer-events: none;
            transition: clip-path 0.7s var(--ease-premium), opacity 0.45s ease;
          }

          .mobile-menu.is-open {
            clip-path: circle(150% at calc(100% - 42px) 42px);
            opacity: 1;
            pointer-events: auto;
          }

          .mobile-menu a,
          .mobile-menu button {
            font-family: var(--font-mono);
            font-weight: 400;
            font-size: clamp(20px, 5.5vw, 28px);
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--text);
            text-decoration: none;
            background: none;
            border: none;
            cursor: pointer;
            opacity: 0;
            transform: translateY(16px);
            transition: opacity 0.4s ease, transform 0.5s var(--ease-premium);
          }

          .mobile-menu.is-open a,
          .mobile-menu.is-open button {
            opacity: 1;
            transform: translateY(0);
          }

          .mobile-menu a:nth-child(1) { transition-delay: 180ms; }
          .mobile-menu a:nth-child(2) { transition-delay: 250ms; }
          .mobile-menu a:nth-child(3) { transition-delay: 320ms; }
          .mobile-menu a:nth-child(4) { transition-delay: 390ms; }
          .mobile-menu button { transition-delay: 460ms; }

          .mobile-menu a:hover,
          .mobile-menu button:hover {
            color: var(--text-dim);
          }

          .mobile-menu a:focus-visible,
          .mobile-menu button:focus-visible {
            outline: 1px solid rgba(255,255,255,0.7);
            outline-offset: 3px;
          }

          .mobile-menu button {
            margin-top: clamp(16px, 3vw, 32px);
            padding: 16px 40px;
            border: 1px solid var(--line-strong);
            letter-spacing: 0.22em;
          }

          .mobile-menu button:hover {
            background: var(--fill-ghost);
            border-color: rgba(255,255,255,0.5);
          }

          /* BODY */
          .hero__body {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding: 0 var(--gutter);
            padding-right: max(var(--gutter), env(safe-area-inset-right));
            min-height: 0;
            overflow-y: auto;
            position: relative;
            z-index: 10;
          }

          @media (max-width: 720px) {
            .hero__body {
              justify-content: center;
              padding-left: max(var(--gutter), env(safe-area-inset-left));
            }
          }

          .panel {
            width: min(34vw, 620px);
            min-width: 380px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: clamp(14px, 1.3vw, 22px);
          }

          @media (max-width: 1100px) {
            .panel {
              width: min(70vw, 520px);
              min-width: 0;
            }
          }

          @media (max-width: 720px) {
            .panel {
              width: 100%;
              align-items: stretch;
            }
          }

          /* CHIP */
          .chip {
            font-family: var(--font-mono);
            font-weight: 400;
            font-size: clamp(11px, 0.72vw, 14px);
            letter-spacing: 0.2em;
            text-transform: uppercase;
            background: rgba(255,255,255,0.09);
            color: var(--text);
            padding: clamp(9px,0.8vw,14px) clamp(14px,1.1vw,20px);
            line-height: 1;
            display: inline-block;
          }

          @media (max-width: 720px) {
            .chip {
              align-self: flex-start;
            }
          }

          /* H1 */
          .hero__h1 {
            font-family: var(--font-display);
            font-weight: 200;
            font-size: clamp(54px, 6.2vw, 118px);
            letter-spacing: 0.03em;
            line-height: 0.95;
            margin-top: clamp(28px, 3vw, 52px);
            color: var(--text);
          }

          @media (max-width: 380px) {
            .hero__h1 {
              font-size: clamp(44px, 15vw, 64px);
            }
          }

          /* TAGLINE */
          .tagline {
            font-family: var(--font-mono);
            font-weight: 300;
            font-size: clamp(11px, 0.94vw, 17px);
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--text-dim);
            margin-top: clamp(14px, 1.4vw, 24px);
            line-height: 1.4;
          }

          /* DEPARTMENTS */
          .departments {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: clamp(12px, 2vw, 20px);
            width: 100%;
            margin-top: clamp(24px, 2.4vw, 40px);
          }

          .dept-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            text-align: center;
          }

          .dept-emoji {
            font-size: clamp(28px, 4vw, 40px);
          }

          .dept-name {
            font-family: var(--font-mono);
            font-weight: 300;
            font-size: clamp(10px, 0.7vw, 12px);
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--text-dim);
          }

          /* FORM */
          .form {
            display: flex;
            flex-direction: column;
            gap: clamp(14px, 1.3vw, 22px);
            width: 100%;
            margin-top: clamp(38px, 4.6vw, 62px);
          }

          .form__label {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0,0,0,0);
            white-space: nowrap;
            border-width: 0;
          }

          .form__input {
            width: 100%;
            background: transparent;
            border: none;
            border-bottom: 1px solid var(--line-strong);
            padding: 0 2px clamp(12px,1.1vw,18px) 2px;
            font-family: var(--font-display);
            font-weight: 300;
            font-size: clamp(16px, 0.95vw, 18px);
            color: var(--text);
            line-height: 1;
            transition: border-color 0.25s ease;
          }

          .form__input::placeholder {
            color: var(--text-dim);
          }

          .form__input:focus {
            outline: none;
            border-bottom-color: rgba(255,255,255,0.85);
          }

          .form__input:focus::placeholder {
            color: var(--text-dimmer);
          }

          /* BUTTON */
          .btn {
            width: 100%;
            padding: clamp(17px,1.6vw,27px) 20px;
            border: none;
            border-radius: 0;
            font-family: var(--font-mono);
            font-weight: 400;
            font-size: clamp(11px, 0.78vw, 14px);
            letter-spacing: 0.22em;
            text-transform: uppercase;
            cursor: pointer;
            background: var(--fill-solid);
            color: var(--text);
            transition: background 0.25s ease;
          }

          .btn:hover {
            background: rgba(255,255,255,0.17);
          }

          .btn:focus-visible {
            outline: 1px solid rgba(255,255,255,0.7);
            outline-offset: 3px;
          }

          /* FOOTER */
          .hero__footer {
            position: relative;
            z-index: 10;
            border-top: 1px solid var(--line);
            padding: clamp(18px, 1.7vw, 30px) var(--gutter);
            padding-bottom: max(clamp(18px, 1.7vw, 30px), env(safe-area-inset-bottom));
            padding-right: max(var(--gutter), env(safe-area-inset-right));
            padding-left: max(var(--gutter), env(safe-area-inset-left));
            text-align: center;
            font-family: var(--font-display);
            font-weight: 300;
            font-size: clamp(12px, 0.82vw, 16px);
            color: var(--text-dim);
            line-height: 1.5;
          }

          .hero__footer a {
            color: var(--text);
            text-decoration: underline;
            text-decoration-offset: 3px;
            text-decoration-thickness: 1px;
            transition: color 0.25s ease;
          }

          .hero__footer a:hover {
            color: var(--text-dim);
          }

          .hero__footer a:focus-visible {
            outline: 1px solid rgba(255,255,255,0.7);
            outline-offset: 3px;
          }

          /* SHORT HEIGHT */
          @media (max-height: 640px) {
            .hero__header {
              padding: 12px var(--gutter);
            }

            .hero__h1 {
              font-size: clamp(36px, 7vw, 64px);
              margin-top: 16px;
            }

            .departments {
              margin-top: 12px;
            }

            .form {
              margin-top: clamp(24px, 3vw, 40px);
              gap: 10px;
            }

            .btn {
              padding: 14px 16px;
              font-size: 11px;
            }

            .hero__footer {
              padding: 12px var(--gutter);
              font-size: 11px;
            }

            .chip {
              padding: 6px 10px;
              font-size: 10px;
            }

            .tagline {
              margin-top: 8px;
              font-size: 10px;
            }
          }

          body.menu-open {
            overflow: hidden;
          }
        `}
      </style>

      <section className="hero">
        {/* Media Layer */}
        <div className="hero__media">
          <link rel="preconnect" href="https://d8j0ntlcm91z4.cloudfront.net" />
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260806_132328_5f9029c8-218f-4489-82b6-29ff2849920e.png">
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260806_133255_956f653f-5d80-4b06-abd5-0f46c98b60fa.mp4"
              type="video/mp4"
            />
          </video>
        </div>

        {/* Navbar */}
        <header className="hero__header">
          <a href="#" className="hero__logo">
            ECHO
          </a>
          <nav className="hero__nav">
            <div className="hero__nav-links">
              {menuItems.map((item) => (
                <a key={item.href} href={item.href} className="hero__nav-link">
                  {item.label}
                </a>
              ))}
            </div>
            <button
              className="hero__cta-nav"
              onClick={() => (window.location.href = 'http://localhost:5000/api/auth/google')}>
              SIGN IN
            </button>
            <button
              className={`hero__hamburger ${menuOpen ? 'is-open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls="mobileMenu"
              aria-label="Open menu"
              type="button">
              <span />
              <span />
              <span />
            </button>
          </nav>
        </header>

        {/* Mobile Menu */}
        <div
          id="mobileMenu"
          className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          aria-hidden={!menuOpen}>
          {menuItems.map((item) => (
            <a key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              closeMenu();
              window.location.href = 'http://localhost:5000/api/auth/google';
            }}>
            SIGN IN
          </button>
        </div>

        {/* Body */}
        <div className="hero__body">
          <div className="panel">
            <div className="chip">[ TASK INTELLIGENCE ]</div>

            <h1 className="hero__h1">Echo</h1>

            <p className="tagline">AI-powered task orchestration for modern teams.</p>

            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(13px, 0.9vw, 16px)',
              color: 'var(--text-dim)',
              lineHeight: '1.6',
              marginTop: 'clamp(12px, 1.2vw, 18px)',
              maxWidth: '90%'
            }}>
              Unified workspace for Finance, Trading, Lending, and Compliance. Real-time collaboration powered by AI insights.
            </p>

            {/* Departments */}
            <div className="departments">
              {departments.map((dept) => (
                <div key={dept.name} className="dept-item">
                  <div className="dept-emoji">{dept.emoji}</div>
                  <div className="dept-name">{dept.name}</div>
                </div>
              ))}
            </div>

            <div style={{
              fontSize: 'clamp(11px, 0.75vw, 13px)',
              color: 'var(--text-dimmer)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: 'clamp(24px, 2.4vw, 32px)',
              paddingTop: 'clamp(24px, 2.4vw, 32px)',
              borderTop: '1px solid var(--line)',
              width: '100%'
            }}>
              ✓ Real-time collaboration
              <br />✓ AI-powered insights
              <br />✓ Cross-department visibility
            </div>

            <form className="form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="email" className="form__label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form__input"
                placeholder="Email"
                required
              />
              <button type="submit" className="btn">
                Begin
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer className="hero__footer">
          Echo — Task Intelligence Platform. <a href="#privacy-notice">Privacy</a> and{' '}
          <a href="#service-contract">Terms</a>.
        </footer>
      </section>
    </>
  );
}
