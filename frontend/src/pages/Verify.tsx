import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell, StatusBanner } from '../components/chrome';
import { apiClient } from '../api/client';

export function Verify() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在校验你的验证链接...');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('缺少验证令牌，请重新打开邮件中的完整链接。');
        return;
      }

      try {
        const result = await apiClient.verify(token);

        if (result.success) {
          setStatus('success');
          setMessage('邮箱验证成功，正在准备跳转回登录页。');
          setTimeout(() => {
            navigate('/login');
          }, 2800);
        } else {
          setStatus('error');
          setMessage(result.error?.message || '验证失败，请重新尝试。');
        }
      } catch {
        setStatus('error');
        setMessage('验证过程中发生错误，请稍后再试。');
      }
    };

    void verifyEmail();
  }, [navigate, searchParams]);

  return (
    <AuthShell
      eyebrow="邮箱验证"
      title="邮箱验证"
      description="系统正在确认该验证链接是否有效。验证完成后将返回登录页。"
      footer={
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => navigate('/login')}>
            返回登录
          </button>
          <button type="button" className="ghost-button" onClick={() => navigate('/register')}>
            重新注册
          </button>
        </div>
      }
    >
      {status === 'loading' ? (
        <StatusBanner tone="info" title="验证进行中">
          <div className="button-row" style={{ alignItems: 'center' }}>
            <span className="animate-spin inline-block h-4 w-4 rounded-full border-2 border-sky-500 border-t-transparent"></span>
            <span>{message}</span>
          </div>
        </StatusBanner>
      ) : null}

      {status === 'success' ? (
        <StatusBanner tone="success" title="验证成功">
          {message}
        </StatusBanner>
      ) : null}

      {status === 'error' ? (
        <StatusBanner tone="error" title="验证失败">
          {message}
        </StatusBanner>
      ) : null}
    </AuthShell>
  );
}
