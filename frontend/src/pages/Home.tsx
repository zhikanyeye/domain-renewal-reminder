import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/logo';

const heroSignals = [
  '30 / 15 / 7 天分级提醒',
  '手动、CSV、AI 导入',
  '状态、责任人、日志同步',
];

const dashboardStats = [
  { value: '24', label: '待关注域名' },
  { value: '08', label: '提醒中' },
  { value: '03', label: '今日续费完成' },
];

const reminderQueue = [
  { domain: 'aiziyou.com', meta: '2026-05-03 到期', status: '提醒中' },
  { domain: 'studio-notes.cn', meta: '2026-05-18 到期', status: '待确认' },
  { domain: 'client-landing.io', meta: '2026-06-02 到期', status: '已续费' },
];

const capabilities = [
  {
    badge: 'Assets',
    title: '统一资产视图',
    description: '域名、到期日、注册商与备注统一归档。',
  },
  {
    badge: 'Automation',
    title: '自动提醒引擎',
    description: '按策略巡检并触发续费提醒。',
  },
  {
    badge: 'Collaboration',
    title: '协作状态同步',
    description: '状态、责任人与处理结果实时留痕。',
  },
];

const flowSteps = ['导入资产', '生成提醒', '更新状态', '续费接续'];

const systemTags = ['Cloudflare 原生部署', '多人协作留痕', '移动端优先'];

export function Home() {
  return (
    <div className="app-shell ink-wash-bg landing-shell landing-shell--executive">
      <a href="#home-main-content" className="skip-link">
        跳到主要内容
      </a>
      <div className="ink-pattern" />
      <div className="landing-orb landing-orb--one" />
      <div className="landing-orb landing-orb--two" />
      <div className="landing-orb landing-orb--three" />

      <header className="app-topbar landing-topbar landing-topbar--minimal">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BrandLogo title="爱自由域名管理" subtitle="Domain Renewal Reminder Service" />
          <nav className="landing-nav landing-nav--minimal" aria-label="Homepage actions">
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
            <Link to="/login" className="secondary-button landing-login-button">
              登录
            </Link>
            <Link to="/register" className="primary-button landing-entry-button">
              立即开始
            </Link>
          </nav>
        </div>
      </header>

      <main id="home-main-content" className="app-main landing-main">
        <section className="landing-hero animate-slideUp" aria-labelledby="hero-title">
          <div className="hero-stage liquid-panel">
            <div className="hero-stage__grid">
              <div className="hero-stage__copy">
                <div className="hero-stage__eyebrow">Domain Renewal Control</div>
                <h1 id="hero-title" className="hero-stage__title">
                  优雅管理每一个
                  <br />
                  域名续费周期
                </h1>
                <p className="hero-stage__description">一个控制台，统一资产、提醒与续费状态。</p>

                <div className="landing-actions hero-stage__actions">
                  <Link to="/register" className="primary-button">
                    创建控制台
                  </Link>
                  <Link to="/login" className="secondary-button">
                    进入系统
                  </Link>
                </div>
              </div>

              <aside className="hero-console" aria-label="Product preview">
                <div className="hero-console__top">
                  <div>
                    <div className="hero-console__eyebrow">Live board preview</div>
                    <h2>关键提醒，一屏掌握</h2>
                  </div>
                  <div className="liquid-status-pill">
                    <span className="liquid-status-pill__dot" aria-hidden="true" />
                    自动巡检运行中
                  </div>
                </div>

                <div className="hero-console__stats" aria-label="Preview metrics">
                  {dashboardStats.map((item) => (
                    <div key={item.label} className="hero-console__stat">
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="preview-board hero-console__board">
                  <div className="preview-board__header">
                    <strong>续费队列</strong>
                    <span>今日同步</span>
                  </div>
                  <ul className="preview-queue">
                    {reminderQueue.map((item) => (
                      <li key={item.domain} className="preview-queue__item">
                        <div className="preview-queue__main">
                          <strong>{item.domain}</strong>
                          <span>{item.meta}</span>
                        </div>
                        <div className="preview-queue__meta">
                          <span className="preview-status-tag">{item.status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>

            <div className="hero-signal-band" aria-label="Homepage highlights">
              {heroSignals.map((signal) => (
                <span key={signal} className="hero-signal-band__item">
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section
          id="capabilities"
          className="landing-section landing-section--compact animate-slideUp"
          aria-labelledby="capabilities-title"
        >
          <div className="landing-section__heading landing-section__heading--centered">
            <div className="liquid-chip">Core</div>
            <h2 id="capabilities-title">少量页面，覆盖完整续费流程</h2>
            <p>聚焦资产管理、自动提醒与协作同步。</p>
          </div>

          <div className="landing-feature-grid">
            {capabilities.map((item) => (
              <article key={item.title} className="liquid-card compact-card">
                <div className="liquid-card__badge">{item.badge}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>

          <div className="feature-rail liquid-panel liquid-panel--feature animate-fadeIn">
            <div className="feature-rail__header">
              <div className="liquid-chip">Flow</div>
              <h3>导入到续费接续，全链路自动衔接</h3>
            </div>
            <div className="ops-strip" aria-label="Process steps">
              {flowSteps.map((item) => (
                <span key={item} className="ops-pill">
                  {item}
                </span>
              ))}
            </div>
            <div className="feature-tags" aria-label="System tags">
              {systemTags.map((item) => (
                <span key={item} className="feature-tag">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section animate-slideUp" aria-labelledby="cta-title">
          <div className="liquid-panel liquid-panel--cta">
            <div>
              <div className="liquid-chip liquid-chip--soft">Ready</div>
              <h2 id="cta-title" className="landing-cta__title">
                把域名续费管理交给系统
              </h2>
              <p className="landing-cta__text">现在开始建立你的域名控制台。</p>
            </div>
            <div className="landing-actions landing-actions--compact">
              <Link to="/register" className="primary-button">
                立即注册
              </Link>
              <Link to="/login" className="secondary-button">
                立即登录
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
