/**
 * Admin Panel Page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

interface User {
  id: string;
  email: string;
  isVerified: boolean;
  isBlacklisted: boolean;
  createdAt: number;
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
  host: string;
  port: number;
  username: string;
  fromEmail: string;
  fromName: string;
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
    host: '',
    port: 587,
    username: '',
    fromEmail: '',
    fromName: '域名续期提醒',
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
        setUsers(response.data.users || []);
        setTotalPages(Math.ceil((response.data.total || 0) / 20));
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
        setSmtpConfig(response.data);
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
        setLogs(response.data);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">管理员登录</h1>
            <p className="text-gray-600">请输入管理员密码</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                管理员密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="输入密码"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-600 transition"
            >
              登录
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              返回首页
            </button>
          </form>
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
                    {user.isVerified ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        已验证
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        未验证
                      </span>
                    )}
                    {user.isBlacklisted && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        已拉黑
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.domainCount || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt * 1000).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {!user.isBlacklisted && (
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
  return (
    <form onSubmit={onSave} className="space-y-6 max-w-2xl">
      {message && (
        <div className={`px-4 py-3 rounded-lg ${
          message.includes('成功') || message.includes('已保存')
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

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
            <option value="25">25</option>
            <option value="465">465 (SSL)</option>
            <option value="587">587 (TLS)</option>
            <option value="2525">2525</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
        <input
          type="text"
          value={config.username}
          onChange={(e) => onConfigChange({ ...config, username: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">发件人邮箱</label>
        <input
          type="email"
          value={config.fromEmail}
          onChange={(e) => onConfigChange({ ...config, fromEmail: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">发件人名称</label>
        <input
          type="text"
          value={config.fromName}
          onChange={(e) => onConfigChange({ ...config, fromName: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-600 transition disabled:opacity-50"
      >
        {loading ? '保存中...' : '保存配置'}
      </button>
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