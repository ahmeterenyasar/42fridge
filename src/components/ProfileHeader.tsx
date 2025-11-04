"use client";

import React from "react";

export default function ProfileHeader() {
	return (
		<div className="mx-auto mb-6 max-w-2xl rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-indigo-600 text-white overflow-hidden">
					<img src="/favicon.svg" alt="Buzdolabı" className="h-10 w-10" />
				</div>
				<div>
					<div className="text-base font-semibold">BEN BUZDOLABIYIM</div>
					<div className="text-xs opacity-70">Ortak sorumluluk ve kullanım talimatlarımı okuyun!</div>
				</div>
			</div>

			<div className="mt-3 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
				<ul className="list-inside list-disc space-y-1.5 text-center">
					<li>Tarihi geçmiş ürünleri çıkarınız ve uygulama üzerinden güncelleyiniz.</li>
					<li>Ürün eklerken lütfen doğru dolabı, rafı ve raf içerisindeki konumunu seçiniz.</li>
					<li>Bozulmaya yakın veya kokan ürünleri atınız ve stok bilgisini güncelleyiniz.</li>
				</ul>
			</div>
		</div>
	);
}
