import { apiFetch } from './api';

export type PlanTier = 'FREE' | 'STARTER' | 'PRO';

export interface CreatorPlan {
  plan: PlanTier;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  communityLimit: number;
  platformFeePercent: number;
}

export const PLAN_DETAILS: Record<PlanTier, { name: string; price: string; fee: string; communityLimit: string; aiFeatures: boolean; highlight?: boolean }> = {
  FREE: {
    name: 'Free',
    price: '$0/month',
    fee: '8% per sale',
    communityLimit: '1 community',
    aiFeatures: false,
  },
  STARTER: {
    name: 'Starter',
    price: '$5/month',
    fee: '4% per sale',
    communityLimit: 'Up to 3 communities',
    aiFeatures: false,
    highlight: true,
  },
  PRO: {
    name: 'Pro',
    price: '$50/month',
    fee: '1% per sale',
    communityLimit: 'Unlimited communities',
    aiFeatures: true,
  },
};

export async function getMyPlan(): Promise<CreatorPlan> {
  return apiFetch('/billing/plan');
}

export async function createBillingCheckout(plan: PlanTier): Promise<{ url: string }> {
  return apiFetch('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

export async function cancelBillingSubscription(): Promise<void> {
  return apiFetch('/billing/cancel', { method: 'POST' });
}

export async function resumeBillingSubscription(): Promise<void> {
  return apiFetch('/billing/resume', { method: 'POST' });
}
