declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string;
				email: string;
				name: string;
				picture?: string;
			} | null;
			accessToken?: string | null;
			refreshToken?: string | null;
			tokenExpiresAt?: number | null;
		}
		interface PageData {
			user?: {
				id: string;
				email: string;
				name: string;
				picture?: string;
			} | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
