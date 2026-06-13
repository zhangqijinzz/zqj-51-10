import type { SimulationResult, Product, Scene } from '@/types';

export interface SummaryMetrics {
  totalVisitors: number;
  totalBuyers: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgConversionRate: number;
  avgSpend: number;
}

export interface ProductPerformance {
  productId: string;
  name: string;
  emoji: string;
  totalSold: number;
  remainingStock: number;
  revenue: number;
  profit: number;
  sellThroughRate: number;
}

export interface BusinessSuggestion {
  id: string;
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export class AnalyticsService {
  static calculateSummary(results: SimulationResult[]): SummaryMetrics {
    if (results.length === 0) {
      return {
        totalVisitors: 0,
        totalBuyers: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        avgConversionRate: 0,
        avgSpend: 0,
      };
    }

    const totalVisitors = results.reduce((sum, r) => sum + r.visitors, 0);
    const totalBuyers = results.reduce((sum, r) => sum + r.buyers, 0);
    const totalRevenue = results.reduce((sum, r) => sum + r.revenue, 0);
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    const totalProfit = results.reduce((sum, r) => sum + r.profit, 0);
    const avgConversionRate =
      results.reduce((sum, r) => sum + r.conversionRate, 0) / results.length;
    const avgSpend = totalBuyers > 0 ? totalRevenue / totalBuyers : 0;

    return {
      totalVisitors,
      totalBuyers,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      avgConversionRate: Math.round(avgConversionRate * 100) / 100,
      avgSpend: Math.round(avgSpend * 100) / 100,
    };
  }

  static calculateProductPerformance(
    results: SimulationResult[],
    products: Product[]
  ): ProductPerformance[] {
    const productSalesMap: Record<string, { sold: number; remaining: number }> = {};

    results.forEach((r) => {
      Object.entries(r.productSales).forEach(([pid, sale]) => {
        if (!productSalesMap[pid]) {
          productSalesMap[pid] = { sold: 0, remaining: sale.remaining };
        }
        productSalesMap[pid].sold += sale.sold;
        productSalesMap[pid].remaining = sale.remaining;
      });
    });

    return products
      .map((p) => {
        const sale = productSalesMap[p.id] || { sold: 0, remaining: p.stock };
        const initialStock = p.stock;
        const revenue = sale.sold * p.price;
        const profit = sale.sold * (p.price - p.cost);
        const sellThroughRate = initialStock > 0 ? (sale.sold / initialStock) * 100 : 0;

        return {
          productId: p.id,
          name: p.name,
          emoji: p.emoji,
          totalSold: sale.sold,
          remainingStock: sale.remaining,
          revenue: Math.round(revenue * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          sellThroughRate: Math.round(sellThroughRate * 100) / 100,
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }

  static generateSuggestions(
    results: SimulationResult[],
    products: Product[],
    scene: Scene | null
  ): BusinessSuggestion[] {
    const suggestions: BusinessSuggestion[] = [];
    const summary = this.calculateSummary(results);
    const productPerf = this.calculateProductPerformance(results, products);

    if (summary.totalProfit <= 0) {
      suggestions.push({
        id: 's1',
        icon: '💡',
        title: '利润为负，需要调整',
        description: '当前方案亏损，建议检查成本定价或更换高毛利商品',
        priority: 'high',
      });
    } else if (summary.totalProfit < 100) {
      suggestions.push({
        id: 's2',
        icon: '📈',
        title: '利润空间较低',
        description: '建议增加高利润商品比例或优化定价策略',
        priority: 'medium',
      });
    } else {
      suggestions.push({
        id: 's3',
        icon: '✅',
        title: '盈利状况良好',
        description: `预计利润 ${summary.totalProfit.toFixed(2)} 元，方案可行！`,
        priority: 'low',
      });
    }

    if (summary.avgConversionRate < 10) {
      suggestions.push({
        id: 's4',
        icon: '🎯',
        title: '转化率偏低',
        description: '建议优化摊位陈列，增加招牌和灯带吸引顾客驻足',
        priority: 'high',
      });
    } else if (summary.avgConversionRate > 30) {
      suggestions.push({
        id: 's5',
        icon: '🌟',
        title: '转化率优秀',
        description: `当前转化率 ${summary.avgConversionRate.toFixed(1)}%，顾客购买意愿强`,
        priority: 'low',
      });
    }

    const topProducts = productPerf.slice(0, 3).filter((p) => p.totalSold > 0);
    if (topProducts.length > 0) {
      suggestions.push({
        id: 's6',
        icon: '🏆',
        title: '明星商品',
        description: `热销：${topProducts.map((p) => `${p.emoji}${p.name}`).join('、')}，建议重点推广`,
        priority: 'medium',
      });
    }

    const poorProducts = productPerf.filter((p) => p.sellThroughRate < 20 && p.totalSold < 3);
    if (poorProducts.length > 0) {
      suggestions.push({
        id: 's7',
        icon: '⚠️',
        title: '滞销商品预警',
        description: `${poorProducts.slice(0, 3).map((p) => `${p.emoji}${p.name}`).join('、')} 销量不佳，考虑更换或促销`,
        priority: 'medium',
      });
    }

    if (scene) {
      const matchedTags = products.flatMap((p) =>
        p.tags.filter((t) => scene.preferredTags.includes(t))
      );
      if (matchedTags.length < products.length * 0.5) {
        suggestions.push({
          id: 's8',
          icon: '🎪',
          title: '场景适配度低',
          description: `${scene.name}偏好「${scene.preferredTags.slice(0, 3).join('、')}」类商品，建议增加相关品类`,
          priority: 'high',
        });
      }
    }

    return suggestions.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
  }
}
