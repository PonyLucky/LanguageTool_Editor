// Use languageTool.js, but this script make use of LanguageTool class to actually update the DOM.

// Constructor
function LanguageEditor(url="https://languagetool.org/api", level="normal", idEditor="editor", idLanguage="languages", idLevel="level", idCheck="check", idWait="wait") {
    this.languageTool = new LanguageTool(url);
    this.languages = this.languageTool.getLanguages();
    this.level = level; // normal, picky
    this.cooldownBeforeCheck = 1000; // ms
    // Ids
    this.idEditor = idEditor;
    this.idLanguages = idLanguage;
    this.idLevel = idLevel;
    this.idCheck = idCheck;
    this.idWait = idWait;
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

// Check the text
LanguageEditor.prototype.check = function() {
    var editor = this.getEditor();
    var language = this.getLanguages();
    var level = this.getLevel();
    var text = editor.innerText;
    
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

// Check callback
LanguageEditor.prototype.checkCallback = function(response) {
    var editor = this.getEditor();
    if (response.matches.length == 0) {
        this.setState('ok');
    }
    else {
        // Save caret position
        var caret = saveCaretPosition(editor);
        this.setState('error');
        console.log(response.matches);
        // Underline errors
        var text = editor.innerText;
        var offset = 0;
        for (var i = 0; i < response.matches.length; i++) {
            var match = response.matches[i];
            var start = match.offset + offset;
            var end = start + match.length;
            var before = text.substring(0, start);
            var error = text.substring(start, end);
            var after = text.substring(end);
            text = before + "<span class='text-error'>" + error + "</span>" + after;
            offset += "<span class='text-error'></span>".length;
        }
        editor.innerHTML = text;
        // Restore caret position
        caret();
    }
}

// Init
LanguageEditor.prototype.init = function() {
    this.setLanguages();
    // this.setLevel();
    // Check on change of editor
    this.getEditor().addEventListener("input", this.check.bind(this));
    // Set selected language from browser language
    var language = this.getLanguages();
    var browserLanguage = navigator.language || navigator.userLanguage;
    for (var i = 0; i < language.options.length; i++) {
        if (language.options[i].value == browserLanguage) {
            language.selectedIndex = i;
            break;
        }
    }
    // Focus on editor
    this.getEditor().focus();

    // For testing purposes, check the text
    this.check();
}
