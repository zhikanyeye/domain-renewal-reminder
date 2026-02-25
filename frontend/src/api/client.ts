/**
 * API Client for Domain Renewal Reminder Service
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server',
        },
      };
    }
  }

  // Auth endpoints
  async register(email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async verify(token: string) {
    return this.request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });

    if (response.success) {
      this.setToken(null);
    }

    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async resendVerification(email: string) {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Domain endpoints
  async getDomains(filters?: {
    renewalUrl?: string;
    usagePeriodYears?: number;
    reminderCount?: number;
  }, page: number = 1, pageSize: number = 20) {
    const params = new URLSearchParams();
    if (filters?.renewalUrl) params.append('renewalUrl', filters.renewalUrl);
    if (filters?.usagePeriodYears) params.append('usagePeriodYears', filters.usagePeriodYears.toString());
    if (filters?.reminderCount) params.append('reminderCount', filters.reminderCount.toString());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const query = params.toString();
    return this.request(`/domains${query ? `?${query}` : ''}`);
  }

  async getDomainsGrouped() {
    return this.request('/domains/grouped');
  }

  async addDomain(domain: {
    domainAddress: string;
    renewalUrl: string;
    registrationDate: string;
    usagePeriodYears: number;
    reminderDaysOffset: number;
    reminderEmail: string;
    reminderCount: number;
  }) {
    return this.request('/domains', {
      method: 'POST',
      body: JSON.stringify(domain),
    });
  }

  async batchAddDomains(domains: Array<{
    domainAddress: string;
    renewalUrl: string;
    registrationDate: string;
    usagePeriodYears: number;
    reminderDaysOffset: number;
    reminderEmail: string;
    reminderCount: number;
  }>) {
    return this.request('/domains/batch', {
      method: 'POST',
      body: JSON.stringify(domains),
    });
  }

  async updateDomain(id: string, updates: any) {
    return this.request(`/domains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteDomain(id: string) {
    return this.request(`/domains/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin endpoints (use admin password from sessionStorage)
  private async adminRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const adminPassword = sessionStorage.getItem('adminPassword');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (adminPassword) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${adminPassword}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Admin API request error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server',
        },
      };
    }
  }

  async getUsers(page: number = 1, pageSize: number = 20) {
    return this.adminRequest(`/admin/users?page=${page}&pageSize=${pageSize}`);
  }

  async blacklistUser(userId: string, reason: string) {
    return this.adminRequest(`/admin/users/${userId}/blacklist`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async deleteUser(userId: string) {
    return this.adminRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateSmtpConfig(config: {
    provider: 'http-api' | 'smtp';
    host: string;
    port: number;
    username: string;
    password: string;
    fromEmail: string;
    fromName: string;
    apiType?: 'resend' | 'sendgrid' | 'mailgun' | 'custom';
    apiKey?: string;
    mailgunDomain?: string;
  }) {
    return this.adminRequest('/admin/smtp', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getSmtpConfig() {
    return this.adminRequest('/admin/smtp');
  }

  async getAdminLogs(limit: number = 100) {
    return this.adminRequest(`/admin/logs?limit=${limit}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
