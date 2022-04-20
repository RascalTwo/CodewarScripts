// ==UserScript==
// @name        Codewars Clan Leaderboard
// @match       https://www.codewars.com/*
// @grant       none
// @version     1.1
// @author      Rascal_Two
// ==/UserScript==


(async () => {
	const log = (...args) => console.log('[R2 Codewars Clan Leaderboard]', ...args);

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
	let seen = new Set();

	let select = null;

	function parseUserFromRow(row) {
		const username = row.dataset.username;
		const clan = row.children[row.children.length - 2].textContent.trim();
		const honor = +row.children[row.children.length - 1].textContent.replace(/,/g, '');
		return { username, honor, clan }
	}

	function isUserRowVisible({ clan, honor, username }) {
		if (!select.value) return true;
		return select.value === clan;
	}

	function updateVisibleUsers() {
		for (const row of document.querySelectorAll('tr[data-username]')) {
			row.style.display = isUserRowVisible(parseUserFromRow(row)) ? 'table-row' : 'none';
		}
	}

	function processTable(table) {
		for (const row of table.querySelectorAll('tr[data-username]')) {
			const user = parseUserFromRow(row);
			if (seen.has(user.username)) {
				row.remove()
				continue;
			}
			if (![...select.options].map(option => option.value).includes(user.clan)) {
				const option = document.createElement('option');
				option.textContent = user.clan;
				select.appendChild(option);
			}

			row.style.display = isUserRowVisible(user) ? 'table-row' : 'none';

			row.innerHTML = `<td>#${nth++}</td>` + row.innerHTML;
			if (self && user.honor >= self.honor && (row.nextSibling && parseUserFromRow(row.nextSibling).honor <= self.honor)) {
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

		const tbody = root.querySelector('tbody');
		const controls = document.createElement('tr')
		controls.insertCell(-1)
		controls.insertCell(-1)
		const clanFilter = controls.insertCell(-1)
		select = document.createElement('select')
		select.style.textAlign = 'center';
		select.style.color = 'black';
		select.style.width = '5ch';
		select.style.height = '3ch';
		select.innerHTML = '<option value="" selected>All</option>';
		select.addEventListener('change', updateVisibleUsers);
		clanFilter.appendChild(select);
		tbody.prepend(controls)

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

		setTimeout(start, 5000);
	}).observe(document, { subtree: true, childList: true });
})();