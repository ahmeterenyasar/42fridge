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

	const overdueItems = items.filter((it) => isOverdue(it.expiration_date));
	const upcomingItems = items.filter((it) => !isOverdue(it.expiration_date));

	return (
		<div className="mb-6 space-y-4">
			{/* Geçmiş ürünler - Kırmızı ve daha belirgin */}
			{overdueItems.length > 0 && (
				<div className="rounded-xl border-2 border-red-500 bg-red-50 p-4 shadow-md dark:border-red-500 dark:bg-red-950/30">
					<div className="mb-3 flex items-center gap-2">
						<span className="text-2xl">⚠️</span>
						<div>
							<div className="font-bold text-red-900 dark:text-red-100">
								Son Kullanma Tarihi GEÇMİŞ Ürünler ({overdueItems.length})
							</div>
							<div className="text-xs text-red-700 dark:text-red-200">
								Bu ürünleri hemen buzdolabından çıkarın ve uygulamadan silin!
							</div>
						</div>
					</div>
					<ul className="space-y-2 text-sm">
						{overdueItems.map((it) => (
							<li
								key={it.id}
								className="rounded-md border border-red-300 bg-red-100 p-2 font-medium text-red-900 dark:border-red-700 dark:bg-red-900/40 dark:text-red-100"
							>
								<span className="font-bold">{it.name}</span> – SKT {formatDateTR(it.expiration_date)} (Dolap {it.fridge_id})
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Yaklaşan ürünler - Sarı/turuncu */}
			{upcomingItems.length > 0 && (
				<div className="rounded-xl border border-yellow-500/30 bg-yellow-50 p-4 shadow-sm dark:border-yellow-400/30 dark:bg-yellow-950/20">
					<div className="mb-3 flex items-center gap-2">
						<span className="text-xl">⏰</span>
						<div>
							<div className="font-semibold text-yellow-900 dark:text-yellow-100">
								Son Kullanma Tarihi Yaklaşan Ürünler ({upcomingItems.length})
							</div>
						</div>
					</div>
					<ul className="list-inside list-disc space-y-1 text-sm text-yellow-900 dark:text-yellow-100">
						{upcomingItems.map((it) => (
							<li key={it.id}>
								<span className="font-medium">{it.name}</span> – SKT {formatDateTR(it.expiration_date)} (Dolap {it.fridge_id})
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}


