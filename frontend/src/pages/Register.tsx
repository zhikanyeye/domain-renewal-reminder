import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell, StatusBanner } from '../components/chrome';
import { useAuth } from '../contexts/useAuth';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }

    if (password.length < 8) {
      setError('密码长度至少需要 8 位。');
      return;
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('密码必须包含大小写字母和数字。');
      return;
    }

    setLoading(true);

    try {
      const result = await register(email, password);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.message || '注册失败');
      }
    } catch {
      setError('注册时发生错误，请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="账号注册"
      title="创建账户"
      description="注册后即可使用域名续费提醒、邮件验证和后台管理功能。"
      footer={
        <>
          <div className="separator">
            <span>已有账户</span>
          </div>
          <div className="button-row">
            <Link to="/login" className="secondary-button">
              返回登录
            </Link>
          </div>
        </>
      }
    >
      {error ? (
        <StatusBanner tone="error" title="注册未完成">
          {error}
        </StatusBanner>
      ) : null}

      {success ? (
        <StatusBanner tone="success" title="注册成功">
          验证邮件已经发出，系统会在几秒后带你回到登录页。
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
          <div className="field-hint">支持主流邮箱服务商，如 Gmail、Outlook、QQ 和 163。</div>
        </div>

        <div className="field-block">
          <label htmlFor="password" className="field-label">
            设置密码
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
              placeholder="至少 8 位，包含大小写字母和数字"
            />
          </div>
        </div>

        <div className="field-block">
          <label htmlFor="confirmPassword" className="field-label">
            确认密码
          </label>
          <div className="field-shell">
            <svg className="field-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="field-control"
              placeholder="再次输入密码"
            />
          </div>
          <div className="field-hint">推荐使用密码管理器生成和保存随机密码。</div>
        </div>

        <button type="submit" disabled={loading || success} className="primary-button">
          {loading ? (
            <>
              <span className="animate-spin inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"></span>
              正在创建账户
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v6m3-3h-6M11 4a4 4 0 100 8 4 4 0 000-8zM5 20a6 6 0 0112 0" />
              </svg>
              创建账户
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
