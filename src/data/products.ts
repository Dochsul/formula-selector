export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  categoryCode:
    | 'standard'
    | 'comfort'
    | 'ha_phf'
    | 'ehf'
    | 'aaf'
    | 'ar'
    | 'lactose_free'
    | 'goat';
  stage: '1' | '2' | '3' | 'pre';
  status: 'verified' | 'unverified';
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  calcium: number;
  iron: number;
  vitaminD: number;
  barcode?: string;
};

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Similac Pro-Advance 1',
    brand: 'Abbott',
    category: 'Стандартная',
    categoryCode: 'standard',
    stage: '1',
    status: 'verified',
    kcal: 67,
    protein: 1.5,
    fat: 3.5,
    carbs: 7.2,
    calcium: 58,
    iron: 0.9,
    vitaminD: 1.1,
    barcode: '5901234123457'
  },
  {
    id: 'p2',
    name: 'Nutrilon Comfort 1',
    brand: 'Nutricia',
    category: 'Комфорт',
    categoryCode: 'comfort',
    stage: '1',
    status: 'verified',
    kcal: 66,
    protein: 1.4,
    fat: 3.1,
    carbs: 7.6,
    calcium: 56,
    iron: 0.8,
    vitaminD: 1.0,
    barcode: '8710908635538'
  },
  {
    id: 'p3',
    name: 'Frisolac Gold HA 1',
    brand: 'FrieslandCampina',
    category: 'Гипоаллергенная',
    categoryCode: 'ha_phf',
    stage: '1',
    status: 'verified',
    kcal: 68,
    protein: 1.6,
    fat: 3.4,
    carbs: 7.3,
    calcium: 57,
    iron: 0.9,
    vitaminD: 1.0,
    barcode: '8711200209397'
  },
  {
    id: 'p4',
    name: 'Nutrilon Pepti 1',
    brand: 'Nutricia',
    category: 'Глубокий гидролизат',
    categoryCode: 'ehf',
    stage: '1',
    status: 'verified',
    kcal: 65,
    protein: 1.5,
    fat: 3.4,
    carbs: 7.0,
    calcium: 55,
    iron: 1.0,
    vitaminD: 1.1,
    barcode: '8710908919603'
  },
  {
    id: 'p5',
    name: 'Neocate Infant',
    brand: 'Nutricia',
    category: 'Аминокислотная',
    categoryCode: 'aaf',
    stage: '1',
    status: 'verified',
    kcal: 67,
    protein: 2.0,
    fat: 3.4,
    carbs: 7.1,
    calcium: 60,
    iron: 1.2,
    vitaminD: 1.0,
    barcode: '3545240304240'
  },
  {
    id: 'p6',
    name: 'NAN Anti-Reflux',
    brand: 'Nestlé',
    category: 'Антирефлюксная',
    categoryCode: 'ar',
    stage: '1',
    status: 'verified',
    kcal: 66,
    protein: 1.5,
    fat: 3.4,
    carbs: 7.0,
    calcium: 58,
    iron: 0.9,
    vitaminD: 1.0,
    barcode: '7613031705345'
  }
];
