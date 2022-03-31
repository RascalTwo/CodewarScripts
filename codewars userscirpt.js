// ==UserScript==
// @name        Codewars Clan Leaderboard
// @match       https://www.codewars.com/*
// @grant       none
// @version     3.0
// @author      Rascal_Two
// ==/UserScript==

(async () => {
	const log = (...args) => console.log('[R2 Codewars Clan Leaderboard Loaded]', ...args);

	function parseSelf() {
		const wrapper = document.querySelector('.profile-points');
		if (!wrapper) return null;

		return {
			rank: wrapper.children[0].textContent,
			honor: +wrapper.children[1].textContent.replace(/,/g, ''),
			username: document.querySelector('#header_profile_link').href.split('/').at(-1),
			rankClass: wrapper.children[0].className,
			avatarImage: document.querySelector('.profile-pic img').src
		}
	}

	let self = parseSelf();
	let nth = 1;

	function processTable(table) {
		for (const row of table.querySelectorAll('tr[data-username]')) {
			const honor = +row.children[2].textContent;
			row.innerHTML = `<td>#${nth++}</td>` + row.innerHTML;
			if (self && honor >= self.honor && (row.nextSibling && +row.nextSibling.children[2].textContent <= self.honor)) {
				console.log(honor, self.honor, +row.nextSibling.children[2].textContent);
				const selfRow = document.createElement('tr')
				selfRow.innerHTML = `<tr data-username="${self.username}">
					<td>#${nth++}</td>
					<td class="is-big">
						<div class="${self.rankClass} float-left mt-5px mr-5">
							<div class="inner-small-hex is-extra-wide ">
								<span>${self.rank}</span>
							</div>
						</div>
						<a href="/users/${self.username}">
							<img class="profile-pic" src="${self.avatarImage}">
							${self.username}
						</a>
					</td>
					<td>
						<i title="Clan" class="icon-moon-clan "></i>
						#100Devs - leonnoel.com/twitch
					</td>
					<td>${self.honor}</td>
				</tr>`
				row.parentNode.insertBefore(selfRow, row.nextSibling)
			}
		}
		log('Table processed')
	}

	const observer = new MutationObserver((records) => {
		for (const record of records) {
			for (const node of record.addedNodes) {
				if (node.classList.contains('leaderboard')) processTable(node);
			}
		}
	});

	let pathname = null;
	function start() {
		log('Table found, attached');
		const root = document.querySelector('.leaderboard')
		observer.observe(root, { childList: true, subtree: true });
		processTable(root);
	}
	new MutationObserver(() => {
		const newPathname = window.location.pathname;
		if (newPathname === pathname) return;
		pathname = newPathname;
		nth = 1;
		self = parseSelf();

		observer.disconnect();
		if (!pathname.match(/users\/.*\/(allies|following|followers)/)) return;

		setTimeout(start, 2500);
	}).observe(document, { subtree: true, childList: true });
})();