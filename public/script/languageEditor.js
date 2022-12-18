// LANGUAGE global variable
var LANGUAGE = navigator.language || navigator.userLanguage || navigator.browserLanguage || navigator.systemLanguage || 'en';
// If language contains a dash, remove the last part
if (LANGUAGE.indexOf('-') != -1) {
    LANGUAGE = LANGUAGE.split('-')[0];
}

// Utility function to get and restore the caret position
// FROM: https://stackoverflow.com/a/38479462
function saveCaretPosition(context){
    var selection = window.getSelection();
    var range = selection.getRangeAt(0);
    range.setStart(  context, 0 );
    var len = range.toString().length;

    return function restore(){
        function getTextNodeAtPosition(root, index){
            const NODE_TYPE = NodeFilter.SHOW_TEXT;
            var treeWalker = document.createTreeWalker(root, NODE_TYPE, function next(elem) {
                if(index > elem.textContent.length){
                    index -= elem.textContent.length;
                    return NodeFilter.FILTER_REJECT
                }
                return NodeFilter.FILTER_ACCEPT;
            });
            var c = treeWalker.nextNode();
            return {
                node: c? c: root,
                position: index
            };
        }
        var pos = getTextNodeAtPosition(context, len);
        selection.removeAllRanges();
        var range = new Range();
        range.setStart(pos.node ,pos.position);
        selection.addRange(range);
    }
}

// Constructor
function LanguageEditor(
    url="https://languagetool.org/api",
    level="normal",
    idEditor="editor",
    idLanguage="languages",
    idLevel="level",
    idCheck="check",
    idWait="wait",
    idMessage="message",
    idInfoText="info-text"
) {
    this.languageTool = new LanguageTool(url);
    this.languages = this.languageTool.getLanguages();
    this.level = level; // normal, picky
    this.cooldownBeforeCheck = 1000; // ms
    this.matches = [];
    this.ignore = [];
    // Ids
    this.idEditor = idEditor;
    this.idLanguages = idLanguage;
    this.idLevel = idLevel;
    this.idCheck = idCheck;
    this.idWait = idWait;
    this.idMessage = idMessage;
    this.idInfoText = idInfoText;
}

// Get the editor
LanguageEditor.prototype.getEditor = function() {
    return document.getElementById(this.idEditor);
}

// Get the language
LanguageEditor.prototype.getLanguages = function() {
    return document.getElementById(this.idLanguages);
}

// Get the level
LanguageEditor.prototype.getLevel = function() {
    // return document.getElementById(this.idLevel);
    return this.level;
}

// Get the check button
LanguageEditor.prototype.getCheck = function() {
    return document.getElementById(this.idCheck);
}

// Get the wait div
LanguageEditor.prototype.getWait = function() {
    return document.getElementById(this.idWait);
}

// Get the message div
LanguageEditor.prototype.getMessage = function() {
    return document.getElementById(this.idMessage);
}

// Get the info text div
LanguageEditor.prototype.getInfoText = function() {
    return document.getElementById(this.idInfoText);
}

// Set state
LanguageEditor.prototype.setState = function(state) {
    var check = this.getCheck();
    var wait = this.getWait();
    // Reset classes
    check.classList.remove("check-pending");
    check.classList.remove("check-ok");
    check.classList.remove("check-err");
    wait.classList.remove("hidden");
    // Set state
    if (state == 'pending') {
        check.classList.add("check-pending");
    }
    else if (state == 'ok') {
        wait.classList.add("hidden");
        check.classList.add("check-ok");
    }
    else if (state == 'error') {
        wait.classList.add("hidden");
        check.classList.add("check-err");
    }
}

// Set the languages
LanguageEditor.prototype.setLanguages = function() {
    var languages = this.getLanguages();
    // Clear languages
    while (languages.firstChild) {
        languages.removeChild(languages.firstChild);
    }
    for (var i = 0; i < this.languages.length; i++) {
        var option = document.createElement("option");
        option.value = this.languages[i].code;
        option.text = this.languages[i].name;
        languages.add(option);
    }
}

