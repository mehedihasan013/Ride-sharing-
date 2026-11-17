import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { BkashService } from './bkash.service';

@Controller('payments/bkash')
export class PaymentsController {
  constructor(private readonly bkashService: BkashService) {}

  @Post('create')
  async createBkashPayment(
    @Body()
    body: {
      driverId: string;
      amountBdt: number;
      callbackBaseUrl?: string;
    },
  ) {
    const payment = await this.bkashService.createPayment(
      body.driverId,
      Number(body.amountBdt),
      body.callbackBaseUrl,
    );

    return {
      success: true,
      id: payment.id,
      paymentID: payment.paymentID,
      driverId: payment.driverId,
      bkashURL: payment.bkashURL,
      invoiceNumber: payment.invoiceNumber,
      amountBdt: payment.amountBdt,
      mode: payment.mode,
      status: payment.status,
      createdAt: payment.createdAt,
      payment,
    };
  }

  @Get('callback')
  async handleBkashCallback(
    @Query('paymentID') paymentID: string,
    @Query('status') status = 'success',
    @Query('msisdn') msisdn?: string,
    @Query('format') format?: string,
    @Res() res?: Response,
  ) {
    const result = await this.bkashService.executeCallback(
      paymentID,
      status || 'success',
      msisdn,
    );

    if (format === 'json' || !res) {
      const payload = {
        success: true,
        ...result,
      };
      if (res) {
        return res.status(200).json(payload);
      }
      return payload;
    }

    return res.redirect(
      302,
      `/payments/bkash/result?paymentID=${encodeURIComponent(paymentID)}&status=${encodeURIComponent(result.payment.status)}`,
    );
  }

