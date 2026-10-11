import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeGoogleCode, encryptSession } from '#lib/server/auth';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');

	if (error) {
		throw redirect(303, `/login?error=${encodeURIComponent(error)}`);
	}

	if (!code) {
		throw redirect(303, '/login?error=missing_code');
	}

	try {
		const { accessToken, refreshToken, expiresIn, user } = await exchangeGoogleCode(code, url);

		// Session lasts 30 days
		const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
		const tokenExpiresAt = Date.now() + expiresIn * 1000;
		const sessionToken = encryptSession({
			user,
			accessToken,
			refreshToken,
			tokenExpiresAt,
			expiresAt
		});

		cookies.set('financy_session', sessionToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 30 * 24 * 60 * 60 // 30 days
		});

		throw redirect(303, '/');
	} catch (err: any) {
		if (err?.status && err?.location) throw err; // SvelteKit redirect
		console.error('OAuth Callback error:', err);
		throw redirect(303, `/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
	}
};
