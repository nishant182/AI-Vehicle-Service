// ============================================================
// AI VEHICLE SERVICE - MY VEHICLES
// Production Backend Connected Version
// ============================================================

const API_BASE_URL = "https://ai-vehicle-service.onrender.com";


// ============================================================
// AUTH HELPERS
// ============================================================

function getAccessToken() {
    return (
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken")
    );
}


function getCurrentUser() {
    try {
        return JSON.parse(
            localStorage.getItem("aiVehicleUser")
        ) || null;
    } catch (error) {
        console.error("User data parse error:", error);
        return null;
    }
}


function redirectToLogin() {
    window.location.href = "login.html";
}


// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {

    const logoutBtn = document.getElementById("logoutBtn");

    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", () => {

        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");

        localStorage.removeItem("aiVehicleUser");
        localStorage.removeItem("rememberLogin");

        redirectToLogin();
    });
}


// ============================================================
// MOBILE SIDEBAR
// ============================================================

function setupMobileSidebar() {

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");

    if (!menuToggle || !sidebar) return;

    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "Not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// ============================================================
// NUMBER FORMAT
// ============================================================

function formatMileage(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "0 km";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return `${value} km`;
    }

    return `${number.toLocaleString("en-IN")} km`;
}


// ============================================================
// IMAGE URL
// ============================================================

function getVehicleImageUrl(vehicleImage) {

    if (!vehicleImage) {
        return null;
    }

    const image = String(vehicleImage).trim();

    if (!image) {
        return null;
    }

    // Full URL
    if (
        image.startsWith("http://") ||
        image.startsWith("https://")
    ) {
        return image;
    }

    // Backend relative path
    if (image.startsWith("/")) {
        return `${API_BASE_URL}${image}`;
    }

    return `${API_BASE_URL}/${image}`;
}


// ============================================================
// VEHICLE HEALTH
// ============================================================

function getHealthInfo(vehicle) {

    return {
        status: "Health data unavailable",
        className: "warning",
        score: null
    };
}


// ============================================================
// CREATE VEHICLE CARD
// ============================================================

