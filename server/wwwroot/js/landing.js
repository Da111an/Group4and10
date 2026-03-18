(function () {
    var appBaseUrl = "http://localhost:5173/";
    var showLoginButton = document.getElementById("show-login");
    var showCreateButton = document.getElementById("show-create");
    var goCreateInlineButton = document.getElementById("go-create-inline");
    var loginForm = document.getElementById("login-form");
    var createForm = document.getElementById("create-form");
    var authStatus = document.getElementById("auth-status");
    var loginEmailInput = document.getElementById("login-email");
    var loginPasswordInput = document.getElementById("login-password");
    var createFullNameInput = document.getElementById("create-full-name");
    var createEmailInput = document.getElementById("create-email");
    var createPasswordInput = document.getElementById("create-password");

    function setMode(mode) {
        if (!loginForm || !createForm || !showLoginButton || !showCreateButton) return;
        var loginMode = mode === "login";
        loginForm.classList.toggle("hidden", !loginMode);
        createForm.classList.toggle("hidden", loginMode);
        showLoginButton.classList.toggle("active", loginMode);
        showCreateButton.classList.toggle("active", !loginMode);
        clearStatus();
    }

    function setStatus(message, isError) {
        if (!authStatus) return;
        authStatus.textContent = message;
        authStatus.classList.remove("hidden", "success", "error");
        authStatus.classList.add(isError ? "error" : "success");
    }

    function clearStatus() {
        if (!authStatus) return;
        authStatus.classList.add("hidden");
        authStatus.classList.remove("success", "error");
        authStatus.textContent = "";
    }

    async function postJson(url, payload) {
        var response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        var result;
        try {
            result = await response.json();
        } catch {
            result = {};
        }

        return { ok: response.ok, result: result };
    }

    function buildAppHomeUrl(fullName) {
        var url = appBaseUrl + "?screen=dashboard";
        if (fullName && fullName.trim().length > 0) {
            url += "&name=" + encodeURIComponent(fullName.trim());
        }
        return url;
    }

    if (showLoginButton) {
        showLoginButton.addEventListener("click", function () {
            setMode("login");
        });
    }

    if (showCreateButton) {
        showCreateButton.addEventListener("click", function () {
            setMode("create");
        });
    }

    if (goCreateInlineButton) {
        goCreateInlineButton.addEventListener("click", function () {
            setMode("create");
            if (createEmailInput) {
                createEmailInput.focus();
            }
        });
    }

    if (loginForm && loginEmailInput && loginPasswordInput) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            clearStatus();

            var email = loginEmailInput.value.trim();
            var password = loginPasswordInput.value;

            if (!email || !password) {
                setStatus("Enter your email and password.", true);
                return;
            }

            var loginResult = await postJson("/api/auth/login", {
                email: email,
                password: password
            });

            if (!loginResult.ok) {
                setStatus(loginResult.result.message || "Login failed. Try again.", true);
                return;
            }

            var loginFullName = (loginResult.result && loginResult.result.fullName) || "";
            var fallbackName = email.split("@")[0] || "Friend";
            var displayName = loginFullName || fallbackName;

            setStatus("Welcome back. Redirecting to home...", false);
            window.setTimeout(function () {
                window.location.href = buildAppHomeUrl(displayName);
            }, 600);
        });
    }

    if (createForm && createFullNameInput && createEmailInput && createPasswordInput) {
        createForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            clearStatus();

            var fullName = createFullNameInput.value.trim();
            var email = createEmailInput.value.trim();
            var password = createPasswordInput.value;

            if (!fullName || !email || !password) {
                setStatus("Enter full name, email, and password to create your account.", true);
                return;
            }

            var createResult = await postJson("/api/auth/register", {
                fullName: fullName,
                email: email,
                password: password
            });

            if (!createResult.ok) {
                setStatus(createResult.result.message || "Account creation failed. Try again.", true);
                return;
            }

            if (loginEmailInput) {
                loginEmailInput.value = email;
            }

            if (loginPasswordInput) {
                loginPasswordInput.value = "";
            }

            window.location.href = buildAppHomeUrl(fullName);
        });
    }

    setMode("login");
})();
