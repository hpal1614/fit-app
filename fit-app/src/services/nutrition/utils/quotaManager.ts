import { APIUsageStats } from '../types/nutrition.types';

const QUOTA_PREFIX = 'nutrition_quota_';
const DAILY_RESET_HOUR = 0; // Midnight

interface QuotaData {
  callsToday: number;
  callsThisMonth: number;
  lastResetDate: string;
  quota: number;
}

export class QuotaManager {
  private quotas: { [key: string]: QuotaData } = {
    openfoodfacts: { callsToday: 0, callsThisMonth: 0, lastResetDate: '', quota: Infinity },
    fatsecret: { callsToday: 0, callsThisMonth: 0, lastResetDate: '', quota: 5000 },
    spoonacular: { callsToday: 0, callsThisMonth: 0, lastResetDate: '', quota: 150 },
    nutritionix: { callsToday: 0, callsThisMonth: 0, lastResetDate: '', quota: 500 },
    usda: { callsToday: 0, callsThisMonth: 0, lastResetDate: '', quota: Infinity }
  };

  constructor() {
    this.loadQuotas();
    this.checkDailyReset();
  }

  private getQuotaKey(apiName: string): string {
    return `${QUOTA_PREFIX}${apiName}`;
  }

  private loadQuotas(): void {
    try {
      Object.keys(this.quotas).forEach(apiName => {
        const quotaData = localStorage.getItem(this.getQuotaKey(apiName));
        if (quotaData) {
          this.quotas[apiName] = JSON.parse(quotaData);
        }
      });
    } catch (error) {
      console.warn('Failed to load quota data:', error);
    }
  }

  private saveQuota(apiName: string): void {
    try {
      localStorage.setItem(this.getQuotaKey(apiName), JSON.stringify(this.quotas[apiName]));
    } catch (error) {
      console.warn(`Failed to save quota for ${apiName}:`, error);
    }
  }

  private checkDailyReset(): void {
    const today = new Date().toDateString();
    
    Object.keys(this.quotas).forEach(apiName => {
      const quota = this.quotas[apiName];
      if (quota.lastResetDate !== today) {
        quota.callsToday = 0;
        quota.lastResetDate = today;
        this.saveQuota(apiName);
      }
    });
  }

  private checkMonthlyReset(): void {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    
    Object.keys(this.quotas).forEach(apiName => {
      const quota = this.quotas[apiName];
      const lastMonth = quota.lastResetDate ? 
        `${new Date(quota.lastResetDate).getFullYear()}-${new Date(quota.lastResetDate).getMonth()}` : '';
      
      if (lastMonth !== currentMonth) {
        quota.callsThisMonth = 0;
        this.saveQuota(apiName);
      }
    });
  }

  trackCall(apiName: string): void {
    if (!this.quotas[apiName]) {
      console.warn(`Unknown API: ${apiName}`);
      return;
    }

    this.checkDailyReset();
    this.checkMonthlyReset();

    this.quotas[apiName].callsToday++;
    this.quotas[apiName].callsThisMonth++;
    this.saveQuota(apiName);
  }

  canMakeCall(apiName: string): boolean {
    if (!this.quotas[apiName]) {
      return false;
    }

    this.checkDailyReset();
    this.checkMonthlyReset();

    return this.quotas[apiName].callsToday < this.quotas[apiName].quota;
  }

  getRemainingCalls(apiName: string): number {
    if (!this.quotas[apiName]) {
      return 0;
    }

    this.checkDailyReset();
    this.checkMonthlyReset();

    const remaining = this.quotas[apiName].quota - this.quotas[apiName].callsToday;
    return Math.max(0, remaining);
  }

  resetDailyCounters(): void {
    Object.keys(this.quotas).forEach(apiName => {
      this.quotas[apiName].callsToday = 0;
      this.quotas[apiName].lastResetDate = new Date().toDateString();
      this.saveQuota(apiName);
    });
  }

  resetMonthlyCounters(): void {
    Object.keys(this.quotas).forEach(apiName => {
      this.quotas[apiName].callsThisMonth = 0;
      this.saveQuota(apiName);
    });
  }

  getUsageStats(): APIUsageStats {
    this.checkDailyReset();
    this.checkMonthlyReset();

    return {
      openfoodfacts: {
        callsToday: this.quotas.openfoodfacts.callsToday,
        callsThisMonth: this.quotas.openfoodfacts.callsThisMonth,
        quota: this.quotas.openfoodfacts.quota,
        remaining: this.getRemainingCalls('openfoodfacts')
      },
      fatsecret: {
        callsToday: this.quotas.fatsecret.callsToday,
        callsThisMonth: this.quotas.fatsecret.callsThisMonth,
        quota: this.quotas.fatsecret.quota,
        remaining: this.getRemainingCalls('fatsecret')
      },
      spoonacular: {
        callsToday: this.quotas.spoonacular.callsToday,
        callsThisMonth: this.quotas.spoonacular.callsThisMonth,
        quota: this.quotas.spoonacular.quota,
        remaining: this.getRemainingCalls('spoonacular')
      },
      nutritionix: {
        callsToday: this.quotas.nutritionix.callsToday,
        callsThisMonth: this.quotas.nutritionix.callsThisMonth,
        quota: this.quotas.nutritionix.quota,
        remaining: this.getRemainingCalls('nutritionix')
      },
      usda: {
        callsToday: this.quotas.usda.callsToday,
        callsThisMonth: this.quotas.usda.callsThisMonth,
        quota: this.quotas.usda.quota,
        remaining: this.getRemainingCalls('usda')
      }
    };
  }

  // Get the best available API based on remaining quotas
  getBestAvailableAPI(): string {
    const apis = [
      { name: 'openfoodfacts', priority: 1 },
      { name: 'fatsecret', priority: 2 },
      { name: 'spoonacular', priority: 3 },
      { name: 'nutritionix', priority: 4 },
      { name: 'usda', priority: 5 }
    ];

    // Sort by priority and availability
    const available = apis
      .filter(api => this.canMakeCall(api.name))
      .sort((a, b) => a.priority - b.priority);

    return available.length > 0 ? available[0].name : 'none';
  }

  // Get quota utilization percentage
  getQuotaUtilization(apiName: string): number {
    if (!this.quotas[apiName] || this.quotas[apiName].quota === Infinity) {
      return 0;
    }

    return (this.quotas[apiName].callsToday / this.quotas[apiName].quota) * 100;
  }

  // Check if any API is available
  hasAvailableAPI(): boolean {
    return Object.keys(this.quotas).some(apiName => this.canMakeCall(apiName));
  }

  // Get next reset time
  getNextResetTime(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(DAILY_RESET_HOUR, 0, 0, 0);
    return tomorrow;
  }

  // Clear all quota data
  clearAllQuotas(): void {
    Object.keys(this.quotas).forEach(apiName => {
      localStorage.removeItem(this.getQuotaKey(apiName));
    });
    
    // Reset in-memory data
    this.quotas = {
      openfoodfacts: { callsToday: 0, callsThisMonth: 0, lastResetDate: '', quota: Infinity },
      fatsecret: { callsToday: 0, callsThisMonth: 0, lastResetDate: '', quota: 5000 },
      spoonacular: { callsToday: 0, callsThisMonth: 0, lastResetDate: '', quota: 150 },
      nutritionix: { callsToday: 0, callsThisMonth: 0, lastResetDate: '', quota: 500 },
      usda: { callsToday: 0, callsThisMonth: 0, lastResetDate: '', quota: Infinity }
    };
  }
}
