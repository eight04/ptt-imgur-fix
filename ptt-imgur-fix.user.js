// ==UserScript==
// @name        PTT Imgur Fix
// @description	修正 Imgur 在 PTT 上的問題
// @namespace   eight04.blogspot.com
// @match https://www.ptt.cc/bbs/*.html
// @match https://www.ptt.cc/man/*.html
// @version     0.8.0
// @author		eight
// @homepage	https://github.com/eight04/ptt-imgur-fix
// @supportURL	https://github.com/eight04/ptt-imgur-fix/issues
// @license		MIT
// @compatible firefox Tampermonkey, Violentmonkey, Greasemonkey 4.11+
// @compatible chrome Tampermonkey, Violentmonkey
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
// @grant GM.xmlHttpRequest
// @require https://greasyfork.org/scripts/371339-gm-webextpref/code/GM_webextPref.js?version=961539
// @connect     imgur.com
// ==/UserScript==

/* global GM_webextPref */

const request = typeof GM_xmlhttpRequest === "function" ? GM_xmlhttpRequest : GM.xmlHttpRequest;

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

const lazyLoader = (() => {
  const xo = new IntersectionObserver(onXoChange, {rootMargin: "30% 0px 30% 0px"});
  // FIXME: memory leak, we don't delete items from the map
  const elMap = new Map;
  pref.on('change', onPrefChange);
  
  return {add};
  
  function onPrefChange(changes) {
    if (changes.lazyLoad == null) return;
    
    if (changes.lazyLoad) {
      for (const target of elMap.values()) {
        xo.observe(target.el);
      }
    } else {
      xo.disconnect();
      for (const target of elMap.values()) {
        target.visible = true;
        loadTarget(target);
        showTarget(target);
      }
    }
  }
  
  function add(el) {
    if (elMap.has(el)) return;
    
    const target = {
      el,
      state: 'pause',
      visible: false,
      finalUrl: '',
      mask: null,
      width: 0,
      height: 0
    };
    
    elMap.set(el, target);
    
    if (pref.get('lazyLoad')) {
      xo.observe(target.el);
    } else {
      target.visible = true;
      loadTarget(target);
    }
  }
  
  function onXoChange(entries) {
    for (const entry of entries) {
      const target = elMap.get(entry.target);
      if (entry.isIntersecting) {
        target.visible = true;
        loadTarget(target);
        showTarget(target);
      } else {
        target.visible = false;
        hideTarget(target);
      }
    }
  }
  
  async function loadTarget(target) {
    if (target.state !== 'pause') return;
    target.state = 'loading';
    try {
      if (target.el.tagName === 'IMG' || target.el.tagName === 'IFRAME') {
        setSrc(target.el, target.el.dataset.src);
        await loadMedia(target.el);
        target.finalUrl = target.el.dataset.src;
      } else if (target.el.tagName === 'VIDEO') {
        const r = await fetch(target.el.dataset.src, {
          referrerPolicy: "no-referrer"
        });
        const b = await r.blob();
        const finalUrl = URL.createObjectURL(b);
        target.finalUrl = finalUrl;
        target.el.src = finalUrl;
        await loadMedia(target.el);
      } else {
        throw new Error(`Invalid media: ${target.el.tagName}`);
      }
      target.state = 'complete';
      const {offsetWidth: w, offsetHeight: h} = target.el;
      target.el.style.width = `${w}px`;
      target.el.style.aspectRatio = `${w} / ${h}`;
      // Waterfox
      // https://greasyfork.org/zh-TW/scripts/28264-ptt-imgur-fix/discussions/115795
      if (!CSS.supports("aspect-ratio", "1/1")) {
        target.el.style.height = `${h}px`;
      }
      if (target.visible) {
        showTarget(target);
      } else {
        hideTarget(target);
      }
    } catch (err) {
      console.error(err);
      target.state = 'pause';
    }
  }
  
  function loadMedia(el) {
    return new Promise((resolve, reject) => {
      el.addEventListener('load', onLoad);
      el.addEventListener('loadeddata', onLoad);
      el.addEventListener('error', onError);
      
      function cleanup() {
        el.removeEventListener('load', onLoad);
        el.removeEventListener('loadeddata', onLoad);
        el.removeEventListener('error', onError);
      }
      
      function onLoad() {
        resolve();
        cleanup();
      }
      
      function onError(e) {
        console.error(e);
        reject(new Error(`failed loading media: ${el.src}`));
        cleanup();
      }
    });
  }
  
  function showTarget(target) {
    if (target.state !== 'complete' && target.state !== 'hidden') return;
    setSrc(target.el, target.finalUrl)
    target.state = 'shown';
  }
  
  function hideTarget(target) {
    if (target.state !== 'complete' && target.state !== 'shown') return;
    if (target.el.tagName === 'IFRAME') return;
    setSrc(target.el, 'about:blank');
    target.state = 'hidden';
  }
})();

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
  .then(init)
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

