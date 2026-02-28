"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ShareBar from "./ShareBar";

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
	const [hoveredCard, setHoveredCard] = useState<string | null>(null);
	const [columns, setColumns] = useState(2); // Default to mobile (Tailwind sm:grid-cols-2)
	const gridRef = useRef<HTMLDivElement>(null);

	function getImageBySlug(slug: string) {
		const r2Base = process.env.NEXT_PUBLIC_R2_IMAGE_BASE_URL;
		if (r2Base) {
			return `${r2Base.replace(/\/$/, "")}/${slug}.png`;
		}

		return `/img/${slug}.png`;
	}

	// ✅ Fetch data from cards API (R2/local with Notion fallback)
	useEffect(() => {
		async function fetchData() {
			try {
				let data: Card[] = [];

				const cardsRes = await fetch("/api/cards", { cache: "no-store" });
				if (cardsRes.ok) {
					data = await cardsRes.json();
				} else {
					console.warn("Cards API fetch failed, falling back to Notion", {
						status: cardsRes.status,
					});

					const notionRes = await fetch("/api/notion");
					if (notionRes.ok) {
						const notionData = await notionRes.json();
						data = notionData.map((item: Card) => ({
							...item,
							imageUrl: getImageBySlug(item.slug),
						}));
					} else {
						console.error("Notion fallback fetch failed", { status: notionRes.status });
					}
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
				const isExpanded = expandedCard === item.id;
				
				// Calculate explicit grid positioning for last-column expanded cards
				let gridStyle = {};
				let className = "card relative flex items-center justify-center aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-300 transition-all";
				
				if (isExpanded) {
					if (isLastColumn) {
						// For last column cards, position them at the start of the next row
						const currentRow = Math.floor(index / columns) + 1; // Convert to 1-indexed
						const nextRow = currentRow + 1;
						gridStyle = {
							gridColumn: '1 / span 2', // Start at column 1, span 2 columns
							gridRow: `${nextRow} / span 2`, // Start at next row, span 2 rows
						};
					} else {
						// For non-last column cards, just expand in place
						className += " col-span-2 row-span-2";
					}
				}
				
				return (
					<div
						key={item.id}
						role="button"
						tabIndex={0}
						data-key={item.id}
						style={gridStyle}
						className={className}
						aria-label={item.title || `Card for ${item.slug}`}
						aria-pressed={isExpanded}
						onClick={() => expandCard(item.id)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								expandCard(item.id);
							}
						}}
						onMouseEnter={() => setHoveredCard(item.id)}
						onMouseLeave={() => setHoveredCard(null)}
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
								// Fallback to local image path if current source fails
								const target = e.target as HTMLImageElement;
								if (!target.src.includes('/img/')) {
									target.src = getImageBySlug(item.slug);
								}
							}}
						/>
					{isExpanded && (
						<ShareBar
							slug={item.slug}
							title={item.title}
							visible={hoveredCard === item.id}
						/>
					)}
					</div>
				);
			})}
		</div>
	);
}
