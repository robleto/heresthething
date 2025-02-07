import "./styles/global.css"; 

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head>
				<title>Here&apos;s the Thing</title>
			</head>
			<body className="bg-gray-200 text-black flex flex-col min-h-screen">
				{children}
			</body>
		</html>
	);
}
