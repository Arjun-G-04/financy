import type { Category } from '#lib/types';

const CATEGORY_RULES: Array<{ target: string; regex: RegExp }> = [
	{
		target: 'Rent & Related',
		regex: /\b(?:rents?|rental)\b/i
	},
	{
		target: 'Transport',
		regex: /\b(?:uber|petrol|rapido|auto|metro|ola|fuel|taxi)\b/i
	},
	{
		target: 'Food',
		regex: /\b(?:lunch|dinner|breakfast|food|swiggy|zomato|cafe|coffee|tea|restaurant|snacks?|snacking|mess|grocery|zepto|blinkit|instamart)\b/i
	}
];

export function formatCurrency(val: number, symbol = '₹'): string {
	const safeVal = isNaN(val) ? 0 : val;
	return `${symbol}${safeVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeCategoryName(name: string): string {
	return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

function resolveCategoryName(target: string, categories: Category[]): string {
	if (!categories || categories.length === 0) return target;
	const normTarget = normalizeCategoryName(target);
	const match =
		categories.find((c) => normalizeCategoryName(c.name) === normTarget) ||
		categories.find((c) => {
			const normC = normalizeCategoryName(c.name);
			return normTarget.startsWith(normC) || normC.startsWith(normTarget);
		});
	return match ? match.name : target;
}

export function suggestCategory(
	input: string | (string | null | undefined)[],
	categories: Category[]
): string | null {
	const candidates = (Array.isArray(input) ? input : [input]).filter(
		(s): s is string => typeof s === 'string' && s.trim().length > 0
	);

	for (const text of candidates) {
		for (const rule of CATEGORY_RULES) {
			if (rule.regex.test(text)) {
				return resolveCategoryName(rule.target, categories);
			}
		}
	}
	return null;
}

export interface CategoryStyle {
	color: string;
	bgColor: string;
	badgeStyle: string;
}

export type TimeBucket = 'Today' | 'Yesterday' | 'Past 7 Days' | 'Past 30 Days' | 'Older';

export function formatDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function parseDate(dateStr: string): Date | null {
	if (!dateStr) return null;
	const parts = dateStr.split('-');
	if (parts.length !== 3) return null;
	const [y, m, d] = parts.map(Number);
	if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
	return new Date(y, m - 1, d);
}

export function getPresetDateRange(preset: '7days' | 'month' | '30days'): { start: string; end: string } {
	const today = new Date();
	const end = formatDate(today);

	if (preset === '7days') {
		const past = new Date(today);
		past.setDate(today.getDate() - 7);
		return { start: formatDate(past), end };
	}
	if (preset === 'month') {
		const start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
		return { start, end };
	}
	if (preset === '30days') {
		const past = new Date(today);
		past.setDate(today.getDate() - 30);
		return { start: formatDate(past), end };
	}
	return { start: end, end };
}

export function getTimeBucket(dateStr: string, referenceDate: Date = new Date()): TimeBucket {
	const txDate = parseDate(dateStr);
	if (!txDate) return 'Older';

	const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
	const diffDays = Math.round((ref.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));

	if (diffDays <= 0) return 'Today';
	if (diffDays === 1) return 'Yesterday';
	if (diffDays <= 7) return 'Past 7 Days';
	if (diffDays <= 30) return 'Past 30 Days';
	return 'Older';
}

export const CATEGORY_PALETTE = [
	'#82b896', // Sage / Muted Emerald
	'#7aa2f7', // Slate Blue
	'#e0af68', // Warm Amber
	'#bb9af7', // Lavender
	'#f7768e', // Rose
	'#2ac3de', // Cyan
	'#ff9e64', // Coral Orange
	'#9ece6a', // Light Green
	'#b4befe', // Periwinkle
	'#e5c07b', // Ochre Gold
	'#c0caf5', // Steel Blue
	'#fab387', // Peach
	'#89dceb', // Sky
	'#f38ba8', // Blush
	'#a6e3a1', // Mint
	'#cba6f7'  // Violet
];

const KNOWN_CATEGORY_COLORS: Record<string, string> = {
	food: '#e0af68',
	dining: '#e0af68',
	groceries: '#e0af68',
	transport: '#7aa2f7',
	travel: '#7aa2f7',
	shopping: '#bb9af7',
	personal: '#bb9af7',
	bills: '#ff9e64',
	utilities: '#ff9e64',
	salary: '#82b896',
	income: '#82b896',
	investment: '#82b896',
	entertainment: '#2ac3de',
	leisure: '#2ac3de',
	health: '#f7768e',
	medical: '#f7768e'
};

export function getCategoryColor(category?: string | null): string {
	if (!category || !category.trim()) {
		return '#78716c';
	}
	const normalized = category.trim().toLowerCase();
	if (KNOWN_CATEGORY_COLORS[normalized]) {
		return KNOWN_CATEGORY_COLORS[normalized];
	}

	let hash = 0;
	for (let i = 0; i < normalized.length; i++) {
		hash = (hash << 5) - hash + normalized.charCodeAt(i);
		hash |= 0;
	}
	const index = Math.abs(hash) % CATEGORY_PALETTE.length;
	return CATEGORY_PALETTE[index];
}

export function getCategoryStyle(category?: string | null): CategoryStyle {
	if (!category || !category.trim()) {
		return {
			color: '#78716c',
			bgColor: 'transparent',
			badgeStyle: 'background-color: #1f1e1b; color: #a8a29e; border-color: #292524;'
		};
	}
	const color = getCategoryColor(category);
	return {
		color,
		bgColor: `${color}12`,
		badgeStyle: `background-color: ${color}1f; color: ${color}; border-color: ${color}40;`
	};
}

