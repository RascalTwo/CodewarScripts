// ==UserScript==
// @name        Codewars Clan Leaderboard
// @match       https://www.codewars.com/*
// @grant       none
// @version     1.0
// @author      Rascal_Two
// ==/UserScript==

(async () => {
	console.log('[R2 Codewars Clan Leaderboard Loaded]')

	const self = (() => {
		const wrapper = document.querySelector('.profile-points');
		if (!wrapper) return null;

		return {
			rank: wrapper.children[0].textContent,
			honor: +wrapper.children[1].textContent,
			username: document.querySelector('#header_profile_link').href.split('/').at(-1),
			rankClass: wrapper.children[1].className,
			avatarImage: document.querySelector('.profile-pic img').src
		}
	})();

	let nth = 1;
	let { pathname } = window.location;

	window.addEventListener('hashchange', console.log)

	while (true) {
		await new Promise(r => setTimeout(r, 1000));
		if (!window.location.pathname.match(/users\/.*\/(allies|following|followers)/)) {
			nth = 1;
			continue;
		}

		if (pathname !== window.location.pathname){
			nth = 1;
			pathname = window.location.pathname;
		}

		for (const row of document.querySelectorAll('tr[data-username]:not([data-r2-done])')) {
			row.dataset.r2Done = true;
			const honor = +row.children[2].textContent;
			if (self && honor >= self.honor && (row.nextSibling && +row.nextSibling.children[2].textContent <= self.honor)) {
				const selfRow = document.createElement('tr')
				selfRow.innerHTML = `<tr data-username="${self.username}" data-r2-done="true">
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
				selfRow.dataset.r2Done = true;
				row.parentNode.insertBefore(selfRow, row.nextSibling)
			}
			row.innerHTML = `<td>#${nth++}</td>` + row.innerHTML;
		}
	}
})();