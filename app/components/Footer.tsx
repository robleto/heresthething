import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
	return (
		<footer className="w-full bg-gray-800 text-gray-400 flex justify-between items-center px-4 py-2">
			<p className="text-sm">
				Illustrations and Design by{" "}
				<Link
					href="https://www.robleto.com/"
					target="_blank"
					rel="noopener noreferrer"
					className="underline"
				>
					Greg Robleto
				</Link>
			</p>

			<div className="flex space-x-4">
				{[
					{
						href: "https://www.robleto.com",
						img: "/_icons/website-icon.svg",
					},
					{
						href: "https://www.codepen.com/robleto",
						img: "/_icons/codepen-icon.svg",
					},
					{
						href: "https://www.dribbble.com/robleto",
						img: "/_icons/dribbble-icon.svg",
					},
					{
						href: "https://www.github.com/robleto",
						img: "/_icons/github-icon.svg",
					},
					{
						href: "https://www.linkedin.com/in/robleto",
						img: "/_icons/linkedin-icon.svg",
					},
				].map(({ href, img }) => (
					<Link
						key={href}
						href={href}
						target="_blank"
						rel="noopener noreferrer">
						<Image 
              src={img} 
              alt="Icon" 
              width={24} 
              height={24} 
              className="w-6 h-6" />
					</Link>
				))}
			</div>
		</footer>
	);
}