  @Post('execute')
  async executeBkashPayment(
    @Body()
    body: {
      paymentID: string;
      status?: string;
      msisdn?: string;
    },
  ) {
    const result = await this.bkashService.executeCallback(
      body.paymentID,
      body.status || 'success',
      body.msisdn,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Get('status/:paymentID')
  getPaymentStatus(@Param('paymentID') paymentID: string) {
    const { payment, wallet } = this.bkashService.getPaymentStatus(paymentID);
    return {
      success: true,
      payment,
      wallet,
    };
  }

  @Get('list')
  listPayments() {
    return {
      success: true,
      mode: this.bkashService.getMode(),
      payments: this.bkashService.getAllPayments(),
    };
  }

  @Get('mock/checkout')
  renderMockCheckoutPage(
    @Query('paymentID') paymentID: string,
    @Res() res: Response,
  ) {
    const { payment, wallet } = this.bkashService.getPaymentStatus(paymentID);
    const confirmUrl = `/payments/bkash/callback?paymentID=${encodeURIComponent(payment.paymentID)}&status=success`;
    const cancelUrl = `/payments/bkash/callback?paymentID=${encodeURIComponent(payment.paymentID)}&status=cancel`;

    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>bKash Tokenized Checkout — CholoBhairab (চলো ভৈরব)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', 'Noto Sans Bengali', -apple-system, BlinkMacSystemFont, sans-serif; }
    body {
      background: #0F172A;
      color: #1E293B;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .card {
      width: 100%;
      max-width: 400px;
      background: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
      border: 2px solid #E2136E;
    }
    .header {
      background: linear-gradient(135deg, #E2136E 0%, #B80D57 100%);
      color: #FFFFFF;
      padding: 20px;
      text-align: center;
    }
    .header-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .header p {
      font-size: 12px;
      opacity: 0.92;
    }
    .merchant-box {
      background: #FDF2F8;
      border-bottom: 1px solid #FBCFE8;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .merchant-info .name {
      font-size: 14px;
      font-weight: 700;
      color: #831843;
    }
    .merchant-info .meta {
      font-size: 11px;
      color: #9D174D;
      margin-top: 2px;
      font-family: monospace;
    }
    .amount-pill {
      background: #E2136E;
      color: #FFFFFF;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 18px;
      font-weight: 800;
    }
    .body {
      padding: 20px;
    }
    .field {
      margin-bottom: 14px;
    }
    .field label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 6px;
    }
    .field input {
      width: 100%;
      padding: 10px 12px;
      border: 1.5px solid #F472B6;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #0F172A;
      background: #FFF1F2;
      text-align: center;
      letter-spacing: 1px;
    }
    .driver-note {
      font-size: 12px;
      color: #64748B;
      background: #F8FAFC;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      border: 1px solid #E2E8F0;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .btn-confirm {
      display: block;
      width: 100%;
      text-align: center;
      text-decoration: none;
      background: #E2136E;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 14px;
      padding: 13px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
    }
    .btn-confirm:hover {
      background: #C81060;
    }
    .btn-cancel {
      display: block;
      width: 100%;
      text-align: center;
      text-decoration: none;
      background: #F1F5F9;
      color: #475569;
      font-weight: 600;
      font-size: 13px;
      padding: 11px;
      border-radius: 10px;
    }
    .footer {
      text-align: center;
      padding: 12px;
      font-size: 11px;
      color: #94A3B8;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="header-badge">bKash Tokenized Checkout v1.2.0-beta</div>
      <h1>বিকাশ পেমেন্ট গেটওয়ে</h1>
      <p>নিরাপদ ড্রাইভার ওয়ালেট রিচার্জ • ভৈরব</p>
    </div>
    <div class="merchant-box">
      <div class="merchant-info">
        <div class="name">CholoBhairab (চলো ভৈরব)</div>
        <div class="meta">Invoice: ${payment.invoiceNumber}</div>
        <div class="meta">PaymentID: ${payment.paymentID}</div>
      </div>
      <div class="amount-pill">৳${payment.amountBdt.toFixed(2)}</div>
    </div>
    <div class="body">
      <div class="driver-note">
        চালক: <strong>${wallet.driverName || payment.driverId}</strong> (${payment.driverId}) • বর্তমান ব্যালেন্স: ৳${wallet.currentBalance.toFixed(2)}
      </div>
      <div class="field">
        <label>বিকাশ একাউন্ট নাম্বার (bKash Account Number)</label>
        <input type="text" value="01811-223304" readonly />
      </div>
      <div class="field">
        <label>ওটিপি ভেরিফিকেশন কোড (6-Digit OTP)</label>
        <input type="text" value="123456" readonly />
      </div>
      <div class="field">
        <label>বিকাশ পিন (5-Digit PIN)</label>
        <input type="password" value="•••••" readonly />
      </div>
      <div class="actions">
        <a class="btn-confirm" href="${confirmUrl}">✓ পেমেন্ট নিশ্চিত করুন (Confirm bKash Payment)</a>
        <a class="btn-cancel" href="${cancelUrl}">✕ বাতিল করুন (Cancel)</a>
      </div>
    </div>
    <div class="footer">
      © 2026 bKash Limited • Tokenized Checkout (${payment.mode})
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  @Get('result')
  renderPaymentResultPage(
    @Query('paymentID') paymentID: string,
    @Query('status') status?: string,
    @Res() res?: Response,
  ) {
    const { payment, wallet } = this.bkashService.getPaymentStatus(paymentID);
    const isSuccess = payment.status === 'COMPLETED';

    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>bKash Payment Receipt — CholoBhairab</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', 'Noto Sans Bengali', sans-serif; }
    body {
      background: #0F172A;
      color: #F8FAFC;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .receipt {
      width: 100%;
      max-width: 400px;
      background: #1E293B;
      border-radius: 16px;
      padding: 24px;
      border: 2px solid ${isSuccess ? '#10B981' : '#EF4444'};
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: ${isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
      color: ${isSuccess ? '#34D399' : '#F87171'};
      margin-bottom: 12px;
    }
    h1 { font-size: 20px; margin-bottom: 6px; }
    p.sub { font-size: 13px; color: #94A3B8; margin-bottom: 18px; }
    .rows {
      background: #0F172A;
      border-radius: 12px;
      padding: 14px;
      text-align: left;
      margin-bottom: 18px;
      font-size: 13px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #1E293B;
    }
    .row:last-child { border-bottom: none; }
    .row span.label { color: #94A3B8; }
    .row span.val { font-weight: 700; color: #F8FAFC; font-family: monospace; }
    button {
      width: 100%;
      padding: 12px;
      border-radius: 10px;
      border: none;
      background: ${isSuccess ? '#10B981' : '#475569'};
      color: #FFFFFF;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="badge">${isSuccess ? '✓ বিকাশ পেমেন্ট সফল (COMPLETED)' : `✕ পেমেন্ট ${payment.status}`}</div>
    <h1>${isSuccess ? `৳${payment.amountBdt.toFixed(2)} রিচার্জ সম্পন্ন` : 'পেমেন্ট সম্পন্ন হয়নি'}</h1>
    <p class="sub">CholoBhairab (চলো ভৈরব) ড্রাইভার প্রিপেইড ওয়ালেট</p>
    <div class="rows">
      <div class="row"><span class="label">PaymentID</span><span class="val">${payment.paymentID}</span></div>
      <div class="row"><span class="label">TrxID</span><span class="val">${payment.trxID || 'N/A'}</span></div>
      <div class="row"><span class="label">Invoice</span><span class="val">${payment.invoiceNumber}</span></div>
      <div class="row"><span class="label">Driver</span><span class="val">${wallet.driverName || payment.driverId}</span></div>
      <div class="row"><span class="label">নতুন ব্যালেন্স</span><span class="val">৳${wallet.currentBalance.toFixed(2)}</span></div>
    </div>
    <button onclick="window.close()">উইন্ডো বন্ধ করুন (Close Window)</button>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: 'BKASH_PAYMENT_COMPLETE',
          paymentID: ${JSON.stringify(payment.paymentID)},
          status: ${JSON.stringify(payment.status)},
          trxID: ${JSON.stringify(payment.trxID || null)},
          amountBdt: ${JSON.stringify(payment.amountBdt)},
          currentBalance: ${JSON.stringify(wallet.currentBalance)}
        }, '*');
      }
    } catch (e) {}
  </script>
</body>
</html>`;

    if (res) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }
    return html;
  }
}
