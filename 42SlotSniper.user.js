/*
    ___   _____ __________
   /   | / ___// ____/ __ \	File:		42SlotSniper.user.js
  / /| | \__ \/ __/ / / / /	Created:	Monday, 30th December 2019 3:29 pm
 / ___ |___/ / /___/ /_/ / 	Author:		Alexandre SEO (aseo@student.42.fr)
/_/  |_/____/_____/\____/

 */

// ==UserScript==
// @name     42 Slot Sniper
// @version  1.0.4
// @include  https://projects.intra.42.fr/projects/*/slots*
// @run-at   document-idle
// @license  GPL-3.0-or-later
// @author   aseo
// @updateURL https://openuserjs.org/meta/DontBreakAlex/42_Slot_Sniper.meta.js
// @downloadURL https://openuserjs.org/install/DontBreakAlex/42_Slot_Sniper.user.js
// ==/UserScript==

/**
 * Add a style element to the document head and insert css into it
 * @param {string} css The CSS content
 */
function addGlobalStyle(css) {
    let head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css', style.innerHTML = css;
    head.appendChild(style);
}
addGlobalStyle('@keyframes pulse{0%{box-shadow:0 0 4px 1px #78c5d5}25%{box-shadow:0 0 4px 1px #79c268}50%{box-shadow:0 0 4px 1px #f5d63d}75%{box-shadow:0 0 4px 1px #e868a1}100%{box-shadow:0 0 4px 1px #bf63a6}}@keyframes pulse-bg{0%{background-color:#78c5d5}25%{background-color:#79c268}50%{background-color:#f5d63d}75%{background-color:#e868a1}100%{background-color:#bf63a6}}.is-loading{animation-name:pulse,pulse-bg;animation-duration:2s;animation-timing-function:ease-in-out;animation-direction:alternate;animation-iteration-count:infinite;color:white;border-style:hidden;}');

function stopSniping(button, interval) {
	console.debug("SNIPING CANCELED !");
	clearInterval(interval);
	button.textContent = "SNIPER";
	button.classList.remove("is-loading");
	delete button.dataset.started;
}

async function takeSlot(team, project, begin, end, id) {
	let response = await fetch(
		`https://projects.intra.42.fr/projects/${project}/slots/${id}.json?team_id=${team}`, {
		"credentials": "include",
		"headers": {
			"Accept": "application/json, text/javascript, */*; q=0.01",
			"Accept-Language": "en-US,en;q=0.5",
			"X-CSRF-Token": document.querySelector("meta[name='csrf-token']").content,
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			"X-Requested-With": "XMLHttpRequest"
		},
		"body": `start=${begin}&end=${end}&_method=put`,
		"method": "POST",
		"mode": "cors"
	});
}

async function checkForSlots(team, project, begin, end) {
	let response = await fetch(
		`https://projects.intra.42.fr/projects/${project}/slots.json?team_id=${team}&start=${begin}&end=${end}`, {
		"credentials": "include",
		"headers": {
			"Accept": "application/json, text/javascript, */*; q=0.01",
			"Accept-Language": "en-US,en;q=0.5",
			"X-CSRF-Token": document.querySelector("meta[name='csrf-token']").content,
			"X-Requested-With": "XMLHttpRequest",
			"Cache-Control": "max-age=0"
		},
		"method": "GET",
		"mode": "cors"
	});
	response = await response.json();

	if (response.length) {
		let message =	"Found slot for " + (new Date(response[0].start)).toLocaleString() +
						"\nDo you want to take it ?";
		if (window.confirm(message))
			takeSlot(team, project, begin, end, response[0].ids.split(',')[0]);
		clearInterval(checkForSlots.interval);
		stopSniping(checkForSlots.button, clearInterval.interval)
	}
}

(async () => {
	let teamId = window.location.search.split("=")[1];
	let DataDate = document.getElementsByClassName("fc-day-header");
	let project = /projects\/(.+)\//.exec(window.location.pathname)[1];

	let button = document.createElement("button");
	checkForSlots.button = button;
	button.textContent = "SNIPER";
	button.addEventListener("click", () => {
		if (!button.dataset.started) {
			console.debug("SNIPING IN PROGRESS !");
			checkForSlots.interval = setInterval(checkForSlots, 5000, teamId, project, DataDate[0].dataset.date, DataDate[DataDate.length - 1].dataset.date);
			button.classList.add("is-loading");
			button.textContent = "SNIPING";
			button.dataset.started = "!";
		} else
			stopSniping(button, checkForSlots.interval);
	});
	let container = document.querySelector("div.fc-left");
	container.appendChild(button);
})();

