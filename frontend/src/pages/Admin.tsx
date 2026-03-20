/**
 * Admin Panel Page
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { BrandLogo } from '../components/logo';

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

interface EmailSendLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  domain_id: string | null;
  domain_address: string | null;
  email_type: 'verification' | 'reminder';
  trigger_source: 'register' | 'resend-verification' | 'cron' | 'manual';
  provider: string;
  recipient_email: string;
  subject: string;
  status: 'sent' | 'failed';
  error_code: string | null;
  error_message: string | null;
  created_at: number;
}

interface ReminderRunResult {
  processed: number;
  sent: number;
  failed: number;
  source: 'cron' | 'manual';
}

interface UsersResponse {
  users: User[];
  total: number;
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
  hasPassword?: boolean;
  hasApiKey?: boolean;
}

export function Admin() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'smtp' | 'reminders' | 'logs'>('users');

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
    hasPassword: false,
    hasApiKey: false,
  });
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpMessage, setSmtpMessage] = useState('');

  // Logs state
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Reminder state
  const [emailLogs, setEmailLogs] = useState<EmailSendLog[]>([]);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);
  const [reminderRunLoading, setReminderRunLoading] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [lastReminderRun, setLastReminderRun] = useState<ReminderRunResult | null>(null);

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
    } catch {
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

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const response = await apiClient.getUsers(currentPage, 20);
      if (response.success && response.data) {
        const data = response.data as UsersResponse;
        setUsers(data.users || []);
        setTotalPages(Math.ceil((data.total || 0) / 20));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setUsersLoading(false);
    }
  }, [currentPage]);

  const loadSmtpConfig = useCallback(async () => {
    setSmtpLoading(true);
    try {
      const response = await apiClient.getSmtpConfig();
      if (response.success && response.data) {
        setSmtpConfig(response.data as SmtpConfig);
        setSmtpPassword('');
      }
    } catch (error) {
      console.error('Failed to load SMTP config:', error);
    } finally {
      setSmtpLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
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
  }, []);

  const loadEmailLogs = useCallback(async () => {
    setEmailLogsLoading(true);
    try {
      const response = await apiClient.getEmailSendLogs(100);
      if (response.success && response.data) {
        setEmailLogs(response.data as EmailSendLog[]);
      }
    } catch (error) {
      console.error('Failed to load email logs:', error);
    } finally {
      setEmailLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated && activeTab === 'users') {
      void loadUsers();
    } else if (authenticated && activeTab === 'smtp') {
      void loadSmtpConfig();
    } else if (authenticated && activeTab === 'reminders') {
      void loadEmailLogs();
    } else if (authenticated && activeTab === 'logs') {
      void loadLogs();
    }
  }, [authenticated, activeTab, currentPage, loadEmailLogs, loadLogs, loadSmtpConfig, loadUsers]);

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
    } catch {
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
    } catch {
      alert('操作失败');
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpLoading(true);
    setSmtpMessage('');

    try {
      const configPayload = {
        ...smtpConfig,
      };
      delete configPayload.hasPassword;
      delete configPayload.hasApiKey;
      const nextPassword = smtpPassword.trim();
      const response = await apiClient.updateSmtpConfig(
        nextPassword
          ? {
              ...configPayload,
              password: nextPassword,
            }
          : configPayload
      );

      if (response.success) {
        setSmtpConfig((current) => ({
          ...current,
          hasPassword: current.hasPassword || Boolean(nextPassword),
          hasApiKey:
            current.hasApiKey || (current.provider === 'http-api' && Boolean(nextPassword)),
        }));
        setSmtpMessage('SMTP configuration saved successfully');
        setSmtpPassword('');
      } else {
        setSmtpMessage(`Save failed: ${response.error?.message || 'Unknown error'}`);
      }
    } catch {
      setSmtpMessage('Save failed');
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleRunReminderCheck = async () => {
    setReminderRunLoading(true);
    setReminderMessage('');

    try {
      const response = await apiClient.runReminderCheck();
      if (response.success && response.data) {
        const result = response.data as ReminderRunResult;
        setLastReminderRun(result);
        setReminderMessage(`本次共检查 ${result.processed} 条记录，发送成功 ${result.sent} 条，失败 ${result.failed} 条。`);
        void loadEmailLogs();
      } else {
        setReminderMessage(`执行失败：${response.error?.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('Failed to run reminder check:', error);
      setReminderMessage('执行失败，请稍后重试。');
    } finally {
      setReminderRunLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center ink-wash-bg px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative">
        <div className="ink-pattern"></div>
        
        <div className="w-full max-w-md relative z-10 animate-slideUp">
          <div className="glass-card rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10">
            <div className="text-center mb-8 sm:mb-10">
              <div className="mb-4 sm:mb-6 flex justify-center">
                <BrandLogo center title="爱自由域名管理" subtitle="Domain Management Console" />
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
    <div className="app-shell ink-wash-bg">
      <div className="ink-pattern"></div>
      
      {/* Header */}
      <header className="app-topbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <BrandLogo compact subtitle="系统管理后台" />
            <button
              onClick={() => {
                sessionStorage.removeItem('adminPassword');
                setAuthenticated(false);
              }}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-all font-medium"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Tabs */}
        <div className="glass-card rounded-xl sm:rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="border-b border-gray-200/50">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 sm:flex-none shrink-0 px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-2 transition-all ${
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
                className={`flex-1 sm:flex-none shrink-0 px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-2 transition-all ${
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
                className={`flex-1 sm:flex-none shrink-0 px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-2 transition-all ${
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
              <button
                onClick={() => setActiveTab('reminders')}
                className={`flex-1 sm:flex-none shrink-0 px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'reminders'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 10H5a2 2 0 01-2-2V8m18 0v8a2 2 0 01-2 2" />
                  </svg>
                  <span>提醒测试</span>
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

            {activeTab === 'reminders' && (
              <RemindersTab
                emailLogs={emailLogs}
                logsLoading={emailLogsLoading}
                runLoading={reminderRunLoading}
                message={reminderMessage}
                lastRun={lastReminderRun}
                onRun={handleRunReminderCheck}
              />
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
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <thead className="bg-gray-50/80 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider align-middle">邮箱</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider align-middle">状态</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider align-middle">域名数</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider align-middle">注册时间</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider align-middle">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-indigo-50/30 transition-all duration-200">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 align-middle">{user.email}</td>
                <td className="px-6 py-4 align-middle">
                  {user.is_verified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-sm mr-2">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      已验证
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm mr-2">
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
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium align-middle">{user.domain_count || 0}</td>
                <td className="px-6 py-4 text-sm text-gray-600 align-middle">
                  {new Date(user.created_at * 1000).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-6 py-4 text-sm font-medium align-middle">
                  {!user.is_blacklisted && (
                    <button
                      onClick={() => onBlacklist(user.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 rounded-lg transition-all mr-2"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="glass-card rounded-xl shadow-lg p-4">
            {/* Email */}
            <div className="mb-3">
              <div className="text-sm font-bold text-gray-900 break-words">{user.email}</div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
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

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">域名数</div>
                <div className="text-sm font-medium text-gray-900">{user.domain_count || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">注册时间</div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(user.created_at * 1000).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              {!user.is_blacklisted && (
                <button
                  onClick={() => onBlacklist(user.id)}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all"
                >
                  拉黑
                </button>
              )}
              <button
                onClick={() => onDelete(user.id, user.email)}
                className="flex-1 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-full sm:w-auto px-4 py-2 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            上一页
          </button>
          <span className="text-sm font-medium text-gray-700">
            第 {currentPage} / {totalPages} 页
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-full sm:w-auto px-4 py-2 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
  const isSuccessMessage = message.toLowerCase().includes('success');

  return (
    <form onSubmit={onSave} className="space-y-6 max-w-4xl w-full">
      {message && (
        <div className={`px-4 py-3 rounded-xl animate-slideDown ${
          isSuccessMessage
            ? 'bg-green-50/80 border-l-4 border-green-500 text-green-700'
            : 'bg-red-50/80 border-l-4 border-red-500 text-red-700'
        }`}>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isSuccessMessage ? (
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
                apiType: e.target.value as SmtpConfig['apiType'],
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
            <div className="flex items-start gap-3">
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
 * Reminder Tab Component
 */
interface RemindersTabProps {
  emailLogs: EmailSendLog[];
  logsLoading: boolean;
  runLoading: boolean;
  message: string;
  lastRun: ReminderRunResult | null;
  onRun: () => void;
}

function RemindersTab({
  emailLogs,
  logsLoading,
  runLoading,
  message,
  lastRun,
  onRun,
}: RemindersTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900">手动执行提醒检查</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                用于验证 cron 逻辑是否正常，不需要等到每天定时任务执行。触发后会按当前提醒规则立即扫描并尝试发送邮件。
              </p>
            </div>
            <button
              type="button"
              onClick={onRun}
              disabled={runLoading}
              className="w-full sm:w-auto shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runLoading ? '执行中...' : '立即执行一次'}
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-indigo-100 bg-white/80 p-4 text-sm text-gray-600">
            定时任务仍会按每天 08:00（中国时间）执行。这里的手动执行不会修改域名到期时间或提醒起始时间，只是立即跑一次相同的筛选与发信流程。
          </div>
          {message && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-gray-700">
              {message}
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">最近执行来源</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{lastRun?.source === 'manual' ? '手动' : '等待执行'}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">最近检查数量</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{lastRun?.processed ?? '-'}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">最近发送结果</div>
            <div className="mt-2 text-sm font-semibold text-gray-900">
              {lastRun ? `成功 ${lastRun.sent} / 失败 ${lastRun.failed}` : '暂无执行记录'}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">最近发信记录</h3>
            <p className="mt-1 text-sm text-gray-600">包含验证邮件和域名提醒邮件的最近 100 条发送结果。</p>
          </div>
        </div>

        {logsLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="mt-4 text-sm text-gray-600">加载中...</p>
          </div>
        ) : emailLogs.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-600">暂无发信记录。</div>
        ) : (
          <div className="mt-4 space-y-3">
            {emailLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-gray-200 bg-slate-50/70 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {log.status === 'sent' ? '发送成功' : '发送失败'}
                      </span>
                      <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {log.email_type === 'reminder' ? '提醒邮件' : '验证邮件'}
                      </span>
                      <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {log.trigger_source}
                      </span>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-gray-900 break-all">{log.subject}</div>
                    <div className="mt-2 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                      <div className="break-all">收件人：{log.recipient_email}</div>
                      <div className="break-all">通道：{log.provider}</div>
                      <div className="break-all">域名：{log.domain_address || '-'}</div>
                      <div className="break-all">用户：{log.user_email || log.user_id || '-'}</div>
                    </div>
                    {log.error_message && (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {log.error_code ? `${log.error_code}: ` : ''}
                        {log.error_message}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-xs text-gray-500">
                    {new Date(log.created_at * 1000).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
              <div className="text-xs sm:text-sm text-gray-500 flex-shrink-0 flex items-center gap-1.5 sm:self-auto">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="break-all sm:whitespace-nowrap">{new Date(log.timestamp * 1000).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
