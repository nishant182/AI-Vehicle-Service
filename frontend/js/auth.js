/* =========================================================
   AI VEHICLE SERVICE
   AUTHENTICATION JS
   Login + Register + JWT
========================================================= */


/* =========================================================
   COMMON API
========================================================= */

const API_BASE_URL = "https://ai-vehicle-service.onrender.com";


/* =========================================================
   LOGIN
========================================================= */

const loginForm = document.getElementById("loginForm");
const loginPasswordInput = document.getElementById("password");
const loginTogglePassword = document.getElementById("togglePassword");
const loginMessage = document.getElementById("loginMessage");


/* =========================================================
   LOGIN - SHOW / HIDE PASSWORD
========================================================= */

if (loginTogglePassword && loginPasswordInput) {

    loginTogglePassword.addEventListener("click", function () {

        if (loginPasswordInput.type === "password") {

            loginPasswordInput.type = "text";
            loginTogglePassword.textContent = "🙈";

        } else {

            loginPasswordInput.type = "password";
            loginTogglePassword.textContent = "👁";

        }

    });

}


/* =========================================================
   LOGIN
========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value.trim();

            const rememberCheckbox =
                document.getElementById("rememberMe");

            const rememberMe =
                rememberCheckbox
                    ? rememberCheckbox.checked
                    : false;


            /* =================================================
               VALIDATION
            ================================================= */

            if (!email || !password) {

                loginMessage.textContent =
                    "Please enter email and password.";

                loginMessage.style.color =
                    "#ff6b6b";

                return;
            }


            try {

                loginMessage.textContent =
                    "Logging in...";

                loginMessage.style.color =
                    "#8fa4ba";


                /* =================================================
                   BACKEND LOGIN
                ================================================= */

                const response = await fetch(
                    `${API_BASE_URL}/auth/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    }
                );


                const data =
                    await response.json();


                /* =================================================
                   LOGIN FAILED
                ================================================= */

                if (!response.ok) {

                    loginMessage.textContent =
                        data.detail ||
                        "Invalid email or password.";

                    loginMessage.style.color =
                        "#ff6b6b";

                    return;
                }


                /* =================================================
                   SAVE JWT TOKEN
                ================================================= */

                if (rememberMe) {

                    localStorage.setItem(
                        "accessToken",
                        data.access_token
                    );

                    sessionStorage.removeItem(
                        "accessToken"
                    );

                } else {

                    sessionStorage.setItem(
                        "accessToken",
                        data.access_token
                    );

                    localStorage.removeItem(
                        "accessToken"
                    );

                }


                /* =================================================
                   SAVE USER STATE
                ================================================= */

                localStorage.setItem(
                    "aiVehicleUser",
                    JSON.stringify({
                        email: email,
                        loggedIn: true
                    })
                );


                /* =================================================
                   SUCCESS
                ================================================= */

                loginMessage.textContent =
                    "Login successful. Opening dashboard...";

                loginMessage.style.color =
                    "#35d07f";


                /* =================================================
                   OPEN DASHBOARD
                ================================================= */

                setTimeout(function () {

                    window.location.href =
                        "dashboard.html";

                }, 500);


            } catch (error) {

                console.error(
                    "Login Error:",
                    error
                );


                loginMessage.textContent =
                    "Unable to connect to server.";

                loginMessage.style.color =
                    "#ff6b6b";

            }

        }
    );

}


/* =========================================================
   REGISTER
========================================================= */

const registerForm =
    document.getElementById("registerForm");

const registerPasswordInput =
    document.getElementById("password");

const registerConfirmPasswordInput =
    document.getElementById("confirmPassword");

const registerTogglePassword =
    document.getElementById("togglePassword");

const registerToggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");

const registerMessage =
    document.getElementById("registerMessage");


/* =========================================================
   REGISTER - SHOW / HIDE PASSWORD
========================================================= */

if (
    registerTogglePassword &&
    registerPasswordInput
) {

    registerTogglePassword.addEventListener(
        "click",
        function () {

            if (
                registerPasswordInput.type ===
                "password"
            ) {

                registerPasswordInput.type =
                    "text";

                registerTogglePassword.textContent =
                    "🙈";

            } else {

                registerPasswordInput.type =
                    "password";

                registerTogglePassword.textContent =
                    "👁";

            }

        }
    );

}


/* =========================================================
   REGISTER - SHOW / HIDE CONFIRM PASSWORD
========================================================= */

if (
    registerToggleConfirmPassword &&
    registerConfirmPasswordInput
) {

    registerToggleConfirmPassword.addEventListener(
        "click",
        function () {

            if (
                registerConfirmPasswordInput.type ===
                "password"
            ) {

                registerConfirmPasswordInput.type =
                    "text";

                registerToggleConfirmPassword.textContent =
                    "🙈";

            } else {

                registerConfirmPasswordInput.type =
                    "password";

                registerToggleConfirmPassword.textContent =
                    "👁";

            }

        }
    );

}


/* =========================================================
   REGISTER
========================================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* =================================================
               GET FORM VALUES
            ================================================= */

            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const phone =
                document
                    .getElementById("phone")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    .value;

            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;

            const terms =
                document.getElementById("terms");


            /* =================================================
               VALIDATION
            ================================================= */

            if (
                !name ||
                !email ||
                !password
            ) {

                registerMessage.textContent =
                    "Please fill all required fields.";

                registerMessage.className =
                    "auth-message error";

                return;
            }


            /* Password Length */

            if (password.length < 6) {

                registerMessage.textContent =
                    "Password must be at least 6 characters.";

                registerMessage.className =
                    "auth-message error";

                return;
            }


            /* Confirm Password */

            if (
                password !==
                confirmPassword
            ) {

                registerMessage.textContent =
                    "Passwords do not match.";

                registerMessage.className =
                    "auth-message error";

                return;
            }


            /* Terms */

            if (
                terms &&
                !terms.checked
            ) {

                registerMessage.textContent =
                    "Please accept the Terms & Conditions.";

                registerMessage.className =
                    "auth-message error";

                return;
            }


            try {

                registerMessage.textContent =
                    "Creating your account...";

                registerMessage.className =
                    "auth-message";


                /* =================================================
                   REGISTER BUTTON
                ================================================= */

                const registerButton =
                    document.getElementById(
                        "registerButton"
                    );

                const registerButtonText =
                    document.getElementById(
                        "registerButtonText"
                    );

                const registerLoader =
                    document.getElementById(
                        "registerLoader"
                    );


                if (registerButton) {

                    registerButton.disabled =
                        true;

                }


                if (registerButtonText) {

                    registerButtonText.style.display =
                        "none";

                }


                if (registerLoader) {

                    registerLoader.style.display =
                        "inline-block";

                }


                /* =================================================
                   BACKEND REGISTER
                ================================================= */

                const response = await fetch(
                    `${API_BASE_URL}/auth/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({

                            name: name,

                            email: email,

                            phone: phone || null,

                            password: password

                        })
                    }
                );


                const data =
                    await response.json();


                /* =================================================
                   REGISTRATION FAILED
                ================================================= */

                if (!response.ok) {

                    registerMessage.textContent =
                        data.detail ||
                        "Registration failed.";

                    registerMessage.className =
                        "auth-message error";


                    if (registerButton) {

                        registerButton.disabled =
                            false;

                    }


                    if (registerButtonText) {

                        registerButtonText.style.display =
                            "inline";

                    }


                    if (registerLoader) {

                        registerLoader.style.display =
                            "none";

                    }

                    return;
                }


                /* =================================================
                   REGISTRATION SUCCESSFUL
                   
                   Automatic Login
                ================================================= */

                registerMessage.textContent =
                    "Account created. Logging you in...";

                registerMessage.className =
                    "auth-message success";


                /* =================================================
                   AUTOMATIC LOGIN
                ================================================= */

                const loginResponse =
                    await fetch(
                        `${API_BASE_URL}/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                email: email,

                                password: password

                            })
                        }
                    );


                const loginData =
                    await loginResponse.json();


                /* =================================================
                   AUTOMATIC LOGIN FAILED
                ================================================= */

                if (!loginResponse.ok) {

                    registerMessage.textContent =
                        "Account created, but automatic login failed. Please login manually.";

                    registerMessage.className =
                        "auth-message error";


                    if (registerButton) {

                        registerButton.disabled =
                            false;

                    }


                    if (registerButtonText) {

                        registerButtonText.style.display =
                            "inline";

                    }


                    if (registerLoader) {

                        registerLoader.style.display =
                            "none";

                    }

                    return;
                }


                /* =================================================
                   SAVE JWT TOKEN
                ================================================= */

                localStorage.setItem(
                    "accessToken",
                    loginData.access_token
                );


                /* Clear old session token */

                sessionStorage.removeItem(
                    "accessToken"
                );


                /* =================================================
                   SAVE USER STATE
                ================================================= */

                localStorage.setItem(
                    "aiVehicleUser",
                    JSON.stringify({

                        email: email,

                        loggedIn: true

                    })
                );


                /* =================================================
                   SUCCESS
                ================================================= */

                registerMessage.textContent =
                    "Account created successfully. Opening dashboard...";

                registerMessage.className =
                    "auth-message success";


                /* =================================================
                   OPEN DASHBOARD
                ================================================= */

                setTimeout(function () {

                    window.location.href =
                        "dashboard.html";

                }, 500);


            } catch (error) {

                console.error(
                    "Registration Error:",
                    error
                );


                registerMessage.textContent =
                    "Unable to connect to server.";

                registerMessage.className =
                    "auth-message error";


                /* =================================================
                   ENABLE BUTTON AGAIN
                ================================================= */

                const registerButton =
                    document.getElementById(
                        "registerButton"
                    );

                const registerButtonText =
                    document.getElementById(
                        "registerButtonText"
                    );

                const registerLoader =
                    document.getElementById(
                        "registerLoader"
                    );


                if (registerButton) {

                    registerButton.disabled =
                        false;

                }


                if (registerButtonText) {

                    registerButtonText.style.display =
                        "inline";

                }


                if (registerLoader) {

                    registerLoader.style.display =
                        "none";

                }

            }

        }
    );

}