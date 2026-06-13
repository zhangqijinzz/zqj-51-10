import type { StallItem, DiscountRule } from '@/types';

export interface MaterialItem {
  id: string;
  name: string;
  emoji: string;
  width: number;
  height: number;
  color?: string;
}

export const signboards: MaterialItem[] = [
  { id: 'sb1', name: '霓虹招牌', emoji: '🏪', width: 180, height: 60, color: '#FF4D6D' },
  { id: 'sb2', name: '木质招牌', emoji: '🪧', width: 160, height: 50, color: '#8B4513' },
  { id: 'sb3', name: '手写黑板', emoji: '📋', width: 140, height: 80, color: '#2C3E50' },
  { id: 'sb4', name: 'LED灯牌', emoji: '💡', width: 150, height: 55, color: '#7CB518' },
  { id: 'sb5', name: '复古招牌', emoji: '🎪', width: 170, height: 65, color: '#FF8C42' },
  { id: 'sb6', name: '卡通招牌', emoji: '🎨', width: 160, height: 70, color: '#3A86FF' },
  { id: 'sb7', name: '荧光招牌', emoji: '✨', width: 155, height: 55, color: '#FFD700' },
  { id: 'sb8', name: '简约招牌', emoji: '📝', width: 150, height: 50, color: '#FFFFFF' },
];

export const lightstrips: MaterialItem[] = [
  { id: 'ls1', name: '霓虹粉灯带', emoji: '💗', width: 200, height: 20, color: '#FF4D6D' },
  { id: 'ls2', name: '荧光绿灯带', emoji: '💚', width: 200, height: 20, color: '#7CB518' },
  { id: 'ls3', name: '星空蓝灯带', emoji: '💙', width: 200, height: 20, color: '#3A86FF' },
  { id: 'ls4', name: '暖橙灯带', emoji: '🧡', width: 200, height: 20, color: '#FF8C42' },
  { id: 'ls5', name: '金黄灯带', emoji: '💛', width: 200, height: 20, color: '#FFD700' },
  { id: 'ls6', name: '炫彩灯带', emoji: '🌈', width: 200, height: 20, color: '#FF00FF' },
];

export const pricetags: MaterialItem[] = [
  { id: 'pt1', name: '简约价签', emoji: '🏷️', width: 70, height: 50, color: '#FFFFFF' },
  { id: 'pt2', name: '爆炸贴价签', emoji: '💥', width: 80, height: 60, color: '#FF4D6D' },
  { id: 'pt3', name: '手写价签', emoji: '✍️', width: 65, height: 55, color: '#FFE4B5' },
  { id: 'pt4', name: 'LED价签', emoji: '🔖', width: 75, height: 45, color: '#7CB518' },
];

export const defaultDiscountRules: DiscountRule[] = [
  {
    id: 'd1',
    type: 'percentage',
    name: '限时8折',
    value: 0.8,
  },
  {
    id: 'd2',
    type: 'fixed',
    name: '满30减5',
    threshold: 30,
    value: 5,
  },
  {
    id: 'd3',
    type: 'bundle',
    name: '买2送1',
    bundleCount: 2,
    value: 1,
  },
];

export const defaultStallItems: StallItem[] = [
  {
    id: 'init-sb',
    type: 'signboard',
    name: '霓虹招牌',
    emoji: '🏪',
    x: 310,
    y: 20,
    width: 180,
    height: 60,
    rotation: 0,
    color: '#FF4D6D',
  },
  {
    id: 'init-ls1',
    type: 'lightstrip',
    name: '暖橙灯带',
    emoji: '🧡',
    x: 100,
    y: 100,
    width: 600,
    height: 20,
    rotation: 0,
    color: '#FF8C42',
  },
  {
    id: 'init-p1',
    type: 'product',
    name: '烤香肠',
    emoji: '🌭',
    x: 120,
    y: 180,
    width: 80,
    height: 80,
    rotation: 0,
    productId: 'p1',
    price: 6,
  },
  {
    id: 'init-p2',
    type: 'product',
    name: '手抓饼',
    emoji: '🥞',
    x: 240,
    y: 180,
    width: 80,
    height: 80,
    rotation: 0,
    productId: 'p2',
    price: 10,
  },
  {
    id: 'init-p3',
    type: 'product',
    name: '奶茶',
    emoji: '🧋',
    x: 360,
    y: 180,
    width: 80,
    height: 80,
    rotation: 0,
    productId: 'p4',
    price: 12,
  },
  {
    id: 'init-p4',
    type: 'product',
    name: '炸串',
    emoji: '🍢',
    x: 480,
    y: 180,
    width: 80,
    height: 80,
    rotation: 0,
    productId: 'p6',
    price: 5,
  },
  {
    id: 'init-p5',
    type: 'product',
    name: '冰粉',
    emoji: '🍧',
    x: 600,
    y: 180,
    width: 80,
    height: 80,
    rotation: 0,
    productId: 'p3',
    price: 8,
  },
  {
    id: 'init-pt1',
    type: 'pricetag',
    name: '爆炸贴价签',
    emoji: '💥',
    x: 130,
    y: 280,
    width: 80,
    height: 60,
    rotation: 0,
    color: '#FF4D6D',
    price: 6,
  },
];
