"use client";

import React, { useEffect, useRef } from "react";

export default function VantaBackground() {
	const elRef = useRef<HTMLDivElement | null>(null);
	const vantaRef = useRef<any>(null);

	useEffect(() => {
		let disposed = false;
		async function load() {
			// Load scripts sequentially to ensure VANTA finds THREE on window
			await new Promise<void>((resolve, reject) => {
				const s = document.createElement("script");
				s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js";
				s.async = true;
				s.onload = () => resolve();
				s.onerror = () => reject(new Error("three.js yüklenemedi"));
				document.body.appendChild(s);
			});
			await new Promise<void>((resolve, reject) => {
				const s = document.createElement("script");
				s.src = "https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.net.min.js";
				s.async = true;
				s.onload = () => resolve();
				s.onerror = () => reject(new Error("vanta.net yüklenemedi"));
				document.body.appendChild(s);
			});
			if (disposed) return;
			// @ts-ignore
			if (window.VANTA && (window as any).VANTA.NET && elRef.current) {
				// @ts-ignore
				vantaRef.current = (window as any).VANTA.NET({
					el: elRef.current,
					mouseControls: true,
					touchControls: true,
					gyroControls: false,
					minHeight: 200.0,
					minWidth: 200.0,
					scale: 1.0,
					scaleMobile: 1.0,
					color: 0xaa8a8a,
					backgroundColor: 0x111111,
					points: 13.0,
					maxDistance: 26.0,
					spacing: 17.0,
				});
			}
		}
		load();
		return () => {
			disposed = true;
			try {
				vantaRef.current && vantaRef.current.destroy && vantaRef.current.destroy();
			} catch {}
		};
	}, []);

	return (
		<div ref={elRef} id="vanta" className="fixed inset-0 -z-10" />
	);
}


