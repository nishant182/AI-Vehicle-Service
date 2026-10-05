/* =========================================
   AI VEHICLE SERVICE
   PROFILE JAVASCRIPT
   BACKEND CONNECTED VERSION
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const API_BASE_URL = "http://127.0.0.1:8000";

    /* =========================================
       AUTH
    ========================================= */

    function getToken() {
        return (
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken")
        );
    }

    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    function getAuthHeaders() {
        return {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };
    }


    /* =========================================
       ELEMENTS
    ========================================= */

    const editProfileBtn =
        document.getElementById("editProfileBtn");

    const cancelProfileBtn =
        document.getElementById("cancelProfileBtn");

    const saveProfileBtn =
        document.getElementById("saveProfileBtn");

    const profileFormActions =
        document.getElementById("profileFormActions");

    const fullName =
        document.getElementById("fullName");

    const email =
        document.getElementById("email");

    const phone =
        document.getElementById("phone");

    const locationInput =
        document.getElementById("location");

    const displayName =
        document.getElementById("profileDisplayName");

    const displayEmail =
        document.getElementById("profileDisplayEmail");

    const changePasswordBtn =
        document.getElementById("changePasswordBtn");

    const passwordBox =
        document.getElementById("passwordBox");

    const savePasswordBtn =
        document.getElementById("savePasswordBtn");

    const currentPassword =
        document.getElementById("currentPassword");

    const newPassword =
        document.getElementById("newPassword");

    const confirmPassword =
        document.getElementById("confirmPassword");


    /* =========================================
       ORIGINAL PROFILE
    ========================================= */

    let originalProfile = {
        name: "",
        email: "",
        phone: "",
        location: ""
    };


    /* =========================================
       API REQUEST
    ========================================= */

    async function apiRequest(url, options = {}) {

        try {

            const response = await fetch(
                `${API_BASE_URL}${url}`,
                {
                    ...options,
                    headers: {
                        ...getAuthHeaders(),
                        ...(options.headers || {})
                    }
                }
            );

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                localStorage.removeItem("accessToken");
                sessionStorage.removeItem("accessToken");

                localStorage.removeItem("aiVehicleUser");
                sessionStorage.removeItem("aiVehicleUser");

                window.location.href = "login.html";

                return null;
            }

            return response;

        } catch (error) {

            console.error(
                "Profile API Connection Error:",
                error
            );

            alert(
                "Unable to connect to the backend server."
            );

            return null;
        }
    }


    /* =========================================
       LOAD PROFILE
    ========================================= */

    async function loadProfile() {

        try {

            const response =
                await apiRequest(
                    "/profile"
                );

            if (!response) return;


            console.log(
                "Profile API Status:",
                response.status
            );


            const data =
                await response.json();


            console.log(
                "Profile API Response:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Unable to load profile"
                );

            }


            /* =====================================
               BACKEND PROFILE DATA
            ===================================== */

            fullName.value =
                data.name || "";

            email.value =
                data.email || "";

            phone.value =
                data.phone || "";

            /*
             * Current backend ProfileResponse does
             * not contain location.
             *
             * Keep existing UI value if available.
             */
            if (data.location !== undefined) {

                locationInput.value =
                    data.location || "";

            }


            originalProfile = {

                name:
                    fullName.value,

                email:
                    email.value,

                phone:
                    phone.value,

                location:
                    locationInput.value

            };


            updateProfileHeader();

            disableEditMode();


        } catch (error) {

            console.error(
                "Load Profile Error:",
                error
            );

        }

    }


    /* =========================================
       UPDATE PROFILE HEADER
    ========================================= */

    function updateProfileHeader() {

        if (displayName) {

            displayName.textContent =
                fullName.value ||
                "User";

        }

        if (displayEmail) {

            displayEmail.textContent =
                email.value ||
                "No email available";

        }

    }


    /* =========================================
       ENABLE EDIT MODE
    ========================================= */

    function enableEditMode() {

        if (fullName) {
            fullName.disabled = false;
        }

        /*
         * Email is currently returned by backend
         * but ProfileUpdate does not allow email update.
         */
        if (email) {
            email.disabled = true;
        }

        if (phone) {
            phone.disabled = false;
        }

        /*
         * Location is not supported by the current
         * ProfileUpdate backend schema.
         */
        if (locationInput) {
            locationInput.disabled = true;
        }


        if (profileFormActions) {
            profileFormActions.style.display = "flex";
        }

        if (editProfileBtn) {
            editProfileBtn.style.display = "none";
        }

        if (fullName) {
            fullName.focus();
        }

    }


    /* =========================================
       DISABLE EDIT MODE
    ========================================= */

    function disableEditMode() {

        if (fullName) {
            fullName.disabled = true;
        }

        if (email) {
            email.disabled = true;
        }

        if (phone) {
            phone.disabled = true;
        }

        if (locationInput) {
            locationInput.disabled = true;
        }


        if (profileFormActions) {
            profileFormActions.style.display = "none";
        }

        if (editProfileBtn) {
            editProfileBtn.style.display =
                "inline-flex";
        }

    }


    /* =========================================
       EDIT PROFILE
    ========================================= */

    if (editProfileBtn) {

        editProfileBtn.addEventListener(
            "click",
            enableEditMode
        );

    }


    /* =========================================
       CANCEL EDIT
    ========================================= */

    if (cancelProfileBtn) {

        cancelProfileBtn.addEventListener(
            "click",
            () => {

                fullName.value =
                    originalProfile.name;

                email.value =
                    originalProfile.email;

                phone.value =
                    originalProfile.phone;

                locationInput.value =
                    originalProfile.location;

                disableEditMode();

            }
        );

    }


    /* =========================================
       VALIDATE PROFILE
    ========================================= */

    function validateProfile() {

        const name =
            fullName.value.trim();

        const userPhone =
            phone.value.trim();


        if (name.length < 2) {

            alert(
                "Please enter a valid full name."
            );

            fullName.focus();

            return false;

        }


        if (userPhone) {

            const phoneDigits =
                userPhone.replace(/\D/g, "");

            if (phoneDigits.length < 10) {

                alert(
                    "Please enter a valid phone number."
                );

                phone.focus();

                return false;

            }

        }


        return true;

    }


    /* =========================================
       SAVE PROFILE
    ========================================= */

    if (saveProfileBtn) {

        saveProfileBtn.addEventListener(
            "click",
            async () => {

                if (!validateProfile()) {
                    return;
                }


                const updatedProfile = {

                    name:
                        fullName.value.trim(),

                    phone:
                        phone.value.trim()

                };


                try {

                    saveProfileBtn.disabled =
                        true;

                    saveProfileBtn.innerHTML =
                        '<i class="fas fa-spinner fa-spin"></i> Saving...';


                    const response =
                        await apiRequest(
                            "/profile",
                            {
                                method: "PUT",
                                body:
                                    JSON.stringify(
                                        updatedProfile
                                    )
                            }
                        );


                    if (!response) return;


                    console.log(
                        "Update Profile API Status:",
                        response.status
                    );


                    const data =
                        await response.json();


                    console.log(
                        "Update Profile API Response:",
                        data
                    );


                    if (!response.ok) {

                        throw new Error(
                            data.detail ||
                            "Unable to update profile"
                        );

                    }


                    /* =================================
                       UPDATE UI FROM BACKEND RESPONSE
                    ================================= */

                    fullName.value =
                        data.name || "";

                    email.value =
                        data.email || "";

                    phone.value =
                        data.phone || "";


                    originalProfile = {

                        name:
                            fullName.value,

                        email:
                            email.value,

                        phone:
                            phone.value,

                        location:
                            locationInput.value

                    };


                    updateProfileHeader();

                    disableEditMode();


                    saveProfileBtn.innerHTML =
                        '<i class="fas fa-check"></i> Saved';


                    setTimeout(() => {

                        saveProfileBtn.innerHTML =
                            '<i class="fas fa-check"></i> Save Changes';

                        saveProfileBtn.disabled =
                            false;

                    }, 1500);


                } catch (error) {

                    console.error(
                        "Update Profile Error:",
                        error
                    );


                    alert(
                        error.message ||
                        "Unable to update profile."
                    );


                    saveProfileBtn.innerHTML =
                        '<i class="fas fa-check"></i> Save Changes';

                    saveProfileBtn.disabled =
                        false;

                }

            }
        );

    }


    /* =========================================
       CHANGE PASSWORD BOX
    ========================================= */

    if (changePasswordBtn) {

        changePasswordBtn.addEventListener(
            "click",
            () => {

                const isHidden =
                    passwordBox.style.display === "none" ||
                    passwordBox.style.display === "";


                if (isHidden) {

                    passwordBox.style.display =
                        "grid";

                    changePasswordBtn.innerHTML =
                        "Cancel";

                } else {

                    passwordBox.style.display =
                        "none";

                    changePasswordBtn.innerHTML =
                        "Change Password";

                    clearPasswordFields();

                }

            }
        );

    }


    /* =========================================
       CLEAR PASSWORD FIELDS
    ========================================= */

    function clearPasswordFields() {

        if (currentPassword) {
            currentPassword.value = "";
        }

        if (newPassword) {
            newPassword.value = "";
        }

        if (confirmPassword) {
            confirmPassword.value = "";
        }

    }


    /* =========================================
       PASSWORD
       CURRENTLY NOT CONNECTED
    ========================================= */

    if (savePasswordBtn) {

        savePasswordBtn.addEventListener(
            "click",
            () => {

                alert(
                    "Password change API is not available yet."
                );

            }
        );

    }


    /* =========================================
       LOGOUT
    ========================================= */

    const logoutButton =
        document.querySelector(".logout-btn");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            event => {

                const confirmLogout =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmLogout) {

                    event.preventDefault();

                    return;

                }


                localStorage.removeItem(
                    "accessToken"
                );

                sessionStorage.removeItem(
                    "accessToken"
                );

                localStorage.removeItem(
                    "aiVehicleUser"
                );

                sessionStorage.removeItem(
                    "aiVehicleUser"
                );

            }
        );

    }


    /* =========================================
       INITIALIZE
    ========================================= */

    await loadProfile();

});