/**
 * Admin Panel Page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

interface User {
  id: string;
  email: string;
  is_verified: number; // SQLite uses INTEGER for boolean (0 or 1)
  is_blacklisted: number; // SQLite uses INTEGER for boolean (0 or 1)
  created_at: number;
  domainCount: number;
}

interface AdminLog {
  id: number;
  action: string;
  targetUserId: string | null;
  details: string | null;
  timestamp: number;
}

interface SmtpConfig {
  provider: 'http-api' | 'smtp';
  host: string;
  port: number;
  username: string;
  fromEmail: string;
  fromName: string;
  apiType?: 'resend' | 'sendgrid' | 'mailgun' | 'custom';
  apiKey?: string;
  mailgunDomain?: string;
}

export function Admin() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'smtp' | 'logs'>('users');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // SMTP state
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    provider: 'http-api',
    host: '',
    port: 443,
    username: '',
    fromEmail: '',
    fromName: '爱自由域名管理',
    apiType: 'resend',
    apiKey: '',
    mailgunDomain: '',
  });
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpMessage, setSmtpMessage] = useState('');

  // Logs state
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Store admin password in session
    sessionStorage.setItem('adminPassword', password);
    
    // Try to fetch users to verify password
    try {
      const response = await apiClient.getUsers(1, 20);
      if (response.success) {
        setAuthenticated(true);
      } else {
        setAuthError('密码错误');
        sessionStorage.removeItem('adminPassword');
      }
    } catch (error) {
      setAuthError('验证失败，请重试');
      sessionStorage.removeItem('adminPassword');
    }
  };

  useEffect(() => {
    // Check if already authenticated
    const savedPassword = sessionStorage.getItem('adminPassword');
    if (savedPassword) {
      setPassword(savedPassword);
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (authenticated && activeTab === 'users') {
      loadUsers();
    } else if (authenticated && activeTab === 'smtp') {
      loadSmtpConfig();
    } else if (authenticated && activeTab === 'logs') {
      loadLogs();
    }
  }, [authenticated, activeTab, currentPage]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await apiClient.getUsers(currentPage, 20);
      if (response.success && response.data) {
        setUsers((response.data as any).users || []);
        setTotalPages(Math.ceil(((response.data as any).total || 0) / 20));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadSmtpConfig = async () => {
    setSmtpLoading(true);
    try {
      const response = await apiClient.getSmtpConfig();
      if (response.success && response.data) {
        setSmtpConfig(response.data as SmtpConfig);
      }
    } catch (error) {
      console.error('Failed to load SMTP config:', error);
    } finally {
      setSmtpLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await apiClient.getAdminLogs(100);
      if (response.success && response.data) {
        setLogs(response.data as AdminLog[]);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleBlacklistUser = async (userId: string) => {
    const reason = prompt('请输入拉黑原因：');
    if (!reason) return;

    try {
      const response = await apiClient.blacklistUser(userId, reason);
      if (response.success) {
        alert('用户已拉黑');
        loadUsers();
      } else {
        alert('操作失败：' + response.error?.message);
      }
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`确定要删除用户 ${email} 吗？此操作无法撤销。`)) return;

    try {
      const response = await apiClient.deleteUser(userId);
      if (response.success) {
        alert('用户已删除');
        loadUsers();
      } else {
        alert('操作失败：' + response.error?.message);
      }
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpLoading(true);
    setSmtpMessage('');

    try {
      const response = await apiClient.updateSmtpConfig({
        ...smtpConfig,
        password: smtpPassword,
      });

      if (response.success) {
        setSmtpMessage('SMTP 配置已保存');
        setSmtpPassword('');
      } else {
        setSmtpMessage('保存失败：' + response.error?.message);
      }
    } catch (error) {
      setSmtpMessage('保存失败');
    } finally {
      setSmtpLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center ink-wash-bg px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative">
        <div className="ink-pattern"></div>
        
        <div className="w-full max-w-md relative z-10 animate-slideUp">
          <div className="glass-card rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10">
            <div className="text-center mb-8 sm:mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-xl mb-4 sm:mb-6 animate-float">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-2 sm:mb-3 tracking-tight">
                管理员登录
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">请输入管理员密码</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5 sm:space-y-6">
              {authError && (
                <div className="p-3 sm:p-4 bg-red-50/80 border-l-4 border-red-500 rounded-xl animate-slideDown backdrop-blur-sm">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700 text-sm font-medium">{authError}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-2.5">
                  管理员密码
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none transition-colors">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:border-indigo-500 transition-all bg-white/50 backdrop-blur-sm font-medium"
                    placeholder="输入管理员密码"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span className="font-bold">登录</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回首页
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">管理员面板</h1>
            <button
              onClick={() => {
                sessionStorage.removeItem('adminPassword');
                setAuthenticated(false);
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'users'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                用户管理
              </button>
              <button
                onClick={() => setActiveTab('smtp')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'smtp'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                SMTP 配置
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'logs'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                操作日志
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <UsersTab
                users={users}
                loading={usersLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onBlacklist={handleBlacklistUser}
                onDelete={handleDeleteUser}
              />
            )}

            {activeTab === 'smtp' && (
              <SmtpTab
                config={smtpConfig}
                password={smtpPassword}
                loading={smtpLoading}
                message={smtpMessage}
                onConfigChange={setSmtpConfig}
                onPasswordChange={setSmtpPassword}
                onSave={handleSaveSmtp}
              />
            )}

            {activeTab === 'logs' && (
              <LogsTab logs={logs} loading={logsLoading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Users Tab Component
 */
