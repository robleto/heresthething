"use client";

import { useState } from "react";

interface ShareBarProps {
	slug: string;
	title: string;
	imageUrl: string;
	quoteText?: string;
	visible: boolean;
}

function humanizeSlug(value: string) {
	return value
		.split(/[-_]+/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function formatShareTitle(title: string, slug: string) {
	const preferred = title && title !== "Untitled" ? title : slug;
	const looksLikeSlug = /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(preferred);

	if (looksLikeSlug) {
		return humanizeSlug(preferred);
	}

	return preferred;
}

// ── Minimal inline SVGs ──────────────────────────────────────────────────────

function XIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.745l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	);
}

function PinterestIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
		</svg>
	);
}

function ThreadsIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.61 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.934.204-2.637 1.33l-1.728-1.115c.916-1.444 2.438-2.232 4.356-2.232h.040c3.058.019 4.877 1.890 5.046 5.131.17.114.336.232.496.355 1.161.891 1.940 2.073 2.253 3.409.498 2.102.044 4.74-2.033 6.772-1.851 1.815-4.107 2.6-7.298 2.624zm.17-8.012c-.959.055-1.843.331-2.44.767-.476.346-.709.788-.674 1.353.066 1.203 1.368 1.617 2.52 1.553 1.199-.065 2.967-.578 3.31-3.982a11.762 11.762 0 0 0-2.716.309z" />
		</svg>
	);
}

function BlueskyIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.204-.659-.299-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
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

function normalizeShareBody(value?: string) {
	if (!value) return "";
	return value.replace(/\s+/g, " ").trim();
}

function stripIntroPrefix(value: string) {
	return value
		.replace(/^here'?s the thing\.{0,3}\s*/i, "")
		.replace(/^[-:–—]+\s*/, "")
		.trim();
}

export default function ShareBar({ slug, title, imageUrl, quoteText, visible }: ShareBarProps) {
	const [copied, setCopied] = useState(false);

	function getCardPath() {
		return `/card/${slug}`;
	}

	function getCanonicalOrigin() {
		const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
		if (fromEnv) {
			return fromEnv.replace(/\/$/, "");
		}

		if (typeof window !== "undefined") {
			return window.location.origin;
		}

		return "";
	}

	function getCardUrl() {
		const origin = getCanonicalOrigin();
		if (origin) {
			return `${origin}${getCardPath()}`;
		}

		return getCardPath();
	}

	function getFreshShareCardUrl() {
		const origin = getCanonicalOrigin();
		const sharePath = `/share/${slug}`;

		if (origin) {
			return `${origin}${sharePath}`;
		}

		return sharePath;
	}

	function getShareDomain() {
		const shareUrl = getFreshShareCardUrl();
		if (/^https?:\/\//i.test(shareUrl)) {
			try {
				return new URL(shareUrl).host;
			} catch {
				return shareUrl;
			}
		}

		const origin = getCanonicalOrigin();
		if (!origin) return shareUrl;

		try {
			return new URL(origin).host;
		} catch {
			return shareUrl;
		}
	}

	const bodyCopyRaw =
		normalizeShareBody(quoteText) || normalizeShareBody(formatShareTitle(title, slug)) || "";
	const bodyCopy = stripIntroPrefix(bodyCopyRaw) || formatShareTitle(title, slug);
	const xShareText = `Here's the thing...\n${bodyCopy}\n${getShareDomain()}`;
	const socialShareText = `Here's the thing...\n${bodyCopy}\n${getFreshShareCardUrl()}`;

	// Prevent card-expand click from firing when interacting with share buttons
	function stop(e: React.MouseEvent) {
		e.stopPropagation();
	}

	async function handleCopy(e: React.MouseEvent) {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(getCardUrl());
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// clipboard unavailable — silent fail
		}
	}

	function handlePinterest(e: React.MouseEvent) {
		e.stopPropagation();
		const url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(getCardUrl())}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(socialShareText)}`;
		openShareUrl(url);
	}

	function handleThreads(e: React.MouseEvent) {
		e.stopPropagation();
		const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(socialShareText)}`;
		openShareUrl(url);
	}

	function handleX(e: React.MouseEvent) {
		e.stopPropagation();
		const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(xShareText)}&url=${encodeURIComponent(getFreshShareCardUrl())}`;
		openShareUrl(url);
	}

	function handleBluesky(e: React.MouseEvent) {
		e.stopPropagation();
		const url = `https://bsky.app/intent/compose?text=${encodeURIComponent(socialShareText)}`;
		openShareUrl(url);
	}

	function openShareUrl(url: string) {
		const shareWindow = window.open(url, "_blank", "noopener,noreferrer");

		if (shareWindow) {
			shareWindow.focus();
		}
	}

	function handleDownload(e: React.MouseEvent) {
		e.stopPropagation();
		const link = document.createElement("a");
		link.href = imageUrl;
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
				onClick={handleThreads}
				onMouseDown={stop}
				aria-label="Share on Threads"
				className={btnClass}
			>
				<ThreadsIcon />
			</button>

			<button
				type="button"
				onClick={handleX}
				onMouseDown={stop}
				aria-label="Share on X"
				className={btnClass}
			>
				<XIcon />
			</button>

			<button
				type="button"
				onClick={handleBluesky}
				onMouseDown={stop}
				aria-label="Share on Bluesky"
				className={btnClass}
			>
				<BlueskyIcon />
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
