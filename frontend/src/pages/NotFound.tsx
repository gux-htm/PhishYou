import { ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../design/ThemeProvider';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="py-landing" style={{ minHeight: '100vh' }}>
      <header className="py-landing-nav">
        <Link to="/" className="py-brand">
          <span className="py-brand-mark">P</span>
          <span>PhishYou</span>
        </Link>
        <nav>
          <Link to="/login">Sign in</Link>
          <button onClick={toggleTheme}>{theme === 'dark' ? 'LIGHT' : 'DARK'}</button>
        </nav>
      </header>

      <main
        className="py-landing-main"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 82px - 60px)',
        }}
      >
        <div className="w-full max-w-xl text-center">
          <div
            className="py-surface"
            style={{ padding: 'clamp(32px, 5vw, 56px)', borderRadius: '24px' }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 24px',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid var(--line)',
                background: 'var(--accent-soft)',
                borderRadius: 16,
                color: 'var(--accent)',
              }}
            >
              <Compass size={26} />
            </div>

            <p className="py-eyebrow" style={{ marginBottom: 16 }}>
              Route unavailable — 404
            </p>

            <h1 className="py-title" style={{ fontSize: 'clamp(36px, 6vw, 64px)' }}>
              Lost signal.
            </h1>

            <p className="py-lede" style={{ margin: '16px auto 0', maxWidth: 440 }}>
              <code
                style={{
                  fontFamily: 'DM Mono, monospace',
                  color: 'var(--soft)',
                  background: 'var(--bg-2)',
                  padding: '2px 6px',
                  fontSize: 13,
                }}
              >
                {location.pathname}
              </code>{' '}
              isn&apos;t an available PhishYou route. It may have moved, expired, or
              require a valid workspace path.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 12,
                marginTop: 32,
              }}
            >
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid var(--line)',
                  background: 'transparent',
                  color: 'var(--soft)',
                  padding: '12px 16px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={15} />
                Go back
              </button>
              <Link to="/dashboard" className="py-primary">
                Open Command Center <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <p
            style={{
              marginTop: 24,
              fontSize: 10,
              fontFamily: 'DM Mono, monospace',
              letterSpacing: '.12em',
              color: 'var(--muted)',
            }}
          >
            Authorized security simulation platform{' '}
            <span style={{ color: 'var(--accent)', margin: '0 8px' }}>—</span> Enterprise
            access only
          </p>
        </div>
      </main>
    </div>
  );
}
