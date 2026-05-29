import { Link } from 'react-router-dom';
import {
  GithubLogoIcon,
  CloudArrowUpIcon,
  BellIcon,
  SparkleIcon,
  ArrowsClockwiseIcon,
} from '@phosphor-icons/react';
import { BrandLogo } from '../components/logo';

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

export function Home() {
  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-zinc-900 dark:focus:bg-zinc-900 dark:focus:text-zinc-100"
      >
        跳到主要内容
      </a>

      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 [-webkit-backdrop-filter:blur(8px)_saturate(180%)] backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <BrandLogo iconOnly title="爱自由域名管理" />

          <nav className="flex items-center gap-4 sm:gap-8" aria-label="主导航">
            <a
              href="#features"
              className="hidden text-sm text-zinc-600 transition-colors hover:text-zinc-900 sm:inline dark:text-zinc-400 dark:hover:text-zinc-100"
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
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 transition-all hover:border-zinc-400 hover:bg-zinc-50 active:scale-[0.98] sm:px-4 sm:py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              登录
            </Link>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="mx-auto max-w-4xl px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-24" aria-labelledby="hero-title">
          <p className="hero-eyebrow home-anim text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Domain Renewal Reminder
          </p>

          <h1
            id="hero-title"
            className="hero-title home-anim mt-4 text-4xl font-semibold leading-tight tracking-tight text-zinc-900 sm:mt-6 sm:text-5xl dark:text-zinc-50"
          >
            别让域名
            <br />
            悄悄过期
          </h1>

          <p className="hero-subtext home-anim mt-4 max-w-xl text-base leading-relaxed text-zinc-600 sm:mt-6 sm:text-lg dark:text-zinc-400">
            到期前自动提醒，再多域名也不漏
          </p>

          <div className="hero-cta home-anim mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg bg-sky-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-800 hover:shadow-md active:translate-y-0 active:scale-[0.98]"
            >
              立即开始
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-zinc-50 active:translate-y-0 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              进入控制台
            </Link>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24"
          aria-labelledby="features-title"
        >
          <h2
            id="features-title"
            className="text-center text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50"
          >
            主要功能
          </h2>

          <div className="home-stagger mt-8 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              const surfaceClass = feature.tinted
                ? 'bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/30 dark:to-zinc-900'
                : 'bg-white dark:bg-zinc-900';
              return (
                <article
                  key={feature.title}
                  className={`feature-card group rounded-xl border border-zinc-200 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] sm:p-6 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] ${surfaceClass}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 transition-transform duration-300 group-hover:scale-110 group-hover:bg-sky-200 dark:bg-sky-900/40 dark:group-hover:bg-sky-800/50">
                    <Icon
                      size={20}
                      weight="duotone"
                      className="text-sky-700 dark:text-sky-300"
                    />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
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

        <footer className="border-t border-zinc-200 bg-white py-6 sm:py-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6">
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
