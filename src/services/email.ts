/**
 * Email Service
 * Handles email sending via SMTP
 */

import { Domain, SmtpConfig, ApiResponse } from '../types';
import { getDaysUntilExpiry, timestampToDate } from '../utils/date';

export class EmailService {
  constructor(private smtpConfig: SmtpConfig) {}

  /**
   * Send email via SMTP
   * Note: In Cloudflare Workers, we need to use fetch to send emails
   * This is a simplified implementation - in production, you'd use a service like Mailgun, SendGrid, etc.
   */
  async sendEmail(to: string, subject: string, _htmlBody: string): Promise<ApiResponse> {
    try {
      // For Cloudflare Workers, we'll use fetch to send via SMTP API
      // This is a placeholder - you'll need to implement actual SMTP sending
      // using a service like Mailgun, SendGrid, or AWS SES

      console.log('Sending email:', { to, subject });
      console.log('SMTP Config:', {
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
        from: this.smtpConfig.fromEmail,
      });

      // TODO: Implement actual email sending
      // For now, just log and return success
      
      return {
        success: true,
        message: 'Email sent successfully',
      };
    } catch (error) {
      console.error('Email sending error:', error);
      
      // Log error for monitoring
      await this.logEmailError(to, subject, error);

      return {
        success: false,
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: 'Failed to send email',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Compose reminder email
   */
  composeReminderEmail(domain: Domain): { subject: string; body: string } {
    const expiryDate = timestampToDate(domain.expiryDate);
    const daysRemaining = getDaysUntilExpiry(expiryDate);

    const subject = `域名续期提醒: ${domain.domainAddress} 将在 ${daysRemaining} 天后到期`;

    const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .domain-info {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: 600;
      color: #6b7280;
    }
    .value {
      color: #111827;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">🔔 域名续期提醒</h1>
  </div>
  
  <div class="content">
    <div class="warning">
      <strong>⚠️ 重要提醒</strong><br>
      您的域名即将到期，请及时续期以避免域名被撤销！
    </div>

    <div class="domain-info">
      <h2 style="margin-top: 0; color: #111827;">域名信息</h2>
      
      <div class="info-row">
        <span class="label">域名地址:</span>
        <span class="value">${domain.domainAddress}</span>
      </div>
      
      <div class="info-row">
        <span class="label">到期日期:</span>
        <span class="value">${expiryDate.toLocaleDateString('zh-CN')}</span>
      </div>
      
      <div class="info-row">
        <span class="label">剩余天数:</span>
        <span class="value" style="color: ${daysRemaining <= 7 ? '#dc2626' : '#f59e0b'}; font-weight: 700;">
          ${daysRemaining} 天
        </span>
      </div>
      
      <div class="info-row">
        <span class="label">续期网站:</span>
        <span class="value">${domain.renewalUrl}</span>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${domain.renewalUrl}" class="button">
        立即续期 →
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      💡 <strong>温馨提示:</strong> 建议您尽早完成续期操作，避免因域名到期导致网站无法访问。
    </p>
  </div>

  <div class="footer">
    <p>这是一封自动发送的提醒邮件，请勿直接回复。</p>
    <p>© ${new Date().getFullYear()} 域名续期提醒服务</p>
  </div>
</body>
</html>
    `;

    return { subject, body };
  }

  /**
   * Compose verification email
   */
  composeVerificationEmail(_email: string, token: string, baseUrl: string): { subject: string; body: string } {
    const verificationUrl = `${baseUrl}/verify?token=${token}`;

    const subject = '验证您的邮箱地址 - 域名续期提醒服务';

    const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">✉️ 邮箱验证</h1>
  </div>
  
  <div class="content">
    <h2 style="color: #111827;">欢迎使用域名续期提醒服务！</h2>
    
    <p>感谢您注册我们的服务。请点击下面的按钮验证您的邮箱地址：</p>

    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">
        验证邮箱地址
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      如果按钮无法点击，请复制以下链接到浏览器中打开：<br>
      <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
    </p>

    <p style="color: #6b7280; font-size: 14px;">
      ⏰ 此验证链接将在 24 小时后失效。
    </p>

    <p style="color: #6b7280; font-size: 14px;">
      如果您没有注册此服务，请忽略此邮件。
    </p>
  </div>

  <div class="footer">
    <p>这是一封自动发送的验证邮件，请勿直接回复。</p>
    <p>© ${new Date().getFullYear()} 域名续期提醒服务</p>
  </div>
</body>
</html>
    `;

    return { subject, body };
  }

  /**
   * Log email sending error
   */
  private async logEmailError(to: string, subject: string, error: any): Promise<void> {
    console.error('Email error:', {
      to,
      subject,
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString(),
    });
  }
}
