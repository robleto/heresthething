"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Card {
	id: string;
	slug: string;
	title: string;
	imageUrl: string;
}

export default function Grid() {
	const [cards, setCards] = useState<Card[]>([]);
	const [expandedCard, setExpandedCard] = useState<string | null>(null);
	const [columns, setColumns] = useState(2); // Default to mobile (Tailwind sm:grid-cols-2)
	const gridRef = useRef<HTMLDivElement>(null);

	// ✅ Fetch data from Supabase API route
	useEffect(() => {
		async function fetchData() {
			try {
				// Try Supabase first, fallback to Notion if needed
				const res = await fetch("/api/supabase");
				let data = await res.json();

				// If Supabase fails, fallback to Notion
				if (!res.ok) {
					console.warn("Supabase API failed, falling back to Notion");
					const notionRes = await fetch("/api/notion");
					const notionData = await notionRes.json();
					// Transform Notion data to match expected format
					data = notionData.map((item: Card) => ({
						...item,
						imageUrl: `/img/${item.slug}.png`
					}));
				}

				// 🔀 Shuffle the cards array
				data = data.sort(() => Math.random() - 0.5);

				setCards(data);
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		}
		fetchData();
	}, []);

	// ✅ Update Column Count Based on Tailwind Breakpoints
	useEffect(() => {
		function updateColumns() {
			const width = window.innerWidth;
			let newColumns = 2; // Default for small screens

			if (width >= 1280) newColumns = 5; // xl:grid-cols-5
			else if (width >= 1024) newColumns = 4; // lg:grid-cols-4
			else if (width >= 768) newColumns = 4; // md:grid-cols-4
			else if (width >= 640) newColumns = 3; // sm:grid-cols-3

			console.log(`Detected Columns: ${newColumns}`); // ✅ Debugging

			setColumns(newColumns);
		}

		updateColumns(); // Run on mount
		window.addEventListener("resize", updateColumns);
		return () => window.removeEventListener("resize", updateColumns);
	}, []);

	// ✅ Expanding card function
	function expandCard(cardId: string) {
		setExpandedCard(expandedCard === cardId ? null : cardId);

		// 🔹 Smooth scroll into view
		setTimeout(() => {
			const cardElement = document.querySelector(
				`[data-key="${cardId}"]`
			);
			if (cardElement) {
				cardElement.scrollIntoView({
					behavior: "smooth",
					block: "center",
				});
			}
		}, 200);
	}

	// ✅ GSAP Scroll Animation
	useEffect(() => {
		if (!gridRef.current) return;

		gsap.utils.toArray(".card").forEach((card) => {
			gsap.fromTo(
				card as Element,
				{ opacity: 0, y: 50 },
				{
					opacity: 1,
					y: 0,
					duration: 0.8,
					ease: "power2.out",
					scrollTrigger: {
						trigger: card as Element,
						start: "top 90%",
						toggleActions: "play none none none",
					},
				}
			);
		});
	}, [cards]);

	// ✅ Render Grid
	return (
		<div
			ref={gridRef}
			className="grid grid-cols-2 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-4 sm:grid-cols-3 gap-2 w-[90vw] max-w-[90vw] mx-auto"
		>
			{cards.map((item, index) => {
				const isLastColumn = (index + 1) % columns === 0;

				console.log(
					`Item: ${item.slug} | Index: ${index} | Last Column: ${isLastColumn}`
				); // ✅ Debugging

				return (
					<div
						key={item.id}
						data-key={item.id}
						className={`card relative flex items-center justify-center aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-300 transition-all ${
							expandedCard === item.id
								? `col-span-2 row-span-2 ${
										isLastColumn ? "-translate-x-full" : ""
								  }`
								: ""
						}`}
						onClick={() => expandCard(item.id)}
					>
						<Image
							className="w-full h-full object-cover"
							src={item.imageUrl}
							alt={item.title || `Card for ${item.slug}`}
							fill
							sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
							priority={index < 6}
							onError={(e) => {
								console.error(`Failed to load image: ${item.imageUrl}`);
								// Fallback to local image if Supabase image fails
								const target = e.target as HTMLImageElement;
								if (!target.src.includes('/img/')) {
									target.src = `/img/${item.slug}.png`;
								}
							}}
						/>
					</div>
				);
			})}
		</div>
	);
}
