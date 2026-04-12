import { SparePart } from './types';

export const SPARE_PARTS: SparePart[] = [
  {
    id: 'p1',
    name: 'ترس محرك أساسي',
    category: 'تروس',
    size: 50,
    compatibilityGroup: 'A',
    price: 150,
    image: 'https://picsum.photos/seed/gear1/400/300',
    description: 'ترس فولاذي عالي الجودة للمحركات الثقيلة.',
    tags: ['ثقيل', 'فولاذ', 'أساسي']
  },
  {
    id: 'p2',
    name: 'ترس محرك صغير',
    category: 'تروس',
    size: 30,
    compatibilityGroup: 'A',
    price: 80,
    image: 'https://picsum.photos/seed/gear2/400/300',
    description: 'ترس دقيق للمحركات الصغيرة.',
    tags: ['دقيق', 'صغير']
  },
  {
    id: 'p3',
    name: 'محور دوران طويل',
    category: 'محاور',
    size: 50,
    compatibilityGroup: 'A',
    price: 200,
    image: 'https://picsum.photos/seed/shaft1/400/300',
    description: 'محور دوران بطول 50 مم.',
    tags: ['طويل', 'دوران']
  },
  {
    id: 'p4',
    name: 'محور دوران قصير',
    category: 'محاور',
    size: 30,
    compatibilityGroup: 'A',
    price: 120,
    image: 'https://picsum.photos/seed/shaft2/400/300',
    description: 'محور دوران بطول 30 مم.',
    tags: ['قصير', 'دوران']
  },
  {
    id: 'p5',
    name: 'صمام هيدروليكي',
    category: 'صمامات',
    size: 20,
    compatibilityGroup: 'B',
    price: 350,
    image: 'https://picsum.photos/seed/valve1/400/300',
    description: 'صمام تحكم في الضغط الهيدروليكي.',
    tags: ['هيدروليك', 'ضغط', 'تحكم']
  }
];

export const ASSEMBLY_TEMPLATES = [
  {
    id: 't1',
    name: 'وحدة نقل الحركة الكبيرة',
    slots: [
      { id: 's1', requiredSize: 50, allowedCategory: 'تروس' },
      { id: 's2', requiredSize: 50, allowedCategory: 'محاور' }
    ]
  },
  {
    id: 't2',
    name: 'وحدة نقل الحركة الصغيرة',
    slots: [
      { id: 's1', requiredSize: 30, allowedCategory: 'تروس' },
      { id: 's2', requiredSize: 30, allowedCategory: 'محاور' }
    ]
  }
];
