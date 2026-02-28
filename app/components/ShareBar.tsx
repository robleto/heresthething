"use client";

import { useState } from "react";

interface ShareBarProps {
	slug: string;
	title: string;
	visible: boolean;
}

// ── Minimal inline SVGs ──────────────────────────────────────────────────────

function PinterestIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
		</svg>
	);
}


function LinkIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
			<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<polyline points="20 6 9 17 4 12" />
		</svg>
	);
}

function DownloadIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<polyline points="7 10 12 15 17 10" />
			<line x1="12" y1="15" x2="12" y2="3" />
		</svg>
	);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ShareBar({ slug, title, visible }: ShareBarProps) {
	const [copied, setCopied] = useState(false);

	function getPageUrl() {
		return typeof window !== "undefined" ? window.location.href : "";
	}

	const shareText =
		title && title !== "Untitled" ? title : "Here's the Thing";

	// Prevent card-expand click from firing when interacting with share buttons
	function stop(e: React.MouseEvent) {
		e.stopPropagation();
	}

	async function handleCopy(e: React.MouseEvent) {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(getPageUrl());
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// clipboard unavailable — silent fail
		}
	}

	function handlePinterest(e: React.MouseEvent) {
		e.stopPropagation();
		const imageUrl = `${window.location.origin}/img/${slug}.png`;
		const url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(getPageUrl())}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(shareText)}`;
		window.open(url, "_blank", "noopener,noreferrer");
	}

	function handleDownload(e: React.MouseEvent) {
		e.stopPropagation();
		const link = document.createElement("a");
		link.href = `/img/${slug}.png`;
		link.download = `${slug}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	const btnClass =
		"flex items-center justify-center w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 active:bg-white/50 text-white backdrop-blur-sm transition-colors duration-150";

	// visible  → controlled by hover state on desktop
	// [@media(hover:none)] → always show on touch/mobile when mounted (parent only renders when expanded)
	const barClass = [
		"absolute inset-x-0 bottom-0",
		"flex items-center justify-start gap-2 px-4 py-3",
		"bg-gradient-to-t from-black/65 via-black/25 to-transparent",
		"transition-all duration-200",
		visible
			? "opacity-100 translate-y-0 pointer-events-auto"
			: "opacity-0 translate-y-1 pointer-events-none",
		// On touch screens there is no hover; always show when the bar is rendered
		"[@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:pointer-events-auto",
	].join(" ");

	return (
		<div className={barClass} role="toolbar" aria-label="Share options">
			<button
				type="button"
				onClick={handlePinterest}
				onMouseDown={stop}
				aria-label="Share on Pinterest"
				className={btnClass}
			>
				<PinterestIcon />
			</button>

			<button
				type="button"
				onClick={handleCopy}
				onMouseDown={stop}
				aria-label={copied ? "Copied!" : "Copy link"}
				className={btnClass}
			>
				{copied ? <CheckIcon /> : <LinkIcon />}
			</button>

			<button
				type="button"
				onClick={handleDownload}
				onMouseDown={stop}
				aria-label="Download image"
				className={btnClass}
			>
				<DownloadIcon />
			</button>
		</div>
	);
}
