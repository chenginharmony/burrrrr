import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_a0c1e83c80ef492b80ca8f4e2b9e8d8c4f5a6b7c';

export interface PaystackResponse {
  status: boolean;
  message: string;
  data?: any;
}

export class PaystackService {
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor() {
    this.secretKey = PAYSTACK_SECRET_KEY;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<PaystackResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  }

  async initializeTransaction(amount: number, email: string, reference: string) {
    return this.makeRequest('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        amount: amount * 100, // Convert to kobo
        email,
        reference,
        currency: 'NGN',
      }),
    });
  }

  async verifyTransaction(reference: string) {
    return this.makeRequest(`/transaction/verify/${reference}`);
  }

  async createTransferRecipient(accountNumber: string, bankCode: string, name: string) {
    return this.makeRequest('/transferrecipient', {
      method: 'POST',
      body: JSON.stringify({
        type: 'nuban',
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });
  }

  async initiateTransfer(amount: number, recipientCode: string, reason: string = 'Withdrawal') {
    return this.makeRequest('/transfer', {
      method: 'POST',
      body: JSON.stringify({
        source: 'balance',
        amount: amount * 100, // Convert to kobo
        recipient: recipientCode,
        reason,
      }),
    });
  }

  async getBanks() {
    return this.makeRequest('/bank?currency=NGN');
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');
    
    return hash === signature;
  }

  generateReference(): string {
    return `betchat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const paystackService = new PaystackService();