interface UsersTabProps {
  users: User[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onBlacklist: (userId: string) => void;
  onDelete: (userId: string, email: string) => void;
}

function UsersTab({ users, loading, currentPage, totalPages, onPageChange, onBlacklist, onDelete }: UsersTabProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">邮箱</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">域名数</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    {user.is_verified ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        已验证
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        未验证
                      </span>
                    )}
                    {user.is_blacklisted ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        已拉黑
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.domainCount || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at * 1000).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {!user.is_blacklisted && (
                    <button
                      onClick={() => onBlacklist(user.id)}
                      className="text-orange-600 hover:text-orange-900 mr-4"
                    >
                      拉黑
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(user.id, user.email)}
                    className="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-sm text-gray-700">
            第 {currentPage} / {totalPages} 页
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * SMTP Tab Component
 */
interface SmtpTabProps {
  config: SmtpConfig;
  password: string;
  loading: boolean;
  message: string;
  onConfigChange: (config: SmtpConfig) => void;
  onPasswordChange: (password: string) => void;
  onSave: (e: React.FormEvent) => void;
}

function SmtpTab({ config, password, loading, message, onConfigChange, onPasswordChange, onSave }: SmtpTabProps) {
  const isHttpApi = config.provider === 'http-api';

  return (
    <form onSubmit={onSave} className="space-y-6 max-w-3xl">
      {message && (
        <div className={`px-4 py-3 rounded-lg ${
          message.includes('成功') || message.includes('已保存')
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Provider Selection */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="block text-sm font-semibold text-gray-900 mb-3">邮件发送方式</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onConfigChange({ 
              ...config, 
              provider: 'http-api',
              apiType: config.apiType || 'resend',
              port: 443,
            })}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              isHttpApi
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                isHttpApi ? 'border-purple-500' : 'border-gray-300'
              }`}>
                {isHttpApi && <div className="w-3 h-3 rounded-full bg-purple-500"></div>}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">HTTP API（推荐）</div>
                <div className="text-sm text-gray-600 mt-1">
                  使用 Resend、SendGrid、Mailgun 等服务的 HTTP API
                </div>
                <div className="text-xs text-green-600 mt-1 font-medium">
                  ✓ 简单易用 ✓ 高可靠性 ✓ 免费额度
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onConfigChange({ 
              ...config, 
              provider: 'smtp',
              port: 587,
            })}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              !isHttpApi
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                !isHttpApi ? 'border-purple-500' : 'border-gray-300'
              }`}>
                {!isHttpApi && <div className="w-3 h-3 rounded-full bg-purple-500"></div>}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">SMTP（高级）</div>
                <div className="text-sm text-gray-600 mt-1">
                  使用传统 SMTP 协议（企业邮箱、自建服务器等）
                </div>
                <div className="text-xs text-orange-600 mt-1 font-medium">
                  ⚠️ 仅支持端口 465/587 ⚠️ 配置复杂
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* HTTP API Configuration */}
      {isHttpApi && (
        <div className="space-y-6 border-t pt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API 服务商</label>
            <select
              value={config.apiType || 'resend'}
              onChange={(e) => onConfigChange({ 
                ...config, 
                apiType: e.target.value as any,
                host: e.target.value === 'resend' ? 'api.resend.com' :
                      e.target.value === 'sendgrid' ? 'api.sendgrid.com' :
                      e.target.value === 'mailgun' ? 'api.mailgun.net' : '',
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="resend">Resend（推荐，100封/天）</option>
              <option value="sendgrid">SendGrid（100封/天）</option>
              <option value="mailgun">Mailgun（5000封/月）</option>
              <option value="custom">自定义 API</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {config.apiType === 'resend' && '最简单的配置，推荐新手使用'}
              {config.apiType === 'sendgrid' && '功能强大，适合需要高级功能的用户'}
              {config.apiType === 'mailgun' && '免费额度最高，适合发送量大的应用'}
              {config.apiType === 'custom' && '使用自定义的 HTTP API 端点'}
            </p>
          </div>

          {config.apiType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API 服务器地址</label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => onConfigChange({ ...config, host: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="api.example.com"
              />
            </div>
          )}

          {config.apiType === 'mailgun' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mailgun 域名</label>
              <input
                type="text"
                value={config.mailgunDomain || ''}
                onChange={(e) => onConfigChange({ ...config, mailgunDomain: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="mg.yourdomain.com"
              />
              <p className="mt-1 text-xs text-gray-500">在 Mailgun 控制面板中找到你的域名</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="留空则不修改"
            />
            <p className="mt-1 text-xs text-gray-500">
              在服务商控制面板中获取 API Key
            </p>
          </div>
        </div>
      )}

      {/* SMTP Configuration */}
      {!isHttpApi && (
        <div className="space-y-6 border-t pt-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-orange-800">
                <div className="font-semibold mb-1">SMTP 配置注意事项：</div>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>端口 25 被 Cloudflare Workers 禁止，无法使用</li>
                  <li>仅支持端口 465（SSL）和 587（TLS）</li>
                  <li>需要 SMTP 服务器支持 STARTTLS 或 SSL</li>
                  <li>配置错误可能导致邮件发送失败</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SMTP 服务器</label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => onConfigChange({ ...config, host: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="smtp.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">端口</label>
              <select
                value={config.port}
                onChange={(e) => onConfigChange({ ...config, port: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="465">465 (SSL)</option>
                <option value="587">587 (TLS)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
            <input
              type="text"
              value={config.username}
              onChange={(e) => onConfigChange({ ...config, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="某些服务不需要用户名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="留空则不修改"
            />
          </div>
        </div>
      )}

      {/* Common Configuration */}
      <div className="space-y-6 border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900">发件人信息</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">发件人邮箱</label>
          <input
            type="email"
            value={config.fromEmail}
            onChange={(e) => onConfigChange({ ...config, fromEmail: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="noreply@yourdomain.com"
          />
          <p className="mt-1 text-xs text-gray-500">
            {isHttpApi ? '需要在服务商控制面板中验证此邮箱或域名' : '必须是 SMTP 服务器允许的发件地址'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">发件人名称</label>
          <input
            type="text"
            value={config.fromName}
            onChange={(e) => onConfigChange({ ...config, fromName: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="爱自由域名管理"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-600 transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>保存中...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>保存配置</span>
            </>
          )}
        </button>

        <a
          href="https://github.com/zhikanyeye/domain-renewal-reminder/blob/main/EMAIL_SETUP.md"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>查看配置指南</span>
        </a>
      </div>
    </form>
  );
}

/**
 * Logs Tab Component
 */
interface LogsTabProps {
  logs: AdminLog[];
  loading: boolean;
}

function LogsTab({ logs, loading }: LogsTabProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无操作日志</div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{log.action}</div>
                {log.details && (
                  <div className="text-sm text-gray-600 mt-1">{log.details}</div>
                )}
              </div>
              <div className="text-xs text-gray-500 ml-4">
                {new Date(log.timestamp * 1000).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}