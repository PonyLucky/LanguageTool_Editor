console.log("Environment variables: ", window.env);
API_URL = window.env.API_URL;
console.log("API_URL: " + API_URL);

// When content is loaded
document.addEventListener("DOMContentLoaded", function() {
    // Create a new language editor
    var languageEditor = new LanguageEditor(
        url=API_URL,
        level='picky',
        idEditor='editor',
        idLanguage='languages',
        idLevel='level',
        idCheck='check',
        idWait='wait',
        idMessage="message",
        idInfoText="info-text",
    );
    // Initialize the language editor
    languageEditor.init();
});