function createStyle(css) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}

function init() {
  createStyle(`
    .ptt-imgur-fix,
    .ptt-imgur-fix img {
      max-height: none;
      max-width: 100%;
    }
  `)
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
    for (const link of links_) {
      const linkInfo = getLinkInfo(link);
      if (!linkInfo.embedable) {
        continue;
      }
      const richContent = createRichContent(linkInfo);
      lineEnd.parentNode.insertBefore(richContent, lineEnd.nextSibling);
      lineEnd = richContent;
    }
		// createRichContent(links_, lineEnd);
	}
  
  // styling
  const style = document.createElement("style");
  style.textContent = `
    .richcontent video {
      max-width: 100%;
    }
  `;
  document.documentElement.append(style);
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

function createRichContent(linkInfo) {
  const richContent = document.createElement("div");
  richContent.className = "richcontent ptt-imgur-fix";
  const embed = createEmbed(linkInfo, richContent);
  if (typeof embed === "string") {
    richContent.innerHTML = embed;
  } else if (embed) {
    richContent.appendChild(embed);
  }
  const lazyTarget = richContent.querySelector("[data-src]");
  if (lazyTarget) {
    lazyLoader.add(lazyTarget);
  }
  return richContent;
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
	if (
    (match = url.match(/youtube\.com\/watch?.*?v=([a-z0-9_-]{9,12})/i)) ||
    (match = url.match(/(?:youtu\.be|youtube\.com\/embed)\/([a-z0-9_-]{9,12})/i)) ||
    (match = url.match(/youtube\.com\/shorts\/([a-z0-9_-]{9,12})/i)) ||
    (match = url.match(/youtube\.com\/live\/([a-z0-9_-]{9,12})/i))
  ) {
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
    if (extension === ".gifv") {
      extension = pref.get("imgurVideo") ? ".mp4" : ".gif";
    }
    const url = `//i.imgur.com/${info.id}${extension}`;
    if (extension !== ".mp4") {
      return `<img referrerpolicy="no-referrer" data-src="${url}">`;
    }
    const video = document.createElement("video");
    video.loop = true;
    video.autoplay = true;
    video.controls = true;
    video.dataset.src = url;
    video.muted = true;
    return video;
	}
	if (info.type == "youtube") {
		return `<div class="resize-container"><div class="resize-content"><iframe class="youtube-player" type="text/html" data-src="//www.youtube.com/embed/${info.id}?${mergeParams(new URL(info.url).search, pref.get("youtubeParameters"))}" frameborder="0" allowfullscreen></iframe></div></div>`;
	}
	if (info.type == "image") {
		return `<img referrerpolicy="no-referrer" data-src="${info.url}">`;
	}
	if (info.type == "twitter") {
    const image = new Image;
    const urls = [
      `//pbs.twimg.com/media/${info.id}:orig`,
      `//pbs.twimg.com/media/${info.id.replace(/\.jpg\b/, ".png")}:orig`,
      `//pbs.twimg.com/media/${info.id}:large`,
      `//pbs.twimg.com/media/${info.id}`,
    ];
    image.dataset.src = urls.shift();
    image.addEventListener("error", function onerror() {
      if (!image.currentSrc || !urls.length) {
        // ignore empty image error
        return;
      }
      const newUrl = urls.shift();
      image.dataset.src = newUrl;
      image.src = newUrl;
    });
		return image;
	}
	if (info.type == "imgur-album") {
		container.textContent = "Loading album...";
		request({
			method: "GET",
			url: `https://api.imgur.com/post/v1/albums/${info.id}?client_id=546c25a59c58ad7&include=media`,
      responseType: "json",
			onload(response) {
				if (response.status < 200 || response.status >= 300) {
					container.textContent = `${response.status} ${response.statusText}`;
					return;
				}
				container.textContent = "";
        const urls = response.response.media.map(m => m.url);
        
				let i = 0;
				const loadImages = (count = Infinity) => {
          const els = [];
					for (; i < urls.length && count--; i++) {
            els.push(createRichContent(getUrlInfo(urls[i])));
					}
					container.append(...els);
				};
				loadImages(pref.get("albumMaxSize"));
				if (i < urls.length) {
					const button = document.createElement("button");
					button.textContent = `Load all images (${urls.length - i} more)`;
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

function mergeParams(origSearch, userSearch) {
  const result = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(origSearch)) {
    if (key === "t") {
      result.set("start", value);
    } else {
      result.set(key, value);
    }
  }
  for (const [key, value] of new URLSearchParams(userSearch)) {
    result.set(key, value);
  }
  return result.toString();
}

function setSrc(el, url) {
  try {
    // https://github.com/eight04/ptt-imgur-fix/issues/22
    el.contentWindow.location.replace(url);
  } catch (err) {
    el.src = url;
  }
}
