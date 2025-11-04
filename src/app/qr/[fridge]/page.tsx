import QRCode from "qrcode";
import { headers } from "next/headers";

type Props = { params: Promise<{ fridge: string }> };

export default async function QRPage({ params }: Props) {
	const { fridge } = await params;
	const fridgeId = Number(fridge);
	if (![1, 2, 3].includes(fridgeId)) {
		return <div className="p-6 text-red-600">Geçersiz dolap numarası.</div>;
	}

	const hdrs = await headers();
	const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
	const proto = (hdrs.get("x-forwarded-proto") || "http").split(",")[0];
	const base = `${proto}://${host}`;
    const targetUrl = `${base}/?add=1&fridge=${fridgeId}`;
	const title = fridgeId === 3 ? "Ortak dolap" : `Buzdolabı ${fridgeId}`;
    // Generate SVG on the server to avoid Canvas dependency
    const svg = await QRCode.toString(targetUrl, { type: "svg", margin: 2, width: 512 });

	return (
		<div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 p-6">
            <h1 className="text-2xl font-semibold">{title} - Ürün Ekle QR</h1>
            <div
                className="h-auto w-72 sm:w-96 [&>svg]:h-auto [&>svg]:w-full"
                aria-label={`Fridge ${fridgeId} QR`}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
			<p className="text-sm opacity-70">Bu QR’ı dolap üzerine yapıştırın. Taratıldığında ekleme formunu açar.</p>
			<a
				className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
				href={targetUrl}
				target="_blank"
				rel="noopener noreferrer"
			>
				Linki Aç
			</a>
		</div>
	);
}


