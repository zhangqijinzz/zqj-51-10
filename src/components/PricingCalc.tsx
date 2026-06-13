import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2, Percent, Banknote, Package2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { PricingService } from '@/services/PricingService';
import type { DiscountRule } from '@/types';

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

  const stats = useMemo(() => {
    let totalCost = 0;
    let totalRevenue = 0;
    let totalStock = 0;

    products.forEach((p) => {
      totalCost += p.cost * p.stock;
      totalRevenue += p.price * p.stock;
      totalStock += p.stock;
    });

    const totalProfit = totalRevenue - totalCost;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      avgMargin: Math.round(avgMargin * 100) / 100,
      totalStock,
      productCount: products.length,
    };
  }, [products]);

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

  return (
    <div className="flex h-full bg-gray-50">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                <Banknote className="w-3.5 h-3.5" />
                总成本
              </div>
              <p className="text-2xl font-bold text-gray-800">¥{stats.totalCost.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.productCount} 种商品 · {stats.totalStock} 件库存</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                <TrendingUp className="w-3.5 h-3.5" />
                预计营收
              </div>
              <p className="text-2xl font-bold text-blue-600">¥{stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">按全售罄计算</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                预计利润
              </div>
              <p className="text-2xl font-bold text-green-600">¥{stats.totalProfit.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-500">毛利率 {stats.avgMargin.toFixed(1)}%</span>
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

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">💰 商品定价</h3>
              <span className="text-xs text-gray-400">点击数字可编辑</span>
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
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const profit = PricingService.calculateGrossProfit(product);
                    const margin = PricingService.calculateGrossMargin(product);
                    const suggestedPrice = PricingService.calculateProfitMargin(product, targetMargin);

                    return (
                      <tr key={product.id} className="border-t border-gray-50 hover:bg-orange-50/30 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{product.emoji}</span>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{product.name}</p>
                              <div className="flex gap-1 mt-0.5">
                                {product.tags.slice(0, 2).map((tag) => (
                                  <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
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
                          <span className={`text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                            onClick={() => updateProduct(product.id, { price: Math.round(suggestedPrice * 100) / 100 })}
                            className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full hover:bg-orange-200 transition-colors"
                          >
                            ¥{suggestedPrice.toFixed(2)}
                          </button>
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

        <div className="p-4 space-y-2 border-b border-gray-200 max-h-48 overflow-y-auto">
          {discountRules.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">暂无折扣，点击右上角添加</p>
          )}
          {discountRules.map((rule) => (
            <div
              key={rule.id}
              onClick={() => setActiveDiscount(rule.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                activeDiscount === rule.id
                  ? 'bg-orange-50 border-orange-300'
                  : 'bg-gray-50 border-transparent hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
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
                  onChange={(e) => updateDiscountRule(activeRule.id, { value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">0.8 表示 8 折</p>
              </div>
            )}

            {activeRule.type === 'fixed' && (
              <>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">满减门槛 (¥)</label>
                  <input
                    type="number"
                    value={activeRule.threshold || 0}
                    onChange={(e) => updateDiscountRule(activeRule.id, { threshold: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">减免金额 (¥)</label>
                  <input
                    type="number"
                    value={activeRule.value}
                    onChange={(e) => updateDiscountRule(activeRule.id, { value: parseFloat(e.target.value) })}
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
                    onChange={(e) => updateDiscountRule(activeRule.id, { bundleCount: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">赠送数量</label>
                  <input
                    type="number"
                    value={activeRule.value}
                    onChange={(e) => updateDiscountRule(activeRule.id, { value: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
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
    </div>
  );
}
