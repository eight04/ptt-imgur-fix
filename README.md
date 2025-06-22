PTT Imgur Fix
=============

[![.github/workflows/build.yml](https://github.com/eight04/ptt-imgur-fix/actions/workflows/build.yml/badge.svg)](https://github.com/eight04/ptt-imgur-fix/actions/workflows/build.yml)

一個用於 PTT Web 版的 userscript。

在 2017/3/17 後，由於 imgur 封鎖來自 ptt.cc 的 referer，站方改用 imgur 所提供的 embed.js 做圖片嵌入。但是嵌入後的圖片是縮圖，對於 PC 使用者反而不如原始嵌入來得方便。

參考︰

* [\[問題\] 網頁版無法自動顯示圖片](https://www.ptt.cc/bbs/SYSOP/M.1489712949.A.B8D.html)
* [\[問卦\] 有沒有imgur.com圖床改版的八卦？](https://www.ptt.cc/bbs/Gossiping/M.1489752429.A.C08.html)

Features
--------
* Disable embed script and use native img tag.
* Embed imgur gifv links to display gif.
* Embed imgur album (`imgur.com/a/` or `imgur.com/gallery/`). 
* Add ":orig" to embeded twitter image with fallbacks.
* Remove embeded youtube video.
* Customize Youtube player parameters. See https://developers.google.com/youtube/player_parameters#Parameters.

Install
-------
<https://greasyfork.org/scripts/28264-ptt-imgur-fix>

Referer 導致的圖片讀取錯誤
--------------------------

雖然此腳本有使用 [referrerPolicy](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/referrerPolicy) 來嘗試解決 referer 的問題，但這不適用以下兩種情況︰

1. 舊版瀏覽器不支援 referrerPolicy，包括 Firefox<50, Chrome<52, Edge<79。
2. 在 term.ptt.cc 上，由於瀏覽器會重用舊的連線，referrerPolicy 並不會生效。

解決方法︰

安裝一個可以移除 referer 的擴充套件（例如 [Referer Control](https://addons.mozilla.org/zh-TW/firefox/addon/referercontrol/)）並檔掉從 https://term.ptt.cc  出去的 referer。

Changelog
---------

* 0.9.9 (Jun 22, 2025)

  - Add: try other filename extensions when meee load failed.

* 0.9.8 (Jun 21, 2025)

  - Fix: failed loading twitter images.

* 0.9.7 (Jun 21, 2025)

  - Add: srcset loader.
  - Add: option to fetch filename extension from meee.com.tw.

* 0.9.6 (Jun 20, 2025)

  - Add: handle `meee.com.tw` url.
  - Fix: undefined error in xo handler.

* 0.9.5 (Jan 19, 2025)

  - Fix: remove default contents under the link in term.ptt.cc.

* 0.9.4 (Jan 15, 2025)

  - Fix: use `min-height` during loading.

* 0.9.3 (Jan 14, 2025)

  - Add: support .svg, .avif, .webp.

* 0.9.2 (Jan 12, 2025)

  - Fix: error when lazyload is disabled.

* 0.9.1 (Jan 11, 2025)

  - Fix: multiple links in one line.

* 0.9.0 (Jan 11, 2025)

  - Add: support term.ptt.cc.
  - Add: embed video.
  - Fix: twitter image retry.

* 0.8.4 (May 16, 2024)

  - Fix: stop retrying twitter images after loaded.
  - Fix: don't remove width/height until the image is loaded.

* 0.8.3 (Dec 15, 2023)

  - Fix: set maxWidth and maxHeight for video and iframe.

* 0.8.2 (Dec 13, 2023)

  - Add: make max width and height configurable.
  - Fix: don't freeze image size after loading.

* 0.8.1 (Nov 23, 2023)

  - Fix: remove max width and height.
  - Fix: unable to display witter webp images.

* 0.8.0 (Apr 30, 2023)

  - Change: mute autoplay videos.
  - Change: match youtube URLs without `www`.

* 0.7.6 (Jan 2, 2023)

  - Fix: detect youtube live URL.
  - Fix: support imgur gifv extension.

* 0.7.5 (Nov 23, 2022)

  - Fix: don't pollute history on Chrome when iframe is loaded (#23)

* 0.7.4 (Jun 25, 2022)

  - Fix: image flickering on waterfox.
  - Fix: support timestamp in youtube embed.

* 0.7.3 (Nov 5, 2021)

  = Add: support youtube shorts.

* 0.7.2 (Oct 30, 2021)

  - Enhance: rewrite lazy loader.

* 0.7.1 (Oct 24, 2021)

  - Fix: video overflow in mobile devices.

* 0.7.0 (Aug 18, 2021)

  - Fix: fallback to large images in twitter.
  - Fix: match URL with query.
  - Fix: failed to load imgur album.
  - **Change: replace GM_config with GM_webextPref. You will loose the current setting. Support Greasemonkey 4.11.**

* 0.6.1 (May 30, 2021)

  - Fix: failed to load jpeg images.

* 0.6.0 (Aug 14, 2020)

  - Fix: unable to load some galleries.
  - Fix: sometimes it is unable to load twitter images.
  - **Breaking: imgur media are loaded according to file extension. the script will load video if the extension is `.mp4`.**
  - Add: option to load imgur GIF as video.

* 0.5.1 (Aug 7, 2019)

  - Add: support twitter mobile.

* 0.5.0 (Mar 21, 2019)

  - **Breaking: add lazy load option.**
  
* 0.4.3 (Nov 24, 2018)

  - Fix: failed to load images in Chrome.
  
* 0.4.2 (Apr 13, 2018)

	- Add: youtube player parameters option.
  
* 0.4.1 (Nov 26, 2017)

	- Use `no-referrer` for normal images. Some sites (e.g. gamer.com.tw) restricted referrer from ptt.
  
* 0.4.0 (Sep 20, 2017)

	- Add embed imgur album option.
  
* 0.3.1 (Jun 22, 2017)

	- Add embed image option.
  
* 0.3.0 (Apr 1, 2017)

	- Fix: sometimes richcontent is not inserted in push content.
	- Fix: twitter pattern.
	- Fix: m.imgur.com is not matched.
	- Refactor, the original richcontent is always removed.
	- Add embedYoutube option.
	- 加入精華區 URL.
  
* 0.2.1 (Mar 30, 2017)

	- Remove unused code.
  
* 0.2.0 (Mar 30, 2017)

	- "gallery" is not a valid imgur id.
	- Add twitter image, expand to `...:orig`.
	- **Remove original .richcontent element.**
  
* 0.1.1 (Mar 19, 2017)

	- Compat with chrome.
  
* 0.1.0 (Mar 19, 2017)

	- First release.
