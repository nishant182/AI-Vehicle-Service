// ============================================================
// AI VEHICLE SERVICE - VEHICLE DETAILS
// Backend Connected Version
// ============================================================

const API_BASE_URL = "https://ai-vehicle-service.onrender.com";


// ============================================================
// AUTH
// ============================================================

function getAccessToken() {
    return (
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken")
    );
}

function redirectToLogin() {
    window.location.href = "login.html";
}


// ============================================================
// SELECTED VEHICLE
// ============================================================

function getSelectedVehicleId() {

    const vehicleId =
        localStorage.getItem("selectedVehicleId");

    if (!vehicleId) {
        return null;
    }

    return vehicleId;
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(value) {

    if (!value) {
        return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// ============================================================
// MILEAGE FORMAT
// ============================================================

function formatMileage(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "Not available";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return `${value} KM`;
    }

    return `${number.toLocaleString("en-IN")} KM`;
}


// ============================================================
// IMAGE URL
// ============================================================

function getVehicleImageUrl(imagePath) {

    if (!imagePath) {
        return null;
    }

    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://")
    ) {
        return imagePath;
    }

    return `${API_BASE_URL}${imagePath}`;
}


// ============================================================
// VEHICLE IMAGE
// ============================================================

function setVehicleImage(vehicle) {

    const image =
        document.getElementById("vehicleImage");

    const placeholder =
        document.getElementById("vehiclePlaceholder");

    if (!image || !placeholder) {
        return;
    }


    const imageUrl =
        getVehicleImageUrl(vehicle.vehicle_image);


    if (!imageUrl) {

        image.style.display = "none";
        placeholder.style.display = "flex";

        return;
    }


    image.onload = () => {

        image.style.display = "block";
        placeholder.style.display = "none";
    };


    image.onerror = () => {

        image.style.display = "none";
        placeholder.style.display = "flex";
    };


    image.src = imageUrl;

    image.alt =
        `${vehicle.brand} ${vehicle.model}`;
}


// ============================================================
// HEALTH DATA
// ============================================================
// Current /vehicles API does not provide health score.
// Therefore no fake health score is displayed.

function updateHealthDisplay() {

    const healthScore =
        document.getElementById("healthScore");

    const healthStatus =
        document.querySelector(".health-status");

    const healthCircle =
        document.querySelector(".health-circle");


    if (healthScore) {
        healthScore.textContent = "—";
    }


    if (healthStatus) {
        healthStatus.textContent =
            "Health data unavailable";
    }


    if (healthCircle) {
        healthCircle.classList.add(
            "health-data-unavailable"
        );
    }


    // System health values
    const systemRows =
        document.querySelectorAll(".system-row");


    systemRows.forEach(row => {

        const score =
            row.querySelector("strong");

        const status =
            row.querySelector("small");

        const progress =
            row.querySelector(
                ".system-progress > div"
            );


        if (score) {
            score.textContent = "—";
        }

        if (status) {
            status.textContent =
                "Data unavailable";
        }

        if (progress) {
            progress.style.width = "0%";
        }

    });
}


// ============================================================
// INSURANCE
// ============================================================

function updateInsurance(vehicle) {

    const expiryElement =
        document.getElementById("insuranceExpiry");

    const statusElement =
        document.getElementById("insuranceStatus");

    const messageElement =
        document.getElementById("insuranceMessage");

    const infoStatusElement =
        document.getElementById(
            "infoInsuranceStatus"
        );


    if (!vehicle.insurance_expiry) {

        if (expiryElement) {
            expiryElement.textContent =
                "Not available";
        }

        if (statusElement) {
            statusElement.textContent =
                "Insurance information unavailable";
        }

        if (messageElement) {
            messageElement.textContent =
                "No insurance expiry date is registered.";
        }

        if (infoStatusElement) {
            infoStatusElement.textContent =
                "Not available";
        }

        return;
    }


    const expiryDate =
        new Date(vehicle.insurance_expiry);

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);


    const expiryText =
        formatDate(vehicle.insurance_expiry);


    if (expiryElement) {
        expiryElement.textContent =
            expiryText;
    }


    if (expiryDate >= today) {

        if (statusElement) {
            statusElement.textContent =
                "Insured";
        }

        if (messageElement) {
            messageElement.textContent =
                "Insurance is currently active";
        }

        if (infoStatusElement) {
            infoStatusElement.textContent =
                "Active";
        }

    } else {

        if (statusElement) {
            statusElement.textContent =
                "Insurance Expired";
        }

        if (messageElement) {
            messageElement.textContent =
                "Insurance expiry date has passed.";
        }

        if (infoStatusElement) {
            infoStatusElement.textContent =
                "Expired";
        }
    }
}


