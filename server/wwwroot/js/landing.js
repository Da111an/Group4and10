(function () {
    var storageKey = "safeharbor_alias";
    var privacyToggle = document.getElementById("privacy-toggle");
    var privacyPanel = document.getElementById("privacy-panel");
    var privacyIcon = document.getElementById("privacy-icon");
    var aliasInput = document.getElementById("alias-input");
    var startButton = document.getElementById("start-button");
    var returningUser = document.getElementById("returning-user");
    var newUser = document.getElementById("new-user");
    var welcomeAlias = document.getElementById("welcome-alias");

    function updateStartButton() {
        if (!aliasInput || !startButton) return;
        startButton.disabled = aliasInput.value.trim().length === 0;
    }

    function showReturning(alias) {
        if (!returningUser || !newUser || !welcomeAlias) return;
        welcomeAlias.textContent = alias;
        returningUser.classList.remove("hidden");
        newUser.classList.add("hidden");
    }

    function showNew() {
        if (!returningUser || !newUser) return;
        returningUser.classList.add("hidden");
        newUser.classList.remove("hidden");
    }

    if (privacyToggle && privacyPanel && privacyIcon) {
        privacyToggle.addEventListener("click", function () {
            var expanded = privacyToggle.getAttribute("aria-expanded") === "true";
            privacyToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
            privacyPanel.classList.toggle("hidden", expanded);
            privacyIcon.textContent = expanded ? "Show" : "Hide";
        });
    }

    var storedAlias = window.localStorage.getItem(storageKey);
    if (storedAlias && storedAlias.trim().length > 0) {
        showReturning(storedAlias);
    } else {
        showNew();
    }

    if (aliasInput) {
        aliasInput.addEventListener("input", updateStartButton);
        aliasInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter" && startButton && !startButton.disabled) {
                startButton.click();
            }
        });
    }

    if (startButton && aliasInput) {
        startButton.addEventListener("click", function () {
            var alias = aliasInput.value.trim();
            if (!alias) return;
            window.localStorage.setItem(storageKey, alias);
            showReturning(alias);
        });
    }

    updateStartButton();
})();
