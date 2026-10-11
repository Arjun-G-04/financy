import type { Handle } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { decryptSession } from '#lib/server/auth';

const PUBLIC_PATHS = ['/login', '/auth/google', '/auth/google/callback'];

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('financy_session');
	if (sessionCookie) {
		const session = decryptSession(sessionCookie);
		if (session) {
			event.locals.user = session.user;
			event.locals.accessToken = session.accessToken;
			event.locals.refreshToken = session.refreshToken;
			event.locals.tokenExpiresAt = session.tokenExpiresAt;
		}
	}

	const path = event.url.pathname;
	const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));

	// Redirect authenticated users away from /login
	if (event.locals.user && path === '/login') {
		throw redirect(303, '/');
	}

	// Gate protected routes
	if (!event.locals.user && !isPublic) {
		if (path.startsWith('/api/')) {
			return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		throw redirect(303, '/login');
	}

	return resolve(event);
};
