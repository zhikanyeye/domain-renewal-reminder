/**
 * Dashboard Page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';

interface Domain {
  id: string;
  domain_address: string;
  renewal_url: string;
  expiry_date: number;
  reminder_start_date: number;
  reminders_sent: number;
  reminder_count: number;
  usage_period_years: number;
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchImportModal, setShowBatchImportModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<Domain | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDomains, setTotalDomains] = useState(0);
  const [pageSize] = useState(20);
  
  // Filter states
  const [filterRenewalUrl, setFilterRenewalUrl] = useState<string>('');
  const [filterUsagePeriod, setFilterUsagePeriod] = useState<number | ''>('');
  const [filterReminderCount, setFilterReminderCount] = useState<number | ''>('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadDomains();
  }, [filterRenewalUrl, filterUsagePeriod, filterReminderCount, currentPage]);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterRenewalUrl) filters.renewalUrl = filterRenewalUrl;
      if (filterUsagePeriod) filters.usagePeriodYears = filterUsagePeriod;
      if (filterReminderCount) filters.reminderCount = filterReminderCount;
      
      const response = await apiClient.getDomains(filters, currentPage, pageSize);
      if (response.success && response.data) {
        const data = response.data as any;
        setDomains(data.domains || []);
        setTotalDomains(data.total || 0);
        setTotalPages(data.totalPages || 1);
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
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Filter domains based on search query
  const filteredDomains = domains.filter(domain => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return domain.domain_address.toLowerCase().includes(query) ||
           domain.renewal_url.toLowerCase().includes(query);
  });

  const groupDomainsByRenewalUrl = () => {
    const grouped: Record<string, Domain[]> = {};
    filteredDomains.forEach(domain => {
      if (!grouped[domain.renewal_url]) {
        grouped[domain.renewal_url] = [];
      }
      grouped[domain.renewal_url].push(domain);
    });
    return grouped;
  };

  const uniqueRenewalUrls = Array.from(new Set(domains.map(d => d.renewal_url)));
  const uniqueUsagePeriods = Array.from(new Set(domains.map(d => d.usage_period_years))).sort((a, b) => a - b);
  const uniqueReminderCounts = Array.from(new Set(domains.map(d => d.reminder_count))).sort((a, b) => a - b);

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gradient">
                  爱自由域名管理
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">欢迎，{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-all font-medium"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 animate-slideUp">
          <div className="glass-card rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">总域名数</div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-800">
              {totalDomains}
            </div>
          </div>
          
          <div className="glass-card rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">即将到期</div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-800">
              {domains.filter(d => getDaysUntilExpiry(d.expiry_date) <= 30).length}
            </div>
          </div>
          
          <div className="glass-card rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">已发送提醒</div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-800">
              {domains.reduce((sum, d) => sum + d.reminders_sent, 0)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">我的域名</h2>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加域名
            </button>
            <button
              onClick={() => setShowBatchImportModal(true)}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              批量导入
            </button>
          </div>
        </div>

        {/* Filters and View Mode */}
        <div className="glass-card rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Search Box */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              搜索域名
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入域名地址或续期网址进行搜索..."
                className="w-full px-4 py-3 pl-12 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-indigo-600 font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                找到 {filteredDomains.length} 个匹配的域名
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              高级筛选
            </h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">列表</span>
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                  viewMode === 'grouped'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="hidden sm:inline">分组</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                续期网址
              </label>
              <select
                value={filterRenewalUrl}
                onChange={(e) => setFilterRenewalUrl(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
              >
                <option value="">全部</option>
                {uniqueRenewalUrls.map(url => (
                  <option key={url} value={url}>{url}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                使用期限（年）
              </label>
              <select
                value={filterUsagePeriod}
                onChange={(e) => setFilterUsagePeriod(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
              >
                <option value="">全部</option>
                {uniqueUsagePeriods.map(period => (
                  <option key={period} value={period}>{period} 年</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                提醒次数
              </label>
              <select
                value={filterReminderCount}
                onChange={(e) => setFilterReminderCount(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
              >
                <option value="">全部</option>
                {uniqueReminderCounts.map(count => (
                  <option key={count} value={count}>{count} 次</option>
                ))}
              </select>
            </div>
          </div>

          {(searchQuery || filterRenewalUrl || filterUsagePeriod || filterReminderCount) && (
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 bg-indigo-50/80 backdrop-blur-sm rounded-xl p-3 border border-indigo-100">
              <div className="text-xs sm:text-sm text-indigo-700 font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                已应用 {[searchQuery, filterRenewalUrl, filterUsagePeriod, filterReminderCount].filter(Boolean).length} 个筛选条件
              </div>
              <button
                onClick={clearFilters}
                className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
              >
                清除所有筛选
              </button>
            </div>
          )}
        </div>

        {/* Domains List */}
        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600 font-medium">加载中...</p>
          </div>
        ) : domains.length === 0 ? (
          <div className="glass-card rounded-xl sm:rounded-2xl shadow-lg p-12 sm:p-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">还没有域名</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">点击上方按钮添加您的第一个域名，开始管理续期提醒</p>
          </div>
        ) : filteredDomains.length === 0 ? (
          <div className="glass-card rounded-xl sm:rounded-2xl shadow-lg p-12 sm:p-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">没有找到匹配的域名</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">尝试调整搜索关键词或清除筛选条件</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              清除所有筛选
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <DomainListView 
            domains={filteredDomains}
            onEdit={setEditingDomain}
            onDelete={setDeletingDomain}
            getDaysUntilExpiry={getDaysUntilExpiry}
            formatDate={formatDate}
          />
        ) : (
          <DomainGroupedView
            domains={filteredDomains}
            groupedDomains={groupDomainsByRenewalUrl()}
            onEdit={setEditingDomain}
            onDelete={setDeletingDomain}
            getDaysUntilExpiry={getDaysUntilExpiry}
            formatDate={formatDate}
          />
        )}

        {/* Pagination */}
        {!loading && filteredDomains.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalDomains)} 条，共 {totalDomains} 条
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                首页
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                上一页
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                下一页
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                末页
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add Domain Modal */}
      {showAddModal && <AddDomainModal onClose={() => setShowAddModal(false)} onSuccess={loadDomains} />}

      {/* Batch Import Modal */}
      {showBatchImportModal && <BatchImportModal onClose={() => setShowBatchImportModal(false)} onSuccess={loadDomains} />}

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
    <div className="glass-card rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <colgroup>
            <col style={{ width: '35%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <thead className="bg-gray-50/80 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                域名信息
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                到期日期
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                剩余天数
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                提醒进度
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-100">
            {domains.map((domain) => {
              const daysLeft = getDaysUntilExpiry(domain.expiry_date);
              const isUrgent = daysLeft <= 7;
              const isWarning = daysLeft <= 30;

              return (
                <tr key={domain.id} className="hover:bg-indigo-50/30 transition-all duration-200">
                  <td className="px-6 py-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{domain.domain_address}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{domain.renewal_url}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="text-sm font-medium text-gray-900">{formatDate(domain.expiry_date)}</div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${
                      isUrgent ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                      isWarning ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                      'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                    }`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {daysLeft} 天
                    </span>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(domain.reminders_sent / domain.reminder_count) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        {domain.reminders_sent}/{domain.reminder_count}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onEdit(domain)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                        title="编辑"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => onDelete(domain)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="删除"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
    <div className="space-y-4 sm:space-y-6">
      {Object.entries(groupedDomains).map(([renewalUrl, domains]) => (
        <div key={renewalUrl} className="glass-card rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">{renewalUrl}</h3>
                  <p className="text-xs sm:text-sm text-indigo-100 mt-0.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    {domains.length} 个域名
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {domains.map((domain) => {
              const daysLeft = getDaysUntilExpiry(domain.expiry_date);
              const isUrgent = daysLeft <= 7;
              const isWarning = daysLeft <= 30;

              return (
                <div key={domain.id} className="px-6 py-5 hover:bg-purple-50/30 transition-all duration-200">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-gray-900 truncate">{domain.domain_address}</div>
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          到期: {formatDate(domain.expiry_date)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl shadow-sm ${
                          isUrgent ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                          isWarning ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                          'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                        }`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          剩余 {daysLeft} 天
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-700">
                          {domain.reminders_sent}/{domain.reminder_count}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => onEdit(domain)}
                          className="p-2.5 text-purple-600 hover:bg-purple-100 rounded-xl transition-all duration-200"
                          title="编辑"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => onDelete(domain)}
                          className="p-2.5 text-red-600 hover:bg-red-100 rounded-xl transition-all duration-200"
                          title="删除"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-card rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">添加域名</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-start gap-2 sm:gap-3 text-sm">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              域名地址 *
            </label>
            <input
              type="text"
              required
              value={formData.domainAddress}
              onChange={(e) => setFormData({ ...formData, domainAddress: e.target.value })}
              placeholder="example.com"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              续期网址 *
            </label>
            <input
              type="url"
              required
              value={formData.renewalUrl}
              onChange={(e) => setFormData({ ...formData, renewalUrl: e.target.value })}
              placeholder="https://example.com/renew"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                注册日期 *
              </label>
              <input
                type="date"
                required
                value={formData.registrationDate}
                onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                使用期限（年）*
              </label>
              <input
                type="number"
                required
                min="1"
                max="10"
                value={formData.usagePeriodYears}
                onChange={(e) => setFormData({ ...formData, usagePeriodYears: parseInt(e.target.value) })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                提前提醒天数 *
              </label>
              <input
                type="number"
                required
                min="1"
                max="365"
                value={formData.reminderDaysOffset}
                onChange={(e) => setFormData({ ...formData, reminderDaysOffset: parseInt(e.target.value) })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm"
              />
              <p className="text-xs text-gray-500 mt-1.5">到期前多少天开始提醒</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                提醒次数 *
              </label>
              <input
                type="number"
                required
                min="1"
                max="30"
                value={formData.reminderCount}
                onChange={(e) => setFormData({ ...formData, reminderCount: parseInt(e.target.value) })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm"
              />
              <p className="text-xs text-gray-500 mt-1.5">连续提醒几天</p>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              提醒邮箱 *
            </label>
            <input
              type="email"
              required
              value={formData.reminderEmail}
              onChange={(e) => setFormData({ ...formData, reminderEmail: e.target.value })}
              placeholder="your@email.com"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm"
            />
            <p className="text-xs text-gray-500 mt-1.5">接收提醒的邮箱地址</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl text-sm"
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
 * Batch Import Modal Component
 */
interface BatchImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function BatchImportModal({ onClose, onSuccess }: BatchImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const downloadTemplate = () => {
    const template = `域名地址,续期网址,注册日期,使用期限(年),提前提醒天数,提醒邮箱,提醒次数
example.com,https://example.com/renew,2024-01-01,1,30,your@email.com,3
mydomain.net,https://registrar.com/renew,2023-06-15,2,60,admin@domain.net,5`;

    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '域名批量导入模板.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('请选择 CSV 文件');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV 文件格式错误：至少需要标题行和一行数据');
    }

    const domains: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      if (values.length < 7) {
        throw new Error(`第 ${i + 1} 行数据不完整`);
      }

      domains.push({
        domainAddress: values[0],
        renewalUrl: values[1],
        registrationDate: values[2],
        usagePeriodYears: parseInt(values[3]),
        reminderDaysOffset: parseInt(values[4]),
        reminderEmail: values[5],
        reminderCount: parseInt(values[6]),
      });
    }

    return domains;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('请选择文件');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const text = await file.text();
      const domains = parseCSV(text);

      // Use batch API
      const response = await apiClient.batchAddDomains(domains);
      
      if (response.success && response.data) {
        const data = response.data as { 
          successCount: number; 
          failedCount: number; 
          errors: Array<{ index: number; domain: string; error: string }> 
        };
        const errorMessages = data.errors.map((e: { domain: string; error: string }) => `${e.domain}: ${e.error}`);
        setResult({ 
          success: data.successCount, 
          failed: data.failedCount, 
          errors: errorMessages 
        });
        
        if (data.successCount > 0) {
          onSuccess();
        }
      } else {
        setError(response.error?.message || '批量导入失败');
      }
    } catch (err: any) {
      setError(err.message || '文件解析失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-card rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">批量导入域名</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Instructions */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900 mb-2">使用说明</h4>
                <ol className="text-xs sm:text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
                  <li>点击下方按钮下载 CSV 模板文件</li>
                  <li>使用 Excel 或文本编辑器打开模板</li>
                  <li>按照模板格式填写域名信息（不要修改标题行）</li>
                  <li>保存为 CSV 格式（UTF-8 编码）</li>
                  <li>上传填好的文件进行批量导入</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Download Template Button */}
          <button
            type="button"
            onClick={downloadTemplate}
            className="w-full px-4 py-3 bg-white border-2 border-indigo-300 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            下载 CSV 模板
          </button>

          {/* File Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              选择 CSV 文件
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer"
              >
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700">
                    {file ? file.name : '点击选择文件或拖拽到此处'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">支持 CSV 格式</p>
                </div>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-start gap-2 sm:gap-3 text-sm">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Result Summary */}
          {result && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 sm:p-5">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                导入完成
              </h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white/60 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{result.success}</div>
                  <div className="text-xs text-gray-600">成功导入</div>
                </div>
                <div className="bg-white/60 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                  <div className="text-xs text-gray-600">导入失败</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2">失败详情：</div>
                  <div className="bg-white/60 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="text-xs text-red-600 mb-1">{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm"
            >
              {result ? '关闭' : '取消'}
            </button>
            {!result && (
              <button
                type="submit"
                disabled={loading || !file}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>导入中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>开始导入</span>
                  </>
                )}
              </button>
            )}
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
    renewalUrl: domain.renewal_url,
    reminderStartDate: new Date(domain.reminder_start_date * 1000).toISOString().split('T')[0],
    reminderCount: domain.reminder_count,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-card rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">编辑域名</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-start gap-2 sm:gap-3 text-sm">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              域名地址
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <input
                type="text"
                disabled
                value={domain.domain_address}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm border-2 border-gray-200 rounded-xl bg-gray-50/80 text-gray-500 cursor-not-allowed backdrop-blur-sm"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">域名地址不可修改</p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              续期网址 *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input
                type="url"
                required
                value={formData.renewalUrl}
                onChange={(e) => setFormData({ ...formData, renewalUrl: e.target.value })}
                placeholder="https://example.com/renew"
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              提醒开始日期 *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="date"
                required
                value={formData.reminderStartDate}
                onChange={(e) => setFormData({ ...formData, reminderStartDate: e.target.value })}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">从这个日期开始发送提醒邮件</p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              提醒次数 *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <input
                type="number"
                required
                min="1"
                max="30"
                value={formData.reminderCount}
                onChange={(e) => setFormData({ ...formData, reminderCount: parseInt(e.target.value) })}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 backdrop-blur-sm"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">连续提醒几天（1-30天）</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl text-sm flex items-center justify-center gap-2"
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
                  <span>保存更改</span>
                </>
              )}
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-card rounded-xl sm:rounded-2xl max-w-md w-full shadow-2xl animate-slideUp">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-red-100 to-red-200 rounded-full mb-4 sm:mb-6 animate-pulse">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-2 sm:mb-3">
            确认删除域名
          </h3>
          <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
            您确定要删除域名 <span className="font-bold text-gray-900">{domain.domain_address}</span> 吗？
          </p>
          <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 rounded-lg p-3 sm:p-4 mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs sm:text-sm text-red-700 font-medium">
                此操作无法撤销，域名的所有提醒记录也将被删除。
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-4 flex items-start gap-2 sm:gap-3 text-sm">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 font-semibold text-sm"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>删除中...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>确认删除</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
