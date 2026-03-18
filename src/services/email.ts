/**
 * Email Service
 * Handles email sending via HTTP API or SMTP
 */

import { Domain, SmtpConfig, ApiResponse } from '../types';
import { getDaysUntilExpiry, timestampToDate } from '../utils/date';

export class EmailService {
  constructor(private smtpConfig: SmtpConfig) {}

  private getSmtpResponseCode(response: string): string {
    const match = response.match(/^(\d{3})/);
    if (!match) {
      throw new Error(`Invalid SMTP response: ${response}`);
    }

    return match[1];
  }

  private assertSmtpResponse(response: string, expectedCodes: string[], context: string): void {
    const code = this.getSmtpResponseCode(response);
    if (!expectedCodes.includes(code)) {
      throw new Error(`${context} failed: ${response}`);
    }
  }

  /**
   * Send email using configured provider
   */
  async sendEmail(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
    if (this.smtpConfig.provider === 'http-api') {
      return this.sendViaHttpApi(to, subject, htmlBody);
    } else {
      return this.sendViaSmtp(to, subject, htmlBody);
    }
  }

  /**
   * Send email via HTTP API (Resend, SendGrid, Mailgun, etc.)
   */
  private async sendViaHttpApi(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
    try {
      console.log('Sending email via HTTP API:', { 
        to, 
        subject, 
        apiType: this.smtpConfig.apiType 
      });

      switch (this.smtpConfig.apiType) {
        case 'resend':
          return await this.sendViaResend(to, subject, htmlBody);
        case 'sendgrid':
          return await this.sendViaSendGrid(to, subject, htmlBody);
        case 'mailgun':
          return await this.sendViaMailgun(to, subject, htmlBody);
        case 'custom':
          return await this.sendViaCustomApi(to, subject, htmlBody);
        default:
          throw new Error(`Unsupported API type: ${this.smtpConfig.apiType}`);
      }
    } catch (error) {
      console.error('HTTP API email error:', error);
      await this.logEmailError(to, subject, error);
      return {
        success: false,
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: 'Failed to send email via HTTP API',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Send via Resend API
   */
  private async sendViaResend(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.smtpConfig.apiKey || this.smtpConfig.password}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${this.smtpConfig.fromName} <${this.smtpConfig.fromEmail}>`,
        to: [to],
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    return {
      success: true,
      message: 'Email sent successfully via Resend',
    };
  }

  /**
   * Send via SendGrid API
   */
  private async sendViaSendGrid(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.smtpConfig.apiKey || this.smtpConfig.password}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
        }],
        from: {
          email: this.smtpConfig.fromEmail,
          name: this.smtpConfig.fromName,
        },
        subject: subject,
        content: [{
          type: 'text/html',
          value: htmlBody,
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }

    return {
      success: true,
      message: 'Email sent successfully via SendGrid',
    };
  }

  /**
   * Send via Mailgun API
   */
  private async sendViaMailgun(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
    const domain = this.smtpConfig.mailgunDomain || this.smtpConfig.host;
    const auth = btoa(`api:${this.smtpConfig.apiKey || this.smtpConfig.password}`);
    
    const formData = new FormData();
    formData.append('from', `${this.smtpConfig.fromName} <${this.smtpConfig.fromEmail}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', htmlBody);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mailgun API error: ${error}`);
    }

    return {
      success: true,
      message: 'Email sent successfully via Mailgun',
    };
  }

  /**
   * Send via custom HTTP API
   */
  private async sendViaCustomApi(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
    const authHeader = this.smtpConfig.username 
      ? `Basic ${btoa(`${this.smtpConfig.username}:${this.smtpConfig.password}`)}`
      : `Bearer ${this.smtpConfig.apiKey || this.smtpConfig.password}`;

    const response = await fetch(`https://${this.smtpConfig.host}/api/send`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          email: this.smtpConfig.fromEmail,
          name: this.smtpConfig.fromName,
        },
        to: [{ email: to }],
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Custom API error: ${response.status} - ${errorText}`);
    }

    return {
      success: true,
      message: 'Email sent successfully via custom API',
    };
  }

  /**
   * Send email via SMTP (TCP Socket)
   * Note: This requires implementing the full SMTP protocol
   */
  private async sendViaSmtp(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
    try {
      console.log('Sending email via SMTP:', { 
        to, 
        subject,
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
      });

      // Import Cloudflare Workers TCP Socket API
      const { connect } = await import('cloudflare:sockets');

      const socket = connect({
        hostname: this.smtpConfig.host,
        port: this.smtpConfig.port,
      }, {
        secureTransport: this.smtpConfig.port === 465 ? 'on' : 'starttls',
        allowHalfOpen: false,
      });

      const writer = socket.writable.getWriter();
      const reader = socket.readable.getReader();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let responseBuffer = '';

      try {
        // Helper function to send command
        const sendCommand = async (command: string) => {
          console.log('SMTP >', command);
          await writer.write(encoder.encode(command + '\r\n'));
        };

        const extractSmtpResponse = (): string | null => {
          const completeLines = responseBuffer.match(/[^\r\n]*\r\n/g) ?? [];
          if (completeLines.length === 0) {
            return null;
          }

          const firstLine = completeLines[0].slice(0, -2);
          const match = firstLine.match(/^(\d{3})([ -])/);
          if (!match) {
            return null;
          }

          const [, code, separator] = match;
          if (separator === ' ') {
            const consumedLength = completeLines[0].length;
            const response = responseBuffer.slice(0, consumedLength).trimEnd();
            responseBuffer = responseBuffer.slice(consumedLength);
            return response;
          }

          let consumedLength = 0;
          for (const lineWithBreak of completeLines) {
            consumedLength += lineWithBreak.length;
            const line = lineWithBreak.slice(0, -2);
            if (line.startsWith(`${code} `)) {
              const response = responseBuffer.slice(0, consumedLength).trimEnd();
              responseBuffer = responseBuffer.slice(consumedLength);
              return response;
            }
          }

          return null;
        };

        // Read until a complete SMTP response is assembled, including multiline replies.
        const readResponse = async (): Promise<string> => {
          while (true) {
            const response = extractSmtpResponse();
            if (response) {
              console.log('SMTP <', response);
              return response;
            }

            const { value, done } = await reader.read();
            if (done) {
              const trailing = responseBuffer + decoder.decode();
              responseBuffer = '';

              if (!trailing.trim()) {
                throw new Error('SMTP connection closed unexpectedly');
              }

              const finalResponse = trailing.trimEnd();
              console.log('SMTP <', finalResponse);
              return finalResponse;
            }

            responseBuffer += decoder.decode(value, { stream: true });
          }
        };

        // 1. Read server greeting
        let response = await readResponse();
        this.assertSmtpResponse(response, ['220'], 'SMTP greeting');

        // 2. Send EHLO
        await sendCommand(`EHLO ${this.smtpConfig.host}`);
        response = await readResponse();
        this.assertSmtpResponse(response, ['250'], 'EHLO');

        // 3. STARTTLS if port 587
        if (this.smtpConfig.port === 587) {
          await sendCommand('STARTTLS');
          response = await readResponse();
          this.assertSmtpResponse(response, ['220'], 'STARTTLS');
          // Connection will be upgraded to TLS automatically

          await sendCommand(`EHLO ${this.smtpConfig.host}`);
          response = await readResponse();
          this.assertSmtpResponse(response, ['250'], 'EHLO after STARTTLS');
        }

        // 4. AUTH LOGIN (if password is provided)
        if (this.smtpConfig.password) {
          await sendCommand('AUTH LOGIN');
          response = await readResponse();
          this.assertSmtpResponse(response, ['334'], 'AUTH LOGIN');

          // Send username (Base64 encoded) - use email if username is empty
          const username = this.smtpConfig.username || this.smtpConfig.fromEmail;
          await sendCommand(btoa(username));
          response = await readResponse();
          this.assertSmtpResponse(response, ['334'], 'Username authentication');

          // Send password (Base64 encoded)
          await sendCommand(btoa(this.smtpConfig.password));
          response = await readResponse();
          this.assertSmtpResponse(response, ['235'], 'Password authentication');
        }

        // 5. MAIL FROM
        await sendCommand(`MAIL FROM:<${this.smtpConfig.fromEmail}>`);
        response = await readResponse();
        this.assertSmtpResponse(response, ['250'], 'MAIL FROM');

        // 6. RCPT TO
        await sendCommand(`RCPT TO:<${to}>`);
        response = await readResponse();
        this.assertSmtpResponse(response, ['250', '251'], 'RCPT TO');

        // 7. DATA
        await sendCommand('DATA');
        response = await readResponse();
        this.assertSmtpResponse(response, ['354'], 'DATA command');

        // 8. Send email content
        const emailContent = [
          `From: ${this.smtpConfig.fromName} <${this.smtpConfig.fromEmail}>`,
          `To: ${to}`,
          `Subject: ${subject}`,
          `Content-Type: text/html; charset=utf-8`,
          ``,
          htmlBody,
          `.`, // End of data
        ].join('\r\n');

        await sendCommand(emailContent);
        response = await readResponse();
        this.assertSmtpResponse(response, ['250'], 'Email sending');

        // 9. QUIT
        await sendCommand('QUIT');
        response = await readResponse();
        this.assertSmtpResponse(response, ['221'], 'QUIT');

        return {
          success: true,
          message: 'Email sent successfully via SMTP',
        };
      } finally {
        await writer.close();
        await socket.close();
      }
    } catch (error) {
      console.error('SMTP error:', error);
      await this.logEmailError(to, subject, error);
      return {
        success: false,
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: 'Failed to send email via SMTP',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Compose reminder email
   */
  composeReminderEmail(domain: Domain): { subject: string; body: string } {
    const expiryDate = timestampToDate(domain.expiry_date);
    const daysRemaining = getDaysUntilExpiry(expiryDate);

    const subject = `域名续期提醒: ${domain.domain_address} 将在 ${daysRemaining} 天后到期`;

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
        <span class="value">${domain.domain_address}</span>
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
        <span class="value">${domain.renewal_url}</span>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${domain.renewal_url}" class="button">
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
  composeVerificationEmail(_email: string, token: string, appUrl: string): { subject: string; body: string } {
    // Remove trailing slash from the app URL to avoid double slashes.
    const cleanBaseUrl = appUrl.replace(/\/$/, '');
    const verificationUrl = `${cleanBaseUrl}/verify?token=${token}`;

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
