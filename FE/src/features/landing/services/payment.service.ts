// src/features/landing/services/payment.service.ts
import { apiClient } from "@/services/api-client";

export interface SubscriptionPaymentResponse {
  paymentTransactionId: number;
  orderCode: number;
  subscriptionPlanId: number;
  subscriptionPlan: string;
  amount: number;
  status: string;
  paymentLinkId?: string;
  checkoutUrl: string;
  qrCode?: string;
  createdAt: string;
}

export const paymentService = {
  /**
   * Tạo link thanh toán payOS để nâng cấp gói Subscription cho user.
   * @param subscriptionPlanId ID của gói cần mua (2 = weekly, 3 = monthly)
   */
  async createSubscriptionPayment(
    subscriptionPlanId: number
  ): Promise<SubscriptionPaymentResponse> {
    return apiClient.post<SubscriptionPaymentResponse>(
      "/payments/payos/subscription",
      { subscriptionPlanId }
    );
  },
};

export default paymentService;
