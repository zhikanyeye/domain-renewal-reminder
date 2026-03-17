import type { ReactNode } from 'react';

type Highlight = {
  title: string;
  description: string;
};

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  sideTitle: string;
  sideDescription: string;
  highlights: Highlight[];
  footer?: ReactNode;
};

type StatusBannerProps = {
  tone: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
};

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark${compact ? ' compact' : ''}`}>
      <div className="brand-mark__icon" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className="brand-mark__copy">
        <strong>域名到期提醒</strong>
        <span>Renewal Control Center</span>
      </div>
    </div>
  );
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  sideTitle,
  sideDescription,
  highlights,
  footer,
}: AuthShellProps) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <section className="auth-panel__main">
          <BrandMark />
          <div className="auth-copy">
            <span className="auth-eyebrow">{eyebrow}</span>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-description">{description}</p>
          </div>
          <div className="auth-body">{children}</div>
          {footer ? <div className="auth-footer">{footer}</div> : null}
        </section>

        <aside className="auth-panel__side">
          <div className="auth-panel__orb auth-panel__orb--one"></div>
          <div className="auth-panel__orb auth-panel__orb--two"></div>
          <div className="auth-side__content">
            <span className="auth-side__eyebrow">SYSTEM FLOW</span>
            <h2>{sideTitle}</h2>
            <p>{sideDescription}</p>
            <ul className="auth-highlights">
              {highlights.map((item) => (
                <li key={item.title} className="auth-highlights__item">
                  <div className="auth-highlights__marker"></div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function StatusBanner({ tone, title, children }: StatusBannerProps) {
  return (
    <div className="status-banner" data-tone={tone}>
      <div className="status-banner__dot" aria-hidden="true"></div>
      <div className="status-banner__content">
        {title ? <strong>{title}</strong> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
