import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell, StatusBanner } from '../components/chrome';
import { useAuth } from '../contexts/useAuth';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowResendButton(false);
    setResendMessage('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || '登录失败');
        if (result.message?.includes('verify') || result.message?.includes('验证')) {
          setShowResendButton(true);
        }
      }
    } catch {
      setError('登录时发生错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage('');

    try {
      const { apiClient } = await import('../api/client');
      const result = await apiClient.resendVerification(email);

      if (result.success) {
        setResendMessage('验证邮件已重新发送，请检查收件箱。');
        setShowResendButton(false);
      } else {
        setResendMessage(result.error?.message || '发送失败，请稍后再试。');
      }
    } catch {
      setResendMessage('发送失败，请稍后再试。');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Control Center"
      title="登录你的提醒控制台"
      description="在一个清爽、快速、可视化的工作台里查看域名状态、提醒节奏和邮件配置。"
      sideTitle="更轻、更稳、更像一套控制面板"
      sideDescription="新的界面围绕高频操作重新组织，重点信息更聚焦，交互反馈更明确，移动端也保持顺滑。"
      highlights={[
        {
          title: '即时状态反馈',
          description: '登录、验证、重发邮件等流程都在当前页面完成，减少跳转打断。',
        },
        {
          title: '简约科技风视觉',
          description: '使用冷色金属质感、柔和网格背景和轻量动效，保持专业而不笨重。',
        },
        {
          title: '响应式优先',
          description: '表单、按钮和提示信息会在手机和桌面之间自然切换，不再显得拥挤。',
        },
      ]}
      footer={
        <>
          <div className="separator">
            <span>More Access</span>
          </div>
          <div className="button-row">
            <Link to="/register" className="secondary-button">
              创建新账户
            </Link>
            <Link to="/admin" className="ghost-button">
              管理员入口
            </Link>
          </div>
        </>
      }
    >
      {error ? (
        <StatusBanner tone="error" title="登录未完成">
          <div className="stack-note">
            <span>{error}</span>
            {showResendButton ? (
              <button
                type="button"
                className="inline-link"
                onClick={handleResendVerification}
                disabled={resendLoading}
              >
                {resendLoading ? '正在重新发送验证邮件...' : '重新发送验证邮件'}
              </button>
            ) : null}
          </div>
        </StatusBanner>
      ) : null}

      {resendMessage ? (
        <StatusBanner
          tone={resendMessage.includes('已') || resendMessage.includes('成功') ? 'success' : 'warning'}
          title="邮箱验证"
        >
          {resendMessage}
        </StatusBanner>
      ) : null}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="field-block">
          <label htmlFor="email" className="field-label">
            邮箱地址
          </label>
          <div className="field-shell">
            <svg className="field-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7l9 6 9-6m-18 0v10a2 2 0 002 2h14a2 2 0 002-2V7m-18 0a2 2 0 012-2h14a2 2 0 012 2" />
            </svg>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="field-control"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="field-block">
          <label htmlFor="password" className="field-label">
            密码
          </label>
          <div className="field-shell">
            <svg className="field-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 11V7a4 4 0 118 0v4m-9 0h10a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2z" />
            </svg>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="field-control"
              placeholder="输入你的账户密码"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="primary-button">
          {loading ? (
            <>
              <span className="animate-spin inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"></span>
              正在登录
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 16l-4-4m0 0l4-4m-4 4h10m-4 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
              </svg>
              进入控制台
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
