/**
 * Email Service
 * Handles email sending via HTTP API or SMTP
 */

import { Domain, SmtpConfig, ApiResponse } from '../types';
import { getDaysUntilExpiry, timestampToDate } from '../utils/date';

type EmailTemplate = {
  subject: string;
  htmlBody: string;
  textBody: string;
};

export class EmailService {
  constructor(private smtpConfig: SmtpConfig) {}

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private dotStuff(value: string): string {
    return value.replace(/^\./gm, '..');
  }

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

  private sanitizeHeaderValue(value: string): string {
    return value.replace(/[\r\n]+/g, ' ').trim();
  }

  private encodeBase64Utf8(value: string): string {
    const bytes = new TextEncoder().encode(value);
    let binary = '';

    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }

    return btoa(binary);
  }

  private encodeMimeHeader(value: string): string {
    const sanitized = this.sanitizeHeaderValue(value);
    if (!sanitized) {
      return '';
    }

    if (/^[\x20-\x7E]+$/.test(sanitized) && !/[",;<>]/.test(sanitized)) {
      return sanitized;
    }

    return `=?UTF-8?B?${this.encodeBase64Utf8(sanitized)}?=`;
  }

  private formatMailbox(name: string, email: string): string {
    const safeEmail = this.sanitizeHeaderValue(email);
    const safeName = this.encodeMimeHeader(name);

    return safeName ? `${safeName} <${safeEmail}>` : `<${safeEmail}>`;
  }

  private formatMessageId(): string {
    const domain = (this.smtpConfig.fromEmail.split('@')[1] || 'localhost')
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '');

    return `<${crypto.randomUUID()}@${domain}>`;
  }

  private buildEmailLayout(options: {
    preheader: string;
    eyebrow: string;
    title: string;
    intro: string;
    content: string;
    actionLabel?: string;
    actionUrl?: string;
    footer: string;
  }): string {
    const {
      preheader,
      eyebrow,
      title,
      intro,
      content,
      actionLabel,
      actionUrl,
      footer,
    } = options;

    const actionBlock = actionLabel && actionUrl
      ? `
        <tr>
          <td style="padding: 0 32px 32px 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td bgcolor="#1565c0" style="border-radius: 10px;">
                  <a
                    href="${this.escapeHtml(actionUrl)}"
                    style="display: inline-block; padding: 14px 24px; font-size: 15px; font-weight: 600; line-height: 20px; color: #ffffff; text-decoration: none;"
                  >
                    ${this.escapeHtml(actionLabel)}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
      : '';

    const brandName = '爱自由域名管理';
    const brandSubtitle = 'Domain Management Console';
    const brandBlock = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td valign="middle" style="padding: 0 14px 0 0;">
            <table role="presentation" width="52" height="52" cellspacing="0" cellpadding="0" border="0" style="width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, #59d5ff 0%, #1da9ef 55%, #0a83d8 100%);">
              <tr>
                <td align="center" valign="middle">
                  <div style="width: 26px; height: 26px; border: 3px solid #ffffff; border-radius: 999px;">
                    <div style="width: 3px; height: 8px; margin: 4px auto 0 auto; background-color: #ffffff; border-radius: 999px;"></div>
                    <div style="width: 9px; height: 3px; margin: 1px 0 0 12px; background-color: #ffffff; border-radius: 999px;"></div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
          <td valign="middle">
            <div style="font-size: 18px; line-height: 24px; font-weight: 700; color: #ffffff;">${this.escapeHtml(brandName)}</div>
            <div style="font-size: 12px; line-height: 18px; color: rgba(255, 255, 255, 0.82);">${this.escapeHtml(brandSubtitle)}</div>
          </td>
        </tr>
      </table>
    `;

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #eef3f8; font-family: 'Microsoft YaHei', 'PingFang SC', 'Segoe UI', Arial, sans-serif; color: #1f2937;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
    ${this.escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #eef3f8;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; background-color: #ffffff; border: 1px solid #d7e0ea; border-radius: 18px; overflow: hidden;">
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #10324b 0%, #1b5f8f 100%); color: #ffffff;">
              ${brandBlock}
              <div style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.82;">${this.escapeHtml(eyebrow)}</div>
              <div style="margin-top: 18px; font-size: 28px; line-height: 36px; font-weight: 700;">${this.escapeHtml(title)}</div>
              <div style="margin-top: 12px; font-size: 15px; line-height: 24px; opacity: 0.92;">${this.escapeHtml(intro)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          ${actionBlock}
          <tr>
            <td style="padding: 20px 32px 28px 32px; border-top: 1px solid #e5ebf1; font-size: 13px; line-height: 22px; color: #607080;">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Send email using configured provider
   */
  async sendEmail(to: string, subject: string, htmlBody: string, textBody: string): Promise<ApiResponse> {
    if (this.smtpConfig.provider === 'http-api') {
      return this.sendViaHttpApi(to, subject, htmlBody, textBody);
    } else {
      return this.sendViaSmtp(to, subject, htmlBody, textBody);
    }
  }

  /**
   * Send email via HTTP API (Resend, SendGrid, Mailgun, etc.)
   */
  private async sendViaHttpApi(to: string, subject: string, htmlBody: string, textBody: string): Promise<ApiResponse> {
    try {
      console.log('Sending email via HTTP API:', {
        to,
        subject,
        apiType: this.smtpConfig.apiType,
      });

      switch (this.smtpConfig.apiType) {
        case 'resend':
          return await this.sendViaResend(to, subject, htmlBody, textBody);
        case 'sendgrid':
          return await this.sendViaSendGrid(to, subject, htmlBody, textBody);
        case 'mailgun':
          return await this.sendViaMailgun(to, subject, htmlBody, textBody);
        case 'custom':
          return await this.sendViaCustomApi(to, subject, htmlBody, textBody);
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
  private async sendViaResend(to: string, subject: string, htmlBody: string, textBody: string): Promise<ApiResponse> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.smtpConfig.apiKey || this.smtpConfig.password}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${this.smtpConfig.fromName} <${this.smtpConfig.fromEmail}>`,
        to: [to],
        subject,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    return {
      success: true,
      message: 'Email accepted by Resend',
    };
  }

  /**
   * Send via SendGrid API
   */
  private async sendViaSendGrid(to: string, subject: string, htmlBody: string, textBody: string): Promise<ApiResponse> {
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
        subject,
        content: [{
          type: 'text/plain',
          value: textBody,
        }, {
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
      message: 'Email accepted by SendGrid',
    };
  }

  /**
   * Send via Mailgun API
   */
  private async sendViaMailgun(to: string, subject: string, htmlBody: string, textBody: string): Promise<ApiResponse> {
    const domain = this.smtpConfig.mailgunDomain || this.smtpConfig.host;
    const auth = btoa(`api:${this.smtpConfig.apiKey || this.smtpConfig.password}`);

    const formData = new FormData();
    formData.append('from', `${this.smtpConfig.fromName} <${this.smtpConfig.fromEmail}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('text', textBody);
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
      message: 'Email accepted by Mailgun',
    };
  }

  /**
   * Send via custom HTTP API
   */
  private async sendViaCustomApi(to: string, subject: string, htmlBody: string, textBody: string): Promise<ApiResponse> {
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
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Custom API error: ${response.status} - ${errorText}`);
    }

    return {
      success: true,
      message: 'Email accepted by custom email API',
    };
  }

  /**
   * Send email via SMTP (TCP Socket)
   * Note: This requires implementing the full SMTP protocol
   */
  private async sendViaSmtp(to: string, subject: string, htmlBody: string, textBody: string): Promise<ApiResponse> {
    try {
      console.log('Sending email via SMTP:', {
        to,
        subject,
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
      });

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

        const readResponse = async (): Promise<string> => {
          // eslint-disable-next-line no-constant-condition
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

        let response = await readResponse();
        this.assertSmtpResponse(response, ['220'], 'SMTP greeting');

        await sendCommand(`EHLO ${this.smtpConfig.host}`);
        response = await readResponse();
        this.assertSmtpResponse(response, ['250'], 'EHLO');

        if (this.smtpConfig.port === 587) {
          await sendCommand('STARTTLS');
          response = await readResponse();
          this.assertSmtpResponse(response, ['220'], 'STARTTLS');

          await sendCommand(`EHLO ${this.smtpConfig.host}`);
          response = await readResponse();
          this.assertSmtpResponse(response, ['250'], 'EHLO after STARTTLS');
        }

        if (this.smtpConfig.password) {
          await sendCommand('AUTH LOGIN');
          response = await readResponse();
          this.assertSmtpResponse(response, ['334'], 'AUTH LOGIN');

          const username = this.smtpConfig.username || this.smtpConfig.fromEmail;
          await sendCommand(btoa(username));
          response = await readResponse();
          this.assertSmtpResponse(response, ['334'], 'Username authentication');

          await sendCommand(btoa(this.smtpConfig.password));
          response = await readResponse();
          this.assertSmtpResponse(response, ['235'], 'Password authentication');
        }

        await sendCommand(`MAIL FROM:<${this.smtpConfig.fromEmail}>`);
        response = await readResponse();
        this.assertSmtpResponse(response, ['250'], 'MAIL FROM');

        await sendCommand(`RCPT TO:<${to}>`);
        response = await readResponse();
        this.assertSmtpResponse(response, ['250', '251'], 'RCPT TO');

        await sendCommand('DATA');
        response = await readResponse();
        this.assertSmtpResponse(response, ['354'], 'DATA command');

        const boundary = `boundary_${crypto.randomUUID()}`;
        const fromHeader = this.formatMailbox(this.smtpConfig.fromName, this.smtpConfig.fromEmail);
        const replyToHeader = this.formatMailbox(this.smtpConfig.fromName, this.smtpConfig.fromEmail);
        const subjectHeader = this.encodeMimeHeader(subject);
        const messageBody = [
          `From: ${fromHeader}`,
          `Reply-To: ${replyToHeader}`,
          `To: ${to}`,
          `Subject: ${subjectHeader}`,
          `Date: ${new Date().toUTCString()}`,
          `Message-ID: ${this.formatMessageId()}`,
          'Auto-Submitted: auto-generated',
          'X-Auto-Response-Suppress: All',
          'MIME-Version: 1.0',
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          'Content-Type: text/plain; charset=utf-8',
          'Content-Transfer-Encoding: 8bit',
          '',
          textBody,
          '',
          `--${boundary}`,
          'Content-Type: text/html; charset=utf-8',
          'Content-Transfer-Encoding: 8bit',
          '',
          htmlBody,
          '',
          `--${boundary}--`,
        ].join('\r\n');

        // Dot-stuff only the message body. The SMTP terminator must remain a single "." line.
        await sendCommand(`${this.dotStuff(messageBody)}\r\n.`);
        response = await readResponse();
        this.assertSmtpResponse(response, ['250'], 'Email sending');

        await sendCommand('QUIT');
        response = await readResponse();
        this.assertSmtpResponse(response, ['221'], 'QUIT');

        return {
          success: true,
          message: 'Email accepted by SMTP server',
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
  composeReminderEmail(domain: Domain): EmailTemplate {
    const expiryDate = timestampToDate(domain.expiry_date);
    const daysRemaining = getDaysUntilExpiry(expiryDate);
    const isExpired = daysRemaining < 0;
    const overdueDays = Math.abs(daysRemaining);
    const safeDomain = this.escapeHtml(domain.domain_address);
    const expiryLabel = this.escapeHtml(expiryDate.toLocaleDateString('zh-CN'));
    const remainingTone = isExpired || daysRemaining <= 7 ? '#c62828' : '#1565c0';
    const statusLabel = isExpired ? `已过期 ${overdueDays} 天` : `剩余 ${daysRemaining} 天`;
    const summaryTitle = isExpired ? '域名已过期' : '域名到期提醒';
    const subject = isExpired ? '账户通知 - 域名已过期' : '账户通知 - 域名到期提醒';
    const statusIntro = isExpired
      ? '你的域名已进入到期后的处理期，建议尽快确认当前状态。'
      : '你的域名已进入提醒时间窗口，建议尽快查看状态并安排续期。';
    const statusFooter = isExpired
      ? '如仍需继续保留该域名，建议尽快查看详情并处理后续操作。'
      : '如需续期或确认当前状态，可点击下方按钮查看详情。';
    const actionUrl = domain.renewal_url;
    const actionLabel = isExpired ? '查看域名状态' : '查看域名详情';
    const actionSuggestion = isExpired ? '查看当前状态' : '查看续期信息';

    const content = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 0 0 18px 0; font-size: 15px; line-height: 24px; color: #334155;">
            ${statusIntro}
          </td>
        </tr>
        <tr>
          <td style="padding: 0 0 20px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fbfe; border: 1px solid #dbe5ef; border-radius: 14px;">
              <tr>
                <td style="padding: 20px 22px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="padding: 0 0 12px 0; font-size: 13px; line-height: 20px; color: #5f6f82;">域名</td>
                      <td align="right" style="padding: 0 0 12px 12px; font-size: 15px; line-height: 22px; font-weight: 600; color: #102a43;">${safeDomain}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-top: 1px solid #dbe5ef; font-size: 13px; line-height: 20px; color: #5f6f82;">到期日期</td>
                      <td align="right" style="padding: 12px 0 12px 12px; border-top: 1px solid #dbe5ef; font-size: 15px; line-height: 22px; color: #102a43;">${expiryLabel}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-top: 1px solid #dbe5ef; font-size: 13px; line-height: 20px; color: #5f6f82;">当前状态</td>
                      <td align="right" style="padding: 12px 0 12px 12px; border-top: 1px solid #dbe5ef; font-size: 16px; line-height: 22px; font-weight: 700; color: ${remainingTone};">${statusLabel}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0 0 0; border-top: 1px solid #dbe5ef; font-size: 13px; line-height: 20px; color: #5f6f82;">建议操作</td>
                      <td align="right" style="padding: 12px 0 0 12px; border-top: 1px solid #dbe5ef; font-size: 14px; line-height: 22px; color: #102a43;">${actionSuggestion}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 0; font-size: 14px; line-height: 22px; color: #5f6f82;">
            ${statusFooter}
          </td>
        </tr>
      </table>
    `.trim();

    const htmlBody = this.buildEmailLayout({
      preheader: `${domain.domain_address} 的状态已有更新。`,
      eyebrow: '域名提醒',
      title: summaryTitle,
      intro: isExpired
        ? '系统检测到你的域名已过期，请及时查看当前状态。'
        : '系统检测到你的域名已进入提醒时间窗口，请及时查看相关信息。',
      content,
      actionLabel,
      actionUrl,
      footer: '这是一封系统自动发送的账户通知邮件，请勿直接回复。',
    });

    const textBody = [
      `[${subject}]`,
      `域名：${domain.domain_address}`,
      `到期日期：${expiryDate.toLocaleDateString('zh-CN')}`,
      `当前状态：${statusLabel}`,
      isExpired
        ? '该域名当前处于到期后的处理期，请尽快查看当前状态。'
        : '该域名当前处于提醒时间窗口，请及时留意并安排续期。',
      `查看详情：${actionUrl}`,
      '这是一封系统自动发送的账户通知邮件，请勿直接回复。',
    ].join('\n');

    return { subject, htmlBody, textBody };
  }

  /**
   * Compose verification email
   */
  composeVerificationEmail(_email: string, token: string, appUrl: string): EmailTemplate {
    const cleanBaseUrl = appUrl.replace(/\/$/, '');
    const verificationUrl = `${cleanBaseUrl}/verify?token=${token}`;
    const safeVerificationUrl = this.escapeHtml(verificationUrl);
    const subject = '验证你的邮箱地址';

    const content = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 0 0 18px 0; font-size: 15px; line-height: 24px; color: #334155;">
            欢迎使用爱自由域名管理。在登录系统和接收域名通知之前，请先完成邮箱验证。
          </td>
        </tr>
        <tr>
          <td style="padding: 0 0 20px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fbfe; border: 1px solid #dbe5ef; border-radius: 14px;">
              <tr>
                <td style="padding: 20px 22px; font-size: 14px; line-height: 23px; color: #334155;">
                  <strong style="display: block; margin-bottom: 8px; color: #102a43;">验证说明</strong>
                  1. 点击下方按钮完成验证。<br>
                  2. 验证链接 24 小时内有效。<br>
                  3. 如果按钮无法打开，请复制下方链接到浏览器访问。
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #5f6f82;">
            备用验证链接：
          </td>
        </tr>
        <tr>
          <td style="padding: 0; font-size: 14px; line-height: 22px; color: #1565c0; word-break: break-all;">
            ${safeVerificationUrl}
          </td>
        </tr>
      </table>
    `.trim();

    const htmlBody = this.buildEmailLayout({
      preheader: '完成邮箱验证后即可启用登录与域名通知。',
      eyebrow: '账户验证',
      title: '完成邮箱验证',
      intro: '请先验证你当前的邮箱地址，以便系统能够稳定发送账户与域名通知。',
      content,
      actionLabel: '立即验证邮箱',
      actionUrl: verificationUrl,
      footer: '如果这不是你本人发起的操作，可以直接忽略此邮件。这是一封系统自动发送的邮件，请勿直接回复。',
    });

    const textBody = [
      '[邮箱验证]',
      '欢迎使用爱自由域名管理。',
      '请使用以下链接完成邮箱验证，链接 24 小时内有效：',
      verificationUrl,
      '',
      '如果这不是你本人发起的操作，可以直接忽略此邮件。',
      '这是一封系统自动发送的邮件，请勿直接回复。',
    ].join('\n');

    return { subject, htmlBody, textBody };
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
