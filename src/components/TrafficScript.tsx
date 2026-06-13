import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Users, DollarSign, Eye } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { scenes } from '@/data/scenes';
import { TrafficSimulation } from '@/services/TrafficSimulation';
import type { Scene, SimulationResult } from '@/types';

export default function TrafficScript() {
  const {
    products,
    stallItems,
    selectedScene,
    setSelectedScene,
    simulationResults,
    addSimulationResult,
    clearSimulationResults,
    isSimulating,
    setSimulating,
    simulationHours,
    setSimulationHours,
    setActiveTab,
    discountRules,
  } = useAppStore();

  const [currentHour, setCurrentHour] = useState(0);
  const [progress, setProgress] = useState(0);
  const [liveResult, setLiveResult] = useState<SimulationResult | null>(null);
  const [startHour, setStartHour] = useState(18);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<number | null>(null);
  const customerAnimRef = useRef<HTMLDivElement>(null);
  const [customers, setCustomers] = useState<{ id: number; emoji: string; x: number; delay: number }[]>([]);

  const customerEmojis = ['👩', '👨', '👧', '👦', '🧑', '👵', '👴', '👱‍♀️', '👨‍🎓', '👩‍🎓'];

  const startSimulation = () => {
    if (!selectedScene) return;

    if (simulationResults.length > 0 && !isSimulating) {
      clearSimulationResults();
      setCurrentHour(0);
      setProgress(0);
    }

    setSimulating(true);

    const results = TrafficSimulation.runSimulation(
      products,
      stallItems,
      selectedScene,
      discountRules,
      startHour,
      simulationHours
    );

    let hourIndex = simulationResults.length;

    const runHour = () => {
      if (hourIndex >= simulationHours) {
        setSimulating(false);
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      const result = results[hourIndex];
      if (result) {
        addSimulationResult(result);
        setLiveResult(result);
        setCurrentHour(hourIndex + 1);
        setProgress(((hourIndex + 1) / simulationHours) * 100);

        const newCustomers = Array.from({ length: Math.min(20, Math.floor(result.visitors / 10)) }).map((_, i) => ({
          id: Date.now() + i,
          emoji: customerEmojis[Math.floor(Math.random() * customerEmojis.length)],
          x: Math.random() * 100,
          delay: Math.random() * 2,
        }));
        setCustomers((prev) => [...prev.slice(-30), ...newCustomers]);
      }

      hourIndex++;
    };

    runHour();
    timerRef.current = window.setInterval(runHour, 2000 / speed);
  };

  const pauseSimulation = () => {
    setSimulating(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetSimulation = () => {
    pauseSimulation();
    clearSimulationResults();
    setCurrentHour(0);
    setProgress(0);
    setLiveResult(null);
    setCustomers([]);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatHour = (h: number) => {
    const absolute = (startHour + h) % 24;
    return `${absolute.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="flex h-full bg-gray-50">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3">🎪 选择经营场景</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {scenes.map((scene: Scene) => {
                const isSelected = selectedScene?.id === scene.id;
                return (
                  <div
                    key={scene.id}
                    onClick={() => setSelectedScene(scene)}
                    className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
                      isSelected
                        ? 'ring-4 ring-orange-400 scale-[1.02] shadow-xl'
                        : 'hover:scale-[1.02] hover:shadow-lg'
                    }`}
                    style={{ backgroundColor: scene.bgColor }}
                  >
                    <div className="p-5 text-white">
                      <div className="text-4xl mb-2">{scene.emoji}</div>
                      <h4 className="font-bold text-lg mb-1">{scene.name}</h4>
                      <p className="text-xs text-white/70 mb-3 leading-relaxed">{scene.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {scene.preferredTags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="px-5 py-3 bg-black/30 backdrop-blur-sm text-xs text-white/90 grid grid-cols-3 gap-2">
                      <div>
                        <span className="block text-white/60 text-[10px]">客流/h</span>
                        <span className="font-bold">{scene.trafficPerHour}</span>
                      </div>
                      <div>
                        <span className="block text-white/60 text-[10px]">驻足率</span>
                        <span className="font-bold">{Math.round(scene.stayRate * 100)}%</span>
                      </div>
                      <div>
                        <span className="block text-white/60 text-[10px]">客单价</span>
                        <span className="font-bold">¥{scene.avgSpend}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedScene && (
            <div
              className="rounded-xl overflow-hidden border border-gray-200 shadow-lg"
              style={{ backgroundColor: selectedScene.bgColor }}
            >
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

                <div
                  ref={customerAnimRef}
                  className="absolute bottom-0 left-0 right-0 h-32"
                >
                  {customers.map((c) => (
                    <span
                      key={c.id}
                      className="absolute text-2xl animate-bounce"
                      style={{
                        left: `${c.x}%`,
                        bottom: `${Math.random() * 60}px`,
                        animationDelay: `${c.delay}s`,
                        animationDuration: `${1 + Math.random()}s`,
                      }}
                    >
                      {c.emoji}
                    </span>
                  ))}
                </div>

                <div className="absolute top-4 left-4 flex items-center gap-2 text-white">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono text-lg font-bold">
                    {formatHour(Math.max(0, currentHour - 1))} - {formatHour(currentHour)}
                  </span>
                </div>

                {liveResult && (
                  <div className="absolute top-4 right-4 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white">
                      <Users className="w-3 h-3" />
                      访客 {liveResult.visitors}
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white">
                      <Eye className="w-3 h-3" />
                      购买 {liveResult.buyers}
                    </div>
                    <div className="flex items-center gap-1.5 bg-green-500/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white font-bold">
                      <DollarSign className="w-3 h-3" />
                      营收 ¥{liveResult.revenue.toFixed(2)}
                    </div>
                  </div>
                )}

                {!isSimulating && simulationResults.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <p className="text-5xl mb-3">{selectedScene.emoji}</p>
                      <p className="text-lg font-bold">{selectedScene.name}</p>
                      <p className="text-sm text-white/70 mt-1">配置好参数后点击「开始模拟」</p>
                    </div>
                  </div>
                )}

                {!isSimulating && simulationResults.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="text-center text-white">
                      <p className="text-4xl mb-2">🎉</p>
                      <p className="text-lg font-bold">模拟完成！</p>
                      <button
                        onClick={() => setActiveTab('review')}
                        className="mt-3 px-5 py-2 bg-orange-500 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
                      >
                        查看复盘结果 →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white">
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>模拟进度</span>
                    <span className="font-mono font-bold text-gray-700">
                      {currentHour} / {simulationHours} 小时
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full transition-all duration-500 relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">开始时间</label>
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(parseInt(e.target.value))}
                      disabled={isSimulating}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50"
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 block mb-1">模拟时长</label>
                    <select
                      value={simulationHours}
                      onChange={(e) => setSimulationHours(parseInt(e.target.value))}
                      disabled={isSimulating}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50"
                    >
                      {[2, 4, 6, 8, 12].map((h) => (
                        <option key={h} value={h}>
                          {h} 小时
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 block mb-1">模拟速度</label>
                    <select
                      value={speed}
                      onChange={(e) => setSpeed(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400"
                    >
                      <option value={1}>1x 正常</option>
                      <option value={2}>2x 快速</option>
                      <option value={4}>4x 极速</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    {!isSimulating ? (
                      <button
                        onClick={startSimulation}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/30 transition-all"
                      >
                        <Play className="w-4 h-4" />
                        {simulationResults.length > 0 && currentHour > 0 ? '继续' : '开始模拟'}
                      </button>
                    ) : (
                      <button
                        onClick={pauseSimulation}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        <Pause className="w-4 h-4" />
                        暂停
                      </button>
                    )}
                    <button
                      onClick={resetSimulation}
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-80 bg-white border-l border-gray-200 p-5 overflow-y-auto">
        <h3 className="font-bold text-gray-800 mb-4">📊 实时数据</h3>

        {simulationResults.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">⏳</p>
            <p className="text-sm">开始模拟后显示数据</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-600 mb-1">总访客</p>
                <p className="text-xl font-bold text-blue-700">
                  {simulationResults.reduce((sum, r) => sum + r.visitors, 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <p className="text-xs text-purple-600 mb-1">购买人数</p>
                <p className="text-xl font-bold text-purple-700">
                  {simulationResults.reduce((sum, r) => sum + r.buyers, 0)}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <p className="text-xs text-green-600 mb-1">总营收</p>
                <p className="text-xl font-bold text-green-700">
                  ¥{simulationResults.reduce((sum, r) => sum + r.revenue, 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <p className="text-xs text-orange-600 mb-1">总利润</p>
                <p className="text-xl font-bold text-orange-700">
                  ¥{simulationResults.reduce((sum, r) => sum + r.profit, 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">逐时记录</h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {simulationResults.map((r, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {formatHour(idx)} - {formatHour(idx + 1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        转化率 {r.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>👥 {r.visitors} 人</span>
                      <span>💰 +¥{r.profit.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
