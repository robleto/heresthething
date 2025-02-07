"use client";

import React from "react";
import Image from "next/image";

interface CardProps {
	id: string; // ✅ Notion ID is a string
	slug: string;
}

const Card: React.FC<CardProps> = ({ id, slug }) => {
	return (
		<div
			className="card flex items-center justify-center aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-300"
			data-key={id} >
			<Image
				className="w-full h-full object-cover"
				src={`/img/${slug}.png`}
				alt={`Card for ${slug}`}
				layout="fill"
			/>
		</div>
	);
};

export default Card;