function createVehicleCard(vehicle) {

    const card = document.createElement("div");

    card.className = "vehicle-card";

    const health = getHealthInfo(vehicle);

    const imageUrl = getVehicleImageUrl(
        vehicle.vehicle_image
    );

    let imageContent = "";

    if (imageUrl) {

        imageContent = `
            <img
                src="${escapeHtml(imageUrl)}"
                alt="${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}"
                class="vehicle-photo"
                onerror="
                    this.style.display='none';
                    if (this.nextElementSibling) {
                        this.nextElementSibling.style.display='flex';
                    }
                "
            >

            <div
                class="vehicle-photo-placeholder"
                style="display:none;"
            >
                🚗
            </div>
        `;

    } else {

        imageContent = `
            <div class="vehicle-photo-placeholder">
                🚗
            </div>
        `;
    }


    card.innerHTML = `

        <div class="vehicle-card-image">

            ${imageContent}

            <span class="vehicle-status ${health.className}">
                ● ${escapeHtml(health.status)}
            </span>

        </div>


        <div class="vehicle-card-body">

            <div class="vehicle-title-row">

                <div>

                    <span class="vehicle-type">
                        ${escapeHtml(vehicle.vehicle_type || "Vehicle")}
                        •
                        ${escapeHtml(vehicle.fuel_type || "N/A")}
                    </span>

                    <h3>
                        ${escapeHtml(vehicle.brand || "")}
                        ${escapeHtml(vehicle.model || "")}
                    </h3>

                </div>

                <button
                    class="more-btn"
                    title="Delete vehicle"
                    data-delete-id="${escapeHtml(vehicle.id)}">
                    ⋮
                </button>

            </div>


            <div class="registration-number">
                ${escapeHtml(vehicle.registration_number || "N/A")}
            </div>


            <div class="vehicle-health-box ${health.className === "warning" ? "warning-health" : ""}">

                <div>

                    <span>Vehicle Health</span>

                    <strong>
                        ${
                            health.score !== null
                                ? `${health.score}/100`
                                : "—"
                        }
                    </strong>

                </div>

                <div
                    class="mini-health-bar ${
                        health.className === "warning"
                            ? "warning-bar"
                            : ""
                    }"
                >

                    <span
                        style="width:${
                            health.score !== null
                                ? health.score
                                : 0
                        }%"
                    ></span>

                </div>

            </div>


            <div class="vehicle-data">

                <div>

                    <span>Current Mileage</span>

                    <strong>
                        ${formatMileage(vehicle.current_mileage)}
                    </strong>

                </div>


                <div>

                    <span>Last Service</span>

                    <strong>
                        ${
                            vehicle.last_service_km !== null &&
                            vehicle.last_service_km !== undefined
                                ? formatMileage(
                                    vehicle.last_service_km
                                )
                                : "Not available"
                        }
                    </strong>

                </div>


                <div>

                    <span>Model Year</span>

                    <strong>
                        ${escapeHtml(vehicle.year || "N/A")}
                    </strong>

                </div>


                <div>

                    <span>Last Service Date</span>

                    <strong>
                        ${formatDate(vehicle.last_service_date)}
                    </strong>

                </div>

            </div>


            <div class="vehicle-card-actions">

                <button
                    class="outline-btn"
                    data-details-id="${escapeHtml(vehicle.id)}"
                >
                    View Details
                </button>


                <button
                    class="health-btn"
                    data-health-id="${escapeHtml(vehicle.id)}"
                >
                    Health Report
                </button>

            </div>

        </div>

    `;


    // ========================================================
    // VIEW DETAILS
    // ========================================================

    const detailsBtn =
        card.querySelector("[data-details-id]");

    if (detailsBtn) {

        detailsBtn.addEventListener("click", () => {

            localStorage.setItem(
                "selectedVehicleId",
                vehicle.id
            );

            window.location.href =
                "vehicle-details.html";
        });
    }


    // ========================================================
    // HEALTH REPORT
    // ========================================================

    const healthBtn =
        card.querySelector("[data-health-id]");

    if (healthBtn) {

        healthBtn.addEventListener("click", () => {

            localStorage.setItem(
                "selectedVehicleId",
                vehicle.id
            );

            window.location.href =
                "vehicle-health.html";
        });
    }


    // ========================================================
    // DELETE VEHICLE
    // ========================================================

    const deleteBtn =
        card.querySelector("[data-delete-id]");

    if (deleteBtn) {

        deleteBtn.addEventListener("click", async () => {

            const confirmed = confirm(
                `Delete ${vehicle.brand || "vehicle"} ${
                    vehicle.model || ""
                }?\n\nThis action cannot be undone.`
            );

            if (!confirmed) return;

            await deleteVehicle(vehicle.id);
        });
    }


    return card;
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
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
// RENDER VEHICLES
// ============================================================

function renderVehicles(vehicles) {

    const grid =
        document.querySelector(".vehicles-grid");

    if (!grid) {

        console.error(
            "Vehicle grid not found."
        );

        return;
    }


    // Remove previous dynamic cards
    grid.querySelectorAll(
        ".vehicle-card:not(.add-vehicle-card)"
    ).forEach(card => {
        card.remove();
    });


    const addVehicleCard =
        grid.querySelector(".add-vehicle-card");


    // ========================================================
    // EMPTY STATE
    // ========================================================

    if (
        !Array.isArray(vehicles) ||
        vehicles.length === 0
    ) {

        const emptyCard =
            document.createElement("div");

        emptyCard.className =
            "vehicle-card vehicle-empty-card";

        emptyCard.innerHTML = `

            <div
                class="vehicle-card-body"
                style="
                    text-align:center;
                    padding:50px 25px;
                "
            >

                <div
                    style="
                        font-size:48px;
                        margin-bottom:15px;
                    "
                >
                    🚘
                </div>

                <h3>No Vehicles Added</h3>

                <p
                    style="
                        margin:12px 0 22px;
                    "
                >
                    Add your first vehicle to start
                    managing its health and maintenance.
                </p>

                <button
                    class="health-btn"
                    onclick="location.href='add-vehicle.html'"
                >
                    + Add Vehicle
                </button>

            </div>

        `;


        if (addVehicleCard) {

            grid.insertBefore(
                emptyCard,
                addVehicleCard
            );

        } else {

            grid.appendChild(emptyCard);
        }


        updateVehicleStats([]);

        return;
    }


    // ========================================================
    // RENDER REAL VEHICLES
    // ========================================================

    vehicles.forEach(vehicle => {

        const card =
            createVehicleCard(vehicle);

        if (addVehicleCard) {

            grid.insertBefore(
                card,
                addVehicleCard
            );

        } else {

            grid.appendChild(card);
        }
    });


    updateVehicleStats(vehicles);
}


// ============================================================
// UPDATE VEHICLE STATS
// ============================================================

function updateVehicleStats(vehicles) {

    const summaryCards =
        document.querySelectorAll(
            ".vehicle-summary-card"
        );

    if (!summaryCards.length) {
        return;
    }


    // Total vehicles
    const totalVehicles =
        summaryCards[0]?.querySelector("strong");

    if (totalVehicles) {

        totalVehicles.textContent =
            vehicles.length;
    }


    // Health information not currently returned
    // by backend vehicle API.

    const healthyVehicles =
        summaryCards[1]?.querySelector("strong");

    if (healthyVehicles) {

        healthyVehicles.textContent = "—";
    }


    const attentionVehicles =
        summaryCards[2]?.querySelector("strong");

    if (attentionVehicles) {

        attentionVehicles.textContent = "—";
    }
}


// ============================================================
// FETCH VEHICLES FROM BACKEND
// ============================================================

async function loadVehicles() {

    const token = getAccessToken();

    if (!token) {

        redirectToLogin();

        return;
    }


    try {

        console.log(
            "Loading vehicles from:",
            `${API_BASE_URL}/vehicles`
        );


        const response =
            await fetch(
                `${API_BASE_URL}/vehicles`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,
                        "Accept":
                            "application/json"
                    }
                }
            );


        console.log(
            "Vehicles API status:",
            response.status
        );


        // ====================================================
        // UNAUTHORIZED
        // ====================================================

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            console.warn(
                "Session expired or unauthorized."
            );

            localStorage.removeItem("accessToken");
            sessionStorage.removeItem("accessToken");
            localStorage.removeItem("aiVehicleUser");

            redirectToLogin();

            return;
        }


        // ====================================================
        // SERVER ERROR
        // ====================================================

        if (!response.ok) {

            let errorMessage =
                "Unable to load vehicles.";

            try {

                const errorData =
                    await response.json();

                errorMessage =
                    errorData.detail ||
                    errorData.message ||
                    errorMessage;

            } catch (jsonError) {

                console.warn(
                    "Could not parse API error response."
                );
            }


            console.error(
                "Vehicles API Error:",
                response.status,
                errorMessage
            );


            showVehicleError(
                `${errorMessage} (HTTP ${response.status})`
            );

            return;
        }


        // ====================================================
        // SUCCESS
        // ====================================================

        const vehicles =
            await response.json();


        console.log(
            "Vehicles API Response:",
            vehicles
        );


        // Backend should return an array.
        if (!Array.isArray(vehicles)) {

            console.error(
                "Unexpected vehicles response:",
                vehicles
            );

            showVehicleError(
                "Invalid response received from backend."
            );

            return;
        }


        renderVehicles(vehicles);

    } catch (error) {

        console.error(
            "Vehicle API connection error:",
            error
        );


        showVehicleError(
            "Unable to connect to the backend. Please check your internet connection or try again."
        );
    }
}


