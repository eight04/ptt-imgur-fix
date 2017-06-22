// ==UserScript==
// @name        PTT Imgur Fix
// @description	修正 Imgur 在 PTT 上的問題
// @namespace   eight04.blogspot.com
// @include     https://www.ptt.cc/bbs/*.html
// @include     https://www.ptt.cc/man/*.html
// @version     0.3.0
// @author		eight
// @homepage	https://github.com/eight04/ptt-imgur-fix
// @supportURL	https://github.com/eight04/ptt-imgur-fix/issues
// @license		MIT
// @compatible	firefox
// @compatible	chrome
// @run-at		document-start
// @grant		GM_getValue
// @grant		GM_setValue
// @grant		GM_registerMenuCommand
// @require https://greasyfork.org/scripts/7212-gm-config-eight-s-version/code/GM_config%20(eight's%20version).js?version=156587
// ==/UserScript==

/* global GM_config */

var config;

GM_config.setup({
	embedYoutube: {
		label: "Embed youtube video",
		type: "checkbox",
		default: true
	},
	embedImage: {
		label: "Embed image",
		type: "checkbox",
		default: true
	}
}, () => config = GM_config.get());

document.addEventListener("beforescriptexecute", e => {
	var url = new URL(e.target.src, location.href);
	if (url.hostname.endsWith("imgur.com")) {
		e.preventDefault();
	}
});

document.addEventListener("DOMContentLoaded", embedLinks);

function embedLinks() {
	// remove old .richcontent
	var rich = document.querySelectorAll("#main-content .richcontent");
	for (var node of rich) {
		node.parentNode.removeChild(node);
	}
	
	// embed links
	var links = document.querySelectorAll("#main-content a"),
		processed = new Set;
	for (var link of links) {
		if (processed.has(link) || !getLinkInfo(link).embedable) {
			continue;
		}
		var [links_, lineEnd] = findLinksInSameLine(link);
		links_.forEach(l => processed.add(l));
		createRichContent(links_, lineEnd);
	}
}

function findLinksInSameLine(node) {
	var links = [];
	
	while (node) {
		if (node.nodeName == "A") {
			links.push(node);
			node = node.nextSibling || node.parentNode.nextSibling;
			continue;
		}
		
		if (node.nodeType == Node.TEXT_NODE && node.nodeValue.includes("\n")) {
			return [links, findLineEnd(node)];
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

function findLineEnd(text) {
	var index = text.nodeValue.indexOf("\n");
	if (index == text.nodeValue.length - 1) {
		while (text.parentNode.id != "main-content") {
			text = text.parentNode;
		}
		return text;
	}
	
	var pre = document.createTextNode("");
	pre.nodeValue = text.nodeValue.slice(0, index + 1);
	text.nodeValue = text.nodeValue.slice(index + 1);
	text.parentNode.insertBefore(pre, text);
	return pre;
}

// insert richcontent brefore ref.nextSibling
function createRichContent(links, ref) {
	// create our rich content
	for (var link of links) {
		var linkInfo = getLinkInfo(link);
		if (!linkInfo.embedable) {
			continue;
		}
		var richContent = document.createElement("div");
		richContent.className = "richcontent ptt-imgur-fix";
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
	if ((match = url.match(/\/\/(?:[im]\.)?imgur\.com\/([a-z0-9]{2,})/i)) && match[1] != "gallery") {
		return {
			type: "imgur",
			id: match[1],
			url: url,
			embedable: config.embedImage
		};
	}
	if ((match = url.match(/\/\/www\.youtube\.com\/watch?.*?v=([a-z0-9_-]{9,12})/i)) || (match = url.match(/\/\/(?:youtu\.be|www\.youtube\.com\/embed)\/([a-z0-9_-]{9,12})/i))) {
		return {
			type: "youtube",
			id: match[1],
			url: url,
			embedable: config.embedYoutube
		};
	}
	if ((match = url.match(/\/\/pbs\.twimg\.com\/media\/([a-z0-9_-]+\.(?:jpg|png))/i))) {
		return {
			type: "twitter",
			id: match[1],
			url: url,
			embedable: config.embedImage
		};
	}
	if (/^[^?#]+\.(?:jpg|png|gif|jpeg)(?:$|[?#])/i.test(url)) {
		return {
			type: "image",
			id: null,
			url: url,
			embedable: config.embedImage
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
