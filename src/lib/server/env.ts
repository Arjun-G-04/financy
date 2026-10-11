if (!process.env.AUTH_SECRET && typeof process.loadEnvFile === 'function') {
	try {
		process.loadEnvFile();
	} catch {}
}

export const env = {
	get AUTH_SECRET(): string {
		return process.env.AUTH_SECRET || 'financy-fallback-secret-at-least-32-chars-long';
	},
	get PUBLIC_BASE_URL(): string {
		return (process.env.PUBLIC_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
	},
	get GOOGLE_CLIENT_ID(): string {
		return process.env.GOOGLE_CLIENT_ID?.trim() || '';
	},
	get GOOGLE_CLIENT_SECRET(): string {
		return process.env.GOOGLE_CLIENT_SECRET?.trim() || '';
	},
	get ALLOWED_EMAIL(): string {
		return process.env.ALLOWED_EMAIL?.trim() || '';
	},
	get TURSO_DATABASE_URL(): string {
		return process.env.TURSO_DATABASE_URL?.trim() || 'file:local.db';
	},
	get TURSO_AUTH_TOKEN(): string | undefined {
		return process.env.TURSO_AUTH_TOKEN?.trim() || undefined;
	}
};