// ============================================================
// DELETE VEHICLE
// ============================================================

async function deleteVehicle(vehicleId) {

    const token = getAccessToken();

    if (!token) {

        redirectToLogin();

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/vehicles/${vehicleId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,
                        "Accept":
                            "application/json"
                    }
                }
            );


        // Unauthorized
        if (
            response.status === 401 ||
            response.status === 403
        ) {

            localStorage.removeItem("accessToken");
            sessionStorage.removeItem("accessToken");
            localStorage.removeItem("aiVehicleUser");

            redirectToLogin();

            return;
        }


        // Delete failed
        if (!response.ok) {

            let errorMessage =
                "Vehicle delete nahi ho paya.";

            try {

                const errorData =
                    await response.json();

                errorMessage =
                    errorData.detail ||
                    errorData.message ||
                    errorMessage;

            } catch (error) {
                console.warn(
                    "Delete error response parse failed."
                );
            }


            console.error(
                "Delete Vehicle Error:",
                response.status,
                errorMessage
            );


            alert(errorMessage);

            return;
        }


        console.log(
            "Vehicle deleted successfully:",
            vehicleId
        );


        // Reload list
        await loadVehicles();

    } catch (error) {

        console.error(
            "Delete Vehicle API Error:",
            error
        );

        alert(
            "Backend server se connection nahi ho paya."
        );
    }
}


