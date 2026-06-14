import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Trash2,
  Percent,
  Banknote,
  Package2,
  AlertTriangle,
  X,
  Tag,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { PricingService } from '@/services/PricingService';
import type { DiscountRule, DiscountConflict, DiscountCalculationResult } from '@/types';

function generateId() {
  return `discount-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function PricingCalc() {
  const {
    products,
    updateProduct,
    discountRules,
    addDiscountRule,
    updateDiscountRule,
    removeDiscountRule,
  } = useAppStore();

  const [activeDiscount, setActiveDiscount] = useState<string | null>(
    discountRules[0]?.id || null
  );
  const [targetMargin, setTargetMargin] = useState(60);
  const [selectedConflict, setSelectedConflict] = useState<DiscountConflict | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedProductDiscount, setSelectedProductDiscount] = useState<{
    productId: string;
    result: DiscountCalculationResult;
  } | null>(null);

  const conflicts = useMemo(() => {
    return PricingService.detectConflicts(products, discountRules);
  }, [products, discountRules]);

  const priceResults = useMemo(() => {
    const map: Record<string, DiscountCalculationResult> = {};
    const bundleRules = discountRules.filter((r) => r.type === 'bundle');
    const hasBundle = bundleRules.length > 0;

    products.forEach((p) => {
      if (hasBundle && p.stock > 1) {
        const bundleRule = bundleRules[0];
        const minBundleQty = (bundleRule.bundleCount || 2) + bundleRule.value;
        if (p.stock >= minBundleQty) {
          const calcQty = Math.min(p.stock, Math.max(minBundleQty, 3));
          map[p.id] = PricingService.calculateFinalPrice(p, discountRules, calcQty);
        } else {
          map[p.id] = PricingService.calculateFinalPrice(p, discountRules, 1);
        }
      } else {
        map[p.id] = PricingService.calculateFinalPrice(p, discountRules, 1);
      }
    });
    return map;
  }, [products, discountRules]);

  const discountRevenueEstimate = useMemo(() => {
    return PricingService.estimateDiscountedRevenue(products, discountRules);
  }, [products, discountRules]);

  const stats = useMemo(() => {
    let totalCost = 0;
    let totalStock = 0;

    products.forEach((p) => {
      totalCost += p.cost * p.stock;
      totalStock += p.stock;
    });

    const totalRevenue = discountRevenueEstimate.totalOriginalRevenue;
    const totalDiscountedRevenue = discountRevenueEstimate.totalDiscountedRevenue;
    const totalDiscount = discountRevenueEstimate.totalDiscount;
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      totalRevenue,
      totalProfit: Math.round(totalProfit * 100) / 100,
      avgMargin: Math.round(avgMargin * 100) / 100,
      totalStock,
      productCount: products.length,
      totalDiscountedRevenue,
      totalDiscount,
    };
  }, [products, discountRevenueEstimate]);

  const addNewDiscount = () => {
    const rule: DiscountRule = {
      id: generateId(),
      type: 'percentage',
      name: '新折扣',
      value: 0.9,
    };
    addDiscountRule(rule);
    setActiveDiscount(rule.id);
  };

  const activeRule = discountRules.find((r) => r.id === activeDiscount);

  const openConflictDetail = (conflict: DiscountConflict) => {
    setSelectedConflict(conflict);
    setShowConflictModal(true);
  };

  return (
    <div className="flex h-full bg-gray-50">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                <Banknote className="w-3.5 h-3.5" />
                总成本
              </div>
              <p className="text-2xl font-bold text-gray-800">¥{stats.totalCost.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.productCount} 种商品 · {stats.totalStock} 件库存
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                <TrendingUp className="w-3.5 h-3.5" />
                原价营收
              </div>
              <p className="text-2xl font-bold text-gray-700">¥{stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">按全售罄计算</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                <Tag className="w-3.5 h-3.5 text-orange-500" />
                折扣后营收
              </div>
              <p className="text-2xl font-bold text-orange-600">
                ¥{stats.totalDiscountedRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-orange-500 mt-1">
                预计优惠 ¥{stats.totalDiscount.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                折扣后利润
              </div>
              <p
                className={`text-2xl font-bold ${
                  stats.totalDiscountedRevenue - stats.totalCost >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                ¥{(stats.totalDiscountedRevenue - stats.totalCost).toFixed(2)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp
                  className={`w-3 h-3 ${
                    stats.totalDiscountedRevenue - stats.totalCost >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                />
                <span
                  className={`text-xs ${
                    stats.totalDiscountedRevenue - stats.totalCost >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  毛利率{' '}
                  {(
                    stats.totalDiscountedRevenue > 0
                      ? ((stats.totalDiscountedRevenue - stats.totalCost) /
                          stats.totalDiscountedRevenue) *
                        100
                      : 0
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl p-4 text-white shadow-md">
              <div className="flex items-center gap-2 text-white/80 text-xs mb-2">
                <Percent className="w-3.5 h-3.5" />
                目标利润率
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={targetMargin}
                onChange={(e) => setTargetMargin(parseInt(e.target.value))}
                className="w-full accent-white"
              />
              <p className="text-xl font-bold mt-1">{targetMargin}%</p>
            </div>
          </div>

          {conflicts.length > 0 && (
            <div className="mb-4 space-y-2">
              {conflicts.map((conflict, idx) => (
                <div
                  key={idx}
                  onClick={() => openConflictDetail(conflict)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                    conflict.severity === 'danger'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 flex-shrink-0 ${
                      conflict.severity === 'danger' ? 'text-red-500' : 'text-yellow-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        conflict.severity === 'danger' ? 'text-red-700' : 'text-yellow-700'
                      }`}
                    >
                      {conflict.message}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        conflict.severity === 'danger' ? 'text-red-500' : 'text-yellow-600'
                      }`}
                    >
                      点击查看冲突详情
                    </p>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 flex-shrink-0 ${
                      conflict.severity === 'danger' ? 'text-red-400' : 'text-yellow-400'
                    }`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">💰 商品定价</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">折扣计算顺序：先满减 → 后折扣</span>
                <Info className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="text-left px-6 py-3 font-medium">商品</th>
                    <th className="text-center px-4 py-3 font-medium">分类</th>
                    <th className="text-center px-4 py-3 font-medium">成本价</th>
                    <th className="text-center px-4 py-3 font-medium">售价</th>
                    <th className="text-center px-4 py-3 font-medium">单件利润</th>
                    <th className="text-center px-4 py-3 font-medium">毛利率</th>
                    <th className="text-center px-4 py-3 font-medium">库存</th>
                    <th className="text-center px-4 py-3 font-medium">建议售价</th>
                    <th className="text-center px-4 py-3 font-medium bg-orange-50">预估到手价</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const profit = PricingService.calculateGrossProfit(product);
                    const margin = PricingService.calculateGrossMargin(product);
                    const suggestedPrice = PricingService.calculateProfitMargin(
                      product,
                      targetMargin
                    );
                    const discountResult = priceResults[product.id];

                    return (
                      <tr
                        key={product.id}
                        className="border-t border-gray-50 hover:bg-orange-50/30 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{product.emoji}</span>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{product.name}</p>
                              <div className="flex gap-1 mt-0.5">
                                {product.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                            {product.category}
                          </span>
                        </td>
                        <td className="text-center px-4 py-3">
                          <input
                            type="number"
                            value={product.cost}
                            onChange={(e) =>
                              updateProduct(product.id, {
                                cost: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-16 text-center text-sm border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                          />
                        </td>
                        <td className="text-center px-4 py-3">
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) =>
                              updateProduct(product.id, {
                                price: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-16 text-center text-sm font-bold text-orange-600 border border-orange-200 rounded px-2 py-1 focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-orange-50"
                          />
                        </td>
                        <td className="text-center px-4 py-3">
                          <span
                            className={`text-sm font-bold ${
                              profit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {profit >= 0 ? '+' : ''}¥{profit.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-flex items-center gap-1">
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 ml-1">{margin.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <input
                            type="number"
                            value={product.stock}
                            onChange={(e) =>
                              updateProduct(product.id, {
                                stock: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-14 text-center text-sm border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                          />
                        </td>
                        <td className="text-center px-4 py-3">
                          <button
                            onClick={() =>
                              updateProduct(product.id, {
                                price: Math.round(suggestedPrice * 100) / 100,
                              })
                            }
                            className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full hover:bg-orange-200 transition-colors"
                          >
                            ¥{suggestedPrice.toFixed(2)}
                          </button>
                        </td>
                        <td className="text-center px-4 py-3 bg-orange-50/50">
                          <div
                            onClick={() =>
                              discountResult &&
                              discountResult.steps.length > 0 &&
                              setSelectedProductDiscount({
                                productId: product.id,
                                result: discountResult,
                              })
                            }
                            className={
                              discountResult && discountResult.steps.length > 0
                                ? 'cursor-pointer'
                                : ''
                            }
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span
                                className={`text-sm font-bold ${
                                  discountResult?.belowCost ? 'text-red-600' : 'text-orange-600'
                                }`}
                              >
                                ¥{discountResult?.finalPrice.toFixed(2) || product.price.toFixed(2)}
                              </span>
                              {discountResult && discountResult.steps.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-orange-500 line-through">
                                    ¥{product.price.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-green-600">
                                    省¥{discountResult.unitDiscount.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {discountResult?.isBundled && (
                                <span className="text-[10px] text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">
                                  买{discountResult.bundleQuantity}件折算
                                </span>
                              )}
                              {discountResult?.belowCost && (
                                <span className="text-[10px] text-red-500 flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3" />
                                  低于成本
                                </span>
                              )}
                              {discountResult && discountResult.steps.length > 0 && (
                                <span className="text-[10px] text-gray-400">点击查看明细</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Package2 className="w-4 h-4 text-orange-500" />
            折扣策略
          </h3>
          <button
            onClick={addNewDiscount}
            className="p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {discountRules.length > 0 && (
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <Info className="w-3 h-3" />
              <span>应用顺序：先满减 → 后折扣 → 买赠叠加</span>
            </div>
          </div>
        )}

        <div className="p-4 space-y-2 border-b border-gray-200 max-h-48 overflow-y-auto">
          {discountRules.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">暂无折扣，点击右上角添加</p>
          )}
          {discountRules.map((rule, index) => (
            <div
              key={rule.id}
              onClick={() => setActiveDiscount(rule.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all border relative ${
                activeDiscount === rule.id
                  ? 'bg-orange-50 border-orange-300'
                  : 'bg-gray-50 border-transparent hover:bg-gray-100'
              }`}
            >
              <div className="absolute top-2 left-2 w-5 h-5 bg-orange-100 text-orange-600 rounded-full text-[10px] flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="flex items-center justify-between pl-5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{rule.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {rule.type === 'percentage' && `${Math.round(rule.value * 100)}% 折扣`}
                    {rule.type === 'fixed' && `满 ¥${rule.threshold} 减 ¥${rule.value}`}
                    {rule.type === 'bundle' && `买 ${rule.bundleCount} 送 ${rule.value}`}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDiscountRule(rule.id);
                    if (activeDiscount === rule.id) setActiveDiscount(null);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {activeRule && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <h4 className="text-sm font-bold text-gray-700">编辑折扣</h4>

            <div>
              <label className="text-xs text-gray-500 block mb-1">折扣名称</label>
              <input
                type="text"
                value={activeRule.name}
                onChange={(e) => updateDiscountRule(activeRule.id, { name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">折扣类型</label>
              <div className="grid grid-cols-3 gap-1">
                {(['percentage', 'fixed', 'bundle'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateDiscountRule(activeRule.id, { type })}
                    className={`py-1.5 text-xs rounded-lg transition-colors ${
                      activeRule.type === type
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {{ percentage: '折扣%', fixed: '满减', bundle: '买送' }[type]}
                  </button>
                ))}
              </div>
            </div>

            {activeRule.type === 'percentage' && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">折扣比例 (0-1)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={activeRule.value}
                  onChange={(e) =>
                    updateDiscountRule(activeRule.id, { value: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  0.8 表示 8 折，相当于优惠 {Math.round((1 - activeRule.value) * 100)}%
                </p>
              </div>
            )}

            {activeRule.type === 'fixed' && (
              <>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">满减门槛 (¥)</label>
                  <input
                    type="number"
                    value={activeRule.threshold || 0}
                    onChange={(e) =>
                      updateDiscountRule(activeRule.id, { threshold: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">减免金额 (¥)</label>
                  <input
                    type="number"
                    value={activeRule.value}
                    onChange={(e) =>
                      updateDiscountRule(activeRule.id, { value: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {activeRule.type === 'bundle' && (
              <>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">购买数量</label>
                  <input
                    type="number"
                    value={activeRule.bundleCount || 2}
                    onChange={(e) =>
                      updateDiscountRule(activeRule.id, { bundleCount: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">赠送数量</label>
                  <input
                    type="number"
                    value={activeRule.value}
                    onChange={(e) =>
                      updateDiscountRule(activeRule.id, { value: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    买 {activeRule.bundleCount || 2} 送 {activeRule.value}，相当于{' '}
                    {(((activeRule.bundleCount || 2) / ((activeRule.bundleCount || 2) + activeRule.value)) * 100).toFixed(0)}
                    折
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {!activeRule && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-gray-400">
              <p className="text-4xl mb-2">🎁</p>
              <p className="text-sm">选择或添加折扣</p>
            </div>
          </div>
        )}
      </div>

      {showConflictModal && selectedConflict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div
              className={`p-5 border-b ${
                selectedConflict.severity === 'danger'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`w-6 h-6 mt-0.5 ${
                      selectedConflict.severity === 'danger' ? 'text-red-500' : 'text-yellow-500'
                    }`}
                  />
                  <div>
                    <h3
                      className={`font-bold ${
                        selectedConflict.severity === 'danger' ? 'text-red-700' : 'text-yellow-700'
                      }`}
                    >
                      {selectedConflict.severity === 'danger' ? '严重冲突警告' : '折扣冲突提示'}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        selectedConflict.severity === 'danger' ? 'text-red-600' : 'text-yellow-600'
                      }`}
                    >
                      {selectedConflict.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowConflictModal(false);
                    setSelectedConflict(null);
                  }}
                  className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <h4 className="text-sm font-bold text-gray-700 mb-3">冲突详情</h4>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-600">
                {selectedConflict.details}
              </div>

              <h4 className="text-sm font-bold text-gray-700 mt-4 mb-3">涉及的折扣规则</h4>
              <div className="space-y-2">
                {selectedConflict.ruleIds.map((ruleId) => {
                  const rule = discountRules.find((r) => r.id === ruleId);
                  if (!rule) return null;
                  return (
                    <div
                      key={ruleId}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Tag className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{rule.name}</p>
                        <p className="text-xs text-gray-500">
                          {rule.type === 'percentage' && `${Math.round(rule.value * 100)}% 折扣`}
                          {rule.type === 'fixed' && `满 ¥${rule.threshold} 减 ¥${rule.value}`}
                          {rule.type === 'bundle' && `买 ${rule.bundleCount} 送 ${rule.value}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-bold text-blue-700 flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  折扣计算规则
                </h4>
                <ul className="mt-2 space-y-1 text-xs text-blue-600">
                  <li>• 满减规则优先计算，达到门槛即可减免</li>
                  <li>• 百分比折扣在满减后价格基础上计算</li>
                  <li>• 买赠规则按购买数量折算单价，与价格折扣叠加</li>
                  <li>• 多同类型折扣按配置顺序依次叠加</li>
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowConflictModal(false);
                  setSelectedConflict(null);
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProductDiscount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">折扣计算明细</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {products.find((p) => p.id === selectedProductDiscount.productId)?.emoji}{' '}
                    {products.find((p) => p.id === selectedProductDiscount.productId)?.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProductDiscount(null)}
                  className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="space-y-2">
                {selectedProductDiscount.result.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-orange-600">{idx + 1}</span>
                    </div>
                    <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{step.ruleName}</span>
                        <span className="text-xs text-gray-400">
                          {
                            { percentage: '折扣%', fixed: '满减', bundle: '买赠' }[
                              step.type
                            ]
                          }
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-gray-500">
                          ¥{step.originalPrice.toFixed(2)}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-300" />
                        <span className="text-sm font-bold text-orange-600">
                          ¥{step.discountedPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">商品原价</span>
                  <span className="text-sm text-gray-700 line-through">
                    ¥{selectedProductDiscount.result.originalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">商品成本</span>
                  <span className="text-sm text-gray-700">
                    ¥{selectedProductDiscount.result.costPrice.toFixed(2)}
                  </span>
                </div>
                {selectedProductDiscount.result.isBundled && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">折算数量</span>
                    <span className="text-sm text-purple-600">
                      {selectedProductDiscount.result.bundleQuantity} 件
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {selectedProductDiscount.result.isBundled ? '单件优惠' : '优惠金额'}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    -¥{selectedProductDiscount.result.unitDiscount.toFixed(2)}
                  </span>
                </div>
                {selectedProductDiscount.result.isBundled && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">总优惠</span>
                    <span className="text-sm font-medium text-green-600">
                      -¥{selectedProductDiscount.result.totalDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
                  <span className="text-sm font-bold text-gray-800">预估到手价</span>
                  <span
                    className={`text-xl font-bold ${
                      selectedProductDiscount.result.belowCost ? 'text-red-600' : 'text-orange-600'
                    }`}
                  >
                    ¥{selectedProductDiscount.result.finalPrice.toFixed(2)}
                  </span>
                </div>
                {selectedProductDiscount.result.belowCost && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg mt-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600">
                      当前到手价已低于成本价，每件亏损 ¥
                      {(
                        selectedProductDiscount.result.costPrice -
                        selectedProductDiscount.result.finalPrice
                      ).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedProductDiscount(null)}
                className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
