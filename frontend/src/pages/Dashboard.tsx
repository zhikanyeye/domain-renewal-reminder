/**
 * Dashboard Page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';

interface Domain {
  id: string;
  domainAddress: string;
  renewalUrl: string;
  expiryDate: number;
  reminderStartDate: number;
  remindersSent: number;
  reminderCount: number;
  usagePeriodYears: number;
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<Domain | null>(null);
  
  // Filter states
  const [filterRenewalUrl, setFilterRenewalUrl] = useState<string>('');
  const [filterUsagePeriod, setFilterUsagePeriod] = useState<number | ''>('');
  const [filterReminderCount, setFilterReminderCount] = useState<number | ''>('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  useEffect(() => {
    loadDomains();
  }, [filterRenewalUrl, filterUsagePeriod, filterReminderCount]);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterRenewalUrl) filters.renewalUrl = filterRenewalUrl;
      if (filterUsagePeriod) filters.usagePeriodYears = filterUsagePeriod;
      if (filterReminderCount) filters.reminderCount = filterReminderCount;
      
      const response = await apiClient.getDomains(filters);
      if (response.success && response.data) {
        setDomains(response.data as Domain[]);
      }
    } catch (error) {
      console.error('Failed to load domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDaysUntilExpiry = (expiryTimestamp: number) => {
    const now = Date.now();
    const diff = expiryTimestamp * 1000 - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN');
  };

  const clearFilters = () => {
    setFilterRenewalUrl('');
    setFilterUsagePeriod('');
    setFilterReminderCount('');
  };

  const groupDomainsByRenewalUrl = () => {
    const grouped: Record<string, Domain[]> = {};
    domains.forEach(domain => {
      if (!grouped[domain.renewalUrl]) {
        grouped[domain.renewalUrl] = [];
      }
      grouped[domain.renewalUrl].push(domain);
    });
    return grouped;
  };

  const uniqueRenewalUrls = Array.from(new Set(domains.map(d => d.renewalUrl)));
  const uniqueUsagePeriods = Array.from(new Set(domains.map(d => d.usagePeriodYears))).sort((a, b) => a - b);
  const uniqueReminderCounts = Array.from(new Set(domains.map(d => d.reminderCount))).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">域名续期提醒</h1>
              <p className="text-sm text-gray-600 mt-1">欢迎，{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">总域名数</div>
            <div className="text-3xl font-bold text-gray-900">{domains.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">即将到期</div>
            <div className="text-3xl font-bold text-orange-600">
              {domains.filter(d => getDaysUntilExpiry(d.expiryDate) <= 30).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">已发送提醒</div>
            <div className="text-3xl font-bold text-green-600">
              {domains.reduce((sum, d) => sum + d.remindersSent, 0)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">我的域名</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-600 transition"
          >
            + 添加域名
          </button>
        </div>

        {/* Filters and View Mode */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">筛选和视图</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                列表视图
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'grouped'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                分组视图
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                续期网址
              </label>
              <select
                value={filterRenewalUrl}
                onChange={(e) => setFilterRenewalUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">全部</option>
                {uniqueRenewalUrls.map(url => (
                  <option key={url} value={url}>{url}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用期限（年）
              </label>
              <select
                value={filterUsagePeriod}
                onChange={(e) => setFilterUsagePeriod(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">全部</option>
                {uniqueUsagePeriods.map(period => (
                  <option key={period} value={period}>{period} 年</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                提醒次数
              </label>
              <select
                value={filterReminderCount}
                onChange={(e) => setFilterReminderCount(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">全部</option>
                {uniqueReminderCounts.map(count => (
                  <option key={count} value={count}>{count} 次</option>
                ))}
              </select>
            </div>
          </div>

          {(filterRenewalUrl || filterUsagePeriod || filterReminderCount) && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                已应用 {[filterRenewalUrl, filterUsagePeriod, filterReminderCount].filter(Boolean).length} 个筛选条件
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                清除筛选
              </button>
            </div>
          )}
        </div>

        {/* Domains List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : domains.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有域名</h3>
            <p className="text-gray-600 mb-6">点击上方按钮添加您的第一个域名</p>
          </div>
        ) : viewMode === 'list' ? (
          <DomainListView 
            domains={domains}
            onEdit={setEditingDomain}
            onDelete={setDeletingDomain}
            getDaysUntilExpiry={getDaysUntilExpiry}
            formatDate={formatDate}
          />
        ) : (
          <DomainGroupedView
            domains={domains}
            groupedDomains={groupDomainsByRenewalUrl()}
            onEdit={setEditingDomain}
            onDelete={setDeletingDomain}
            getDaysUntilExpiry={getDaysUntilExpiry}
            formatDate={formatDate}
          />
        )}
      </main>

      {/* Add Domain Modal */}
      {showAddModal && <AddDomainModal onClose={() => setShowAddModal(false)} onSuccess={loadDomains} />}

      {/* Edit Domain Modal */}
      {editingDomain && (
        <EditDomainModal 
          domain={editingDomain} 
          onClose={() => setEditingDomain(null)} 
          onSuccess={loadDomains} 
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingDomain && (
        <DeleteConfirmDialog
          domain={deletingDomain}
          onClose={() => setDeletingDomain(null)}
          onSuccess={loadDomains}
        />
      )}
    </div>
  );
}

/**
 * Domain List View Component
 */
interface DomainListViewProps {
  domains: Domain[];
  onEdit: (domain: Domain) => void;
  onDelete: (domain: Domain) => void;
  getDaysUntilExpiry: (timestamp: number) => number;
  formatDate: (timestamp: number) => string;
}

function DomainListView({ domains, onEdit, onDelete, getDaysUntilExpiry, formatDate }: DomainListViewProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              域名
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              到期日期
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              剩余天数
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              提醒进度
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {domains.map((domain) => {
            const daysLeft = getDaysUntilExpiry(domain.expiryDate);
            const isUrgent = daysLeft <= 7;
            const isWarning = daysLeft <= 30;

            return (
              <tr key={domain.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{domain.domainAddress}</div>
                  <div className="text-sm text-gray-500">{domain.renewalUrl}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(domain.expiryDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    isUrgent ? 'bg-red-100 text-red-800' :
                    isWarning ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {daysLeft} 天
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {domain.remindersSent} / {domain.reminderCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => onEdit(domain)}
                    className="text-purple-600 hover:text-purple-900 mr-4"
                  >
                    编辑
                  </button>
                  <button 
                    onClick={() => onDelete(domain)}
                    className="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Domain Grouped View Component
 */
interface DomainGroupedViewProps {
  domains: Domain[];
  groupedDomains: Record<string, Domain[]>;
  onEdit: (domain: Domain) => void;
  onDelete: (domain: Domain) => void;
  getDaysUntilExpiry: (timestamp: number) => number;
  formatDate: (timestamp: number) => string;
}

function DomainGroupedView({ groupedDomains, onEdit, onDelete, getDaysUntilExpiry, formatDate }: DomainGroupedViewProps) {
  return (
    <div className="space-y-6">
      {Object.entries(groupedDomains).map(([renewalUrl, domains]) => (
        <div key={renewalUrl} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">{renewalUrl}</h3>
            <p className="text-sm text-purple-100 mt-1">{domains.length} 个域名</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {domains.map((domain) => {
              const daysLeft = getDaysUntilExpiry(domain.expiryDate);
              const isUrgent = daysLeft <= 7;
              const isWarning = daysLeft <= 30;

              return (
                <div key={domain.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{domain.domainAddress}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            到期: {formatDate(domain.expiryDate)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div>
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                              isUrgent ? 'bg-red-100 text-red-800' :
                              isWarning ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              剩余 {daysLeft} 天
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            提醒: {domain.remindersSent} / {domain.reminderCount}
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => onEdit(domain)}
                              className="px-3 py-1 text-sm text-purple-600 hover:text-purple-900 font-medium"
                            >
                              编辑
                            </button>
                            <button 
                              onClick={() => onDelete(domain)}
                              className="px-3 py-1 text-sm text-red-600 hover:text-red-900 font-medium"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}


/**
 * Add Domain Modal Component
 */
interface AddDomainModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddDomainModal({ onClose, onSuccess }: AddDomainModalProps) {
  const [formData, setFormData] = useState({
    domainAddress: '',
    renewalUrl: '',
    registrationDate: '',
    usagePeriodYears: 1,
    reminderDaysOffset: 30,
    reminderEmail: '',
    reminderCount: 3,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.addDomain(formData);
      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.error?.message || '添加失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">添加域名</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              域名地址 *
            </label>
            <input
              type="text"
              required
              value={formData.domainAddress}
              onChange={(e) => setFormData({ ...formData, domainAddress: e.target.value })}
              placeholder="example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              续期网址 *
            </label>
            <input
              type="url"
              required
              value={formData.renewalUrl}
              onChange={(e) => setFormData({ ...formData, renewalUrl: e.target.value })}
              placeholder="https://example.com/renew"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                注册日期 *
              </label>
              <input
                type="date"
                required
                value={formData.registrationDate}
                onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用期限（年）*
              </label>
              <input
                type="number"
                required
                min="1"
                max="10"
                value={formData.usagePeriodYears}
                onChange={(e) => setFormData({ ...formData, usagePeriodYears: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                提前提醒天数 *
              </label>
              <input
                type="number"
                required
                min="1"
                max="365"
                value={formData.reminderDaysOffset}
                onChange={(e) => setFormData({ ...formData, reminderDaysOffset: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">到期前多少天开始提醒</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                提醒次数 *
              </label>
              <input
                type="number"
                required
                min="1"
                max="30"
                value={formData.reminderCount}
                onChange={(e) => setFormData({ ...formData, reminderCount: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">连续提醒几天</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              提醒邮箱 *
            </label>
            <input
              type="email"
              required
              value={formData.reminderEmail}
              onChange={(e) => setFormData({ ...formData, reminderEmail: e.target.value })}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">接收提醒的邮箱地址</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-600 transition disabled:opacity-50"
            >
              {loading ? '添加中...' : '添加域名'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Edit Domain Modal Component
 */
interface EditDomainModalProps {
  domain: Domain;
  onClose: () => void;
  onSuccess: () => void;
}

function EditDomainModal({ domain, onClose, onSuccess }: EditDomainModalProps) {
  const [formData, setFormData] = useState({
    renewalUrl: domain.renewalUrl,
    reminderStartDate: new Date(domain.reminderStartDate * 1000).toISOString().split('T')[0],
    reminderCount: domain.reminderCount,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.updateDomain(domain.id, {
        renewalUrl: formData.renewalUrl,
        reminderStartDate: Math.floor(new Date(formData.reminderStartDate).getTime() / 1000),
        reminderCount: formData.reminderCount,
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.error?.message || '更新失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">编辑域名</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              域名地址
            </label>
            <input
              type="text"
              disabled
              value={domain.domainAddress}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              续期网址 *
            </label>
            <input
              type="url"
              required
              value={formData.renewalUrl}
              onChange={(e) => setFormData({ ...formData, renewalUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              提醒开始日期 *
            </label>
            <input
              type="date"
              required
              value={formData.reminderStartDate}
              onChange={(e) => setFormData({ ...formData, reminderStartDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              提醒次数 *
            </label>
            <input
              type="number"
              required
              min="1"
              max="30"
              value={formData.reminderCount}
              onChange={(e) => setFormData({ ...formData, reminderCount: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-600 transition disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存更改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Delete Confirmation Dialog Component
 */
interface DeleteConfirmDialogProps {
  domain: Domain;
  onClose: () => void;
  onSuccess: () => void;
}

function DeleteConfirmDialog({ domain, onClose, onSuccess }: DeleteConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.deleteDomain(domain.id);
      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.error?.message || '删除失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          确认删除域名
        </h3>
        <p className="text-gray-600 text-center mb-4">
          您确定要删除域名 <span className="font-semibold">{domain.domainAddress}</span> 吗？此操作无法撤销。
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? '删除中...' : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  );
}
