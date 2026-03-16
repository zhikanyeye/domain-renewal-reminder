/**
 * Email Verification Page
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';

export function Verify() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('验证链接无效');
        return;
      }

      try {
        const result = await apiClient.verify(token);

        if (result.success) {
          setStatus('success');
          setMessage('邮箱验证成功!');
          // 3秒后跳转到登录页
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(result.error?.message || '验证失败');
        }
      } catch {
        setStatus('error');
        setMessage('验证时发生错误');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center ink-wash-bg px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative">
      <div className="ink-pattern"></div>
      
      <div className="w-full max-w-md relative z-10 animate-slideUp">
        <div className="glass-card rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-xl mb-4 sm:mb-6">
                  <svg className="animate-spin h-8 w-8 sm:h-10 sm:w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  正在验证...
                </h1>
                <p className="text-gray-600">请稍候</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl shadow-xl mb-4 sm:mb-6 animate-float">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">
                  验证成功!
                </h1>
                <p className="text-gray-600 mb-6">{message}</p>
                <p className="text-sm text-gray-500">3秒后自动跳转到登录页...</p>
                <button
                  onClick={() => navigate('/login')}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                  立即登录
                </button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl sm:rounded-2xl shadow-xl mb-4 sm:mb-6">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  验证失败
                </h1>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    返回登录
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    重新注册
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