// Set the level
LanguageEditor.prototype.setLevel = function() {
    var level = this.getLevel();
    // Clear levels
    while (level.firstChild) {
        level.removeChild(level.firstChild);
    }
    var option = document.createElement("option");
    option.value = "normal";
    option.text = "Normal";
    level.add(option);
    option = document.createElement("option");
    option.value = "picky";
    option.text = "Picky";
    level.add(option);
}

// Check the text
LanguageEditor.prototype.check = function() {
    var editor = this.getEditor();
    var language = this.getLanguages();
    var level = this.getLevel();
    var text = editor.innerText;

    // Hide message
    this.message();

    // Update textInfos
    this.updateTextInfos();
    
    // If text is empty, set state to ok
    if (text == "") {
        this.setState('ok');
        return;
    }
    
    // Wait before checking, reset timer on every change
    this.setState('pending');
    if (this.timer) {
        clearTimeout(this.timer);
    }
    _this = this;
    this.timer = setTimeout(function() {
        _this.setState('pending');
        _this.languageTool.checkAsync(text, language.value, level, _this.checkCallback.bind(_this));
    }, this.cooldownBeforeCheck);
}

// Message
LanguageEditor.prototype.message = function(show=false) {
    var message = this.getMessage();
    var editor = this.getEditor();
    // Clear message
    while (message.firstChild) {
        message.removeChild(message.firstChild);
    }
    // Set message
    if (show) {
        var match = null;
        // Find the match with ".text-current" class and get the index
        var texts = editor.getElementsByClassName("text")
        for (var i = 0; i < texts.length; i++) {
            if (texts[i].classList.contains("text-current")) {
                match = this.matches[i];
                break;
            }
        }
        // If no match, first match
        if (match == null) {
            match = this.matches[0];
        }
        var textMessage = match.message;
        var textReplacements = match.replacements;

        // Message, create h2
        var h2 = document.createElement("h2");
        h2.classList.add("message-title");
        h2.innerHTML = textMessage;
        message.appendChild(h2);

        // Rule, (div with .message-rule)
        var divRule = document.createElement("div");
        divRule.classList.add("message-rule");
        message.appendChild(divRule);

        // Replacements, create a div for each (into a div)
        var divReplacements = document.createElement("div");
        divReplacements.classList.add("message-replacements");
        for (var i = 0; i < textReplacements.length; i++) {
            // Stop if more than 5
            if (i > 4) {
                break;
            }
            var div = document.createElement("div");
            div.innerHTML = textReplacements[i].value;
            // Add click event
            div.addEventListener("click", this.replace.bind(this, textReplacements[i].value));
            divReplacements.appendChild(div);
        }
        // If there are no replacements, say it
        if (textReplacements.length == 0) {
            let text = "No replacements";
            try {
                // Change text depending of browser language
                // fr, es, de, it, pt, ru, pl, nl, ja, zh, ko, sv, da
                switch (LANGUAGE) {
                    case "fr":
                        text = "Pas de remplacements...";
                        break;
                    case "es":
                        text = "Sin reemplazos...";
                        break;
                    case "de":
                        text = "Keine Ersatz...";
                        break;
                    case "it":
                        text = "Nessun sostituto...";
                        break;
                    case "pt":
                        text = "Sem substitutos...";
                        break;
                    case "ru":
                        text = "Нет замен...";
                        break;
                    case "pl":
                        text = "Brak zastępców...";
                        break;
                    case "nl":
                        text = "Geen vervangingen...";
                        break;
                    case "ja":
                        text = "置換なし...";
                        break;
                    case "zh":
                        text = "没有替换...";
                        break;
                    case "ko":
                        text = "대체 없음...";
                        break;
                    case "sv":
                        text = "Inga ersättningar...";
                        break;
                    case "da":
                        text = "Ingen erstatning...";
                        break;
                }
            } catch {}
            divReplacements.innerHTML = text;
        }
        message.appendChild(divReplacements);

        // Rule, (div with .message-rule)
        var divRule = document.createElement("div");
        divRule.classList.add("message-rule");
        message.appendChild(divRule);

        // Ignore, create a div
        var divIgnore = document.createElement("div");
        divIgnore.classList.add("message-ignore");
        var textIgnore = "Ignore";
        try {
            // Change text depending of browser language
            // fr, es, de, it, pt, ru, pl, nl, ja, zh, ko, sv, da
            switch (LANGUAGE) {
                case "fr":
                    textIgnore = "Ignorer";
                    break;
                case "es":
                    textIgnore = "Ignorar";
                    break;
                case "de":
                    textIgnore = "Ignorieren";
                    break;
                case "it":
                    textIgnore = "Ignorare";
                    break;
                case "pt":
                    textIgnore = "Ignorar";
                    break;
                case "ru":
                    textIgnore = "Игнорировать";
                    break;
                case "pl":
                    textIgnore = "Ignorować";
                    break;
                case "nl":
                    textIgnore = "Negeren";
                    break;
                case "ja":
                    textIgnore = "無視する";
                    break;
                case "zh":
                    textIgnore = "忽略";
                    break;
                case "ko":
                    textIgnore = "무시";
                    break;
                case "sv":
                    textIgnore = "Ignorera";
                    break;
                case "da":
                    textIgnore = "Ignorere";
                    break;
            }
        } catch {}
        divIgnore.innerHTML = textIgnore;
        divIgnore.addEventListener("click", this.ignoreText.bind(this));
        message.appendChild(divIgnore);
        // Show message
        message.classList.remove("hidden");
    }
    else {
        // Hide message
        message.classList.add("hidden");
    }
}

