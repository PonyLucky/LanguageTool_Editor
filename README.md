# LanguageTool_Editor
Lets you easily edit text to see if this very text is correct using LanguageTool.

## HTML page
Open the page (`.html`) and using your LanguageTool local server, you will be able to see if you've done any mistakes.

## Settings
If the page doesn't work, you can change the url of the LanguageTool server in `./public/script/main.js` (line 1):
```js
const URLServer = "http://<your ip>:<your port>";
```

If you want to use the LanguageTool public api, you can change the url in `./public/script/main.js` (line 2):
```js
const URLServer = "https://languagetool.org/api";
```
Or by commenting the line 7 :
```js
// url=URLServer,
```
