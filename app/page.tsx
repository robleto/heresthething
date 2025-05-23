import Grid from "./components/Grid";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Home() {
	return (
		<div className="flex flex-col min-h-screen">
			<Header />
			<main className="flex flex-col items-center justify-center min-h-screen px-6 py-6 bg-gray-200">
				<Grid />
			</main>
			<Footer />
		</div>
	);
}
