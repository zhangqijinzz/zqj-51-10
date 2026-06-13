import { useRef, useState } from 'react';
import type { StallItem, StallItemType } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface Props {
  onAddItem: (item: Partial<StallItem>, type: StallItemType) => void;
}

export default function StallCanvas({ onAddItem }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    stallItems,
    selectedItemId,
    setSelectedItemId,
    updateStallItem,
    removeStallItem,
  } = useAppStore();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const parsed = JSON.parse(data);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.max(0, e.clientX - rect.left - (parsed.width || 80) / 2);
      const y = Math.max(0, e.clientY - rect.top - (parsed.height || 80) / 2);

      onAddItem(
        {
          ...parsed,
          x: Math.round(x),
          y: Math.round(y),
        },
        parsed.type as StallItemType
      );
    } catch (err) {
      console.error('Failed to parse drop data', err);
    }
  };

  const handleItemMouseDown = (e: React.MouseEvent, item: StallItem) => {
    e.stopPropagation();
    setSelectedItemId(item.id);
    setDraggingId(item.id);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 80));
    const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 80));

    updateStallItem(draggingId, { x: Math.round(x), y: Math.round(y) });
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const handleCanvasClick = () => {
    setSelectedItemId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeStallItem(id);
  };

  const renderItem = (item: StallItem) => {
    const isSelected = selectedItemId === item.id;
    const isDragging = draggingId === item.id;

    const glowStyle =
      item.type === 'lightstrip'
        ? { boxShadow: `0 0 20px ${item.color}, 0 0 40px ${item.color}40` }
        : item.type === 'signboard'
        ? { boxShadow: `0 0 15px ${item.color}60` }
        : {};

    return (
      <div
        key={item.id}
        onMouseDown={(e) => handleItemMouseDown(e, item)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedItemId(item.id);
        }}
        className={`absolute cursor-move select-none transition-shadow ${
          isDragging ? 'z-50 scale-105 opacity-90' : 'z-10'
        } ${
          isSelected
            ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-amber-100 rounded-lg'
            : ''
        }`}
        style={{
          left: item.x,
          top: item.y,
          width: item.width,
          height: item.height,
          transform: `rotate(${item.rotation}deg)`,
          ...glowStyle,
        }}
      >
        {item.type === 'product' && (
          <div className="w-full h-full bg-white rounded-xl border-2 border-orange-200 flex flex-col items-center justify-center shadow-md hover:shadow-lg transition-shadow">
            <span className="text-3xl">{item.emoji}</span>
            {item.price !== undefined && (
              <span className="text-xs font-bold text-orange-600 mt-1">¥{item.price}</span>
            )}
          </div>
        )}

        {item.type === 'signboard' && (
          <div
            className="w-full h-full rounded-xl flex items-center justify-center border-2"
            style={{
              backgroundColor: item.color || '#FF8C42',
              borderColor: item.color,
              boxShadow: `0 0 20px ${item.color}60, inset 0 0 20px rgba(255,255,255,0.2)`,
            }}
          >
            <span className="text-xl mr-1">{item.emoji}</span>
            <span className="text-sm font-bold text-white drop-shadow-lg">{item.name}</span>
          </div>
        )}

        {item.type === 'lightstrip' && (
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`,
              boxShadow: `0 0 15px ${item.color}, 0 0 30px ${item.color}80`,
            }}
          >
            <div className="flex items-center justify-center h-full gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {item.type === 'pricetag' && (
          <div
            className="w-full h-full rounded-lg flex items-center justify-center border-2 shadow-md"
            style={{ backgroundColor: item.color || '#fff', borderColor: '#ddd' }}
          >
            <div className="text-center">
              <span className="text-sm">{item.emoji}</span>
              {item.price !== undefined && (
                <p className="text-xs font-bold text-red-500">¥{item.price}</p>
              )}
            </div>
          </div>
        )}

        {isSelected && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => handleDelete(e, item.id)}
            className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-50"
          >
            ×
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div
        ref={canvasRef}
        onDrop={handleCanvasDrop}
        onDragOver={(e) => e.preventDefault()}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        className="relative mx-auto rounded-2xl border-4 border-amber-700/50 overflow-hidden"
        style={{
          width: 800,
          height: 500,
          background: `
            linear-gradient(135deg, #d4a574 0%, #c4956a 50%, #b8865a 100%)
          `,
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 40px,
              rgba(139, 69, 19, 0.1) 40px,
              rgba(139, 69, 19, 0.1) 41px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 40px,
              rgba(139, 69, 19, 0.1) 40px,
              rgba(139, 69, 19, 0.1) 41px
            ),
            linear-gradient(135deg, #d4a574 0%, #c4956a 50%, #b8865a 100%)
          `,
          boxShadow: 'inset 0 0 60px rgba(139, 69, 19, 0.3)',
        }}
      >
        {stallItems.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-amber-900/40">
              <p className="text-6xl mb-4">🎪</p>
              <p className="text-lg font-medium">从左侧素材库拖拽或点击添加元素</p>
              <p className="text-sm mt-2">设计你的专属摊位</p>
            </div>
          </div>
        )}
        {stallItems.map(renderItem)}
      </div>

      <div className="mt-4 flex justify-center gap-4 text-xs text-gray-500">
        <span>💡 提示：拖拽可移动元素，点击选中后可删除</span>
        <span>|</span>
        <span>当前元素：{stallItems.length} 个</span>
      </div>
    </div>
  );
}
