"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function AddItemModal() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const urlOpen = searchParams.get("add") === "1";

	// allow three fridge ids: 1, 2 and 3 (shared)
	type FridgeId = 1 | 2 | 3;

	const defaultFridge = Number(searchParams.get("fridge") || 1) as FridgeId;

	const [isOpen, setIsOpen] = useState<boolean>(urlOpen);
	const [openedByURL, setOpenedByURL] = useState<boolean>(urlOpen);
	const [submitting, setSubmitting] = useState<boolean>(false);

	interface FormState {
		fridge_id: FridgeId;
		name: string;
		expiration_date: string;
		is_common_use: boolean;
		location_shelf: number;
		location_position: number;
		added_by: string;
	}

	const [form, setForm] = useState<FormState>({
		fridge_id: defaultFridge,
		name: "",
		expiration_date: "",
		is_common_use: false,
		location_shelf: 1,
		location_position: 0,
		added_by: "",
	});

	// Local UI state for DD/MM/YYYY input; persisted to form as ISO
	const [dateInput, setDateInput] = useState<string>("");



	useEffect(() => {
		// Sync with URL (QR or direct link)
		if (urlOpen) {
			setIsOpen(true);
			setOpenedByURL(true);
			setForm({
				fridge_id: defaultFridge,
				name: "",
				expiration_date: "",
				is_common_use: false,
				location_shelf: 1,
				location_position: 0,
				added_by: "",
			});
			setDateInput("");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [urlOpen, defaultFridge]);

	useEffect(() => {
		// Client-side instant open (no navigation)
		function onOpen(e: any) {
			const fid = Number(e.detail?.fridgeId || 1) as FridgeId;
			setForm({
				fridge_id: fid,
				name: "",
				expiration_date: "",
				is_common_use: false,
				location_shelf: 1,
				location_position: 0,
				added_by: "",
			});
			setDateInput("");
			setOpenedByURL(false);
			setIsOpen(true);
		}
		window.addEventListener("open-add-modal", onOpen as EventListener);
		return () => window.removeEventListener("open-add-modal", onOpen as EventListener);
	}, []);

	const close = () => {
		setIsOpen(false);
		if (openedByURL) {
			const next = new URLSearchParams(searchParams.toString());
			next.delete("add");
			next.delete("fridge");
			router.replace(`${pathname}${next.toString() ? `?${next.toString()}` : ""}`);
		}
	};

		const supabase = useMemo(() => getSupabaseClient(), []);

	function formatISOToDDMMYYYY(iso: string): string {
		if (!iso) return "";
		const [y, m, d] = iso.split("-");
		if (!y || !m || !d) return "";
		return `${d}/${m}/${y}`;
	}

	function parseDDMMYYYYToISO(ddmmyyyy: string): string {
		const cleaned = ddmmyyyy.replace(/[^0-9]/g, "");
		if (cleaned.length !== 8) return "";
		const d = cleaned.slice(0, 2);
		const m = cleaned.slice(2, 4);
		const y = cleaned.slice(4, 8);
		const day = Number(d), month = Number(m), year = Number(y);
		if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return "";
		const dt = new Date(year, month - 1, day);
		if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return "";
		return `${y}-${m}-${d}`;
	}

	function handleDateInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		let v = e.target.value.replace(/[^0-9]/g, "");
		if (v.length > 8) v = v.slice(0, 8);
		let formatted = v;
		if (v.length > 4) formatted = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
		else if (v.length > 2) formatted = `${v.slice(0, 2)}/${v.slice(2)}`;
		setDateInput(formatted);
		const iso = parseDDMMYYYYToISO(formatted);
		if (iso) {
			setForm((prev) => ({ ...prev, expiration_date: iso }));
		} else if (formatted.length === 10) {
			// Only show error when user has entered full date (8 digits)
			toast.error("Geçersiz tarih! Lütfen gg/aa/yyyy formatında geçerli bir tarih girin.");
		}
	}

	useEffect(() => {
		setDateInput(formatISOToDDMMYYYY(form.expiration_date));
	}, [form.expiration_date]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (submitting) return;
		
		// Validate date before submitting
		if (!form.expiration_date) {
			toast.error("Lütfen geçerli bir son kullanma tarihi girin!");
			return;
		}
		
		// Validate shelf number
		if (!form.location_shelf || form.location_shelf < 1) {
			toast.error("Lütfen geçerli bir raf numarası girin (minimum 1)!");
			return;
		}
		
		setSubmitting(true);
		const { error } = await supabase.from("fridge_items").insert([
			{
				fridge_id: form.fridge_id,
				name: form.name,
				expiration_date: form.expiration_date,
				is_common_use: form.is_common_use,
				location_shelf: form.location_shelf,
				location_position: form.location_position,
				added_by: form.added_by,
			},
		]);
		if (!error) {
			toast.success("Ürün başarıyla eklendi!");
			close();
			// Inform lists to reload instantly (in addition to Realtime)
			if (typeof window !== "undefined") {
				window.dispatchEvent(
					new CustomEvent("fridge-reload", { detail: { fridgeId: form.fridge_id } })
				);
			}
			router.refresh();
		} else {
			toast.error("Ürün eklenirken hata oluştu: " + error.message);
		}
		setSubmitting(false);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-lg rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
				<div className="mb-3 flex items-center justify-between">
					<h3 className="text-lg font-semibold">Ürün Ekle</h3>
					<button onClick={close} className="text-sm opacity-70 hover:opacity-100">
						Kapat
					</button>
				</div>
				<form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<label className="flex flex-col gap-1 text-sm sm:col-span-2">
						<span>Gıda Adı</span>
						<input
							required
						className="rounded-md border border-black/10 bg-white px-3 py-2 text-black outline-none dark:border-white/15 dark:bg-zinc-900 dark:text-white"
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						<span>Dolap</span>
			<select
							className="rounded-md border border-black/10 bg-white px-3 py-2 text-black outline-none dark:border-white/15 dark:bg-zinc-900 dark:text-white"
							value={form.fridge_id}
				onChange={(e) => setForm({ ...form, fridge_id: Number(e.target.value) as 1 | 2 | 3 })}
						>
							<option value={1}>Buzdolabı 1</option>
							<option value={2}>Buzdolabı 2</option>
				<option value={3}>Ortak dolap</option>
						</select>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						<span>Son Kullanma Tarihi</span>
						<input
							required
							type="text"
							inputMode="numeric"
							placeholder="gg/aa/yyyy"
							className="rounded-md border border-black/10 bg-white px-3 py-2 text-black outline-none dark:border-white/15 dark:bg-zinc-900 dark:text-white"
							value={dateInput}
							onChange={handleDateInputChange}
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						<span>Raf Numarası</span>
						<input
							type="text"
							inputMode="numeric"
							placeholder="1"
							className="rounded-md border border-black/10 bg-white px-3 py-2 text-black outline-none dark:border-white/15 dark:bg-zinc-900 dark:text-white"
							value={form.location_shelf || ""}
							onChange={(e) => {
								const val = e.target.value.replace(/[^0-9]/g, "");
								if (val === "") {
									setForm({ ...form, location_shelf: 0 });
								} else {
									const num = parseInt(val, 10);
									if (!isNaN(num)) {
										setForm({ ...form, location_shelf: num });
									}
								}
							}}
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						<span>Pozisyon</span>
						<select
							className="rounded-md border border-black/10 bg-white px-3 py-2 text-black outline-none dark:border-white/15 dark:bg-zinc-900 dark:text-white"
							value={form.location_position}
							onChange={(e) => setForm({ ...form, location_position: Number(e.target.value) })}
						>
							<option value={0}>Sol</option>
							<option value={1}>Orta</option>
							<option value={2}>Sağ</option>
						</select>
					</label>
					<label className="flex items-center gap-2 text-sm sm:col-span-2">
						<input
							type="checkbox"
							checked={form.is_common_use}
							onChange={(e) => setForm({ ...form, is_common_use: e.target.checked })}
						/>
						<span>Ortak tüketime açık</span>
					</label>
					<label className="flex flex-col gap-1 text-sm sm:col-span-2">
						<span>Kullanıcı Adı</span>
						<input
							required
							className="rounded-md border border-black/10 bg-transparent px-3 py-2 outline-none dark:border-white/15"
							value={form.added_by}
							onChange={(e) => setForm({ ...form, added_by: e.target.value })}
						/>
					</label>
					<div className="sm:col-span-2">
						<button
							type="submit"
							disabled={submitting}
							className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white opacity-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black"
						>
							{submitting ? "Ekleniyor…" : "Ekle"}
						</button>
					</div>
				</form>
			</div>
			<Toaster position="top-center" reverseOrder={false} />
		</div>
	);
}


