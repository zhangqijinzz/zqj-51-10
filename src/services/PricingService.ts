import type { Product, DiscountRule } from '@/types';

export class PricingService {
  static calculateGrossProfit(product: Product): number {
    return product.price - product.cost;
  }

  static calculateGrossMargin(product: Product): number {
    if (product.price === 0) return 0;
    return ((product.price - product.cost) / product.price) * 100;
  }

  static calculateProfitMargin(product: Product, targetMargin: number): number {
    return product.cost / (1 - targetMargin / 100);
  }

  static applyDiscount(price: number, rule: DiscountRule): number {
    switch (rule.type) {
      case 'percentage':
        return Math.round(price * rule.value * 100) / 100;
      case 'fixed':
        return Math.max(0, Math.round((price - rule.value) * 100) / 100);
      case 'bundle':
        return price;
      default:
        return price;
    }
  }

  static calculateBundlePrice(price: number, rule: DiscountRule, quantity: number): number {
    if (rule.type !== 'bundle' || !rule.bundleCount) return price * quantity;
    const bundleSets = Math.floor(quantity / (rule.bundleCount + rule.value));
    const remainder = quantity % (rule.bundleCount + rule.value);
    return (bundleSets * rule.bundleCount + remainder) * price;
  }

  static calculateTotalRevenue(
    products: Product[],
    soldQuantities: Record<string, number>,
    discounts: DiscountRule[] = []
  ): { revenue: number; cost: number; profit: number } {
    let revenue = 0;
    let cost = 0;

    Object.entries(soldQuantities).forEach(([productId, qty]) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      cost += product.cost * qty;

      let itemRevenue = product.price * qty;
      discounts.forEach((rule) => {
        if (rule.type === 'bundle') {
          itemRevenue = PricingService.calculateBundlePrice(product.price, rule, qty);
        } else {
          itemRevenue = PricingService.applyDiscount(itemRevenue, rule);
        }
      });

      revenue += itemRevenue;
    });

    return {
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      profit: Math.round((revenue - cost) * 100) / 100,
    };
  }
}
