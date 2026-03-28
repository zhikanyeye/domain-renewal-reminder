import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/logo';

const previewRows = [
  '到期时间',
  '提醒状态',
  '处理记录',
  '续费周期',
];

export function Home() {
  return (
    <div className="app-shell ink-wash-bg landing-shell">
      <div className="ink-pattern" />
      <div className="landing-orb landing-orb--one" />
      <div className="landing-orb landing-orb--two" />
      <div className="landing-orb landing-orb--three" />

      <header className="app-topbar landing-topbar">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <BrandLogo title="爱自由域名管理" subtitle="Domain Renewal Reminder Service" />
          <nav className="landing-nav" aria-label="Homepage actions">
            <a
              href="https://github.com/zhikanyeye/domain-renewal-reminder"
              target="_blank"
              rel="noreferrer"
              className="landing-icon-link"
              aria-label="GitHub repository"
              title="GitHub repository"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.59 2 12.25c0 4.528 2.865 8.37 6.839 9.727.5.096.682-.223.682-.495 0-.244-.009-.89-.014-1.747-2.782.62-3.369-1.39-3.369-1.39-.455-1.192-1.11-1.51-1.11-1.51-.908-.638.069-.625.069-.625 1.004.073 1.532 1.058 1.532 1.058.892 1.566 2.341 1.114 2.91.852.091-.667.349-1.115.635-1.371-2.22-.26-4.555-1.14-4.555-5.074 0-1.121.39-2.038 1.03-2.757-.104-.261-.447-1.312.097-2.735 0 0 .84-.276 2.75 1.053A9.303 9.303 0 0 1 12 6.838c.85.004 1.706.118 2.504.347 1.909-1.329 2.748-1.053 2.748-1.053.545 1.423.202 2.474.099 2.735.64.719 1.028 1.636 1.028 2.757 0 3.944-2.339 4.811-4.566 5.066.359.319.679.948.679 1.912 0 1.381-.012 2.494-.012 2.833 0 .274.18.596.688.494C19.138 20.616 22 16.776 22 12.25 22 6.59 17.523 2 12 2Z" />
              </svg>
            </a>
            <Link to="/login" className="secondary-button">
              登录
            </Link>
            <Link to="/register" className="primary-button">
              开始使用
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-main landing-main">
        <section className="landing-hero">
          <div className="liquid-panel liquid-panel--hero animate-slideUp">
            <div className="liquid-chip">Domain Renewal Console</div>

            <div className="landing-copy">
              <p className="landing-kicker">域名续费提醒与状态管理</p>
              <h1 className="landing-title">
                让域名续费，
                <span className="text-gradient"> 始终在掌控中。</span>
              </h1>
              <p className="landing-description">
                集中查看到期时间、提醒进度和处理状态。界面简洁，信息直接，适合长期使用。
              </p>
            </div>

            <div className="landing-actions">
              <Link to="/register" className="primary-button">
                免费注册
              </Link>
              <Link to="/login" className="secondary-button">
                进入控制台
              </Link>
            </div>
          </div>

          <div className="liquid-panel liquid-panel--aside animate-slideUp">
            <div className="liquid-preview">
              <div className="liquid-preview__header">
                <div>
                  <div className="liquid-preview__eyebrow">Overview</div>
                  <h2>把需要处理的域名放在眼前</h2>
                </div>
                <div className="liquid-status-pill">
                  <span className="liquid-status-pill__dot" />
                  Clean
                </div>
              </div>

              <div className="liquid-stack">
                {previewRows.map((item) => (
                  <div key={item} className="liquid-stack-card">
                    <div className="liquid-stack-card__title">{item}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <article className="liquid-panel liquid-panel--feature">
            <div className="liquid-chip liquid-chip--soft">Product highlights</div>
            <h2 className="landing-feature__title">一个面板，处理域名到期、提醒和续费状态。</h2>
            <p className="landing-feature__text">
              到期时间、提醒进度、处理记录和续费周期集中呈现。信息足够直接，流程足够清楚，
              适合个人长期使用，也适合小团队协作管理。
            </p>
          </article>
        </section>

        <section className="landing-section">
          <div className="liquid-panel liquid-panel--cta">
            <div>
              <div className="liquid-chip liquid-chip--soft">Ready</div>
              <h2 className="landing-cta__title">轻量管理，从容续费。</h2>
              <p className="landing-cta__text">适合个人，也适合小团队长期使用。</p>
            </div>

            <div className="landing-actions landing-actions--compact">
              <Link to="/register" className="primary-button">
                立即开始
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
