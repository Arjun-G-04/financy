import type { Category } from '#lib/types';

const FOOD_KEYWORDS_REGEX = /\b(?:lunch|dinner|breakfast|food|swiggy|zomato|cafe|coffee|tea|restaurant|snacks|mess)\b/i;

export function formatCurrency(val: number, symbol = '₹'): string {
	const safeVal = isNaN(val) ? 0 : val;
	return `${symbol}${safeVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function suggestCategory(text: string, categories: Category[]): string | null {
	if (!text) return null;
	if (FOOD_KEYWORDS_REGEX.test(text)) {
		const foodCat = categories.find((c) => c.name.toLowerCase() === 'food');
		if (foodCat) return foodCat.name;
	}
	return null;
}
