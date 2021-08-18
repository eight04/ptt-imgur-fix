// ==UserScript==
// @name        PTT Imgur Fix
// @description	修正 Imgur 在 PTT 上的問題
// @namespace   eight04.blogspot.com
// @include     https://www.ptt.cc/bbs/*.html
// @include     https://www.ptt.cc/man/*.html
// @version     0.6.1
// @author		eight
// @homepage	https://github.com/eight04/ptt-imgur-fix
// @supportURL	https://github.com/eight04/ptt-imgur-fix/issues
// @license		MIT
// @compatible	firefox
// @compatible	chrome
// @run-at		document-start
// @grant GM_getValue
// @grant GM.getValue
// @grant GM_setValue
// @grant GM.setValue
// @grant GM_deleteValue
// @grant GM.deleteValue
// @grant GM_addValueChangeListener
// @grant GM_registerMenuCommand
// @grant GM.registerMenuCommand
// @grant GM_xmlhttpRequest
// @grant GM.xmlhttpRequest
// @require https://greasyfork.org/scripts/371339-gm-webextpref/code/GM_webextPref.js?version=961539
// @connect     imgur.com
// ==/UserScript==

/* global GM_webextPref */

const request = typeof GM_xmlhttpRequest === "function" ? GM_xmlhttpRequest : GM.xmlhttpRequest;

const pref = GM_webextPref({
  default: {
    embedYoutube: true,
    youtubeParameters: "",
    embedImage: true,
    embedAlbum: false,
    albumMaxSize: 5,
    imgurVideo: false,
    lazyLoad: true
  },
  body: [
    {
      key: "embedImage",
      label: "Embed image",
      type: "checkbox",
    },
    {
      key: "embedAlbum",
      label: "Embed imgur album. The script would request imgur.com for album info",
      type: "checkbox",
      children: [
        {
          key: "albumMaxSize",
          label: "Maximum number of images to load for an album",
          type: "number"
        }
      ]
    },
    {
      key: "imgurVideo",
      label: "Embed imgur video instead of GIF. Reduce file size",
      type: "checkbox"
    },
    {
      key: "embedYoutube",
      label: "Embed youtube video",
      type: "checkbox",
      children: [
        {
          key: "youtubeParameters",
          label: "Youtube player parameters (e.g. rel=0&loop=1)",
          type: "text",
          default: ""
        }
      ]
    },
    {
      key: "lazyLoad",
      label: "Don't load images until scrolled into view",
      type: "checkbox"
    }
  ],
  navbar: false
});

document.addEventListener("beforescriptexecute", e => {
	var url = new URL(e.target.src, location.href);
	if (url.hostname.endsWith("imgur.com")) {
		e.preventDefault();
	}
});

Promise.all([
  pref.ready(),
  domReady()
])
  .then(embedLinks)
  .catch(console.error);
  
function domReady() {
  return new Promise(resolve => {
    if (document.readyState !== "loading") {
      resolve();
      return;
    }
    document.addEventListener("DOMContentLoaded", resolve, {once: true});
  });
}

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
		const embed = createEmbed(linkInfo, richContent);
    if (typeof embed === "string") {
      richContent.innerHTML = embed;
    } else if (embed) {
      richContent.appendChild(embed);
    }
    const lazyTarget = richContent.querySelector("[data-src]");
    if (lazyTarget) {
      setupLazyLoad(lazyTarget, !pref.get("lazyLoad"));
    }

		ref.parentNode.insertBefore(richContent, ref.nextSibling);
		ref = richContent;
	}
}

function setupLazyLoad(target, forceLoad = false) {
  if (forceLoad) {
    load();
    return;
  }
  
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        load();
      } else {
        unload();
      }
    }
  });
  observer.observe(target);
  
  function load() {
    target.src = target.dataset.src;
    target.dispatchEvent(new CustomEvent("lazyload"));
  }
  
  function unload() {
    if (target.videoHeight || target.naturalHeight) {
      const {offsetWidth, offsetHeight} = target;
      target.style.width = offsetWidth + "px";
      target.style.height = offsetHeight + "px";
    }
    target.src = "";
  }
}

function getLinkInfo(link) {
	return getUrlInfo(link.href);
}

