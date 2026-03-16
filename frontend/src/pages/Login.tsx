/**
 * Login Page
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
        
        // Check if error is due to unverified email
        if (result.message?.includes('verify') || result.message?.includes('验证')) {
          setShowResendButton(true);
        }
      }
    } catch {
      setError('登录时发生错误');
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
        setResendMessage('验证邮件已发送,请检查您的邮箱');
        setShowResendButton(false);
      } else {
        setResendMessage(result.error?.message || '发送失败,请稍后重试');
      }
    } catch {
      setResendMessage('发送失败,请稍后重试');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center ink-wash-bg px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative">
      {/* Ink wash pattern overlay */}
      <div className="ink-pattern"></div>
      
      <div className="w-full max-w-md relative z-10 animate-slideUp">
        <div className="glass-card rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10">
          {/* Logo and Title */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-xl mb-4 sm:mb-6 animate-float">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-2 sm:mb-3 tracking-tight">
              爱自由域名管理
            </h1>
            <p className="text-gray-600 text-sm sm:text-base font-medium">登录您的账号，管理域名续期</p>
          </div>

          {error && (
            <div className="mb-6 p-3 sm:p-4 bg-red-50/80 border-l-4 border-red-500 rounded-xl animate-slideDown backdrop-blur-sm">
              <div className="flex items-start gap-2 sm:gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <span className="text-red-700 text-sm font-medium">{error}</span>
                  {showResendButton && (
                    <button
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-semibold underline disabled:opacity-50"
                    >
                      {resendLoading ? '发送中...' : '重新发送验证邮件'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {resendMessage && (
            <div className={`mb-6 p-3 sm:p-4 border-l-4 rounded-xl animate-slideDown backdrop-blur-sm ${
              resendMessage.includes('成功') || resendMessage.includes('已发送')
                ? 'bg-green-50/80 border-green-500'
                : 'bg-yellow-50/80 border-yellow-500'
            }`}>
              <div className="flex items-start gap-2 sm:gap-3">
                <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  resendMessage.includes('成功') || resendMessage.includes('已发送')
                    ? 'text-green-500'
                    : 'text-yellow-500'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`text-sm font-medium ${
                  resendMessage.includes('成功') || resendMessage.includes('已发送')
                    ? 'text-green-700'
                    : 'text-yellow-700'
                }`}>{resendMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-2.5">
                邮箱地址
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none transition-colors">
                  <svg className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 transition-all bg-white/50 backdrop-blur-sm font-medium text-sm sm:text-base"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-2.5">
                密码
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none transition-colors">
                  <svg className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 transition-all bg-white/50 backdrop-blur-sm font-medium text-sm sm:text-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-bold">登录中...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-bold">登录</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 sm:mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 text-gray-500 font-medium backdrop-blur-sm">或</span>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6 space-y-3">
              <Link 
                to="/register" 
                className="block w-full px-4 py-3 sm:py-3.5 border-2 border-indigo-200 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all text-center text-sm sm:text-base"
              >
                创建新账号
              </Link>
              
              <Link 
                to="/admin" 
                className="block w-full px-4 py-3 sm:py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                管理员入口
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
