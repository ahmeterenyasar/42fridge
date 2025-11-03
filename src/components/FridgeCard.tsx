"use client";

import React from "react";
import { MAX_CAPACITY } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Props = {
	fridgeId: 1 | 2 | 3;
	count: number;
};

export default function FridgeCard({ fridgeId, count }: Props) {
	const router = useRouter();
	const percent = Math.min(100, Math.round((count / MAX_CAPACITY) * 100));

	const title = fridgeId === 3 ? "Ortak dolap" : `Buzdolabı ${fridgeId}`;

	return (
		<div className="w-full rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">{title}</h2>
				<div className="flex items-center gap-2">
					<button
						className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
						onClick={() => {
							// Open modal instantly via client event (no server navigation)
							window.dispatchEvent(new CustomEvent("open-add-modal", { detail: { fridgeId } }));
						}}
					>
						Ekle
					</button>
					<button
						className="rounded-md border border-black/20 px-3 py-2 text-sm font-medium dark:border-white/30"
						onClick={() => router.push(`/qr/${fridgeId}`)}
					>
						QR
					</button>
				</div>
			</div>
			<div className="mt-3">
				<div className="mb-1 flex justify-between text-sm">
					<span>Doluluk</span>
					<span>
						{count}/{MAX_CAPACITY} (%{percent})
					</span>
				</div>
				<div className="h-3 w-full overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
					<div
						className="h-full bg-zinc-900 transition-all dark:bg-zinc-100"
						style={{ width: `${percent}%` }}
					/>
				</div>
			</div>
		</div>
	);
}


