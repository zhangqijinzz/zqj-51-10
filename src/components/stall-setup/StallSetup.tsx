import MaterialLibrary from './MaterialLibrary';
import StallCanvas from './StallCanvas';
import PropertyPanel from './PropertyPanel';
import { useAppStore } from '@/store/useAppStore';
import type { StallItem, StallItemType } from '@/types';

function generateId() {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function StallSetup() {
  const { addStallItem } = useAppStore();

  const handleAddItem = (item: Partial<StallItem>, type: StallItemType) => {
    const newItem: StallItem = {
      id: generateId(),
      type,
      name: item.name || '未命名',
      emoji: item.emoji || '📦',
      x: item.x ?? 200 + Math.random() * 200,
      y: item.y ?? 200 + Math.random() * 100,
      width: item.width ?? 80,
      height: item.height ?? 80,
      rotation: item.rotation ?? 0,
      color: item.color,
      price: item.price,
      productId: item.productId,
    };
    addStallItem(newItem);
  };

  return (
    <div className="flex h-full bg-gray-50">
      <MaterialLibrary onAddToCanvas={handleAddItem} />
      <StallCanvas onAddItem={handleAddItem} />
      <PropertyPanel />
    </div>
  );
}
