import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, DollarSign, TrendingUp, ShoppingBag, Award, AlertTriangle, Lightbulb, Play } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { AnalyticsService } from '@/services/AnalyticsService';

const PIE_COLORS = ['#FF8C42', '#FF4D6D', '#7CB518', '#3A86FF', '#FFD700', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function ReviewPanel() {
  const { simulationResults, products, selectedScene, setActiveTab, discountRules } = useAppStore();

  const summary = useMemo(
    () => AnalyticsService.calculateSummary(simulationResults),
    [simulationResults]
  );

  const discountImpact = useMemo(() => {
    if (discountRules.length === 0 || simulationResults.length === 0) return null;

    let totalSold: Record<string, number> = {};
    simulationResults.forEach((r) => {
      Object.entries(r.productSales).forEach(([pid, sale]) => {
        totalSold[pid] = (totalSold[pid] || 0) + sale.sold;
      });
    });

    let theoreticalRevenue = 0;
    let actualRevenue = 0;

    Object.entries(totalSold).forEach(([pid, qty]) => {
      const product = products.find((p) => p.id === pid);
      if (product) {
        theoreticalRevenue += product.price * qty;
      }
    });

    simulationResults.forEach((r) => {
      actualRevenue += r.revenue;
    });

    return {
      theoreticalRevenue: Math.round(theoreticalRevenue * 100) / 100,
      actualRevenue: Math.round(actualRevenue * 100) / 100,
      discountAmount: Math.round((theoreticalRevenue - actualRevenue) * 100) / 100,
    };
  }, [discountRules, simulationResults, products]);

  const productPerf = useMemo(
    () => AnalyticsService.calculateProductPerformance(simulationResults, products),
    [simulationResults, products]
  );

  const suggestions = useMemo(
    () => AnalyticsService.generateSuggestions(simulationResults, products, selectedScene),
    [simulationResults, products, selectedScene]
  );

  const chartData = useMemo(() => {
    return simulationResults.map((r, idx) => ({
      hour: `第${idx + 1}时`,
      访客: r.visitors,
      购买: r.buyers,
      营收: Math.round(r.revenue),
      利润: Math.round(r.profit),
      转化率: r.conversionRate,
    }));
  }, [simulationResults]);

  const productChartData = useMemo(() => {
    return productPerf
      .filter((p) => p.totalSold > 0)
      .slice(0, 8)
      .map((p) => ({
        name: p.name,
        销量: p.totalSold,
        利润: Math.round(p.profit),
        revenue: Math.round(p.revenue),
      }));
  }, [productPerf]);

  const pieData = useMemo(() => {
    return productPerf
      .filter((p) => p.revenue > 0)
      .slice(0, 8)
      .map((p) => ({
        name: p.name,
        value: Math.round(p.revenue),
      }));
  }, [productPerf]);

  if (simulationResults.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center">
            <span className="text-6xl">📊</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">还没有模拟数据</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            前往「客流脚本」模块选择场景并开始模拟经营，即可查看经营数据复盘
          </p>
          <button
            onClick={() => setActiveTab('traffic')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all"
          >
            <Play className="w-4 h-4" />
            开始模拟经营
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">总访客数</p>
                <p className="text-3xl font-bold text-gray-800">{summary.totalVisitors}</p>
                <p className="text-xs text-gray-400 mt-1">累计客流</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">购买人数</p>
                <p className="text-3xl font-bold text-gray-800">{summary.totalBuyers}</p>
                <p className="text-xs text-blue-500 mt-1">
                  转化率 {summary.avgConversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">总营收</p>
                <p className="text-3xl font-bold text-blue-600">¥{summary.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">客单价 ¥{summary.avgSpend.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl p-5 text-white shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/80 mb-1">净利润</p>
                <p className="text-3xl font-bold">¥{summary.totalProfit.toFixed(2)}</p>
                <p className="text-xs text-white/70 mt-1">
                  利润率 {summary.totalRevenue > 0 ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {discountImpact && discountRules.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-lg">🎁</span>
              折扣策略效果分析
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">已启用折扣</p>
                <div className="flex flex-wrap gap-1">
                  {discountRules.map((d) => (
                    <span key={d.id} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">原价营收</p>
                <p className="text-xl font-bold text-gray-700">¥{discountImpact.theoreticalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">折扣让利</p>
                <p className="text-xl font-bold text-red-500">-¥{discountImpact.discountAmount.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">实际营收</p>
                <p className="text-xl font-bold text-purple-600">¥{discountImpact.actualRevenue.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 折扣虽减少了单笔收入，但提升了 {discountRules.length > 0 ? '约10%' : ''} 的转化率和购买意愿，
              实际效果需要结合具体场景评估。
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-lg">📈</span>
              经营趋势
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} stroke="#999" />
                <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #eee',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="营收"
                  stroke="#FF8C42"
                  strokeWidth={3}
                  dot={{ fill: '#FF8C42', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="利润"
                  stroke="#7CB518"
                  strokeWidth={3}
                  dot={{ fill: '#7CB518', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="访客"
                  stroke="#3A86FF"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#3A86FF', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-lg">🏆</span>
              商品销量排行
            </h3>
            {productChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={productChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#999" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="#999"
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #eee',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="销量" fill="#FF8C42" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="利润" fill="#7CB518" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-gray-400">
                暂无销售数据
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-lg">🥧</span>
              营收构成
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`¥${value}`, '营收']}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #eee',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-gray-400">
                暂无数据
              </div>
            )}
            {pieData.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {pieData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm lg:col-span-2">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" />
              商品库存与销售详情
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium">商品</th>
                    <th className="text-center px-4 py-2.5 font-medium">已售</th>
                    <th className="text-center px-4 py-2.5 font-medium">剩余</th>
                    <th className="text-center px-4 py-2.5 font-medium">售罄率</th>
                    <th className="text-center px-4 py-2.5 font-medium">营收</th>
                    <th className="text-center px-4 py-2.5 font-medium">利润</th>
                  </tr>
                </thead>
                <tbody>
                  {productPerf.filter((p) => p.totalSold > 0 || p.remainingStock > 0).slice(0, 8).map((p) => (
                    <tr key={p.productId} className="border-t border-gray-50 hover:bg-orange-50/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{p.emoji}</span>
                          <span className="text-sm font-medium text-gray-800">{p.name}</span>
                        </div>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className="text-sm font-bold text-orange-600">{p.totalSold}</span>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className="text-sm text-gray-600">{p.remainingStock}</span>
                      </td>
                      <td className="text-center px-4 py-3">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, p.sellThroughRate)}%`,
                                backgroundColor:
                                  p.sellThroughRate >= 80
                                    ? '#10B981'
                                    : p.sellThroughRate >= 50
                                    ? '#F59E0B'
                                    : '#EF4444',
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-left">
                            {p.sellThroughRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className="text-sm font-medium text-blue-600">¥{p.revenue.toFixed(2)}</span>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className="text-sm font-bold text-green-600">¥{p.profit.toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            经营建议
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((s) => {
              const priorityStyles = {
                high: 'border-red-200 bg-red-50',
                medium: 'border-orange-200 bg-orange-50',
                low: 'border-green-200 bg-green-50',
              };
              const priorityIcon = {
                high: <AlertTriangle className="w-5 h-5 text-red-500" />,
                medium: <Lightbulb className="w-5 h-5 text-orange-500" />,
                low: <Award className="w-5 h-5 text-green-500" />,
              };
              return (
                <div
                  key={s.id}
                  className={`p-4 rounded-xl border ${priorityStyles[s.priority]} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{s.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {priorityIcon[s.priority]}
                        <h4 className="font-bold text-gray-800 text-sm">{s.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{s.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
