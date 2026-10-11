import { redirect, isRedirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogleAuthUrl } from '#lib/server/auth';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const authUrl = getGoogleAuthUrl(url);
		throw redirect(303, authUrl, { external: true });
	} catch (err: unknown) {
		if (isRedirect(err)) throw err;
		console.error('Google OAuth init failed:', err);
		const message = err instanceof Error ? err.message : 'OAuth init failed';
		throw redirect(303, `/login?error=${encodeURIComponent(message)}`);
	}
};
