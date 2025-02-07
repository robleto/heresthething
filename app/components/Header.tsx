import Link from 'next/link';

export default function Header() {
	return (
		<header className="flex flex-row items-center justify-between p-4 text-white bg-slate-900">
			<div className="flex flex-col md:flex-row">
				<Link href="/">
					<h1 className="text-lg font-medium place-items-center px-2 md:pr-3">
						Here&apos;s the Thing&hellip;
					</h1>
        </Link>
			</div>
		</header>
	);
}
