/* =========================================
   ADD VEHICLE
   Frontend ↔ FastAPI Vehicles API
   Vehicle + Image Upload
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    const API_BASE_URL = "https://ai-vehicle-service.onrender.com";


    const form =
        document.getElementById("vehicleForm");

    const message =
        document.getElementById("vehicleMessage");

    const imageInput =
        document.getElementById("vehicleImage");

    const imagePreview =
        document.getElementById("imagePreview");

    const sidebar =
        document.getElementById("sidebar");

    const menuToggle =
        document.getElementById("menuToggle");

    const logoutBtn =
        document.getElementById("logoutBtn");


    /* ===============================
       GET ACCESS TOKEN
    =============================== */

    function getAccessToken() {

        return (
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken")
        );

    }


    /* ===============================
       LOGIN CHECK
    =============================== */

    const token =
        getAccessToken();

    const user =
        localStorage.getItem("aiVehicleUser");


    if (!token || !user) {

        window.location.href =
            "login.html";

        return;

    }


    /* ===============================
       MOBILE SIDEBAR
    =============================== */

    if (menuToggle && sidebar) {

        menuToggle.addEventListener(
            "click",
            function () {

                sidebar.classList.toggle(
                    "open"
                );

            }
        );

    }


    /* ===============================
       LOGOUT
    =============================== */

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            function () {

                localStorage.removeItem(
                    "accessToken"
                );

                sessionStorage.removeItem(
                    "accessToken"
                );

                localStorage.removeItem(
                    "aiVehicleUser"
                );

                localStorage.removeItem(
                    "rememberLogin"
                );

                window.location.href =
                    "login.html";

            }
        );

    }


    /* ===============================
       IMAGE PREVIEW
    =============================== */

    if (imageInput) {

        imageInput.addEventListener(
            "change",
            function () {

                const file =
                    imageInput.files[0];


                if (!file) {

                    imagePreview.innerHTML =
                        "";

                    imagePreview.classList.remove(
                        "show"
                    );

                    return;

                }


                /* File type */

                if (
                    ![
                        "image/jpeg",
                        "image/png",
                        "image/webp"
                    ].includes(file.type)
                ) {

                    showMessage(
                        "Only JPG, JPEG, PNG or WEBP images are allowed.",
                        "error"
                    );

                    imageInput.value = "";

                    return;

                }


                /* Maximum 5 MB */

                if (
                    file.size >
                    5 * 1024 * 1024
                ) {

                    showMessage(
                        "Image size must be less than 5 MB.",
                        "error"
                    );

                    imageInput.value = "";

                    return;

                }


                const reader =
                    new FileReader();


                reader.onload =
                    function (event) {

                        imagePreview.innerHTML = `
                            <img
                                src="${event.target.result}"
                                alt="Vehicle Preview"
                            >
                        `;

                        imagePreview.classList.add(
                            "show"
                        );

                    };


                reader.readAsDataURL(file);

            }
        );

    }


    /* ===============================
       FORM SUBMIT
    =============================== */

    if (form) {

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                showMessage(
                    "",
                    ""
                );


                /* ===============================
                   GET FORM VALUES
                =============================== */

                const vehicleType =
                    document.getElementById(
                        "vehicleType"
                    ).value.trim();


                const brand =
                    document.getElementById(
                        "brand"
                    ).value.trim();


                const model =
                    document.getElementById(
                        "model"
                    ).value.trim();


                const year =
                    document.getElementById(
                        "year"
                    ).value;


                const registration =
                    document.getElementById(
                        "registration"
                    ).value.trim();


                const fuelType =
                    document.getElementById(
                        "fuelType"
                    ).value.trim();


                const currentMileage =
                    document.getElementById(
                        "currentMileage"
                    ).value;


                const lastServiceKm =
                    document.getElementById(
                        "lastServiceKm"
                    ).value;


                const lastServiceDate =
                    document.getElementById(
                        "lastServiceDate"
                    ).value;


                const insuranceExpiry =
                    document.getElementById(
                        "insuranceExpiry"
                    ).value;


                const imageFile =
                    imageInput &&
                    imageInput.files.length > 0
                        ? imageInput.files[0]
                        : null;


                /* ===============================
                   VALIDATION
                =============================== */

                if (
                    !vehicleType ||
                    !brand ||
                    !model ||
                    !year ||
                    !registration ||
                    !fuelType ||
                    !currentMileage
                ) {

                    showMessage(
                        "Please fill all required fields.",
                        "error"
                    );

                    return;

                }


                /* ===============================
                   VEHICLE DATA
                =============================== */

                const vehicleData = {

                    vehicle_type:
                        vehicleType,

                    brand:
                        brand,

                    model:
                        model,

                    year:
                        Number(year),

                    registration_number:
                        registration.toUpperCase(),

                    fuel_type:
                        fuelType,

                    current_mileage:
                        Number(currentMileage),

                    last_service_date:
                        lastServiceDate || null,

                    last_service_km:
                        lastServiceKm
                            ? Number(lastServiceKm)
                            : null,

                    insurance_expiry:
                        insuranceExpiry || null,

                    vehicle_image:
                        null

                };


                console.log(
                    "Vehicle Payload:",
                    vehicleData
                );


                /* ===============================
                   BUTTON
                =============================== */

                const submitButton =
                    form.querySelector(
                        ".save-vehicle-btn"
                    );


                const originalText =
                    submitButton
                        ? submitButton.textContent
                        : "Save Vehicle →";


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Saving...";

                }


                try {

                    /* ===============================
                       STEP 1
                       CREATE VEHICLE
                    =============================== */

                    const vehicleResponse =
                        await fetch(
                            `${API_BASE_URL}/vehicles`,
                            {
                                method: "POST",

                                headers: {

                                    "Authorization":
                                        `Bearer ${token}`,

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify(
                                        vehicleData
                                    )

                            }
                        );


                    /* ===============================
                       AUTH ERROR
                    =============================== */

                    if (
                        vehicleResponse.status ===
                        401 ||
                        vehicleResponse.status ===
                        403
                    ) {

                        logoutUser();

                        return;

                    }


                    const vehicleResult =
                        await vehicleResponse.json();


                    if (!vehicleResponse.ok) {

                        throw new Error(
                            vehicleResult.detail ||
                            "Failed to save vehicle."
                        );

                    }


                    console.log(
                        "Vehicle Created:",
                        vehicleResult
                    );


                    const vehicleId =
                        vehicleResult.id;


                    /* ===============================
                       STEP 2
                       UPLOAD IMAGE
                    =============================== */

                    if (imageFile) {

                        if (submitButton) {

                            submitButton.textContent =
                                "Uploading Image...";

                        }


                        const formData =
                            new FormData();


                        formData.append(
                            "image",
                            imageFile
                        );


                        const imageResponse =
                            await fetch(
                                `${API_BASE_URL}/vehicles/${vehicleId}/image`,
                                {
                                    method: "POST",

                                    headers: {

                                        "Authorization":
                                            `Bearer ${token}`

                                    },

                                    body:
                                        formData

                                }
                            );


                        /* ===============================
                           AUTH ERROR
                        =============================== */

                        if (
                            imageResponse.status ===
                            401 ||
                            imageResponse.status ===
                            403
                        ) {

                            logoutUser();

                            return;

                        }


                        const imageResult =
                            await imageResponse.json();


                        if (!imageResponse.ok) {

                            throw new Error(
                                imageResult.detail ||
                                "Vehicle saved, but image upload failed."
                            );

                        }


                        console.log(
                            "Vehicle Image Uploaded:",
                            imageResult
                        );

                    }


                    /* ===============================
                       SUCCESS
                    =============================== */

                    showMessage(
                        imageFile
                            ? "Vehicle and image added successfully!"
                            : "Vehicle added successfully!",
                        "success"
                    );


                    /* ===============================
                       REDIRECT
                    =============================== */

                    setTimeout(
                        function () {

                            window.location.href =
                                "vehicles.html";

                        },
                        1200
                    );


                } catch (error) {

                    console.error(
                        "Add vehicle failed:",
                        error
                    );


                    showMessage(
                        error.message ||
                        "Something went wrong while saving the vehicle.",
                        "error"
                    );


                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            originalText;

                    }

                }

            }
        );

    }


    /* ===============================
       LOGOUT HELPER
    =============================== */

    function logoutUser() {

        localStorage.removeItem(
            "accessToken"
        );

        sessionStorage.removeItem(
            "accessToken"
        );

        localStorage.removeItem(
            "aiVehicleUser"
        );

        localStorage.removeItem(
            "rememberLogin"
        );

        window.location.href =
            "login.html";

    }


    /* ===============================
       MESSAGE HELPER
    =============================== */

    function showMessage(
        text,
        type
    ) {

        if (!message) {
            return;
        }


        message.textContent =
            text;


        message.className =
            "vehicle-message";


        if (type) {

            message.classList.add(
                type
            );

        }

    }

});