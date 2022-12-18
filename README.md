# LanguageTool_Editor
Lets you easily edit text to see if this very text is correct using LanguageTool.

## HTML page
Open the page (`.html`) and using your LanguageTool local server, you will be able to see if you've done any mistakes.

## Settings
### LanguageTool server
If the page doesn't work, you can change the url of the LanguageTool server in `./public/script/main.js` (line 1):
```js
const URLServer = "http://<your ip>:<your port>";
```

### LanguageTool public api
If you want to use the LanguageTool public api, you can change the url in `./public/script/main.js` (line 1):
```js
const URLServer = "https://languagetool.org/api";
```
Or by commenting on line 7 :
```js
// url=URLServer,
```

## Information
- You don't need to disable the LanguageTool web extension. She won't interfere with the page. *If you want to, go [here](https://github.com/PonyLucky/LanguageTool_Editor/tree/HTML-page)*.
- You don't need to disable the CORS policy.
- You can use the LanguageTool public api, but it's not recommended because it's slow. *See the [related section](#languagetool-public-api)*.