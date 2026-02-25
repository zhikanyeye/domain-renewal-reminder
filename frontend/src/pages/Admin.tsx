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
  domain_count: number;
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
    <div className="min-h-screen w-full ink-wash-bg relative">
      <div className="ink-pattern"></div>
      
      {/* Header */}
      <header className="glass-card border-b border-gray-200/50 sticky top-0 z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg animate-float">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gradient">
                  管理员面板
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">用户管理·SMTP 配置·操作日志</p>
              </div>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('adminPassword');
                setAuthenticated(false);
              }}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-all font-medium"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Tabs */}
        <div className="glass-card rounded-xl sm:rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="border-b border-gray-200/50">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'users'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>用户管理</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('smtp')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'smtp'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>SMTP 配置</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'logs'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>操作日志</span>
                </div>
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
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
      </main>
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
      <div className="text-center py-12 sm:py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:h-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        <p className="mt-4 text-sm sm:text-base text-gray-600 font-medium">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50/80 backdrop-blur-sm">
            <tr>
              <th className="w-[30%] px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">邮箱</th>
              <th className="w-[25%] px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">状态</th>
              <th className="w-[15%] px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">域名数</th>
              <th className="w-[15%] px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">注册时间</th>
              <th className="w-[15%] px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-indigo-50/30 transition-all duration-200">
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    {user.is_verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-sm">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        已验证
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        未验证
                      </span>
                    )}
                    {user.is_blacklisted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        已拉黑
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{user.domain_count || 0}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(user.created_at * 1000).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {!user.is_blacklisted && (
                      <button
                        onClick={() => onBlacklist(user.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                      >
                        拉黑
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(user.id, user.email)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      删除
                    </button>
                  </div>
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
            className="px-4 py-2 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            上一页
          </button>
          <span className="text-sm font-medium text-gray-700">
            第 {currentPage} / {totalPages} 页
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
    <form onSubmit={onSave} className="space-y-6 max-w-4xl">
      {message && (
        <div className={`px-4 py-3 rounded-xl animate-slideDown ${
          message.includes('成功') || message.includes('已保存')
            ? 'bg-green-50/80 border-l-4 border-green-500 text-green-700'
            : 'bg-red-50/80 border-l-4 border-red-500 text-red-700'
        }`}>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {message.includes('成功') || message.includes('已保存') ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
        <label className="block text-sm font-bold text-gray-900 mb-4">邮件发送方式</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onConfigChange({ 
              ...config, 
              provider: 'http-api',
              apiType: config.apiType || 'resend',
              port: 443,
            })}
            className={`p-5 rounded-xl border-2 transition-all text-left ${
              isHttpApi
                ? 'border-indigo-500 bg-white shadow-lg'
                : 'border-gray-200 bg-white/50 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                isHttpApi ? 'border-indigo-500' : 'border-gray-300'
              }`}>
                {isHttpApi && <div className="w-3.5 h-3.5 rounded-full bg-indigo-500"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 mb-1">HTTP API（推荐）</div>
                <div className="text-sm text-gray-600 mb-2">
                  使用 Resend、SendGrid、Mailgun 等服务的 HTTP API
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    简单易用
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    高可靠性
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    免费额度
                  </span>
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
            className={`p-5 rounded-xl border-2 transition-all text-left ${
              !isHttpApi
                ? 'border-indigo-500 bg-white shadow-lg'
                : 'border-gray-200 bg-white/50 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                !isHttpApi ? 'border-indigo-500' : 'border-gray-300'
              }`}>
                {!isHttpApi && <div className="w-3.5 h-3.5 rounded-full bg-indigo-500"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 mb-1">SMTP（高级）</div>
                <div className="text-sm text-gray-600 mb-2">
                  使用传统 SMTP 协议（企业邮箱、自建服务器等）
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    仅支持 465/587
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    配置复杂
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* HTTP API Configuration */}
      {isHttpApi && (
        <div className="space-y-5 border-t-2 border-gray-200 pt-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2.5">API 服务商</label>
            <select
              value={config.apiType || 'resend'}
              onChange={(e) => onConfigChange({ 
                ...config, 
                apiType: e.target.value as any,
                host: e.target.value === 'resend' ? 'api.resend.com' :
                      e.target.value === 'sendgrid' ? 'api.sendgrid.com' :
                      e.target.value === 'mailgun' ? 'api.mailgun.net' : '',
              })}
              className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm font-medium"
            >
              <option value="resend">Resend（推荐，100封/天）</option>
              <option value="sendgrid">SendGrid（100封/天）</option>
              <option value="mailgun">Mailgun（5000封/月）</option>
              <option value="custom">自定义 API</option>
            </select>
            <p className="mt-2 text-xs text-gray-600 font-medium">
              {config.apiType === 'resend' && '✨ 最简单的配置，推荐新手使用'}
              {config.apiType === 'sendgrid' && '⚡ 功能强大，适合需要高级功能的用户'}
              {config.apiType === 'mailgun' && '🚀 免费额度最高，适合发送量大的应用'}
              {config.apiType === 'custom' && '🔧 使用自定义的 HTTP API 端点'}
            </p>
          </div>

          {config.apiType === 'custom' && (
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2.5">API 服务器地址</label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => onConfigChange({ ...config, host: e.target.value })}
                required
                className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm font-medium"
                placeholder="api.example.com"
              />
            </div>
          )}

          {config.apiType === 'mailgun' && (
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2.5">Mailgun 域名</label>
              <input
                type="text"
                value={config.mailgunDomain || ''}
                onChange={(e) => onConfigChange({ ...config, mailgunDomain: e.target.value })}
                required
                className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm font-medium"
                placeholder="mg.yourdomain.com"
              />
              <p className="mt-2 text-xs text-gray-600">在 Mailgun 控制面板中找到你的域名</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2.5">API Key</label>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm font-medium"
              placeholder="留空则不修改"
            />
            <p className="mt-2 text-xs text-gray-600">
              在服务商控制面板中获取 API Key
            </p>
          </div>
        </div>
      )}

      {/* SMTP Configuration */}
      {!isHttpApi && (
        <div className="space-y-5 border-t-2 border-gray-200 pt-6">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-orange-900">
                <div className="font-bold mb-2">SMTP 配置注意事项：</div>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>端口 25 被 Cloudflare Workers 禁止，无法使用</li>
                  <li>仅支持端口 465（SSL）和 587（TLS）</li>
                  <li>需要 SMTP 服务器支持 STARTTLS 或 SSL</li>
                  <li>配置错误可能导致邮件发送失败</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2.5">SMTP 服务器</label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => onConfigChange({ ...config, host: e.target.value })}
                required
                className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm font-medium"
                placeholder="smtp.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2.5">端口</label>
              <select
                value={config.port}
                onChange={(e) => onConfigChange({ ...config, port: parseInt(e.target.value) })}
                className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm font-medium"
              >
                <option value="465">465 (SSL)</option>
                <option value="587">587 (TLS)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2.5">用户名</label>
            <input
              type="text"
              value={config.username}
              onChange={(e) => onConfigChange({ ...config, username: e.target.value })}
              className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm font-medium"
              placeholder="某些服务不需要用户名"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm font-medium"
              placeholder="留空则不修改"
            />
          </div>
        </div>
      )}

      {/* Common Configuration */}
      <div className="space-y-5 border-t-2 border-gray-200 pt-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          发件人信息
        </h3>
        
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2.5">发件人邮箱</label>
          <input
            type="email"
            value={config.fromEmail}
            onChange={(e) => onConfigChange({ ...config, fromEmail: e.target.value })}
            required
            className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm font-medium"
            placeholder="noreply@yourdomain.com"
          />
          <p className="mt-2 text-xs text-gray-600">
            {isHttpApi ? '需要在服务商控制面板中验证此邮箱或域名' : '必须是 SMTP 服务器允许的发件地址'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2.5">发件人名称</label>
          <input
            type="text"
            value={config.fromName}
            onChange={(e) => onConfigChange({ ...config, fromName: e.target.value })}
            required
            className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm font-medium"
            placeholder="爱自由域名管理"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
          className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
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
      <div className="text-center py-12 sm:py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        <p className="mt-4 text-sm sm:text-base text-gray-600 font-medium">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {logs.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">暂无操作日志</h3>
          <p className="text-sm sm:text-base text-gray-600">管理员操作记录将显示在这里</p>
        </div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 sm:p-5 hover:bg-indigo-50/30 hover:border-indigo-200/50 transition-all duration-200 shadow-sm hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-base font-semibold text-gray-900">{log.action}</div>
                  {log.details && (
                    <div className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{log.details}</div>
                  )}
                  {log.targetUserId && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      用户 ID: {log.targetUserId}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 flex-shrink-0 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="whitespace-nowrap">{new Date(log.timestamp * 1000).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}