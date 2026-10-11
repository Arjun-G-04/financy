import crypto from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { env } from '#lib/server/env';

export interface AuthUser {
	id: string;
	email: string;
	name: string;
	picture?: string;
}

export interface SessionData {
	user: AuthUser;
	accessToken: string;
	refreshToken?: string;
	tokenExpiresAt?: number;
	expiresAt: number;
}

function getSecretKey(): Buffer {
	const secret = env.AUTH_SECRET || process.env.AUTH_SECRET || 'financy-fallback-secret-at-least-32-chars-long';
	return crypto.createHash('sha256').update(secret).digest();
}

export function encryptSession(data: SessionData): string {
	const key = getSecretKey();
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
	const text = JSON.stringify(data);
	let encrypted = cipher.update(text, 'utf8', 'base64');
	encrypted += cipher.final('base64');
	const tag = cipher.getAuthTag();
	return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted}`;
}

export function decryptSession(payload: string): SessionData | null {
	try {
		const parts = payload.split('.');
		if (parts.length !== 3) return null;
		const [ivB64, tagB64, encrypted] = parts;
		const key = getSecretKey();
		const iv = Buffer.from(ivB64, 'base64');
		const tag = Buffer.from(tagB64, 'base64');
		const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
		decipher.setAuthTag(tag);
		let decrypted = decipher.update(encrypted, 'base64', 'utf8');
		decrypted += decipher.final('utf8');
		const session = JSON.parse(decrypted) as SessionData;
		if (session.expiresAt && Date.now() > session.expiresAt) {
			return null;
		}
		return session;
	} catch {
		return null;
	}
}

export function getBaseUrl(requestUrl?: URL): string {
	const envBase = (env.PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL)?.trim();
	if (envBase) {
		return envBase.replace(/\/$/, '');
	}
	if (requestUrl) {
		return `${requestUrl.protocol}//${requestUrl.host}`;
	}
	return 'http://localhost:5173';
}

function getGoogleCredentials() {
	const clientId = (env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID)?.trim();
	const clientSecret = (env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET)?.trim();
	if (!clientId || !clientSecret) {
		throw new Error('Google OAuth credentials not configured in environment');
	}
	return { clientId, clientSecret };
}

export function getGoogleAuthUrl(requestUrl?: URL): string {
	const { clientId } = getGoogleCredentials();

	const baseUrl = getBaseUrl(requestUrl);
	const redirectUri = `${baseUrl}/auth/google/callback`;
	const scopes = [
		'openid',
		'https://www.googleapis.com/auth/userinfo.email',
		'https://www.googleapis.com/auth/userinfo.profile',
		'https://www.googleapis.com/auth/spreadsheets'
	].join(' ');

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: scopes,
		access_type: 'offline',
		prompt: 'consent'
	});

	return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(
	code: string,
	requestUrl?: URL
): Promise<{
	accessToken: string;
	refreshToken?: string;
	expiresIn: number;
	user: AuthUser;
}> {
	const { clientId, clientSecret } = getGoogleCredentials();

	const baseUrl = getBaseUrl(requestUrl);
	const redirectUri = `${baseUrl}/auth/google/callback`;

	const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			grant_type: 'authorization_code'
		})
	});

	if (!tokenRes.ok) {
		const errBody = await tokenRes.text();
		throw new Error(`Google token exchange failed: ${errBody}`);
	}

	const tokenData = await tokenRes.json();
	const accessToken = tokenData.access_token;
	const refreshToken = tokenData.refresh_token;
	const expiresIn = Number(tokenData.expires_in) || 3600;

	// Fetch user details
	const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (!userRes.ok) {
		throw new Error('Failed to retrieve user profile from Google');
	}

	const profile = await userRes.json();

	// Whitelist check
	const allowedEmail = (env.ALLOWED_EMAIL || process.env.ALLOWED_EMAIL)?.trim();
	if (allowedEmail && profile.email.toLowerCase() !== allowedEmail.toLowerCase()) {
		throw new Error(`Unauthorized email: ${profile.email}. Access restricted.`);
	}

	return {
		accessToken,
		refreshToken,
		expiresIn,
		user: {
			id: profile.id,
			email: profile.email,
			name: profile.name || profile.email.split('@')[0],
			picture: profile.picture
		}
	};
}

export async function refreshGoogleAccessToken(
	refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
	const { clientId, clientSecret } = getGoogleCredentials();

	const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			refresh_token: refreshToken,
			grant_type: 'refresh_token'
		})
	});

	if (!tokenRes.ok) {
		const errBody = await tokenRes.text();
		throw new Error(`Google token refresh failed: ${errBody}`);
	}

	const data = await tokenRes.json();
	return {
		accessToken: data.access_token,
		expiresIn: Number(data.expires_in) || 3600
	};
}

export async function getValidAccessToken(
	cookies: Cookies,
	locals: App.Locals
): Promise<string> {
	if (!locals.user) {
		throw new Error('Unauthenticated. Please log in first.');
	}

	let currentToken = locals.accessToken;
	const isNearExpiry =
		locals.tokenExpiresAt && Date.now() > locals.tokenExpiresAt - 60 * 1000;

	if ((!currentToken || isNearExpiry) && locals.refreshToken) {
		try {
			const refreshed = await refreshGoogleAccessToken(locals.refreshToken);
			currentToken = refreshed.accessToken;
			locals.accessToken = refreshed.accessToken;
			locals.tokenExpiresAt = Date.now() + refreshed.expiresIn * 1000;

			// Re-seal updated session cookie
			const sessionToken = encryptSession({
				user: locals.user,
				accessToken: locals.accessToken,
				refreshToken: locals.refreshToken,
				tokenExpiresAt: locals.tokenExpiresAt,
				expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
			});

			cookies.set('financy_session', sessionToken, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 30 * 24 * 60 * 60
			});
		} catch (err) {
			console.error('Failed to auto-refresh Google access token:', err);
			if (!currentToken) {
				throw new Error('Google session expired. Please sign in again.');
			}
		}
	}

	if (!currentToken) {
		throw new Error('Google access token unavailable. Please sign in again.');
	}

	return currentToken;
}
