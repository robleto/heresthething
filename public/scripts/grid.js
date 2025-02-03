/* public/scripts/grid.js */
document.addEventListener("DOMContentLoaded", () => {
	const gridContainer = document.querySelector(".grid");
	let expandedCard = null;

	if (!gridContainer) return;

	// Event Delegation for Clicks (Performance Optimization)
	gridContainer.addEventListener("click", (event) => {
		const card = event.target.closest(".card");
		if (card) expandCard(card);
	});

	function expandCard(card) {
		const cards = Array.from(gridContainer.children);
		const cardIndex = cards.indexOf(card);
		const numCols = Math.floor(
			gridContainer.clientWidth / card.clientWidth
		);
		const rowStart = Math.floor(cardIndex / numCols) * numCols;

		if (expandedCard === card) {
			resetGrid();
			return;
		}

		if (expandedCard) {
			resetGrid();
		}

		card.classList.add("expanded");
		expandedCard = card;

		shiftAffectedCards(cardIndex, numCols, cards);
	}

	function shiftAffectedCards(expandedIndex, numCols, cards) {
		const rowStart = Math.floor(expandedIndex / numCols) * numCols;
		let affectedCards = [];

		for (let i = 0; i < numCols; i++) {
			let index = rowStart + i;
			if (cards[index] && index !== expandedIndex) {
				affectedCards.push(cards[index]);
			}
		}

		affectedCards.forEach((card, i) => {
			let newPos = rowStart + numCols + i;
			if (cards[newPos]) {
				gridContainer.insertBefore(card, cards[newPos].nextSibling);
			} else {
				gridContainer.appendChild(card);
			}
		});
	}

	function resetGrid() {
		if (expandedCard) {
			expandedCard.classList.remove("expanded");
			expandedCard = null;
		}
		reorderGrid();
	}

	function reorderGrid() {
		const cards = Array.from(gridContainer.children);
		gridContainer.innerHTML = "";
		cards.sort(
			(a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index)
		);
		cards.forEach((card) => gridContainer.appendChild(card));
	}
});