// ============================================================
// CALCULATE KM SINCE SERVICE
// ============================================================

function updateServiceData(vehicle) {

    const currentMileage =
        Number(vehicle.current_mileage);

    const lastServiceKm =
        Number(vehicle.last_service_km);


    const currentMileageElement =
        document.getElementById(
            "currentMileage"
        );

    const lastServiceKmElement =
        document.getElementById(
            "lastServiceKm"
        );

    const kmSinceServiceElement =
        document.getElementById(
            "kmSinceService"
        );

    const lastServiceDateElement =
        document.getElementById(
            "lastServiceDate"
        );


    if (currentMileageElement) {

        if (!Number.isNaN(currentMileage)) {

            currentMileageElement.textContent =
                currentMileage.toLocaleString("en-IN");

        } else {

            currentMileageElement.textContent =
                "—";
        }
    }


    if (lastServiceKmElement) {

        lastServiceKmElement.textContent =
            vehicle.last_service_km !== null &&
            vehicle.last_service_km !== undefined
                ? formatMileage(vehicle.last_service_km)
                : "Not available";
    }


    if (
        !Number.isNaN(currentMileage) &&
        !Number.isNaN(lastServiceKm)
    ) {

        const difference =
            currentMileage - lastServiceKm;


        if (kmSinceServiceElement) {

            if (difference >= 0) {

                kmSinceServiceElement.textContent =
                    `${difference.toLocaleString("en-IN")} KM`;

            } else {

                kmSinceServiceElement.textContent =
                    "—";
            }
        }

    } else {

        if (kmSinceServiceElement) {
            kmSinceServiceElement.textContent =
                "Not available";
        }
    }


    if (lastServiceDateElement) {

        lastServiceDateElement.textContent =
            formatDate(
                vehicle.last_service_date
            );
    }
}


// ============================================================
// RENDER VEHICLE
// ============================================================