// Check callback
LanguageEditor.prototype.checkCallback = function(response) {
    var editor = this.getEditor();
    var ignore = this.ignore;
    function isAllIgnored(matches) {
        var text = editor.innerText;
        // Check if all matches are ignored
        // A match is ignored if the text in the editor (offset + length) is the same as in 'ignore'
        for (var i = 0; i < matches.length; i++) {
            var match = matches[i];
            var start = match.offset;
            var end = start + match.length;
            var textMatch = text.substring(start, end);
            console.log(textMatch);
            console.log(ignore);
            if (!ignore.includes(textMatch)) {
                return false;
            }
        }
        return true;
    }
    if (response.matches.length == 0 || isAllIgnored(response.matches)) {
        this.setState('ok');

        // Remove all errors
        var texts = this.getEditor().getElementsByClassName("text");
        // If texts not empty, save caret position
        var caret = null;
        if (texts.length > 0) {
            caret = saveCaretPosition(editor);
        }
        for (var i = 0; i < texts.length; i++) {
            texts[i].outerHTML = texts[i].innerText;
        }
        // Restore caret position
        if (caret != null) {
            caret();
        }

        // Log for debug
        console.log("No errors");
    }
    else {
        // Save caret position
        var caret = saveCaretPosition(editor);
        this.setState('error');
        // Underline errors
        var text = editor.innerText;
        var offset = 0;
        for (var i = 0; i < response.matches.length; i++) {
            var match = response.matches[i];
            var start = match.offset + offset;
            response.matches[i].offset = start; // Update offset
            var end = start + match.length;
            var before = text.substring(0, start);
            var error = text.substring(start, end);
            var after = text.substring(end);
            var classes = "text";
            switch (match.rule.issueType) {
                case "misspelling":
                    classes += " text-typo";
                    break;
                case "style":
                    classes += " text-style";
                    break;
                default:
                    classes += " text-other";
                    break;
            }
            // Add .text-current if it's the first error
            if (i == 0) {
                classes += " text-current";
            }
            var attributes = `class='${classes}'`;
            text = `${before}<span ${attributes}>${error}</span>${after}`
            offset += "<span></span>".length + attributes.length + 1;
        }
        this.matches = response.matches;
        // Replace all new lines (\n) next to each other (1 or more) with a single new line
        text = text.replace(/\n{1,}/g, "<br><br>");
        editor.innerHTML = text;
        // Restore caret position
        try {
            caret();
        } catch {}
        // Add event listeners to the text
        var texts = editor.getElementsByClassName("text");
        for (var i = 0; i < texts.length; i++) {
            texts[i].addEventListener("click", this.textClick.bind(this));
        }
        // Show message
        this.message(true);

        // Log for debug
        console.log(response);
    }
}

// Text click
LanguageEditor.prototype.textClick = function(event) {
    var editor = this.getEditor();
    var text = event.target;
    // Remove .text-current from all texts
    var texts = editor.getElementsByClassName("text");
    for (var i = 0; i < texts.length; i++) {
        texts[i].classList.remove("text-current");
    }
    // Add .text-current to the clicked text
    text.classList.add("text-current");
    // Show message
    this.message(true);
}

