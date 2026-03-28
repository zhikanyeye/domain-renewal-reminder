/**
 * Dashboard Page
 */

import type { FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { BrandLogo } from '../components/logo';
import { useAuth } from '../contexts/useAuth';

type DomainStatus = 'active' | 'paused' | 'handled' | 'abandoned';

interface Domain {
  id: string;
  domain_address: string;
  renewal_url: string;
  registration_date: number;
  usage_period_years: number;
  expiry_date: number;
  reminder_days_offset: number;
  reminder_start_date: number;
  reminder_email: string;
  reminder_count: number;
  reminders_sent: number;
  status: DomainStatus;
  status_note?: string | null;
  owner?: string | null;
  processed_at?: number | null;
  last_renewed_at?: number | null;
}

interface DomainFilters {
  renewalUrl?: string;
  usagePeriodYears?: number;
  reminderCount?: number;
  status?: DomainStatus;
}

interface DomainsResponse {
  domains: Domain[];
  total: number;
  totalPages: number;
}

interface DomainFormData {
  domainAddress: string;
  renewalUrl: string;
  registrationDate: string;
  usagePeriodYears: number;
  reminderDaysOffset: number;
  reminderEmail: string;
  reminderCount: number;
}

interface BannerState {
  tone: 'success' | 'error';
  text: string;
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN');
}

function getDaysUntilExpiry(expiryTimestamp: number) {
  const now = Date.now();
  const diff = expiryTimestamp * 1000 - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusMeta(status: DomainStatus) {
  switch (status) {
    case 'handled':
      return {
        label: '已处理',
        className: 'border-sky-200 bg-sky-50 text-sky-700',
      };
    case 'paused':
      return {
        label: '已暂停',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
      };
    case 'abandoned':
      return {
        label: '已放弃',
        className: 'border-rose-200 bg-rose-50 text-rose-700',
      };
    default:
      return {
        label: '提醒中',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      };
  }
}

function StatusBadge({ status }: { status: DomainStatus }) {
  const meta = getStatusMeta(status);

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function RemainingBadge({ daysLeft }: { daysLeft: number }) {
  const className =
    daysLeft <= 7
      ? 'from-red-500 to-red-600 text-white'
      : daysLeft <= 30
        ? 'from-yellow-400 to-orange-500 text-white'
        : 'from-green-400 to-emerald-500 text-white';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-bold shadow-sm ${className}`}>
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {daysLeft} 天
    </span>
  );
}

function InfoItem({ label, value, breakAll }: { label: string; value: string; breakAll?: boolean }) {
  return (
    <div className="rounded-xl bg-white/70 px-3 py-3">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold text-gray-900 ${breakAll ? 'break-all' : ''}`}>{value}</div>
    </div>
  );
}

interface DomainCardProps {
  domain: Domain;
  onRenew: (domain: Domain) => void;
  onHandle: (domain: Domain) => void;
  onStatusChange: (domain: Domain, status: DomainStatus) => void;
  onEdit: (domain: Domain) => void;
  onDelete: (domain: Domain) => void;
}

function DomainCard({ domain, onRenew, onHandle, onStatusChange, onEdit, onDelete }: DomainCardProps) {
  const daysLeft = getDaysUntilExpiry(domain.expiry_date);
  const progress = Math.min(100, Math.round((domain.reminders_sent / domain.reminder_count) * 100));

  return (
    <div className="glass-card rounded-2xl border border-white/40 p-5 shadow-lg">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-all text-lg font-bold text-gray-900">{domain.domain_address}</h3>
              <StatusBadge status={domain.status} />
            </div>
            <div className="mt-1 break-all text-sm text-gray-500">{domain.renewal_url}</div>
          </div>
          <RemainingBadge daysLeft={daysLeft} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoItem label="到期日期" value={formatDate(domain.expiry_date)} />
          <InfoItem label="提醒开始" value={formatDate(domain.reminder_start_date)} />
          <InfoItem label="提醒邮箱" value={domain.reminder_email} breakAll />
          <InfoItem label="提醒进度" value={`${domain.reminders_sent}/${domain.reminder_count}`} />
        </div>

        {(domain.owner || domain.processed_at) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {domain.owner && <InfoItem label="负责人" value={domain.owner} />}
            {domain.processed_at && <InfoItem label="处理时间" value={formatDate(domain.processed_at)} />}
          </div>
        )}

        {domain.status_note && (
          <div className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm text-gray-600">
            备注：{domain.status_note}
          </div>
        )}

        {domain.last_renewed_at && (
          <div className="text-sm font-medium text-emerald-600">上次续费：{formatDate(domain.last_renewed_at)}</div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
            <span>提醒发送进度</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => onRenew(domain)}
            className="flex-1 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100"
          >
            续费并重置提醒
          </button>
          <button
            type="button"
            onClick={() => onHandle(domain)}
            className="flex-1 rounded-xl bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition-all hover:bg-sky-100"
          >
            标记已处理
          </button>
          {domain.status === 'active' ? (
            <button
              type="button"
              onClick={() => onStatusChange(domain, 'paused')}
              className="flex-1 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-100"
            >
              暂停提醒
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStatusChange(domain, 'active')}
              className="flex-1 rounded-xl bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 transition-all hover:bg-teal-100"
            >
              恢复提醒
            </button>
          )}
          {domain.status !== 'abandoned' && (
            <button
              type="button"
              onClick={() => onStatusChange(domain, 'abandoned')}
              className="flex-1 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-100"
            >
              标记已放弃
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(domain)}
            className="flex-1 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition-all hover:bg-indigo-100"
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => onDelete(domain)}
            className="flex-1 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-all hover:bg-red-100"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
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
  const [banner, setBanner] = useState<BannerState | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDomains, setTotalDomains] = useState(0);
  const pageSize = 20;

  const [filterRenewalUrl, setFilterRenewalUrl] = useState('');
  const [filterUsagePeriod, setFilterUsagePeriod] = useState<number | ''>('');
  const [filterReminderCount, setFilterReminderCount] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<DomainStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  const loadDomains = useCallback(async () => {
    setLoading(true);
    try {
      const filters: DomainFilters = {};
      if (filterRenewalUrl) filters.renewalUrl = filterRenewalUrl;
      if (filterUsagePeriod) filters.usagePeriodYears = filterUsagePeriod;
      if (filterReminderCount) filters.reminderCount = filterReminderCount;
      if (filterStatus) filters.status = filterStatus;

      const response = await apiClient.getDomains(filters, currentPage, pageSize);
      if (response.success && response.data) {
        const data = response.data as DomainsResponse;
        setDomains(data.domains || []);
        setTotalDomains(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setBanner({
          tone: 'error',
          text: response.error?.message || '加载域名失败。',
        });
      }
    } catch {
      setBanner({
        tone: 'error',
        text: '网络错误，暂时无法加载域名。',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterReminderCount, filterRenewalUrl, filterStatus, filterUsagePeriod]);

  useEffect(() => {
    void loadDomains();
  }, [loadDomains]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const clearFilters = () => {
    setFilterRenewalUrl('');
    setFilterUsagePeriod('');
    setFilterReminderCount('');
    setFilterStatus('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleRenewDomain = useCallback(async (domain: Domain) => {
    if (!window.confirm(`确认已完成 ${domain.domain_address} 的续费？系统会自动顺延一个使用周期，并重置提醒进度。`)) {
      return;
    }

    try {
      const response = await apiClient.renewDomain(domain.id);
      if (response.success) {
        await loadDomains();
        setBanner({
          tone: 'success',
          text: `${domain.domain_address} 已完成续费，提醒周期已重置。`,
        });
      } else {
        setBanner({
          tone: 'error',
          text: response.error?.message || '续费失败。',
        });
      }
    } catch {
      setBanner({
        tone: 'error',
        text: '网络错误，续费操作未完成。',
      });
    }
  }, [loadDomains]);

  const handleMarkHandled = useCallback(async (domain: Domain) => {
    try {
      const response = await apiClient.updateDomain(domain.id, {
        status: 'handled',
      });

      if (response.success) {
        await loadDomains();
        setBanner({
          tone: 'success',
          text: `${domain.domain_address} 已标记为已处理。`,
        });
      } else {
        setBanner({
          tone: 'error',
          text: response.error?.message || '标记已处理失败。',
        });
      }
    } catch {
      setBanner({
        tone: 'error',
        text: '网络错误，未能标记已处理。',
      });
    }
  }, [loadDomains]);

  const handleChangeStatus = useCallback(async (domain: Domain, status: DomainStatus) => {
    const actionLabels: Record<DomainStatus, string> = {
      active: '恢复提醒',
      paused: '暂停提醒',
      handled: '标记已处理',
      abandoned: '标记已放弃',
    };

    if (!window.confirm(`确认要将 ${domain.domain_address} 设置为“${actionLabels[status]}”吗？`)) {
      return;
    }

    try {
      const response = await apiClient.updateDomain(domain.id, { status });

      if (response.success) {
        await loadDomains();
        setBanner({
          tone: 'success',
          text: `${domain.domain_address} 状态已更新为“${actionLabels[status]}”。`,
        });
      } else {
        setBanner({
          tone: 'error',
          text: response.error?.message || '状态更新失败。',
        });
      }
    } catch {
      setBanner({
        tone: 'error',
        text: '网络错误，状态更新未完成。',
      });
    }
  }, [loadDomains]);

  const filteredDomains = domains.filter((domain) => {
    if (!searchQuery) {
      return true;
    }

    const query = searchQuery.toLowerCase();
    return (
      domain.domain_address.toLowerCase().includes(query) ||
      domain.renewal_url.toLowerCase().includes(query) ||
      domain.reminder_email.toLowerCase().includes(query)
    );
  });

  const groupedDomains = filteredDomains.reduce<Record<string, Domain[]>>((groups, domain) => {
    if (!groups[domain.renewal_url]) {
      groups[domain.renewal_url] = [];
    }
    groups[domain.renewal_url].push(domain);
    return groups;
  }, {});

  const uniqueRenewalUrls = Array.from(new Set(domains.map((domain) => domain.renewal_url)));
  const uniqueUsagePeriods = Array.from(new Set(domains.map((domain) => domain.usage_period_years))).sort((a, b) => a - b);
  const uniqueReminderCounts = Array.from(new Set(domains.map((domain) => domain.reminder_count))).sort((a, b) => a - b);

  const activeCount = domains.filter((domain) => domain.status === 'active').length;
  const handledCount = domains.filter((domain) => domain.status === 'handled').length;
  const pausedCount = domains.filter((domain) => domain.status === 'paused').length;
  const abandonedCount = domains.filter((domain) => domain.status === 'abandoned').length;

  return (
    <div className="app-shell ink-wash-bg">
      <div className="ink-pattern" />

      <header className="app-topbar">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <BrandLogo compact subtitle={user?.email ? `欢迎，${user.email}` : 'Domain Management Console'} />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100/80 hover:text-gray-900 sm:w-auto"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-5">
          <StatCard label="域名总数" value={String(totalDomains)} />
          <StatCard label="提醒中" value={String(activeCount)} accent="emerald" />
          <StatCard label="已处理" value={String(handledCount)} accent="indigo" />
          <StatCard label="已暂停" value={String(pausedCount)} accent="amber" />
          <StatCard label="已放弃" value={String(abandonedCount)} accent="rose" />
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900">我的域名</h2>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700 sm:flex-none"
            >
              添加域名
            </button>
            <button
              type="button"
              onClick={() => setShowBatchImportModal(true)}
              className="flex-1 rounded-xl border-2 border-indigo-600 px-5 py-3 text-sm font-semibold text-indigo-700 transition-all hover:bg-indigo-50 sm:flex-none"
            >
              批量导入
            </button>
          </div>
        </div>

        {banner && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
              banner.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {banner.text}
          </div>
        )}

        <div className="glass-card mb-6 rounded-2xl p-5 shadow-lg">
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-gray-700">搜索域名</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索域名、续费地址或提醒邮箱"
              className="w-full rounded-xl border border-gray-300 bg-white/70 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-base font-semibold text-gray-900">筛选与视图</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                列表
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${viewMode === 'grouped' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                分组
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <FilterSelect
              label="续费网址"
              value={filterRenewalUrl}
              onChange={setFilterRenewalUrl}
              options={[{ label: '全部', value: '' }, ...uniqueRenewalUrls.map((url) => ({ label: url, value: url }))]}
            />
            <FilterSelect
              label="使用周期"
              value={String(filterUsagePeriod)}
              onChange={(value) => setFilterUsagePeriod(value ? parseInt(value, 10) : '')}
              options={[{ label: '全部', value: '' }, ...uniqueUsagePeriods.map((value) => ({ label: `${value} 年`, value: String(value) }))]}
            />
            <FilterSelect
              label="提醒次数"
              value={String(filterReminderCount)}
              onChange={(value) => setFilterReminderCount(value ? parseInt(value, 10) : '')}
              options={[{ label: '全部', value: '' }, ...uniqueReminderCounts.map((value) => ({ label: `${value} 次`, value: String(value) }))]}
            />
            <FilterSelect
              label="域名状态"
              value={filterStatus}
              onChange={(value) => setFilterStatus((value || '') as DomainStatus | '')}
              options={[
                { label: '全部', value: '' },
                { label: '提醒中', value: 'active' },
                { label: '已处理', value: 'handled' },
                { label: '已暂停', value: 'paused' },
                { label: '已放弃', value: 'abandoned' },
              ]}
            />
          </div>

          {(searchQuery || filterRenewalUrl || filterUsagePeriod || filterReminderCount || filterStatus) && (
            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-indigo-100 bg-indigo-50/80 p-3 text-sm text-indigo-700 sm:flex-row sm:items-center sm:justify-between">
              <div>
                已应用 {[searchQuery, filterRenewalUrl, filterUsagePeriod, filterReminderCount, filterStatus].filter(Boolean).length} 个筛选条件
              </div>
              <button type="button" onClick={clearFilters} className="font-semibold hover:underline">
                清除全部
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="mt-4 text-sm font-medium text-gray-600">加载中...</p>
          </div>
        ) : domains.length === 0 ? (
          <EmptyState title="还没有域名" description="先添加第一个域名，系统才能开始帮你追踪续费和提醒。" />
        ) : filteredDomains.length === 0 ? (
          <EmptyState title="没有匹配结果" description="换一个关键词，或者清除筛选条件后再试。" actionLabel="清除筛选" onAction={clearFilters} />
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredDomains.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                onRenew={handleRenewDomain}
                onHandle={handleMarkHandled}
                onStatusChange={handleChangeStatus}
                onEdit={setEditingDomain}
                onDelete={setDeletingDomain}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedDomains).map(([renewalUrl, group]) => (
              <div key={renewalUrl} className="glass-card overflow-hidden rounded-2xl shadow-lg">
                <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 px-5 py-4 text-white">
                  <div className="break-all text-base font-bold">{renewalUrl}</div>
                  <div className="mt-1 text-sm text-indigo-100">{group.length} 个域名</div>
                </div>
                <div className="space-y-4 p-4">
                  {group.map((domain) => (
                    <DomainCard
                      key={domain.id}
                      domain={domain}
                      onRenew={handleRenewDomain}
                      onHandle={handleMarkHandled}
                      onStatusChange={handleChangeStatus}
                      onEdit={setEditingDomain}
                      onDelete={setDeletingDomain}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredDomains.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalDomains)} 条，共 {totalDomains} 条
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                上一页
              </button>
              <span className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700">
                第 {currentPage} / {totalPages} 页
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </main>

      {showAddModal && <AddDomainModal onClose={() => setShowAddModal(false)} onSuccess={loadDomains} />}
      {showBatchImportModal && <BatchImportModal onClose={() => setShowBatchImportModal(false)} onSuccess={loadDomains} />}
      {editingDomain && <EditDomainModal domain={editingDomain} onClose={() => setEditingDomain(null)} onSuccess={loadDomains} />}
      {deletingDomain && <DeleteConfirmDialog domain={deletingDomain} onClose={() => setDeletingDomain(null)} onSuccess={loadDomains} />}
    </div>
  );
}

function StatCard({ label, value, accent = 'indigo' }: { label: string; value: string; accent?: 'indigo' | 'emerald' | 'amber' | 'rose' }) {
  const accentMap = {
    indigo: 'from-indigo-500 to-purple-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-red-600',
  };

  return (
    <div className="glass-card rounded-2xl p-5 shadow-lg">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white ${accentMap[accent]}`}>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="text-sm font-semibold text-gray-600">{label}</div>
      <div className="mt-1 text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-white/70 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value || 'all'}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="glass-card rounded-2xl p-16 text-center shadow-lg">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
        <svg className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

interface AddDomainModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddDomainModal({ onClose, onSuccess }: AddDomainModalProps) {
  const [formData, setFormData] = useState<DomainFormData>({
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.addDomain(formData);
      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.error?.message || '添加域名失败。');
      }
    } catch {
      setError('网络错误，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="添加域名" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError error={error} />
        <TextField label="域名地址" value={formData.domainAddress} onChange={(value) => setFormData({ ...formData, domainAddress: value })} placeholder="example.com" />
        <TextField label="续费网址" type="url" value={formData.renewalUrl} onChange={(value) => setFormData({ ...formData, renewalUrl: value })} placeholder="https://example.com/renew" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="注册日期" type="date" value={formData.registrationDate} onChange={(value) => setFormData({ ...formData, registrationDate: value })} />
          <NumberField label="使用周期（年）" value={formData.usagePeriodYears} onChange={(value) => setFormData({ ...formData, usagePeriodYears: value })} min={1} max={10} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="提前提醒天数" value={formData.reminderDaysOffset} onChange={(value) => setFormData({ ...formData, reminderDaysOffset: value })} min={1} max={365} />
          <NumberField label="提醒次数" value={formData.reminderCount} onChange={(value) => setFormData({ ...formData, reminderCount: value })} min={1} max={30} />
        </div>
        <TextField label="提醒邮箱" type="email" value={formData.reminderEmail} onChange={(value) => setFormData({ ...formData, reminderEmail: value })} placeholder="you@example.com" />
        <ModalActions onClose={onClose} loading={loading} submitLabel="保存并创建" />
      </form>
    </ModalShell>
  );
}

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
    const template = `domainAddress,renewalUrl,registrationDate,usagePeriodYears,reminderDaysOffset,reminderEmail,reminderCount
example.com,https://example.com/renew,2024-01-01,1,30,you@example.com,3
mydomain.net,https://registrar.com/renew,2023-06-15,2,60,admin@mydomain.net,5`;

    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'domain-import-template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const parseCsv = (text: string): DomainFormData[] => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new Error('CSV 文件至少需要标题行和一行数据。');
    }

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map((value) => value.trim());
      if (values.length < 7) {
        throw new Error(`第 ${index + 2} 行数据不完整。`);
      }

      return {
        domainAddress: values[0],
        renewalUrl: values[1],
        registrationDate: values[2],
        usagePeriodYears: parseInt(values[3], 10),
        reminderDaysOffset: parseInt(values[4], 10),
        reminderEmail: values[5],
        reminderCount: parseInt(values[6], 10),
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError('请先选择 CSV 文件。');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const text = await file.text();
      const domains = parseCsv(text);
      const response = await apiClient.batchAddDomains(domains);

      if (response.success && response.data) {
        const data = response.data as {
          successCount: number;
          failedCount: number;
          errors: Array<{ index: number; domain: string; error: string }>;
        };

        setResult({
          success: data.successCount,
          failed: data.failedCount,
          errors: data.errors.map((item) => `${item.domain}: ${item.error}`),
        });

        if (data.successCount > 0) {
          onSuccess();
        }
      } else {
        setError(response.error?.message || '批量导入失败。');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '解析文件失败。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="批量导入域名" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          先下载模板，按列填写后再上传。当前支持标准 CSV，不支持带逗号转义的复杂内容。
        </div>

        <button
          type="button"
          onClick={downloadTemplate}
          className="w-full rounded-xl border-2 border-indigo-300 bg-white px-4 py-3 text-sm font-semibold text-indigo-700 transition-all hover:bg-indigo-50"
        >
          下载 CSV 模板
        </button>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">选择 CSV 文件</label>
          <input
            type="file"
            accept=".csv"
            onChange={(event) => {
              const selected = event.target.files?.[0] || null;
              setFile(selected);
              setError('');
              setResult(null);
            }}
            className="w-full rounded-xl border border-gray-300 bg-white/70 px-4 py-3 text-sm"
          />
        </div>

        <FormError error={error} />

        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoItem label="导入成功" value={String(result.success)} />
              <InfoItem label="导入失败" value={String(result.failed)} />
            </div>
            {result.errors.length > 0 && (
              <div className="mt-3 rounded-xl bg-white/80 p-3 text-sm text-red-700">
                {result.errors.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
          >
            {result ? '关闭' : '取消'}
          </button>
          {!result && (
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '导入中...' : '开始导入'}
            </button>
          )}
        </div>
      </form>
    </ModalShell>
  );
}

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
    status: domain.status,
    statusNote: domain.status_note || '',
    owner: domain.owner || '',
    processedAt: domain.processed_at ? new Date(domain.processed_at * 1000).toISOString().split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.updateDomain(domain.id, {
        renewalUrl: formData.renewalUrl,
        reminderStartDate: Math.floor(new Date(formData.reminderStartDate).getTime() / 1000),
        reminderCount: formData.reminderCount,
        status: formData.status,
        statusNote: formData.statusNote.trim() || null,
        owner: formData.owner.trim() || null,
        processedAt: formData.processedAt ? Math.floor(new Date(formData.processedAt).getTime() / 1000) : null,
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.error?.message || '更新失败。');
      }
    } catch {
      setError('网络错误，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="编辑域名" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError error={error} />
        <TextField label="域名地址" value={domain.domain_address} onChange={() => undefined} disabled />
        <TextField label="续费网址" type="url" value={formData.renewalUrl} onChange={(value) => setFormData({ ...formData, renewalUrl: value })} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="提醒开始日期" type="date" value={formData.reminderStartDate} onChange={(value) => setFormData({ ...formData, reminderStartDate: value })} />
          <NumberField label="提醒次数" value={formData.reminderCount} onChange={(value) => setFormData({ ...formData, reminderCount: value })} min={1} max={30} />
        </div>
        <FilterSelect
          label="域名状态"
          value={formData.status}
          onChange={(value) => setFormData({ ...formData, status: value as DomainStatus })}
          options={[
            { label: '提醒中', value: 'active' },
            { label: '已处理', value: 'handled' },
            { label: '已暂停', value: 'paused' },
            { label: '已放弃', value: 'abandoned' },
          ]}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="负责人" value={formData.owner} onChange={(value) => setFormData({ ...formData, owner: value })} placeholder="例如：张三 / Ops / 自己" />
          <TextField label="处理时间" type="date" value={formData.processedAt} onChange={(value) => setFormData({ ...formData, processedAt: value })} />
        </div>
        <TextAreaField
          label="状态备注"
          value={formData.statusNote}
          onChange={(value) => setFormData({ ...formData, statusNote: value })}
          placeholder="可选，例如：已人工续费处理中、供应商账单待确认等"
        />
        <ModalActions onClose={onClose} loading={loading} submitLabel="保存修改" />
      </form>
    </ModalShell>
  );
}

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
        setError(response.error?.message || '删除失败。');
      }
    } catch {
      setError('网络错误，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="删除域名" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          确认删除 <span className="font-semibold">{domain.domain_address}</span>？此操作无法撤销。
        </div>
        <FormError error={error} />
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '删除中...' : '确认删除'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="glass-card max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="sticky top-0 flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white">
          <h3 className="text-lg font-bold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 transition-all hover:bg-white/20">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function FormError({ error }: { error: string }) {
  if (!error) {
    return null;
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {error}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-300 bg-white/70 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(parseInt(event.target.value, 10))}
        min={min}
        max={max}
        className="w-full rounded-xl border border-gray-300 bg-white/70 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-xl border border-gray-300 bg-white/70 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      />
    </div>
  );
}

function ModalActions({
  onClose,
  loading,
  submitLabel,
}: {
  onClose: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
      >
        取消
      </button>
      <button
        type="submit"
        disabled={loading}
        className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? '保存中...' : submitLabel}
      </button>
    </div>
  );
}
