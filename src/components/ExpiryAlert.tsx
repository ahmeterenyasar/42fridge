"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient, type FridgeItem } from "@/lib/supabaseClient";

export default function ExpiryAlert() {
	const supabase = useMemo(() => getSupabaseClient(), []);
	const [items, setItems] = useState<FridgeItem[]>([]);

	function formatDateTR(iso: string): string {
		if (!iso) return "-";
		const parts = iso.split("-");
		if (parts.length === 3) {
			const [y, m, d] = parts;
			return `${d}.${m}.${y}`;
		}
		try {
			const dt = new Date(iso);
			const d = String(dt.getDate()).padStart(2, "0");
			const m = String(dt.getMonth() + 1).padStart(2, "0");
			const y = String(dt.getFullYear());
			return `${d}.${m}.${y}`;
		} catch {
			return iso;
		}
	}

	function isOverdue(iso: string): boolean {
		if (!iso) return false;
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const d = new Date(iso);
		d.setHours(0, 0, 0, 0);
		return d < today;
	}

	async function load() {
		const today = new Date();
		const soon = new Date();
		soon.setDate(today.getDate() + 7);
		const soonISO = soon.toISOString().slice(0, 10);
		const { data } = await supabase
			.from("fridge_items")
			.select("*")
			.lte("expiration_date", soonISO)
			.order("expiration_date", { ascending: true });
		setItems((data ?? []) as FridgeItem[]);
	}

	useEffect(() => {
		load();
		const channel = supabase
			.channel("expiry_alert")
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "fridge_items" },
				() => load()
			)
			.on(
				"postgres_changes",
				{ event: "DELETE", schema: "public", table: "fridge_items" },
				() => load()
			)
			.subscribe();

		function onReload() { load(); }
		window.addEventListener("fridge-reload", onReload as EventListener);

		return () => {
			supabase.removeChannel(channel);
			window.removeEventListener("fridge-reload", onReload as EventListener);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (items.length === 0) return null;

	return (
		<div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-50 p-4 text-yellow-900 shadow-sm dark:border-yellow-400/30 dark:bg-yellow-950/20 dark:text-yellow-100">
			<div className="mb-2 font-semibold">Son kullanma tarihi yaklaşan/ geçmiş ürünler</div>
			<ul className="list-inside list-disc text-sm">
				{items.map((it) => {
					const overdue = isOverdue(it.expiration_date);
					return (
						<li
							key={it.id}
							className={overdue ? "text-red-700 dark:text-red-300" : undefined}
						>
							<span className="font-medium">{it.name}</span> – SKT {formatDateTR(it.expiration_date)} (Dolap {it.fridge_id})
						</li>
					);
				})}
			</ul>
		</div>
	);
}