// Replace
LanguageEditor.prototype.replace = function(text) {
    // Replace text
    var editor = this.getEditor();
    // Find the match with ".text-current" class and change the text
    var texts = editor.getElementsByClassName("text")
    var id = null;
    for (var i = 0; i < texts.length; i++) {
        if (texts[i].classList.contains("text-current")) {
            id = i;
            break;
        }
    }
    texts[id].outerHTML = text;
    // Remove id from matches
    this.matches.splice(id, 1);
    // Update texts
    texts = editor.getElementsByClassName("text");
    // Select next text, if any
    if (texts.length > 0) {
        texts[id % texts.length].classList.add("text-current");
        // Show message
        this.message(true);
    }
    else {
        // Hide message
        this.message(false);
        // Check again
        this.check();
    }

    // Update textInfos
    this.updateTextInfos();
}

// Ignore
LanguageEditor.prototype.ignoreText = function() {
    // Remove .text-current from all texts
    var editor = this.getEditor();
    var texts = editor.getElementsByClassName("text");
    var idToIgnore = null;
    for (var i = 0; i < texts.length; i++) {
        if (texts[i].classList.contains("text-current")) {
            idToIgnore = i;
            break;
        }
    }
    // Get text to ignore
    var textToIgnore = texts[idToIgnore].innerText;
    // Add text to ignore
    this.ignore.push(textToIgnore);
    texts[idToIgnore].outerHTML = textToIgnore;
    // Remove id from matches
    this.matches.splice(idToIgnore, 1);
    // Update texts
    texts = editor.getElementsByClassName("text");
    // Select next text, if any
    if (texts.length > 0) {
        texts[idToIgnore % texts.length].classList.add("text-current");
        // Show message
        this.message(true);
    }
    else {
        // Hide message
        this.message(false);
        // Set state to ok
        this.setState("ok");
    }
}

// textInfos
LanguageEditor.prototype.updateTextInfos = function() {
    // Update the text infos, if any
    // nb chars, nb words
    var editor = this.getEditor();
    var text = editor.innerText;
    var nbChars = text.length;
    var nbWords = text.split(" ").length;

    // Get text infos
    var textInfos = this.getInfoText();
    var content = "{0} characters, {1} words";

    try {
        // Change text depending of browser language
        // fr, es, de, it, pt, ru, pl, nl, ja, zh, ko, sv, da
        switch (LANGUAGE) {
            case "fr":
                content = "{0} caractères, {1} mots";
                break;
            case "es":
                content = "{0} caracteres, {1} palabras";
                break;
            case "de":
                content = "{0} Zeichen, {1} Wörter";
                break;
            case "it":
                content = "{0} caratteri, {1} parole";
                break;
            case "pt":
                content = "{0} caracteres, {1} palavras";
                break;
            case "ru":
                content = "{0} символов, {1} слов";
                break;
            case "pl":
                content = "{0} znaków, {1} słów";
                break;
            case "nl":
                content = "{0} tekens, {1} woorden";
                break;
            case "ja":
                content = "{0} 文字, {1} 語";
                break;
            case "zh":
                content = "{0} 字符, {1} 字";
                break;
            case "ko":
                content = "{0} 문자, {1} 단어";
                break;
            case "sv":
                content = "{0} tecken, {1} ord";
                break;
            case "da":
                content = "{0} tegn, {1} ord";
        }
    } catch {}

    // Update text infos
    textInfos.innerHTML = content.replace("{0}", nbChars).replace("{1}", nbWords);
}

// Init
LanguageEditor.prototype.init = function() {
    this.setLanguages();
    // this.setLevel();
    // Check on change of editor
    this.getEditor().addEventListener("input", this.check.bind(this));
    // Set selected language from browser language
    var language = this.getLanguages();
    var browserLanguage = LANGUAGE;
    for (var i = 0; i < language.options.length; i++) {
        if (language.options[i].value == browserLanguage) {
            language.selectedIndex = i;
            break;
        }
    }
    // Focus on editor
    this.getEditor().focus();

    // Update textInfos
    this.updateTextInfos();
}
