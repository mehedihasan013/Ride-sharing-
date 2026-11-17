export interface BkashPaymentRecord {
  id: string;
  paymentID: string;
  driverId: string;
  amountBdt: number;
  invoiceNumber: string;
  mode: 'MOCK' | 'SANDBOX';
  status: 'INITIATED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  bkashURL: string;
  trxID?: string;
  customerMsisdn?: string;
  createdAt: string;
  completedAt?: string;
}

export interface BkashGrantTokenResponse {
  id_token: string;
  token_type?: string;
  expires_in: number;
  refresh_token?: string;
  statusCode: string;
  statusMessage: string;
}

export interface BkashCreatePaymentResponse {
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  successCallbackURL?: string;
  failureCallbackURL?: string;
  cancelledCallbackURL?: string;
  amount: string;
  intent: string;
  currency: string;
  paymentCreateTime?: string;
  transactionStatus: string;
  merchantInvoiceNumber: string;
  statusCode: string;
  statusMessage: string;
}

export interface BkashExecutePaymentResponse {
  paymentID: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  paymentExecuteTime?: string;
  merchantInvoiceNumber: string;
  payerReference?: string;
  customerMsisdn?: string;
  statusCode: string;
  statusMessage: string;
}
