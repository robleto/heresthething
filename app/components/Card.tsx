"use client";

import React, { useState } from "react";
import Image from "next/image";

interface CardProps {
	id: string; // ✅ Notion ID is a string
	slug: string;
}

const Card: React.FC<CardProps> = ({ id, slug }) => {
	const [imageError, setImageError] = useState(false);
	
	return (
		<div
			className="card relative flex items-center justify-center aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-300"
			data-key={id} >
			{!imageError ? (
				<Image
					className="w-full h-full object-cover"
					src={`/img/${slug}.png`}
					alt={`Card for ${slug}`}
					fill
					sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
					onError={() => {
						console.error(`Failed to load image: /img/${slug}.png`);
						setImageError(true);
					}}
				/>
			) : (
				<div className="flex items-center justify-center w-full h-full text-gray-600 text-sm font-medium">
					{slug}
				</div>
			)}
		</div>
	);
};

export default Card;
