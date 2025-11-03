"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FridgeItem, getSupabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Props = { fridgeId: 1 | 2 | 3 };

export default function InventoryList({ fridgeId }: Props) {
	const supabase = useMemo(() => getSupabaseClient(), []);
	const [items, setItems] = useState<FridgeItem[]>([]);
	const [loading, setLoading] = useState(true);
    const router = useRouter();

	async function load() {
		setLoading(true);
		const { data } = await supabase
			.from("fridge_items")
			.select("*")
			.eq("fridge_id", fridgeId)
			.order("created_at", { ascending: false });
		const arr = (data ?? []) as FridgeItem[];
		// De-duplicate by id to avoid duplicate keys when multiple signals arrive
		const unique = Array.from(new Map(arr.map((x) => [x.id, x])).values());
		setItems(unique);
		setLoading(false);
	}

	useEffect(() => {
		load();
		// Realtime updates for inserts and deletes
		const channel = supabase
			.channel(`fridge_items_${fridgeId}`)
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "fridge_items", filter: `fridge_id=eq.${fridgeId}` },
				() => {
					load();
				}
			)
			.on(
				"postgres_changes",
				{ event: "DELETE", schema: "public", table: "fridge_items", filter: `fridge_id=eq.${fridgeId}` },
				() => {
					load();
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fridgeId]);

	useEffect(() => {
		function onReload(e: any) {
			const fid = Number(e.detail?.fridgeId);
			if (fid === fridgeId) {
				load();
			}
		}
		window.addEventListener("fridge-reload", onReload as EventListener);
		return () => window.removeEventListener("fridge-reload", onReload as EventListener);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fridgeId]);

	async function handleDelete(id: string) {
		// Optimistic update
		setItems((prev) => prev.filter((it) => it.id !== id));
		const { error } = await supabase.from("fridge_items").delete().eq("id", id);
		if (error) {
			// Revert on error
			await load();
			alert("Silme işlemi başarısız: " + error.message);
        } else {
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("fridge-reload", { detail: { fridgeId } }));
            }
            router.refresh();
		}
	}

	if (loading) {
		return <div className="flex h-full items-center justify-center text-sm opacity-70">Yükleniyor…</div>;
	}

	if (items.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-sm opacity-70">
				Kayıt bulunamadı.
			</div>
		);
	}

	return (
		<div className="mt-3 divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/10 dark:border-white/10">
			<div className="w-full overflow-x-auto">
				<table className="min-w-[760px] w-full text-sm">
				<thead className="bg-zinc-50 dark:bg-zinc-900">
					<tr>
						<th className="px-3 py-2 text-left font-medium">Ad</th>
						<th className="px-3 py-2 text-left font-medium">SKT</th>
						<th className="px-3 py-2 text-left font-medium">Raf</th>
						<th className="px-3 py-2 text-left font-medium">Pozisyon</th>
						<th className="px-3 py-2 text-left font-medium">Ortak?</th>
						<th className="px-3 py-2 text-left font-medium">Ekleyen</th>
						<th className="px-3 py-2 text-left" />
					</tr>
				</thead>
				<tbody>
					{items.map((it) => (
						<tr key={it.id} className="odd:bg-white even:bg-zinc-50 dark:odd:bg-black dark:even:bg-zinc-900">
							<td className="px-3 py-2">{it.name}</td>
							<td className="px-3 py-2">{it.expiration_date}</td>
							<td className="px-3 py-2">{it.location_shelf}</td>
							<td className="px-3 py-2">{["Sol", "Orta", "Sağ"][it.location_position] ?? "-"}</td>
							<td className="px-3 py-2">{it.is_common_use ? "Evet" : "Hayır"}</td>
							<td className="px-3 py-2">{it.added_by}</td>
							<td className="px-3 py-2 text-right">
								<button
									onClick={() => handleDelete(it.id)}
									className="rounded-md border border-red-600 px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
								>
									Çıkar
								</button>
							</td>
						</tr>
					))}
				</tbody>
				</table>
			</div>
		</div>
	);
}


