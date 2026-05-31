import { Link } from 'react-router-dom';
import {
  GithubLogoIcon,
  CloudArrowUpIcon,
  BellIcon,
  SparkleIcon,
  ArrowsClockwiseIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@phosphor-icons/react';
import { BrandLogo } from '../components/logo';
import dashboardPreview from '../assets/home-dashboard-preview.png';

const repoUrl = 'https://github.com/zhikanyeye/domain-renewal-reminder';

const features = [
  {
    icon: CloudArrowUpIcon,
    title: '集中管理',
    description: '域名、到期时间、续费链接统一视图',
    tinted: true,
  },
  {
    icon: BellIcon,
    title: '自动提醒',
    description: '系统计算提醒节奏，降低人工成本',
    tinted: false,
  },
  {
    icon: SparkleIcon,
    title: 'AI 导入',
    description: '批量导入、文字识别、图片识别',
    tinted: false,
  },
  {
    icon: ArrowsClockwiseIcon,
    title: '状态同步',
    description: '续费流程全程可追踪，多人协作',
    tinted: true,
  },
];

const timelineItems = [
  { label: 'example.com', meta: '7 天后到期', tone: 'urgent' },
  { label: 'brand.cn', meta: '提醒已发送 2/3', tone: 'active' },
  { label: 'docs.dev', meta: '已续费并重置', tone: 'done' },
];

export function Home() {
  return (
    <div className="home-landing min-h-[100dvh] bg-[#f6fbfd] text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-zinc-900 dark:focus:bg-zinc-900 dark:focus:text-zinc-100"
      >
        跳到主要内容
      </a>

      <header className="sticky top-0 z-40 w-full border-b border-cyan-950/10 bg-white/82 [-webkit-backdrop-filter:blur(14px)_saturate(180%)] backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/78">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo compact title="爱自由域名管理" subtitle="Renewal operations" />

          <nav className="flex items-center gap-3 sm:gap-6" aria-label="主导航">
            <a
              href="#features"
              className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 sm:inline dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              主要功能
            </a>
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              aria-label="GitHub 仓库"
            >
              <GithubLogoIcon size={20} weight="fill" />
            </a>
            <Link
              to="/login"
              className="rounded-full border border-cyan-950/15 bg-white px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-700/30 hover:bg-cyan-50 active:translate-y-0 active:scale-[0.98] dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-cyan-300/30 dark:hover:bg-zinc-800"
            >
              登录
            </Link>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:px-8 lg:pb-24" aria-labelledby="hero-title">
          <div className="home-hero-copy">
            <p className="hero-eyebrow home-anim text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
              Domain Renewal Reminder
            </p>

            <h1
              id="hero-title"
              className="hero-title home-anim mt-5 max-w-[11ch] text-5xl font-semibold leading-[1.03] tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl dark:text-zinc-50"
            >
              别让域名悄悄过期
            </h1>

            <p className="hero-subtext home-anim mt-6 max-w-xl text-base leading-8 text-zinc-600 sm:text-lg dark:text-zinc-400">
              把域名、续费入口、提醒邮件和处理状态放进同一张工作台，到期前自动提醒，续费后自动进入下一个周期。
            </p>

            <div className="hero-cta home-anim mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyan-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(8,145,178,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-800 hover:shadow-[0_22px_44px_rgba(8,145,178,0.28)] active:translate-y-0 active:scale-[0.98]"
              >
                立即开始
                <ArrowRightIcon size={17} weight="bold" />
              </Link>
              <Link
                to="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-cyan-950/15 bg-white/90 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-700/30 hover:bg-cyan-50 active:translate-y-0 active:scale-[0.98] dark:border-white/15 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:border-cyan-300/30 dark:hover:bg-zinc-800"
              >
                进入控制台
              </Link>
            </div>

            <div className="home-anim mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-2xl border border-cyan-950/10 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">20</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">每页批量扫描</div>
              </div>
              <div className="rounded-2xl border border-cyan-950/10 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">08:00</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">每日提醒检查</div>
              </div>
              <div className="rounded-2xl border border-cyan-950/10 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">AI</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">图片文字导入</div>
              </div>
            </div>
          </div>

          <div className="home-hero-visual home-anim" aria-label="域名管理工作台预览">
            <div className="home-visual-shell">
              <div className="home-visual-toolbar">
                <span />
                <span />
                <span />
                <strong>Renewal desk</strong>
              </div>
              <img src={dashboardPreview} alt="域名管理仪表盘预览" className="home-visual-image" />
              <div className="home-visual-panel home-visual-panel--left">
                <div className="text-xs font-semibold text-cyan-800 dark:text-cyan-200">下一次提醒</div>
                <div className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">7 天</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">example.com</div>
              </div>
              <div className="home-visual-panel home-visual-panel--right">
                {timelineItems.map((item) => (
                  <div key={item.label} className="home-timeline-row">
                    <CheckCircleIcon
                      size={16}
                      weight={item.tone === 'done' ? 'fill' : 'duotone'}
                      className={item.tone === 'urgent' ? 'text-rose-500' : item.tone === 'done' ? 'text-emerald-500' : 'text-cyan-600'}
                    />
                    <div>
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{item.label}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{item.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
          aria-labelledby="features-title"
        >
          <div className="max-w-2xl">
            <h2
              id="features-title"
              className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50"
            >
              从导入到续费，状态一眼看清
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              批量录入、自动提醒、续费重置、暂停放弃都在同一套流程里完成。
            </p>
          </div>

          <div className="home-stagger mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              const surfaceClass = feature.tinted
                ? 'bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/30 dark:to-zinc-900'
                : 'bg-white/86 dark:bg-zinc-900/86';
              return (
                <article
                  key={feature.title}
                  className={`feature-card group rounded-2xl border border-cyan-950/10 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-700/25 hover:shadow-[0_18px_44px_rgba(8,47,73,0.08)] sm:p-6 dark:border-white/10 dark:hover:border-cyan-300/25 dark:hover:shadow-[0_18px_44px_rgba(0,0,0,0.42)] ${surfaceClass}`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 transition-transform duration-300 group-hover:scale-105 group-hover:bg-cyan-200 dark:bg-cyan-900/40 dark:group-hover:bg-cyan-800/50">
                    <Icon
                      size={22}
                      weight="duotone"
                      className="text-cyan-700 dark:text-cyan-300"
                    />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-zinc-950 dark:text-zinc-100">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="border-t border-cyan-950/10 bg-white/70 py-6 sm:py-8 dark:border-white/10 dark:bg-zinc-900/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <GithubLogoIcon size={16} weight="fill" />
              <span>MIT License</span>
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
