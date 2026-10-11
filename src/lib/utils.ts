import type { Category } from '#lib/types';

const CATEGORY_RULES: Array<{ target: string; regex: RegExp }> = [
	{
		target: 'Transport',
		regex: /\b(?:uber|petrol|rapido|auto|metro|ola|fuel|taxi)\b/i
	},
	{
		target: 'Food',
		regex: /\b(?:lunch|dinner|breakfast|food|swiggy|zomato|cafe|coffee|tea|restaurant|snacks|mess|grocery|zepto|blinkit|instamart)\b/i
	}
];

export function formatCurrency(val: number, symbol = '₹'): string {
	const safeVal = isNaN(val) ? 0 : val;
	return `${symbol}${safeVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function suggestCategory(text: string, categories: Category[]): string | null {
	if (!text) return null;
	for (const rule of CATEGORY_RULES) {
		if (rule.regex.test(text)) {
			const matched = categories.find((c) => c.name.toLowerCase() === rule.target.toLowerCase());
			return matched ? matched.name : rule.target;
		}
	}
	return null;
}

