// ==UserScript==
// @name        Codewars Completed Kata Marker
// @match       https://www.codewars.com/*
// @grant       none
// @version     1.0
// @author      Rascal_Two
// ==/UserScript==


(async () => {
	const CHECKBOX = `
		<div part="base" class="icon" aria-hidden="true" name="check2" style="display: inline-block;">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16">
				<path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"></path>
			</svg>
		</div>
	`;

	const log = (...args) => console.log('[R2 Codewars Completed Kata Marker]', ...args);

	const { completedChallenges, syncChallenges } = await (async () => {
		const completedChallenges = new Map(Object.entries(JSON.parse(localStorage.getItem('r2-completed-challenges') || '{}')));
		let count = +(localStorage.getItem('r2-completed-count') || '0')

		function getUsername(){
			return document.querySelector('#header_profile_link').href.split('/').at(-1);
		}

		async function fetchCompletedChallenges(){
			log('Fetching completed challenges...');
			const challenges = new Map();

			for (let page = 0, totalPages = Infinity; page <= totalPages; page++) {
				log(`Fetching page ${page}...`);
				const res = await fetch(`https://www.codewars.com/api/v1/users/${getUsername()}/code-challenges/completed?page=${page}`);
				const { totalPages: newTotalPages, data } = await res.json();
				totalPages = newTotalPages;
				for (const challenge of data) challenges.set(challenge.id, challenge);
			}

			return challenges;
		}

		async function syncChallenges() {
			const res = await fetch(`https://www.codewars.com/api/v1/users/${getUsername()}`);
			const latestCount = (await res.json()).codeChallenges.totalCompleted;
			log(`Latest count: ${latestCount}`);
			if (latestCount !== count) {
				count = latestCount;
				localStorage.setItem('r2-completed-count', count);

				const newChallenges = await fetchCompletedChallenges();
				completedChallenges.clear();
				for (const [id, challenge] of newChallenges) completedChallenges.set(id, challenge);
				localStorage.setItem('r2-completed-challenges', JSON.stringify(completedChallenges, (_, value) => value instanceof Map ? Object.fromEntries(value.entries()) : value));
			}
		}

		return { completedChallenges, syncChallenges };
	})();

	function processKata(node){
		if (node.dataset.r2Processed) return
		node.dataset.r2Processed = true;

		const id = node.querySelector('[data-id]').dataset.id;
		if (!completedChallenges.has(id)) return;

		const challenge = completedChallenges.get(id);
		const languages = challenge.completedLanguages;
		const textWrapper = node.children[0].children[0].children[0];
		textWrapper.insertAdjacentHTML('beforeend', CHECKBOX);

		for (const language of languages){
			const languageNode = node.querySelector(`[data-language="${language}"]`);
			languageNode.children[0].dataset.progress = '2';
		}
	}

	const observer = new MutationObserver((records) => {
		for (const record of records) {
			for (const node of record.addedNodes) {
				if (node.classList.contains('list-item-kata')) processKata(node);
			}
		}
	});

	let pathname = null;
	function start() {
		log('List found, attached');
		const root = document.querySelector('.items-list')
		observer.observe(root, { childList: true });
		for (const child of root.children) if (child.classList.contains('list-item-kata')) processKata(child);
	}
	new MutationObserver(() => {
		const newPathname = window.location.pathname;
		if (newPathname === pathname) return;
		pathname = newPathname;

		syncChallenges().then(newSelf => {
			self = newSelf;

			observer.disconnect();
			if (!pathname.match(/users\/.*\/completed/)) return;

			setTimeout(start, 5000);
		});
	}).observe(document, { subtree: true, childList: true });
})();