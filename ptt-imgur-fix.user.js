// ==UserScript==
// @name        PTT Imgur Fix
// @description	修正 Imgur 在 PTT 上的問題
// @namespace   eight04.blogspot.com
// @include     https://www.ptt.cc/bbs/*.html
// @version     2.0.2
// @author		eight
// @homepage	https://github.com/eight04/ptt-imgur-fix
// @supportURL	https://github.com/eight04/ptt-imgur-fix/issues
// @license		MIT
// @compatible	firefox
// @compatible	chrome
// @run-at		document-start
// @grant		none
// ==/UserScript==

document.addEventListener("beforescriptexecute", e => {
	var url = new URL(e.target.src, location.href);
	if (url.hostname.endsWith("imgur.com")) {
		e.preventDefault();
	}
});

document.addEventListener("DOMContentLoaded", () => {
	var quotes = document.querySelectorAll(".richcontent .imgur-embed-pub");
	for (var quote of quotes) {
		var parent = quote.parentNode,
			link = `//i.imgur.com/${quote.dataset.id}.jpg`,
			img = new Image;
		img.src = link;
		img.referrerPolicy = "no-referrer";
		parent.innerHTML = "";
		parent.appendChild(img);
	}
});
