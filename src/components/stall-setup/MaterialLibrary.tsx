import { useState } from 'react';
import { Package, Signpost, Lightbulb, Tag } from 'lucide-react';
import type { StallItemType, Product, StallItem } from '@/types';
import { signboards, lightstrips, pricetags } from '@/data/materials';
import { useAppStore } from '@/store/useAppStore';

const categories: { id: StallItemType; label: string; icon: typeof Package }[] = [
  { id: 'product', label: '商品', icon: Package },
  { id: 'signboard', label: '招牌', icon: Signpost },
  { id: 'lightstrip', label: '灯带', icon: Lightbulb },
  { id: 'pricetag', label: '价签', icon: Tag },
];

interface Props {
  onAddToCanvas: (item: Partial<StallItem>, type: StallItemType) => void;
}

export default function MaterialLibrary({ onAddToCanvas }: Props) {
  const [activeCategory, setActiveCategory] = useState<StallItemType>('product');
  const products = useAppStore((s) => s.products);

  const handleDragStart = (e: React.DragEvent, data: Record<string, unknown>, type: StallItemType) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ ...data, type }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderProducts = () => (
    <div className="grid grid-cols-2 gap-2">
      {products.map((product: Product) => (
        <div
          key={product.id}
          draggable
          onDragStart={(e) => handleDragStart(e, {
            name: product.name,
            emoji: product.emoji,
            productId: product.id,
            price: product.price,
            width: 80,
            height: 80,
          }, 'product')}
          onClick={() => onAddToCanvas({
            name: product.name,
            emoji: product.emoji,
            productId: product.id,
            price: product.price,
            width: 80,
            height: 80,
          }, 'product')}
          className="group relative bg-white rounded-xl p-3 border-2 border-gray-100 hover:border-orange-400 transition-all cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="text-center">
            <span className="text-3xl">{product.emoji}</span>
            <p className="text-xs font-medium text-gray-700 mt-1 truncate">{product.name}</p>
            <p className="text-xs text-orange-500 font-bold mt-0.5">¥{product.price}</p>
          </div>
          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  );

  const renderMaterials = (items: { id: string; name: string; emoji: string; width: number; height: number; color?: string }[], type: StallItemType) => (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, {
            name: item.name,
            emoji: item.emoji,
            color: item.color,
            width: item.width,
            height: item.height,
          }, type)}
          onClick={() => onAddToCanvas({
            name: item.name,
            emoji: item.emoji,
            color: item.color,
            width: item.width,
            height: item.height,
          }, type)}
          className="group relative bg-white rounded-xl p-3 border-2 border-gray-100 hover:border-orange-400 transition-all cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="text-center">
            <div
              className="mx-auto rounded-lg flex items-center justify-center mb-1"
              style={{
                backgroundColor: item.color || '#f5f5f5',
                boxShadow: type === 'lightstrip' ? `0 0 10px ${item.color}` : undefined,
                width: type === 'lightstrip' ? '100%' : '40px',
                height: type === 'lightstrip' ? '14px' : '40px',
              }}
            >
              <span className="text-lg">{item.emoji}</span>
            </div>
            <p className="text-xs font-medium text-gray-700 truncate">{item.name}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-72 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 mb-3">🎨 素材库</h3>
        <div className="grid grid-cols-4 gap-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs text-gray-400 mb-3">点击或拖拽添加到画布</p>
        {activeCategory === 'product' && renderProducts()}
        {activeCategory === 'signboard' && renderMaterials(signboards, 'signboard')}
        {activeCategory === 'lightstrip' && renderMaterials(lightstrips, 'lightstrip')}
        {activeCategory === 'pricetag' && renderMaterials(pricetags, 'pricetag')}
      </div>
    </div>
  );
}
