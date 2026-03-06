import { apiFetch } from './api';

export type ProductType = 'course' | 'membership' | 'download' | 'coaching';
export type CourseTrack = 'self_paced' | 'accountability';
export type PaymentGateway = 'stripe' | 'paystack';

/** Currencies that Paystack supports (core African currencies). */
export const PAYSTACK_CURRENCIES = new Set(['NGN', 'GHS', 'ZAR', 'KES']);

/** The default currency Paystack will convert to when the product currency isn't supported. */
export const PAYSTACK_DEFAULT_CURRENCY = 'GHS';

/** Returns true if the currency is supported by Paystack. */
export function isPaystackCurrency(currency: string): boolean {
  return PAYSTACK_CURRENCIES.has(currency.toUpperCase());
}

/** Fetch the exchange rate (and optionally a converted amount) from the backend. */
export async function getExchangeRate(
  from: string,
  to: string,
  amount?: number,
): Promise<{ rate: number; convertedAmount?: number }> {
  const params = new URLSearchParams({ from, to });
  if (amount !== undefined) params.set('amount', String(amount));
  return apiFetch(`/payments/exchange-rate?${params.toString()}`);
}

export interface CheckoutSessionRequest {
  productId: string;
  productType: ProductType;
  track?: CourseTrack;
  billingInterval?: 'monthly' | 'annual';
  cohortId?: string;
  gateway: PaymentGateway;
}

export interface StripeCheckoutResponse {
  sessionId: string;
  url: string;
}

export interface PaystackCheckoutResponse {
  authorization_url: string;
  reference: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  track: 'SELF_PACED' | 'ACCOUNTABILITY';
  status: 'ACTIVE' | 'COMPLETED';
  enrolledAt: string;
}

export async function createCheckoutSession(
  data: CheckoutSessionRequest,
): Promise<StripeCheckoutResponse | PaystackCheckoutResponse> {
  return apiFetch('/payments/checkout-session', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function enrollFree(courseId: string, track: CourseTrack, communityId?: string): Promise<Enrollment> {
  return apiFetch(`/courses/${courseId}/enroll`, {
    method: 'POST',
    body: JSON.stringify({ track, ...(communityId && { communityId }) }),
  });
}

export async function getMyEnrollment(courseId: string): Promise<Enrollment> {
  return apiFetch(`/courses/${courseId}/enrollment`);
}
