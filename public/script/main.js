// When content is loaded
document.addEventListener("DOMContentLoaded", function() {
    // Create a new language editor
    var languageEditor = new LanguageEditor(
        url='http://192.168.1.105:8010',
        level='picky',
        idEditor='editor',
        idLanguage='languages',
        idLevel='level',
        idCheck='check',
        idWait='wait',
        idMessage="message"
    );
    // Initialize the language editor
    languageEditor.init();
});