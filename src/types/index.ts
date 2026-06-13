export type StallItemType = 'product' | 'signboard' | 'lightstrip' | 'pricetag';

export interface StallItem {
  id: string;
  type: StallItemType;
  name: string;
  emoji: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  price?: number;
  productId?: string;
}

export interface Product {
  id: string;
  name: string;
  emoji: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
  tags: string[];
}

export type DiscountType = 'percentage' | 'fixed' | 'bundle';

export interface DiscountRule {
  id: string;
  type: DiscountType;
  name: string;
  threshold?: number;
  value: number;
  bundleCount?: number;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  emoji: string;
  bgColor: string;
  trafficPerHour: number;
  stayRate: number;
  avgSpend: number;
  preferredTags: string[];
  priceSensitivity: number;
  peakHours: [number, number][];
}

export interface ProductSaleRecord {
  sold: number;
  remaining: number;
}

export interface SimulationResult {
  timestamp: number;
  hour: number;
  visitors: number;
  buyers: number;
  revenue: number;
  cost: number;
  profit: number;
  productSales: Record<string, ProductSaleRecord>;
  conversionRate: number;
}

export type ActiveTab = 'setup' | 'pricing' | 'traffic' | 'review';

export interface AppState {
  activeTab: ActiveTab;
  stallItems: StallItem[];
  products: Product[];
  discountRules: DiscountRule[];
  selectedScene: Scene | null;
  simulationResults: SimulationResult[];
  isSimulating: boolean;
  simulationHours: number;
  selectedItemId: string | null;

  setActiveTab: (tab: ActiveTab) => void;
  setSelectedItemId: (id: string | null) => void;
  addStallItem: (item: StallItem) => void;
  updateStallItem: (id: string, updates: Partial<StallItem>) => void;
  removeStallItem: (id: string) => void;
  clearStallItems: () => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addDiscountRule: (rule: DiscountRule) => void;
  updateDiscountRule: (id: string, updates: Partial<DiscountRule>) => void;
  removeDiscountRule: (id: string) => void;
  setSelectedScene: (scene: Scene | null) => void;
  setSimulationHours: (hours: number) => void;
  setSimulating: (val: boolean) => void;
  addSimulationResult: (result: SimulationResult) => void;
  clearSimulationResults: () => void;
  resetAll: () => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}
