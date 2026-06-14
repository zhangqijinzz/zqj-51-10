import type { Product, DiscountRule, DiscountCalculationResult, DiscountApplicationStep, DiscountConflict } from '@/types';

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

  static sortDiscountsByPriority(rules: DiscountRule[]): DiscountRule[] {
    const priorityOrder: Record<string, number> = {
      fixed: 1,
      percentage: 2,
      bundle: 3,
    };
    return [...rules].sort((a, b) => (priorityOrder[a.type] || 99) - (priorityOrder[b.type] || 99));
  }

  static calculateFinalPrice(
    product: Product,
    discountRules: DiscountRule[],
    quantity: number = 1
  ): DiscountCalculationResult {
    const originalPrice = product.price;
    const costPrice = product.cost;
    let currentPrice = originalPrice;
    const steps: DiscountApplicationStep[] = [];

    const priceRules = discountRules.filter((r) => r.type !== 'bundle');
    const sortedRules = this.sortDiscountsByPriority(priceRules);

    sortedRules.forEach((rule) => {
      const stepOriginalPrice = currentPrice;

      if (rule.type === 'fixed') {
        const threshold = rule.threshold || 0;
        if (currentPrice >= threshold) {
          currentPrice = Math.max(0, Math.round((currentPrice - rule.value) * 100) / 100);
          steps.push({
            ruleId: rule.id,
            ruleName: rule.name,
            type: rule.type,
            originalPrice: stepOriginalPrice,
            discountedPrice: currentPrice,
            description: `满 ¥${threshold.toFixed(2)} 减 ¥${rule.value.toFixed(2)}`,
          });
        }
      } else if (rule.type === 'percentage') {
        currentPrice = Math.round(currentPrice * rule.value * 100) / 100;
        const discountPercent = Math.round((1 - rule.value) * 100);
        steps.push({
          ruleId: rule.id,
          ruleName: rule.name,
          type: rule.type,
          originalPrice: stepOriginalPrice,
          discountedPrice: currentPrice,
          description: `${discountPercent}% 折扣（${Math.round(rule.value * 100)}折）`,
        });
      }
    });

    let finalPrice = currentPrice;
    let totalDiscount = originalPrice - finalPrice;
    let unitDiscount = totalDiscount;
    let isBundled = false;
    const bundleRules = discountRules.filter((r) => r.type === 'bundle');

    if (quantity > 1 && bundleRules.length > 0) {
      const bundleRule = bundleRules[0];
      const bundleTotal = this.calculateBundlePrice(currentPrice, bundleRule, quantity);
      const bundleSets = bundleRule.bundleCount
        ? Math.floor(quantity / (bundleRule.bundleCount + bundleRule.value))
        : 0;

      if (bundleSets > 0) {
        const perUnitPrice = bundleTotal / quantity;
        finalPrice = Math.round(perUnitPrice * 100) / 100;
        totalDiscount = originalPrice * quantity - bundleTotal;
        unitDiscount = originalPrice - finalPrice;
        isBundled = true;

        steps.push({
          ruleId: bundleRule.id,
          ruleName: bundleRule.name,
          type: 'bundle',
          originalPrice: currentPrice * quantity,
          discountedPrice: bundleTotal,
          description: `买 ${bundleRule.bundleCount} 送 ${bundleRule.value}（${quantity}件折算单件）`,
        });
      }
    }

    return {
      originalPrice,
      finalPrice,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      unitDiscount: Math.round(unitDiscount * 100) / 100,
      steps,
      belowCost: finalPrice < costPrice,
      costPrice,
      isBundled,
      bundleQuantity: isBundled ? quantity : 1,
    };
  }

  static calculateBundledTotalPrice(
    product: Product,
    discountRules: DiscountRule[],
    quantity: number
  ): { totalPrice: number; unitPrice: number; totalDiscount: number; steps: DiscountApplicationStep[] } {
    const priceRules = discountRules.filter((r) => r.type !== 'bundle');
    const bundleRules = discountRules.filter((r) => r.type === 'bundle');

    const perUnitResult = this.calculateFinalPrice(product, priceRules, 1);
    const priceAfterDiscounts = perUnitResult.finalPrice;
    const steps: DiscountApplicationStep[] = [...perUnitResult.steps];

    let totalPrice = priceAfterDiscounts * quantity;
    let totalDiscount = (product.price - priceAfterDiscounts) * quantity;

    if (quantity > 1 && bundleRules.length > 0) {
      const bundleRule = bundleRules[0];
      const bundleSets = bundleRule.bundleCount
        ? Math.floor(quantity / (bundleRule.bundleCount + bundleRule.value))
        : 0;

      if (bundleSets > 0) {
        const beforeBundleTotal = totalPrice;
        totalPrice = this.calculateBundlePrice(priceAfterDiscounts, bundleRule, quantity);
        const bundleDiscount = beforeBundleTotal - totalPrice;
        totalDiscount += bundleDiscount;

        steps.push({
          ruleId: bundleRule.id,
          ruleName: bundleRule.name,
          type: 'bundle',
          originalPrice: beforeBundleTotal,
          discountedPrice: totalPrice,
          description: `买 ${bundleRule.bundleCount} 送 ${bundleRule.value}（共${quantity}件）`,
        });
      }
    }

    return {
      totalPrice: Math.round(totalPrice * 100) / 100,
      unitPrice: Math.round((totalPrice / quantity) * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      steps,
    };
  }

  static detectConflicts(products: Product[], discountRules: DiscountRule[]): DiscountConflict[] {
    const conflicts: DiscountConflict[] = [];

    if (discountRules.length < 2) return conflicts;

    const fixedRules = discountRules.filter((r) => r.type === 'fixed');
    const percentageRules = discountRules.filter((r) => r.type === 'percentage');
    const bundleRules = discountRules.filter((r) => r.type === 'bundle');

    if (fixedRules.length > 0 && percentageRules.length > 0) {
      const affectedProducts: string[] = [];
      const details: string[] = [];

      products.forEach((product) => {
        const result = this.calculateFinalPrice(product, discountRules);
        if (result.belowCost) {
          affectedProducts.push(product.id);
          details.push(
            `${product.emoji} ${product.name}：原价 ¥${product.price.toFixed(2)}，成本 ¥${product.cost.toFixed(2)}，叠加后到手价 ¥${result.finalPrice.toFixed(2)}（低于成本 ¥${(product.cost - result.finalPrice).toFixed(2)}）`
          );
        }
      });

      if (affectedProducts.length > 0) {
        const allRules = [...fixedRules, ...percentageRules];
        const hasDanger = products.some((p) => {
          const result = this.calculateFinalPrice(p, discountRules);
          return result.finalPrice < p.cost * 0.5;
        });

        conflicts.push({
          ruleIds: allRules.map((r) => r.id),
          severity: hasDanger ? 'danger' : 'warning',
          message: hasDanger
            ? `折扣叠加后 ${affectedProducts.length} 件商品远低于成本价！`
            : `折扣叠加后 ${affectedProducts.length} 件商品低于成本价`,
          affectedProducts,
          details: details.join('\n'),
        });
      }
    }

    if (bundleRules.length > 0 && (fixedRules.length > 0 || percentageRules.length > 0)) {
      const priceDiscounts = [...fixedRules, ...percentageRules];
      conflicts.push({
        ruleIds: [...bundleRules.map((r) => r.id), ...priceDiscounts.map((r) => r.id)],
        severity: 'warning',
        message: '买赠活动与价格类折扣同时生效，请注意核算最终利润',
        affectedProducts: products.map((p) => p.id),
        details: `买赠规则"${bundleRules[0].name}"将与价格折扣同时计算，可能导致利润低于预期。建议单独使用或调整折扣力度。`,
      });
    }

    if (fixedRules.length > 1) {
      conflicts.push({
        ruleIds: fixedRules.map((r) => r.id),
        severity: 'warning',
        message: `同时配置了 ${fixedRules.length} 条满减规则，将按优先级依次叠加`,
        affectedProducts: products.map((p) => p.id),
        details: `满减规则将按门槛从低到高依次应用。当前规则：\n${fixedRules
          .map((r) => `  · ${r.name}：满 ¥${r.threshold} 减 ¥${r.value}`)
          .join('\n')}`,
      });
    }

    if (percentageRules.length > 1) {
      conflicts.push({
        ruleIds: percentageRules.map((r) => r.id),
        severity: 'warning',
        message: `同时配置了 ${percentageRules.length} 条折扣规则，将按比例连续相乘`,
        affectedProducts: products.map((p) => p.id),
        details: `多条折扣规则将依次相乘（如 8折 × 9折 = 72折）。当前规则：\n${percentageRules
          .map((r) => `  · ${r.name}：${Math.round(r.value * 100)}折`)
          .join('\n')}`,
      });
    }

    return conflicts;
  }

  static estimateDiscountedRevenue(
    products: Product[],
    discountRules: DiscountRule[]
  ): {
    totalOriginalRevenue: number;
    totalDiscountedRevenue: number;
    totalDiscount: number;
    perProduct: Record<string, { original: number; discounted: number; discount: number }>;
  } {
    let totalOriginalRevenue = 0;
    let totalDiscountedRevenue = 0;
    const perProduct: Record<string, { original: number; discounted: number; discount: number }> = {};

    products.forEach((p) => {
      if (p.stock <= 0) return;

      const original = p.price * p.stock;
      totalOriginalRevenue += original;

      const bundledResult = this.calculateBundledTotalPrice(p, discountRules, p.stock);
      totalDiscountedRevenue += bundledResult.totalPrice;

      perProduct[p.id] = {
        original: Math.round(original * 100) / 100,
        discounted: Math.round(bundledResult.totalPrice * 100) / 100,
        discount: Math.round((original - bundledResult.totalPrice) * 100) / 100,
      };
    });

    return {
      totalOriginalRevenue: Math.round(totalOriginalRevenue * 100) / 100,
      totalDiscountedRevenue: Math.round(totalDiscountedRevenue * 100) / 100,
      totalDiscount: Math.round((totalOriginalRevenue - totalDiscountedRevenue) * 100) / 100,
      perProduct,
    };
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
      if (!product || qty <= 0) return;

      cost += product.cost * qty;

      const bundledResult = this.calculateBundledTotalPrice(product, discounts, qty);
      revenue += bundledResult.totalPrice;
    });

    return {
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      profit: Math.round((revenue - cost) * 100) / 100,
    };
  }
}
