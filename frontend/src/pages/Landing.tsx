import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PIN_LOGIN_DELAY = 500; // ms to wait for session to be established

export default function Landing() {
  const { authenticated, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'google' | 'pin'>('google');
  const [pinInput, setPinInput] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

  const handleGoogleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const handlePinSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('🔐 [FRONTEND PIN] Submitting PIN login');

    if (!pinInput) {
      console.log('❌ [FRONTEND PIN] PIN is empty');
      setPinError('PIN is required');
      return;
    }
    if (!/^\d{4,6}$/.test(pinInput)) {
      console.log('❌ [FRONTEND PIN] PIN format invalid:', pinInput);
      setPinError('PIN must be 4-6 digits');
      return;
    }

    setPinLoading(true);
    setPinError('');

    try {
      console.log('🔐 [FRONTEND PIN] Sending to:', `${apiUrl}/api/auth/verify-pin-only`);
      const response = await fetch(`${apiUrl}/api/auth/verify-pin-only`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });

      console.log('🔐 [FRONTEND PIN] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [FRONTEND PIN] Login successful, verifying auth');
        console.log('✅ [FRONTEND PIN] User data:', data.employee);

        // Wait a moment for session to be established, then verify auth and navigate
        await new Promise(resolve => setTimeout(resolve, PIN_LOGIN_DELAY));
        console.log('🔐 [FRONTEND PIN] Verifying authentication...');
        await checkAuth();

        console.log('✅ [FRONTEND PIN] Auth verified, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.log('❌ [FRONTEND PIN] Response not OK');
        const data = await response.json();
        console.log('❌ [FRONTEND PIN] Error:', data.error);
        setPinError(data.error || 'Invalid PIN');
      }
    } catch (error) {
      console.error('❌ [FRONTEND PIN] Network error:', error);
      setPinError('Network error during PIN login');
    } finally {
      setPinLoading(false);
    }
    
  };

  const handleSubmit = loginMode === 'google' ? handleGoogleSubmit : handlePinSubmit;

  const menuItems = [
    { label: 'Overview', href: '#overview' },
    { label: 'Operations', href: '#operations' },
    { label: 'Workflow', href: '#workflow' },
    { label: 'Support', href: '#support' },
  ];

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;500&family=JetBrains+Mono:wght@300;400;500&display=swap');

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
            --text-dim: rgba(255,255,255,0.78);
            --text-dimmer: rgba(255,255,255,0.55);
            --line: rgba(255,255,255,0.18);
            --line-strong: rgba(255,255,255,0.32);
            --fill-ghost: rgba(255,255,255,0.06);
            --fill-solid: rgba(255,255,255,0.12);
            --gutter: clamp(20px, 4.5vw, 80px);
            --ease-premium: cubic-bezier(0.16, 1, 0.3, 1);
            --font-display: "Sora", "Helvetica Neue", Helvetica, Arial, sans-serif;
            --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
          }

          .hero {
            position: relative;
            width: 100%;
            height: 100vh;
            height: 100svh;
            min-height: 580px;
            overflow: hidden;
            display: grid;
            grid-template-rows: auto 1fr auto;
            isolation: isolate;
            background: var(--bg);
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
            background: linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.88) 100%),
                        linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.6) 100%);
          }

          @media (max-width: 720px) {
            .hero__media::before {
              background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.85) 100%);
            }
          }

          /* NAVBAR */
          .hero__header {
            position: relative;
            z-index: 60;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: clamp(16px, 2.2vh, 28px) var(--gutter);
            gap: 32px;
          }

          .hero__logo {
            font-family: var(--font-display);
            font-weight: 300;
            font-size: clamp(20px, 1.6vw, 26px);
            letter-spacing: 0.18em;
            color: var(--text);
            text-decoration: none;
            line-height: 1;
            white-space: nowrap;
          }

          .hero__nav {
            display: flex;
            align-items: center;
            gap: clamp(20px, 2.8vw, 48px);
            margin-left: auto;
          }

          .hero__nav-links {
            display: none;
            gap: clamp(18px, 2.2vw, 44px);
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
            font-size: clamp(11px, 0.75vw, 13px);
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: var(--text-dim);
            text-decoration: none;
            transition: color 0.25s ease;
          }

          .hero__nav-link:hover {
            color: var(--text);
          }

          .hero__cta-nav {
            display: none;
            padding: 10px 22px;
            border: 1px solid var(--line-strong);
            background: transparent;
            color: var(--text);
            font-family: var(--font-mono);
            font-weight: 400;
            font-size: clamp(11px, 0.75vw, 13px);
            letter-spacing: 0.2em;
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
            border-color: rgba(255,255,255,0.6);
          }

          .hero__hamburger {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 40px;
            height: 40px;
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
            transition: transform 0.4s var(--ease-premium), opacity 0.25s ease;
          }

          .hero__hamburger span:nth-child(1) { top: 14px; }
          .hero__hamburger span:nth-child(2) { top: 20px; }
          .hero__hamburger span:nth-child(3) { top: 26px; }

          .hero__hamburger.is-open span:nth-child(1) {
            transform: rotate(45deg) translateY(8.5px);
            top: 20px;
          }

          .hero__hamburger.is-open span:nth-child(2) {
            opacity: 0;
          }

          .hero__hamburger.is-open span:nth-child(3) {
            transform: rotate(-45deg) translateY(-8.5px);
            top: 20px;
          }

          /* MOBILE MENU */
          .mobile-menu {
            position: fixed;
            inset: 0;
            z-index: 50;
            background: rgba(4,4,6,0.95);
            backdrop-filter: blur(24px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 24px;
            clip-path: circle(3% at calc(100% - 42px) 42px);
            opacity: 0;
            pointer-events: none;
            transition: clip-path 0.6s var(--ease-premium), opacity 0.4s ease;
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
            font-size: 20px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--text);
            text-decoration: none;
            background: none;
            border: none;
            cursor: pointer;
          }

          .mobile-menu button {
            margin-top: 20px;
            padding: 14px 36px;
            border: 1px solid var(--line-strong);
            letter-spacing: 0.2em;
          }

          /* BODY */
          .hero__body {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding: 0 var(--gutter);
            min-height: 0;
            position: relative;
            z-index: 10;
          }

          @media (max-width: 720px) {
            .hero__body {
              justify-content: center;
            }
          }

          .panel {
            width: min(36vw, 560px);
            min-width: 320px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: clamp(12px, 1.4vh, 20px);
          }

          @media (max-width: 1000px) {
            .panel {
              width: min(65vw, 480px);
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
            font-size: clamp(10px, 0.7vw, 12px);
            letter-spacing: 0.22em;
            text-transform: uppercase;
            background: rgba(255,255,255,0.08);
            color: var(--text-dim);
            padding: 7px 14px;
            line-height: 1;
            display: inline-block;
          }

          /* H1 */
          .hero__h1 {
            font-family: var(--font-display);
            font-weight: 200;
            font-size: clamp(44px, 5vw, 88px);
            letter-spacing: 0.04em;
            line-height: 1;
            margin-top: 4px;
            color: var(--text);
          }

          /* TAGLINE */
          .tagline {
            font-family: var(--font-mono);
            font-weight: 300;
            font-size: clamp(11px, 0.85vw, 14px);
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--text-dim);
            line-height: 1.4;
          }

          /* FEATURES */
          .features {
            font-size: clamp(10px, 0.72vw, 12px);
            color: var(--text-dimmer);
            font-family: var(--font-mono);
            letter-spacing: 0.12em;
            text-transform: uppercase;
            padding-top: 14px;
            border-top: 1px solid var(--line);
            width: 100%;
            line-height: 1.8;
          }

          /* FORM */
          .form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 100%;
            margin-top: 8px;
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
            padding: 0 2px 10px 2px;
            font-family: var(--font-display);
            font-weight: 300;
            font-size: clamp(14px, 0.9vw, 16px);
            color: var(--text);
            line-height: 1;
            transition: border-color 0.25s ease;
          }

          .form__input::placeholder {
            color: var(--text-dimmer);
          }

          .form__input:focus {
            outline: none;
            border-bottom-color: rgba(255,255,255,0.9);
          }

          /* BUTTON */
          .btn {
            width: 100%;
            padding: clamp(14px, 1.4vh, 18px) 20px;
            border: none;
            border-radius: 0;
            font-family: var(--font-mono);
            font-weight: 400;
            font-size: clamp(11px, 0.75vw, 13px);
            letter-spacing: 0.22em;
            text-transform: uppercase;
            cursor: pointer;
            background: var(--fill-solid);
            color: var(--text);
            transition: background 0.25s ease;
          }

          .btn:hover {
            background: rgba(255,255,255,0.2);
          }

          /* FOOTER */
          .hero__footer {
            position: relative;
            z-index: 10;
            border-top: 1px solid var(--line);
            padding: clamp(12px, 1.6vh, 20px) var(--gutter);
            text-align: center;
            font-family: var(--font-mono);
            font-weight: 300;
            font-size: clamp(11px, 0.72vw, 13px);
            color: var(--text-dimmer);
            letter-spacing: 0.08em;
          }

          @media (max-height: 640px) {
            .hero__header { padding: 10px var(--gutter); }
            .hero__h1 { font-size: 36px; }
            .form { margin-top: 6px; gap: 8px; }
            .btn { padding: 10px 14px; }
            .hero__footer { padding: 8px var(--gutter); font-size: 10px; }
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
            RGSL
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
              onClick={() => (window.location.href = `${apiUrl}/api/auth/google`)}>
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
              window.location.href = `${apiUrl}/api/auth/google`;
            }}>
            SIGN IN
          </button>
        </div>

        {/* Body */}
        <div className="hero__body">
          <div className="panel">
            <div className="chip">[ INTERNAL SYSTEM ]</div>

            <h1 className="hero__h1">RGSL</h1>

            <p className="tagline">Enterprise operations & task intelligence.</p>

            <div className="features">
              ✓ Internal Network
              <br />✓ Automated Workflows
              <br />✓ AI Insights
            </div>

            <form className="form" onSubmit={handleSubmit} noValidate>
              {loginMode === 'google' ? (
                <>
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
                    ENTER
                  </button>
                </>
              ) : (
                <>
                  <label htmlFor="pin" className="form__label">
                    PIN (4-6 digits)
                  </label>
                  <input
                    id="pin"
                    type="password"
                    className="form__input"
                    placeholder="PIN"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    autoFocus
                  />
                  {pinError && (
                    <div style={{ color: 'rgba(239,68,68,0.9)', fontSize: '12px', marginTop: '8px' }}>
                      {pinError}
                    </div>
                  )}
                  <button type="submit" className="btn" disabled={pinLoading}>
                    {pinLoading ? 'VERIFYING...' : 'ENTER'}
                  </button>
                </>
              )}
            </form>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setLoginMode(loginMode === 'google' ? 'pin' : 'google');
                  setPinInput('');
                  setPinError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  transition: 'color 0.25s ease',
                  padding: '4px 0',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.78)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                {loginMode === 'google' ? 'Use PIN instead?' : 'Use Google instead?'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="hero__footer">
          RGSL Group — Internal Operations. Authorized Access Only.
        </footer>
      </section>
    </>
  );
}
