/** Payment gateway abstraction. */
export type CheckoutSession = {
  checkoutUrl: string;
  externalId: string;
};

export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED';

export interface BillingProvider {
  createCheckoutSession(params: {
    userId: string;
    email: string;
    planId: string;
    amountClp: number;
  }): Promise<CheckoutSession>;

  handleWebhook(
    payload: unknown,
    signature: string | undefined,
  ): Promise<{ userId: string; status: SubscriptionStatus } | null>;

  cancelSubscription(externalSubscriptionId: string): Promise<void>;
}

export const BILLING_PROVIDER = Symbol('BILLING_PROVIDER');
