// ==UserScript==
// @name        PTT Imgur Fix
// @description	修正 Imgur 在 PTT 上的問題
// @namespace   eight04.blogspot.com
// @include     https://www.ptt.cc/bbs/*.html
// @version     0.1.1
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

function fixImgur() {
	var quotes = document.querySelectorAll(".richcontent .imgur-embed-pub");
	for (var quote of quotes) {
		quote.parentNode.innerHTML = `<img src="//i.imgur.com/${quote.dataset.id}.jpg" referrerpolicy="no-referrer">`;
	}
	
	var frames = document.querySelectorAll(".richcontent .imgur-embed-iframe-pub");
	for (var frame of frames) {
		var id = frame.id.match(/pub-([a-z0-9]+)/i)[1];
		frame.parentNode.innerHTML = `<img src="//i.imgur.com/${id}.jpg" referrerpolicy="no-referrer">`;
	}
}

var PROCESSED_LINKS = new Set;

document.addEventListener("DOMContentLoaded", () => {
	fixImgur();
	embedLinks();
});

function embedLinks() {
	// embed links
	var links = document.querySelectorAll("#main-content a");
	for (var link of links) {
		if (PROCESSED_LINKS.has(link)) {
			continue;
		}
		if (!getUrlInfo(link.href).embedable) {
			continue;
		}
		processLine(link);
	}
}

function processLine(node) {
	var links = [];
	
	while (node) {
		if (node.nodeName == "A") {
			links.push(node);
			PROCESSED_LINKS.add(node);
			node = node.nextSibling;
			continue;
		}
		
		if (node.nodeType == Node.TEXT_NODE && node.nodeValue.includes("\n")) {
			insertRichContent(links, node);
			break;
		}
		
		if (node.childNodes.length) {
			node = node.childNodes[0];
			continue;
		}
		
		if (node.nextSibling) {
			node = node.nextSibling;
			continue;
		}
		
		if (node.parentNode.id != "main-content") {
			node = node.parentNode.nextSibling;
			continue;
		}
		
		throw new Error("Invalid article, missing new line?");
	}
}

function insertRichContent(links, text) {
	var index = text.nodeValue.indexOf("\n");
	if (index == text.nodeValue.length - 1) {
		while (text.parentNode.id != "main-content") {
			text = text.parentNode;
		}
		createRichContent(links, text);
	} else {
		var pre = document.createTextNode("");
		pre.nodeValue = text.nodeValue.slice(0, index + 1);
		text.nodeValue = text.nodeValue.slice(index + 1);
		text.parentNode.insertBefore(pre, text);
		createRichContent(links, pre);
	}
}

// insert richcontent brefore ref.nextSibling
function createRichContent(links, ref) {
	// remove original richcontent
	while (ref.nextSibling && ref.nextSibling.className == "richcontent") {
		ref.parentNode.removeChild(ref.nextSibling);
	}
	// create our rich content
	for (var link of links) {
		var linkInfo = getLinkInfo(link);
		if (!linkInfo.embedable) {
			continue;
		}
		var richContent = document.createElement("div");
		richContent.className = "richcontent";
		richContent.innerHTML = createEmbed(linkInfo);
		
		ref.parentNode.insertBefore(richContent, ref.nextSibling);
		ref = richContent;
	}
}

function getLinkInfo(link) {
	return getUrlInfo(link.href);
}

function getUrlInfo(url) {
	var match;
	if ((match = url.match(/\/\/(?:i\.)?imgur\.com\/([a-z0-9]{2,})/i)) && match[1] != "gallery") {
		return {
			type: "imgur",
			id: match[1],
			url: url,
			embedable: true
		};
	}
	if ((match = url.match(/\/\/www\.youtube\.com\/watch?.*?v=([a-z0-9_-]{9,12})/i))) {
		return {
			type: "youtube",
			id: match[1],
			url: url,
			embedable: true
		};
	}
	if ((match = url.match(/\/\/(?:youtu\.be|www\.youtube\.com\/embed)\/([a-z0-9_-]{9,12})/i))) {
		return {
			type: "youtube",
			id: match[1],
			url: url,
			embedable: true
		};
	}
	if ((match = url.match(/\/\/pbs\.twimg\.com\/media\/([a-z0-9]+\.(?:jpg|png))/i))) {
		return {
			type: "twitter",
			id: match[1],
			url: url,
			embedable: true
		};
	}
	if (/^[^?#]+\.(?:jpg|png|gif|jpeg)(?:$|[?#])/i.test(url)) {
		return {
			type: "image",
			id: null,
			url: url,
			embedable: true
		};
	}
	return {
		type: "url",
		id: null,
		url: url,
		embedable: false
	};
}

function createEmbed(info) {
	if (info.type == "imgur") {
		return `<img src="//i.imgur.com/${info.id}.jpg" referrerpolicy="no-referrer">`;
	}
	if (info.type == "youtube") {
		return `<div class="resize-container"><div class="resize-content"><iframe class="youtube-player" type="text/html" src="//www.youtube.com/embed/${info.id}" frameborder="0" allowfullscreen></iframe></div></div>`;
	}
	if (info.type == "image") {
		return `<img src="${info.url}">`;
	}
	if (info.type == "twitter") {
		return `<img src="//pbs.twimg.com/media/${info.id}:orig">`;
	}
	throw new Error(`Invalid type: ${info.type}`);
}
