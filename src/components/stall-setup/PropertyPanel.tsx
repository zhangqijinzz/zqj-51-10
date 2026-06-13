import { useAppStore } from '@/store/useAppStore';
import { Move, RotateCw, Trash2, Maximize, Palette } from 'lucide-react';

export default function PropertyPanel() {
  const {
    stallItems,
    selectedItemId,
    updateStallItem,
    removeStallItem,
    setSelectedItemId,
    clearStallItems,
  } = useAppStore();

  const selectedItem = stallItems.find((item) => item.id === selectedItemId);

  if (!selectedItem) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-800">⚙️ 属性面板</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-gray-400">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-sm">选择画布上的元素</p>
            <p className="text-xs mt-1">查看和编辑属性</p>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (confirm('确定要清空画布吗？')) clearStallItems();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            清空画布
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (field: string, value: number | string | undefined) => {
    updateStallItem(selectedItem.id, { [field]: value });
  };

  const colors = ['#FF4D6D', '#7CB518', '#3A86FF', '#FF8C42', '#FFD700', '#8B4513', '#FFFFFF'];

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">⚙️ 属性面板</h3>
        <button
          onClick={() => setSelectedItemId(null)}
          className="text-gray-400 hover:text-gray-600 text-lg"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm">
            {selectedItem.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 truncate">{selectedItem.name}</p>
            <p className="text-xs text-gray-500">
              类型：
              {{
                product: '商品',
                signboard: '招牌',
                lightstrip: '灯带',
                pricetag: '价签',
              }[selectedItem.type]}
            </p>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
            <Move className="w-3.5 h-3.5" />
            位置
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-gray-400">X</span>
              <input
                type="number"
                value={selectedItem.x}
                onChange={(e) => handleChange('x', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <div>
              <span className="text-xs text-gray-400">Y</span>
              <input
                type="number"
                value={selectedItem.y}
                onChange={(e) => handleChange('y', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
            <Maximize className="w-3.5 h-3.5" />
            尺寸
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-gray-400">宽</span>
              <input
                type="number"
                value={selectedItem.width}
                onChange={(e) => handleChange('width', parseInt(e.target.value) || 80)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <div>
              <span className="text-xs text-gray-400">高</span>
              <input
                type="number"
                value={selectedItem.height}
                onChange={(e) => handleChange('height', parseInt(e.target.value) || 80)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
            <RotateCw className="w-3.5 h-3.5" />
            旋转角度
          </label>
          <input
            type="range"
            min={-180}
            max={180}
            value={selectedItem.rotation}
            onChange={(e) => handleChange('rotation', parseInt(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="text-center text-xs text-gray-500 mt-1">{selectedItem.rotation}°</div>
        </div>

        {selectedItem.type !== 'product' && (
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
              <Palette className="w-3.5 h-3.5" />
              颜色
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleChange('color', color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    selectedItem.color === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
                />
              ))}
            </div>
          </div>
        )}

        {selectedItem.type !== 'lightstrip' && (
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">价格 (¥)</label>
            <input
              type="number"
              value={selectedItem.price ?? ''}
              placeholder="可选"
              onChange={(e) =>
                handleChange(
                  'price',
                  e.target.value === '' ? undefined : parseFloat(e.target.value)
                )
              }
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => removeStallItem(selectedItem.id)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          删除元素
        </button>
        <button
          onClick={() => {
            if (confirm('确定要清空画布吗？')) clearStallItems();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 text-sm font-medium transition-colors"
        >
          清空画布
        </button>
      </div>
    </div>
  );
}
