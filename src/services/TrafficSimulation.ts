import type { Product, Scene, SimulationResult, StallItem, DiscountRule } from '@/types';
import { PricingService } from './PricingService';

interface SimulationContext {
  products: Product[];
  stallItems: StallItem[];
  scene: Scene;
  startHour: number;
  totalHours: number;
  discountRules: DiscountRule[];
}

export class TrafficSimulation {
  private static isPeakHour(scene: Scene, hour: number): boolean {
    return scene.peakHours.some(([start, end]) => hour >= start && hour <= end);
  }

  private static calculateHourlyTraffic(scene: Scene, hour: number): number {
    let base = scene.trafficPerHour;
    if (this.isPeakHour(scene, hour)) {
      base *= 1.8;
    } else {
      base *= 0.6;
    }
    const variance = 0.8 + Math.random() * 0.4;
    return Math.floor(base * variance);
  }

  private static calculateTagMatchScore(product: Product, scene: Scene): number {
    const matched = product.tags.filter((tag) =>
      scene.preferredTags.includes(tag)
    ).length;
    return matched / Math.max(product.tags.length, 1);
  }

  private static calculatePriceScore(product: Product, scene: Scene, discountRules: DiscountRule[]): number {
    const avgPrice = scene.avgSpend / 2;
    let effectivePrice = product.price;

    if (discountRules.length > 0) {
      const percentageDiscount = discountRules.find((d) => d.type === 'percentage');
      if (percentageDiscount) {
        effectivePrice = PricingService.applyDiscount(product.price, percentageDiscount);
      }
    }

    const priceRatio = effectivePrice / avgPrice;
    const sensitivity = scene.priceSensitivity;
    if (priceRatio <= 1) {
      return 1 - sensitivity * 0.2 + (discountRules.length > 0 ? 0.1 : 0);
    }
    return Math.max(0, 1 - sensitivity * (priceRatio - 1) * 0.5 + (discountRules.length > 0 ? 0.05 : 0));
  }

  private static calculateDisplayBonus(stallItems: StallItem[], productId: string): number {
    const productOnDisplay = stallItems.some(
      (item) => item.type === 'product' && item.productId === productId
    );
    const hasSignboard = stallItems.some((item) => item.type === 'signboard');
    const hasLighting = stallItems.some((item) => item.type === 'lightstrip');
    const hasPricetag = stallItems.some((item) => item.type === 'pricetag');

    let bonus = 1;
    if (productOnDisplay) bonus += 0.3;
    if (hasSignboard) bonus += 0.15;
    if (hasLighting) bonus += 0.1;
    if (hasPricetag) bonus += 0.05;
    return bonus;
  }

  private static selectProductsToBuy(
    visitors: number,
    context: SimulationContext
  ): Record<string, number> {
    const { products, scene, stallItems, discountRules } = context;
    const soldQuantities: Record<string, number> = {};

    const availableProducts = products.filter((p) => p.stock > 0);
    if (availableProducts.length === 0) return soldQuantities;

    const productScores: { product: Product; score: number }[] = availableProducts.map(
      (product) => {
        const tagScore = this.calculateTagMatchScore(product, scene);
        const priceScore = this.calculatePriceScore(product, scene, discountRules);
        const displayBonus = this.calculateDisplayBonus(stallItems, product.id);
        const score = (tagScore * 0.4 + priceScore * 0.3 + 0.3) * displayBonus;
        return { product, score };
      }
    );

    const totalScore = productScores.reduce((sum, ps) => sum + ps.score, 0);

    const buyers = Math.floor(visitors * scene.stayRate * (discountRules.length > 0 ? 1.1 : 1));

    for (let i = 0; i < buyers; i++) {
      const itemsCount = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < itemsCount; j++) {
        let random = Math.random() * totalScore;
        for (const ps of productScores) {
          random -= ps.score;
          if (random <= 0) {
            const currentSold = soldQuantities[ps.product.id] || 0;
            if (currentSold < ps.product.stock) {
              soldQuantities[ps.product.id] = currentSold + 1;
            }
            break;
          }
        }
      }
    }

    return soldQuantities;
  }

  static simulateHour(context: SimulationContext, currentHour: number): SimulationResult {
    const { products, scene, startHour, discountRules } = context;
    const absoluteHour = (startHour + currentHour) % 24;

    const visitors = this.calculateHourlyTraffic(scene, absoluteHour);
    const soldQuantities = this.selectProductsToBuy(visitors, context);

    const { revenue, cost, profit } = PricingService.calculateTotalRevenue(
      products,
      soldQuantities,
      discountRules
    );

    const totalSold = Object.values(soldQuantities).reduce((sum, q) => sum + q, 0);
    const buyers = Object.keys(soldQuantities).length > 0
      ? Math.floor(visitors * scene.stayRate * (0.7 + Math.random() * 0.3))
      : 0;

    const productSales: Record<string, { sold: number; remaining: number }> = {};
    products.forEach((p) => {
      const sold = soldQuantities[p.id] || 0;
      productSales[p.id] = {
        sold,
        remaining: Math.max(0, p.stock - sold),
      };
    });

    return {
      timestamp: Date.now() + currentHour * 3600000,
      hour: currentHour,
      visitors,
      buyers,
      revenue,
      cost,
      profit,
      productSales,
      conversionRate: visitors > 0 ? Math.round((buyers / visitors) * 10000) / 100 : 0,
    };
  }

  static runSimulation(
    products: Product[],
    stallItems: StallItem[],
    scene: Scene,
    discountRules: DiscountRule[] = [],
    startHour: number = 18,
    totalHours: number = 4
  ): SimulationResult[] {
    const results: SimulationResult[] = [];
    const context: SimulationContext = {
      products,
      stallItems,
      scene,
      startHour,
      totalHours,
      discountRules,
    };

    let currentProducts = [...products];

    for (let hour = 0; hour < totalHours; hour++) {
      const result = this.simulateHour({ ...context, products: currentProducts }, hour);
      results.push(result);

      currentProducts = currentProducts.map((p) => {
        const sale = result.productSales[p.id];
        return sale ? { ...p, stock: sale.remaining } : p;
      });
    }

    return results;
  }
}