function renderVehicle(vehicle) {

    console.log(
        "Rendering vehicle:",
        vehicle
    );


    // --------------------------------------------------------
    // Hero
    // --------------------------------------------------------

    const vehicleName =
        document.getElementById("vehicleName");

    const vehicleRegistration =
        document.getElementById(
            "vehicleRegistration"
        );

    const vehicleYear =
        document.getElementById("vehicleYear");

    const vehicleFuel =
        document.getElementById("vehicleFuel");

    const vehicleType =
        document.getElementById("vehicleType");


    if (vehicleName) {

        vehicleName.textContent =
            `${vehicle.brand} ${vehicle.model}`;
    }


    if (vehicleRegistration) {

        vehicleRegistration.textContent =
            vehicle.registration_number;
    }


    if (vehicleYear) {
        vehicleYear.textContent =
            vehicle.year;
    }


    if (vehicleFuel) {
        vehicleFuel.textContent =
            vehicle.fuel_type;
    }


    if (vehicleType) {
        vehicleType.textContent =
            vehicle.vehicle_type;
    }


    // --------------------------------------------------------
    // Vehicle Information
    // --------------------------------------------------------

    const infoType =
        document.getElementById("infoType");

    const infoBrand =
        document.getElementById("infoBrand");

    const infoModel =
        document.getElementById("infoModel");

    const infoYear =
        document.getElementById("infoYear");

    const infoRegistration =
        document.getElementById(
            "infoRegistration"
        );

    const infoFuel =
        document.getElementById("infoFuel");


    if (infoType) {
        infoType.textContent =
            vehicle.vehicle_type;
    }

    if (infoBrand) {
        infoBrand.textContent =
            vehicle.brand;
    }

    if (infoModel) {
        infoModel.textContent =
            vehicle.model;
    }

    if (infoYear) {
        infoYear.textContent =
            vehicle.year;
    }

    if (infoRegistration) {
        infoRegistration.textContent =
            vehicle.registration_number;
    }

    if (infoFuel) {
        infoFuel.textContent =
            vehicle.fuel_type;
    }


    // --------------------------------------------------------
    // Image
    // --------------------------------------------------------

    setVehicleImage(vehicle);


    // --------------------------------------------------------
    // Mileage & Service
    // --------------------------------------------------------

    updateServiceData(vehicle);


    // --------------------------------------------------------
    // Insurance
    // --------------------------------------------------------

    updateInsurance(vehicle);


    // --------------------------------------------------------
    // Health
    // --------------------------------------------------------

    updateHealthDisplay();
}


// ============================================================
// LOAD VEHICLE FROM BACKEND
// ============================================================

async function loadVehicle() {

    const token =
        getAccessToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    const vehicleId =
        getSelectedVehicleId();


    if (!vehicleId) {

        alert(
            "Vehicle select nahi kiya gaya."
        );

        window.location.href =
            "vehicles.html";

        return;
    }


    console.log(
        "Loading vehicle ID:",
        vehicleId
    );


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/vehicles/${vehicleId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        // ----------------------------------------------------
        // Unauthorized
        // ----------------------------------------------------

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            redirectToLogin();

            return;
        }


        // ----------------------------------------------------
        // Not found / error
        // ----------------------------------------------------

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Vehicle Details API Error:",
                response.status,
                errorText
            );


            alert(
                "Vehicle details load nahi ho paaye."
            );


            window.location.href =
                "vehicles.html";

            return;
        }


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        const vehicle =
            await response.json();


        console.log(
            "Vehicle Details API Response:",
            vehicle
        );


        renderVehicle(vehicle);


    } catch (error) {

        console.error(
            "Vehicle Details Connection Error:",
            error
        );


        alert(
            "Backend server se connection nahi ho paya."
        );
    }
}


// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutBtn) return;


    logoutBtn.addEventListener(
        "click",
        () => {

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


            redirectToLogin();
        }
    );
}


// ============================================================
// MOBILE MENU
// ============================================================

function setupMobileMenu() {

    const menuBtn =
        document.getElementById(
            "menuBtn"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    if (!menuBtn || !sidebar) {
        return;
    }


    menuBtn.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );
        }
    );
}


// ============================================================
// USER INFO
// ============================================================

function loadUserInfo() {

    let user = null;


    try {

        user =
            JSON.parse(
                localStorage.getItem(
                    "aiVehicleUser"
                )
            );

    } catch (error) {

        user = null;
    }


    if (!user) return;


    const name =
        user.name ||
        "Vehicle Owner";


    const initials =
        name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(
                word =>
                    word
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");


    const avatar =
        document.querySelector(
            ".topbar-user .user-avatar"
        );


    if (avatar) {

        avatar.textContent =
            initials || "U";
    }


    const userName =
        document.querySelector(
            ".topbar-user .user-info strong"
        );


    if (userName) {

        userName.textContent =
            name;
    }
}


// ============================================================
// INIT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "AI Vehicle Service - Vehicle Details loaded"
        );


        const token =
            getAccessToken();


        if (!token) {

            redirectToLogin();

            return;
        }


        setupLogout();

        setupMobileMenu();

        loadUserInfo();

        await loadVehicle();

    }
);