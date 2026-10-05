// ============================================================
// AI VEHICLE SERVICE - MY VEHICLES
// Backend API Connected Version
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
        return JSON.parse(localStorage.getItem("aiVehicleUser")) || null;
    } catch (error) {
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
        return dateValue;
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

    if (value === null || value === undefined || value === "") {
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

    // Already complete URL
    if (
        vehicleImage.startsWith("http://") ||
        vehicleImage.startsWith("https://")
    ) {
        return vehicleImage;
    }

    // Backend relative path
    return `${API_BASE_URL}${vehicleImage}`;
}


// ============================================================
// VEHICLE HEALTH
// ============================================================
// Backend currently does not return a health score.
// So we use a neutral display until Vehicle Health API
// is connected.

// This does NOT invent a vehicle health score.

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

    const imageUrl = getVehicleImageUrl(vehicle.vehicle_image);

    let imageContent = "";

    if (imageUrl) {

        imageContent = `
            <img
                src="${imageUrl}"
                alt="${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}"
                class="vehicle-photo"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
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
                ● ${health.status}
            </span>

        </div>


        <div class="vehicle-card-body">

            <div class="vehicle-title-row">

                <div>

                    <span class="vehicle-type">
                        ${escapeHtml(vehicle.vehicle_type)}
                        •
                        ${escapeHtml(vehicle.fuel_type)}
                    </span>

                    <h3>
                        ${escapeHtml(vehicle.brand)}
                        ${escapeHtml(vehicle.model)}
                    </h3>

                </div>

                <button
                    class="more-btn"
                    title="Delete vehicle"
                    data-delete-id="${vehicle.id}">
                    ⋮
                </button>

            </div>


            <div class="registration-number">
                ${escapeHtml(vehicle.registration_number)}
            </div>


            <div class="vehicle-health-box ${health.className === "warning" ? "warning-health" : ""}">

                <div>

                    <span>Vehicle Health</span>

                    <strong>
                        ${health.score !== null ? `${health.score}/100` : "—"}
                    </strong>

                </div>

                <div class="mini-health-bar ${health.className === "warning" ? "warning-bar" : ""}">

                    <span
                        style="width:${health.score !== null ? health.score : 0}%">
                    </span>

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
                        ${vehicle.last_service_km !== null &&
                          vehicle.last_service_km !== undefined
                            ? formatMileage(vehicle.last_service_km)
                            : "Not available"}
                    </strong>

                </div>


                <div>

                    <span>Model Year</span>

                    <strong>
                        ${vehicle.year}
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
                    data-details-id="${vehicle.id}">
                    View Details
                </button>


                <button
                    class="health-btn"
                    data-health-id="${vehicle.id}">
                    Health Report
                </button>

            </div>

        </div>

    `;


    // View Details
    const detailsBtn = card.querySelector("[data-details-id]");

    if (detailsBtn) {

        detailsBtn.addEventListener("click", () => {

            localStorage.setItem(
                "selectedVehicleId",
                vehicle.id
            );

            window.location.href = "vehicle-details.html";
        });
    }


    // Health Report
    const healthBtn = card.querySelector("[data-health-id]");

    if (healthBtn) {

        healthBtn.addEventListener("click", () => {

            localStorage.setItem(
                "selectedVehicleId",
                vehicle.id
            );

            window.location.href = "vehicle-health.html";
        });
    }


    // Delete
    const deleteBtn = card.querySelector("[data-delete-id]");

    if (deleteBtn) {

        deleteBtn.addEventListener("click", () => {

            const confirmed = confirm(
                `Delete ${vehicle.brand} ${vehicle.model}?\n\nThis action cannot be undone.`
            );

            if (!confirmed) return;

            deleteVehicle(vehicle.id);
        });
    }


    return card;
}


// ============================================================
// ESCAPE HTML
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
// RENDER VEHICLES
// ============================================================

function renderVehicles(vehicles) {

    const grid = document.querySelector(".vehicles-grid");

    if (!grid) {
        console.error("Vehicle grid not found.");
        return;
    }


    // Remove existing hardcoded vehicle cards
    grid.querySelectorAll(".vehicle-card").forEach(card => {
        card.remove();
    });


    // Add Vehicle card already exists.
    // We keep it at the end.

    const addVehicleCard =
        grid.querySelector(".add-vehicle-card");


    // Empty state
    if (!vehicles || vehicles.length === 0) {

        const emptyCard = document.createElement("div");

        emptyCard.className = "vehicle-card";

        emptyCard.innerHTML = `

            <div class="vehicle-card-body"
                 style="text-align:center; padding:50px 25px;">

                <div style="font-size:48px; margin-bottom:15px;">
                    🚘
                </div>

                <h3>No Vehicles Added</h3>

                <p style="margin:12px 0 22px;">
                    Add your first vehicle to start managing
                    its health and maintenance.
                </p>

                <button
                    class="health-btn"
                    onclick="location.href='add-vehicle.html'">
                    + Add Vehicle
                </button>

            </div>

        `;

        if (addVehicleCard) {
            grid.insertBefore(emptyCard, addVehicleCard);
        } else {
            grid.appendChild(emptyCard);
        }

        updateVehicleStats([]);

        return;
    }


    // Render real vehicles
    vehicles.forEach(vehicle => {

        const card = createVehicleCard(vehicle);

        if (addVehicleCard) {
            grid.insertBefore(card, addVehicleCard);
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
        document.querySelectorAll(".vehicle-summary-card");

    if (!summaryCards.length) return;


    // Total vehicles
    const totalVehicles =
        summaryCards[0]?.querySelector("strong");

    if (totalVehicles) {
        totalVehicles.textContent = vehicles.length;
    }


    // Backend vehicle API currently does not provide
    // health status. Keep these values neutral.

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

        console.log("Loading vehicles...");


        const response = await fetch(
            `${API_BASE_URL}/vehicles`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );


        // Unauthorized
        if (response.status === 401 ||
            response.status === 403) {

            console.warn(
                "Session expired or unauthorized."
            );

            redirectToLogin();

            return;
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Vehicles API Error:",
                response.status,
                errorText
            );

            showVehicleError(
                "Unable to load vehicles. Please try again."
            );

            return;
        }


        const vehicles =
            await response.json();


        console.log(
            "Vehicles API Response:",
            vehicles
        );


        renderVehicles(vehicles);

    } catch (error) {

        console.error(
            "Vehicle API connection error:",
            error
        );

        showVehicleError(
            "Backend server is not reachable. Please make sure FastAPI is running."
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

        const response = await fetch(
            `${API_BASE_URL}/vehicles/${vehicleId}`,
            {
                method: "DELETE",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        if (response.status === 401 ||
            response.status === 403) {

            redirectToLogin();

            return;
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Delete Vehicle Error:",
                response.status,
                errorText
            );

            alert(
                "Vehicle delete nahi ho paya."
            );

            return;
        }


        console.log(
            "Vehicle deleted successfully:",
            vehicleId
        );


        // Reload vehicles after deletion
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
        document.querySelector(".vehicles-grid");

    if (!grid) return;


    const existingError =
        document.querySelector(".vehicle-api-error");

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
        <strong>Vehicle Loading Error</strong>
        <br>
        <span>${escapeHtml(message)}</span>
    `;


    const addVehicleCard =
        grid.querySelector(".add-vehicle-card");


    if (addVehicleCard) {
        grid.insertBefore(
            errorBox,
            addVehicleCard
        );
    } else {
        grid.appendChild(errorBox);
    }
}


// ============================================================
// USER INFO
// ============================================================

function loadUserInfo() {

    const user = getCurrentUser();

    if (!user) return;


    // Sidebar name
    const sidebarName =
        document.querySelector(".sidebar-user .user-info strong");

    if (sidebarName && user.name) {
        sidebarName.textContent = user.name;
    }


    // Sidebar initials
    const sidebarAvatar =
        document.querySelector(".sidebar-user .user-avatar");

    // Topbar name
    const topbarName =
        document.querySelector(".topbar-profile strong");

    if (topbarName && user.name) {
        topbarName.textContent = user.name;
    }


    // Topbar avatar
    const topbarAvatar =
        document.querySelector(".topbar-avatar");


    const name =
        user.name || "Vehicle Owner";


    const initials =
        name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(word => word.charAt(0).toUpperCase())
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


        const token = getAccessToken();

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