function getUrlInfo(url) {
	var match;
	if ((match = url.match(/\/\/(?:[im]\.)?imgur\.com\/([a-z0-9]{2,})(\.[a-z0-9]{3,4})?/i)) && match[1] != "gallery") {
		return {
			type: "imgur",
			id: match[1],
			url: url,
			embedable: pref.get("embedImage"),
      extension: match[2] && match[2].toLowerCase()
		};
	}
	if ((match = url.match(/\/\/(?:[im]\.)?imgur\.com\/(?:a|gallery)\/([a-z0-9]{2,})/i))) {
		return {
			type: "imgur-album",
			id: match[1],
			url: url,
			embedable: pref.get("embedAlbum")
		};
	}
	if ((match = url.match(/\/\/www\.youtube\.com\/watch?.*?v=([a-z0-9_-]{9,12})/i)) || (match = url.match(/\/\/(?:youtu\.be|www\.youtube\.com\/embed)\/([a-z0-9_-]{9,12})/i))) {
		return {
			type: "youtube",
			id: match[1],
			url: url,
			embedable: pref.get("embedYoutube")
		};
	}
	if ((match = url.match(/\/\/pbs\.twimg\.com\/media\/([a-z0-9_-]+\.(?:jpg|png))/i))) {
		return {
			type: "twitter",
			id: match[1],
			url: url,
			embedable: pref.get("embedImage")
		};
	}
	if ((match = url.match(/\/\/pbs\.twimg\.com\/media\/([a-z0-9_-]+)\?.*format=([\w]+)/i))) {
		return {
			type: "twitter",
			id: `${match[1]}.${match[2]}`,
			url: url,
			embedable: pref.get("embedImage")
		};
	}
	if (/^[^?#]+\.(?:jpg|png|gif|jpeg)(?:$|[?#])/i.test(url)) {
		return {
			type: "image",
			id: null,
			url: url,
			embedable: pref.get("embedImage")
		};
	}
	return {
		type: "url",
		id: null,
		url: url,
		embedable: false
	};
}

function createEmbed(info, container) {
	if (info.type == "imgur") {
    let extension = info.extension || ".jpg";
    if (extension === ".gif" && pref.get("imgurVideo")) {
      extension = ".mp4";
    }
    const url = `//i.imgur.com/${info.id}${extension}`;
    if (extension !== ".mp4") {
      return `<img referrerpolicy="no-referrer" data-src="${url}">`;
    }
    const video = document.createElement("video");
    video.loop = true;
    video.autoplay = true;
    video.controls = true;
    video.dataset.src = "";
    video.addEventListener("lazyload", () => {
      fetch(url, {
        referrerPolicy: "no-referrer"
      })
        .then(r => r.blob())
        .then(response => {
          const finalUrl = URL.createObjectURL(response);
          video.dataset.src = finalUrl;
          video.src = finalUrl;
        });
    }, {once: true});
    return video;
	}
	if (info.type == "youtube") {
		return `<div class="resize-container"><div class="resize-content"><iframe class="youtube-player" type="text/html" data-src="//www.youtube.com/embed/${info.id}?${pref.get("youtubeParameters")}" frameborder="0" allowfullscreen></iframe></div></div>`;
	}
	if (info.type == "image") {
		return `<img referrerpolicy="no-referrer" data-src="${info.url}">`;
	}
	if (info.type == "twitter") {
    const image = new Image;
    const url = `//pbs.twimg.com/media/${info.id}:orig`;
    const pngUrl = url.replace(/\.jpg\b/, ".png");
    image.dataset.src = url;
    image.addEventListener("error", function onerror() {
      if (!image.currentSrc) {
        // ignore empty image error
        return;
      }
      image.dataset.src = pngUrl;
      image.src = pngUrl;
      image.removeEventListener("error", onerror);
    });
		return image;
	}
	if (info.type == "imgur-album") {
		container.textContent = "Loading album...";
		request({
			method: "GET",
			url: info.url.replace("://m.", "://"),
			onload(response) {
				if (response.status < 200 || response.status >= 300) {
					container.textContent = `${response.status} ${response.statusText}`;
					return;
				}
				container.textContent = "";
				const text = response.responseText;
				let match;
                let hashes;
				if ((match = text.match(/album_images":\{.+?(\[.+?\])/))) {
          hashes = JSON.parse(match[1]).map(i => i.hash);
				} else if ((match = text.match(/\bimage\s*:.+?hash":"([^"]+)/))) {
					hashes = [match[1]];
				} else if ((match = text.match(/<meta property="og:image"[^>]*content="([^"]+)/))) {
          // https://imgur.com/gallery/uVxFvZf
          hashes = [match[1].match(/imgur\.com\/(\w+\.\w{3})/)[1]];
        }
				if (!hashes) {
					throw new Error(`Can't find images for ${info.url} (${response.finalUrl})`);
				}
				let i = 0;
				const loadImages = (count = Infinity) => {
					let html = "";
					for (; i < hashes.length && count--; i++) {
						html += `<div class="richcontent"><img referrerpolicy="no-referrer" src="//i.imgur.com/${hashes[i]}.jpg"></div>`;
					}
					container.insertAdjacentHTML("beforeend", html);
				};
				loadImages(pref.get("albumMaxSize"));
				if (i < hashes.length) {
					const button = document.createElement("button");
					button.textContent = `Load all images (${hashes.length - i} more)`;
					button.addEventListener('click', () => {
						button.remove();
						loadImages();
					});
					container.appendChild(button);
				}
			}
		});
		return;
	}
	throw new Error(`Invalid type: ${info.type}`);
}
