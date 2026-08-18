// Expanded vibrant distinct palette for categories
export const CATEGORY_PALETTE = [
  '#38BDF8', // Sky 400
  '#34D399', // Emerald 400
  '#FB7185', // Rose 400
  '#FBBF24', // Amber 400
  '#A855F7', // Purple 500
  '#F472B6', // Pink 400
  '#FB923C', // Orange 400
  '#2DD4BF', // Teal 400
  '#818CF8', // Indigo 400
  '#A3E635', // Lime 400
  '#E879F9', // Fuchsia 400
  '#22D3EE', // Cyan 400
  '#F87171', // Red 400
  '#FACC15', // Yellow 400
  '#C084FC', // Violet 400
  '#4ADE80', // Green 400
  '#FDBA74', // Warm Orange 300
  '#67E8F9', // Light Cyan 300
  '#F43F5E', // Deep Rose 500
  '#10B981', // True Emerald 500
  '#6366F1', // Deep Indigo 500
  '#EC4899', // Dark Pink 500
  '#8B5CF6', // Purple 500
  '#14B8A6', // Dark Teal 500
  '#D946EF', // Magenta 500
  '#0EA5E9', // Ocean Sky 500
  '#84CC16', // Lime 500
  '#E11D48', // Crimson 600
  '#06B6D4', // Deep Cyan 500
  '#F59E0B', // Amber 500
  '#60A5FA', // Blue 400
  '#9333EA', // Purple 600
];

// FNV-1a hash algorithm for well-distributed hash values
function fnv1aHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Generate stable, well-distributed category color based on name hash
export const getCategoryColor = (name: string): string => {
  if (!name || name.trim() === '') return '#71717A';
  const clean = name.trim().toLowerCase();
  const hash = fnv1aHash(clean);
  const index = hash % CATEGORY_PALETTE.length;
  return CATEGORY_PALETTE[index];
};

// Guarantee unique colors for a list of categories displayed on the same screen
export const getCategoryColorsMap = (categories: string[]): Record<string, string> => {
  const map: Record<string, string> = {};
  const usedIndices = new Set<number>();

  categories.forEach((cat, i) => {
    const clean = cat.trim().toLowerCase();
    const primaryHash = fnv1aHash(clean);
    let index = primaryHash % CATEGORY_PALETTE.length;

    // If collision in this specific set, find next unused color in palette
    if (usedIndices.has(index) && usedIndices.size < CATEGORY_PALETTE.length) {
      for (let offset = 1; offset < CATEGORY_PALETTE.length; offset++) {
        const nextIndex = (index + offset) % CATEGORY_PALETTE.length;
        if (!usedIndices.has(nextIndex)) {
          index = nextIndex;
          break;
        }
      }
    }

    usedIndices.add(index);
    map[cat] = CATEGORY_PALETTE[index];
  });

  return map;
};

// Check if category represents income
export const isIncomeCategory = (categoryName?: string | null): boolean => {
  if (!categoryName) return false;
  return categoryName.toLowerCase().includes('income');
};

