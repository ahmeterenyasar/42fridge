import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
	if (typeof window === "undefined") {
		// On the server we can create a short-lived client per request
		return createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL as string,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
		);
	}
	if (!browserClient) {
		browserClient = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL as string,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
		);
	}
	return browserClient;
}

export type FridgeItem = {
	id: string;
	fridge_id: number;
	name: string;
	expiration_date: string; // ISO date string (YYYY-MM-DD)
	is_common_use: boolean;
	location_shelf: number;
	location_position: number; // 0: left, 1: center, 2: right
	added_by: string;
	created_at: string | null;
};

export const MAX_CAPACITY = 50;

