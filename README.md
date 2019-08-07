PTT Imgur Fix
=============

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
* Add ":orig" to embeded twitter image.
* Remove embeded youtube video.
* Customize Youtube player parameters. See https://developers.google.com/youtube/player_parameters#Parameters.

Install
-------
<https://greasyfork.org/scripts/28264-ptt-imgur-fix>

Compat notes
------------
* If your browser doesn't support [referrerPolicy](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/referrerPolicy), you need to use an extension to strip referer header, e.g. [RefControl](https://addons.mozilla.org/firefox/addon/refcontrol/).
* If you have installed a request-blocker like [uBlock origin](https://addons.mozilla.org/zh-tw/firefox/addon/ublock-origin/), you can block the request from `ptt.cc` to `https://s.imgur.com/min/embed.js`.

Changelog
---------

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
