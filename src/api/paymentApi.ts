import axiosInstance from '@/api/axiosInstance';

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface Transaction {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export const paymentApi = {
  createPaymentIntent: async (
    amount: number,
    currency: string = 'usd'
  ): Promise<PaymentIntent> => {
    const response = await axiosInstance.post<PaymentIntent>(
      '/api/payments/intent',
      { amount, currency }
    );
    return response.data;
  },

  confirmPayment: async (paymentIntentId: string): Promise<Transaction> => {
    const response = await axiosInstance.post<Transaction>(
      `/api/payments/${paymentIntentId}/confirm`
    );
    return response.data;
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const response = await axiosInstance.get<Transaction[]>(
      '/api/payments/transactions'
    );
    return response.data || [];
  },
};
