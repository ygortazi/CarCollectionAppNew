export type PlanType = 'Free' | 'Premium';
export type SubscriptionInterval = 'monthly' | 'yearly' | 'lifetime';

export interface SubscriptionPlan {
  id: string;
  type: PlanType;
  interval?: SubscriptionInterval;
  price: number;
}

interface SubscriptionResponse {
  success: boolean;
  plan: PlanType;
  expiresAt?: string;
  error?: string;
}

// Mock subscription service
class SubscriptionService {
  // Mock subscription processing
  async subscribeToPlan(
    userId: string,
    planId: string,
    interval?: SubscriptionInterval
  ): Promise<SubscriptionResponse> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate successful subscription
    // In reality, this would handle payment processing and backend updates
    if (planId === 'free') {
      return {
        success: true,
        plan: 'Free'
      };
    }

    // Calculate expiration for non-lifetime plans
    let expiresAt: string | undefined;
    if (interval && interval !== 'lifetime') {
      const date = new Date();
      if (interval === 'monthly') {
        date.setMonth(date.getMonth() + 1);
      } else if (interval === 'yearly') {
        date.setFullYear(date.getFullYear() + 1);
      }
      expiresAt = date.toISOString();
    }

    return {
      success: true,
      plan: 'Premium',
      expiresAt
    };
  }

  // Mock cancellation process
  async cancelSubscription(userId: string): Promise<SubscriptionResponse> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      plan: 'Free'
    };
  }

  // Mock subscription validation
  async validateSubscription(userId: string): Promise<SubscriptionResponse> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // In reality, this would check against a backend database
    return {
      success: true,
      plan: 'Premium',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };
  }
}

export const subscriptionService = new SubscriptionService();