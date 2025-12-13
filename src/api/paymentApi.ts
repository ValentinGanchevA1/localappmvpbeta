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
    try {
      const response = await axiosInstance.post<PaymentIntent>(
        '/api/payments/intent',
        { amount, currency }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to create payment intent. Please try again.';
      throw new Error(message);
    }
  },

  confirmPayment: async (paymentIntentId: string): Promise<Transaction> => {
    try {
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required');
      }
      const response = await axiosInstance.post<Transaction>(
        `/api/payments/${paymentIntentId}/confirm`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to confirm payment. Please try again.';
      throw new Error(message);
    }
  },

  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await axiosInstance.get<Transaction[]>(
        '/api/payments/transactions'
      );
      return response.data || [];
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch transactions. Please try again.';
      throw new Error(message);
    }
  },
};