// ============================================================
// ERROR MESSAGE
// ============================================================

function showVehicleError(message) {

    const grid =
        document.querySelector(
            ".vehicles-grid"
        );

    if (!grid) return;


    // Remove previous error
    const existingError =
        grid.querySelector(
            ".vehicle-api-error"
        );

    if (existingError) {
        existingError.remove();
    }


    const errorBox =
        document.createElement("div");

    errorBox.className =
        "vehicle-api-error";


    errorBox.style.cssText = `
        grid-column: 1 / -1;
        padding: 25px;
        border-radius: 14px;
        border: 1px solid rgba(255, 80, 80, 0.35);
        background: rgba(120, 20, 20, 0.18);
        color: #ffb4b4;
        text-align: center;
        margin-bottom: 20px;
    `;


    errorBox.innerHTML = `

        <strong>
            Vehicle Loading Error
        </strong>

        <br>

        <span>
            ${escapeHtml(message)}
        </span>

        <br><br>

        <button
            type="button"
            class="health-btn"
            id="retryVehiclesBtn"
        >
            Retry
        </button>

    `;


    const addVehicleCard =
        grid.querySelector(
            ".add-vehicle-card"
        );


    if (addVehicleCard) {

        grid.insertBefore(
            errorBox,
            addVehicleCard
        );

    } else {

        grid.appendChild(
            errorBox
        );
    }


    // Retry button
    const retryBtn =
        errorBox.querySelector(
            "#retryVehiclesBtn"
        );

    if (retryBtn) {

        retryBtn.addEventListener(
            "click",
            async () => {

                errorBox.remove();

                await loadVehicles();
            }
        );
    }
}


// ============================================================
// USER INFO
// ============================================================

function loadUserInfo() {

    const user =
        getCurrentUser();

    if (!user) return;


    // Sidebar name
    const sidebarName =
        document.querySelector(
            ".sidebar-user .user-info strong"
        );

    if (
        sidebarName &&
        user.name
    ) {

        sidebarName.textContent =
            user.name;
    }


    // Sidebar avatar
    const sidebarAvatar =
        document.querySelector(
            ".sidebar-user .user-avatar"
        );


    // Topbar name
    const topbarName =
        document.querySelector(
            ".topbar-profile strong"
        );

    if (
        topbarName &&
        user.name
    ) {

        topbarName.textContent =
            user.name;
    }


    // Topbar avatar
    const topbarAvatar =
        document.querySelector(
            ".topbar-avatar"
        );


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


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            initials || "U";
    }


    if (topbarAvatar) {

        topbarAvatar.textContent =
            initials || "U";
    }
}


// ============================================================
// PAGE INIT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "AI Vehicle Service - My Vehicles loaded"
        );


        const token =
            getAccessToken();


        if (!token) {

            redirectToLogin();

            return;
        }


        setupLogout();

        setupMobileSidebar();

        loadUserInfo();

        await loadVehicles();
    }
);