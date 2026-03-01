import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getCardBySlug, getCards } from "../../../lib/cards";

interface SharePageProps {
	params: Promise<{ slug: string }>;
}

function formatCardTitle(title: string, slug: string) {
	const preferred = title && title !== "Untitled" ? title : slug;
	const looksLikeSlug = /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(preferred);

	if (looksLikeSlug) {
		return preferred
			.split(/[-_]+/)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(" ");
	}

	return preferred;
}

export async function generateStaticParams() {
	const cards = await getCards();
	return cards.map((card) => ({ slug: card.slug }));
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
	const { slug } = await params;
	const card = await getCardBySlug(slug);

	if (!card) {
		return {
			title: "Card Not Found",
			robots: {
				index: false,
				follow: false,
			},
		};
	}

	const title = formatCardTitle(card.title, card.slug);
	const description = `${title} — from Here's the Thing.`;
	const sharePath = `/share/${card.slug}`;
	const cardPath = `/card/${card.slug}`;
	const imagePath = `/share/${card.slug}/twitter-image`;

	return {
		title,
		description,
		alternates: {
			canonical: cardPath,
		},
		openGraph: {
			type: "article",
			title,
			description,
			url: sharePath,
			images: [
				{
					url: imagePath,
					width: 1200,
					height: 630,
					alt: title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [imagePath],
		},
	};
}

export default async function SharePage({ params }: SharePageProps) {
	const { slug } = await params;
	const card = await getCardBySlug(slug);

	if (!card) {
		notFound();
	}

	const title = formatCardTitle(card.title, card.slug);

	return (
		<div className="flex flex-col min-h-screen">
			<Header />
			<main className="flex flex-col items-center justify-center min-h-screen px-6 py-10 bg-gray-200 gap-6">
				<div className="w-full max-w-xl aspect-square relative rounded-xl overflow-hidden shadow-sm bg-gray-300">
					<Image
						src={card.imageUrl}
						alt={title}
						fill
						priority
						className="object-cover"
						sizes="(max-width: 768px) 90vw, 600px"
					/>
				</div>
				<h1 className="text-center text-lg md:text-xl font-medium text-gray-900 max-w-2xl">{title}</h1>
				<Link href={`/card/${card.slug}`} className="text-sm text-gray-700 hover:text-black underline underline-offset-4">
					Open card page
				</Link>
			</main>
			<Footer />
		</div>
	);
}
