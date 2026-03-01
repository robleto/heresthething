"use client";

import { useEffect } from "react";

export default function ShareRedirect() {
	useEffect(() => {
		const timeout = window.setTimeout(() => {
			window.location.replace("/");
		}, 300);

		return () => window.clearTimeout(timeout);
	}, []);

	return null;
}
