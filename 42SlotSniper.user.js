/*
    ___   _____ __________
   /   | / ___// ____/ __ \	File:		42SlotSniper.user.js
  / /| | \__ \/ __/ / / / /	Created:	Monday, 30th December 2019 3:29 pm
 / ___ |___/ / /___/ /_/ / 	Author:		Alexandre SEO (aseo@student.42.fr)
/_/  |_/____/_____/\____/

 */

// ==UserScript==
// @name     42 Slot Sniper
// @version  1.2.0
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
(css => {
    let head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css', style.innerHTML = css;
    head.appendChild(style);
})('@keyframes pulse{0%{box-shadow:0 0 4px 1px #78c5d5}25%{box-shadow:0 0 4px 1px #79c268}50%{box-shadow:0 0 4px 1px #f5d63d}75%{box-shadow:0 0 4px 1px #e868a1}100%{box-shadow:0 0 4px 1px #bf63a6}}@keyframes pulse-bg{0%{background-color:#78c5d5}25%{background-color:#79c268}50%{background-color:#f5d63d}75%{background-color:#e868a1}100%{background-color:#bf63a6}}.is-loading{animation-name:pulse,pulse-bg;animation-duration:2s;animation-timing-function:ease-in-out;animation-direction:alternate;animation-iteration-count:infinite;color:white;border-style:hidden;}');

class Sniper {
	constructor() {
		this.team = window.location.search.split("=")[1];
		this.DataDate = document.getElementsByClassName("fc-day-header");
		this.project = /projects\/(.+)\//.exec(window.location.pathname)[1];
		this.login = document.querySelector("span[data-login]").dataset.login;
		this.button = document.createElement("button");
		this.begin = this.DataDate[0].dataset.date;
		this.end = this.DataDate[this.DataDate.length - 1].dataset.date;
		this.period = 30000;

		this.running = false;
		this.button.textContent = "SNIPER";
		this.button.addEventListener("click", () => {
			if (this.running == false)
				this.bind();
			else
				this.stop();
		});

		document.querySelector("div.fc-left").appendChild(this.button);
	}

	bind() {
		this.interval = setInterval(this.snipe.bind(this), this.period);
		this.snipe();
		this.button.classList.add("is-loading");
		this.button.textContent = "SNIPING";
		this.running = true;
	}

	stop() {
		console.debug("SNIPING STOPPED !");
		clearInterval(this.interval);
		this.button.textContent = "SNIPER";
		this.button.classList.remove("is-loading");
		this.running = false;
	}

	async snipe() {
		let response = await fetch(
			`https://projects.intra.42.fr/projects/${this.project}/slots.json?team_id=${this.team}&start=${this.begin}&end=${this.end}`, {
			"credentials": "include",
			"headers": {
				"Accept": "application/json, text/javascript, */*; q=0.01",
				"Accept-Language": "en-US,en;q=0.5",
				"X-CSRF-Token": document.querySelector("meta[name='csrf-token']").content,
				"X-Requested-With": "XMLHttpRequest",
			},
			"method": "GET",
			"mode": "cors"
		});
		response = await response.json();

		if (response.length) {
			let prom = this.getCurrentSlots();
			let slots = response.map(elem => {
				return new Slots(elem);
			}).sort((a, b) => {
				return a.timeSlots[0].date - b.timeSlots[0].date;
			});
			await prom;
			for (elem of slots) {
				let slot = elem.findSlot(this.correction);
				if (slot) {
					let message =	"Found slot for " + slot.date.toLocaleString() +
									"\nDo you want to take it ?";
					if (window.confirm(message))
						elem.takeSlot(this, slot.id);
					else {
						this.stop()
						return
					}
				}
			}
			console.info("Cannot take any slot because you already have corrections at the same time")
		}
	}

	async getCurrentSlots() {
		let parser = new DOMParser();
		let page = await fetch(`https://projects.intra.42.fr/${this.project}/${this.login}`);

		page = await page.text();
		page = parser.parseFromString(page, 'text/html');

		let slots = page.querySelectorAll("div.time span[data-long-date]");
		if (slots.length) {
			this.corrections = Array.from(slots).map(elem => {
				return new Date(elem.dataset.longDate.slice(0, -6));
			})
			console.debug(this.corrections);
		}
	}
}

class Slot {
	constructor(array) {
		let begin = new Date(array.start), end = new Date(array.end);
		let parsedArray = array.ids.split(',');
		let duration = (end - begin) / parsedArray.length;

		this.timeSlots = parsedArray.map((elem, index) => {
			return {
				date: new Date(begin.getTime() + duration * index),
				id: elem
			};
		})
	}

	takeSlot(sniper, id) {
		fetch(
			`https://projects.intra.42.fr/projects/${sniper.project}/slots/${id}.json?team_id=${sniper.team}`, {
			"credentials": "include",
			"headers": {
				"Accept": "application/json, text/javascript, */*; q=0.01",
				"Accept-Language": "en-US,en;q=0.5",
				"X-CSRF-Token": document.querySelector("meta[name='csrf-token']").content,
				"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
				"X-Requested-With": "XMLHttpRequest"
			},
			"body": `start=${sniper.begin}&end=${sniper.end}&_method=put`,
			"method": "POST",
			"mode": "cors"
		});
	}

	takeFirstSlot(sniper) {
		this.takeSlot(sniper, this.timeSlots[0].id);
	}

	findSlot(corrections) {
		for (elem of this.timeSlots) {
			if (!corrections.includes(elem.date))
				return elem;
		}
		return false;
	}
}

(async () => {
	let sniper = new Sniper;
})();

