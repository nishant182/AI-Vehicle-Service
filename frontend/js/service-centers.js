// ==========================================
// AI Vehicle Service - Service Centers JS
// Backend Connected Version
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // API CONFIG
    // ==========================================

    const API_BASE_URL = "http://127.0.0.1:8000";

    // ==========================================
    // AUTH
    // ==========================================

    function getAccessToken() {
        return (
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken")
        );
    }

    const token = getAccessToken();
    const user = localStorage.getItem("aiVehicleUser");

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }

    // ==========================================
    // ELEMENTS
    // ==========================================

    const searchInput = document.getElementById("searchInput");
    const serviceFilter = document.getElementById("serviceFilter");
    const ratingFilter = document.getElementById("ratingFilter");
    const sortSelect = document.getElementById("sortSelect");

    const centerGrid = document.getElementById("serviceCenterGrid");
    const resultCount = document.getElementById("resultCount");
    const emptyState = document.getElementById("emptyState");

    const locationBtn = document.getElementById("locationBtn");

    // ==========================================
    // SERVICE CENTER DATA
    // ==========================================

    let serviceCenters = [];

    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ==========================================
    // NORMALIZE BACKEND DATA
    // ==========================================

    function normalizeCenter(center) {

        return {
            id: center.id,

            name: center.name || "Service Center",

            rating: Number(center.rating ?? 0),

            distance: Number(
                center.distance ??
                center.distance_km ??
                0
            ),

            price: Number(
                center.price ??
                center.starting_price ??
                0
            ),

            phone:
                center.phone ??
                center.contact ??
                "Not available",

            services:
                Array.isArray(center.services)
                    ? center.services
                    : [],

            address:
                center.address || "",

            location:
                center.location || "",

            openingTime:
                center.opening_time || "",

            closingTime:
                center.closing_time || "",

            description:
                center.description || ""
        };
    }

    // ==========================================
    // LOAD SERVICE CENTERS FROM BACKEND
    // ==========================================

    async function loadServiceCenters() {

        try {

            if (centerGrid) {
                centerGrid.innerHTML = `
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <p>Loading service centers...</p>
                    </div>
                `;
            }

            const response = await fetch(
                `${API_BASE_URL}/service-centers`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log(
                "Service Centers API Status:",
                response.status
            );

            if (response.status === 401 || response.status === 403) {

                localStorage.removeItem("accessToken");
                sessionStorage.removeItem("accessToken");
                localStorage.removeItem("aiVehicleUser");

                window.location.href = "login.html";
                return;
            }

            const data = await response.json();

            console.log(
                "Service Centers API Response:",
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Unable to load service centers."
                );
            }

            if (!Array.isArray(data)) {
                throw new Error(
                    "Invalid service center data received from server."
                );
            }

            serviceCenters = data.map(normalizeCenter);

            applyFilters();

        } catch (error) {

            console.error(
                "Service Centers Error:",
                error
            );

            serviceCenters = [];

            if (centerGrid) {
                centerGrid.innerHTML = `
                    <div class="error-state">
                        <h3>Unable to load service centers</h3>
                        <p>
                            Please make sure the FastAPI backend
                            is running and try again.
                        </p>

                        <button
                            type="button"
                            class="btn-primary"
                            onclick="location.reload()"
                        >
                            Retry
                        </button>
                    </div>
                `;
            }

            if (resultCount) {
                resultCount.textContent =
                    "Unable to load Service Centers";
            }

        }
    }

    // ==========================================
    // RENDER SERVICE CENTERS
    // ==========================================

    function renderCenters(data) {

        if (!centerGrid) return;

        centerGrid.innerHTML = "";

        if (resultCount) {

            resultCount.textContent =
                `${data.length} Service Center${data.length !== 1 ? "s" : ""} Found`;
        }

        if (data.length === 0) {

            centerGrid.style.display = "none";

            if (emptyState) {
                emptyState.style.display = "block";
            }

            return;
        }

        centerGrid.style.display = "grid";

        if (emptyState) {
            emptyState.style.display = "none";
        }

        data.forEach(center => {

            const card = document.createElement("div");

            card.className = "service-center-card";

            const rating =
                Number.isFinite(center.rating)
                    ? center.rating.toFixed(1)
                    : "0.0";

            const distance =
                Number.isFinite(center.distance)
                    ? center.distance.toFixed(1)
                    : "0.0";

            const price =
                Number.isFinite(center.price)
                    ? center.price.toLocaleString("en-IN")
                    : "0";

            const phone =
                center.phone || "Not available";

            const services =
                Array.isArray(center.services)
                    ? center.services
                    : [];

            card.innerHTML = `
                <div class="center-image">

                    <div class="open-badge">
                        <span></span>
                        Open Now
                    </div>

                    <div class="center-image-icon">
                        🔧
                    </div>

                </div>

                <div class="center-body">

                    <div class="center-title-row">

                        <h3>
                            ${escapeHTML(center.name)}
                        </h3>

                        <div class="rating">
                            <span>★</span>
                            ${rating}
                        </div>

                    </div>

                    <div class="center-distance">
                        📍 ${distance} km away
                    </div>

                    ${
                        center.address
                            ? `
                                <div class="center-address">
                                    📌 ${escapeHTML(center.address)}
                                </div>
                              `
                            : ""
                    }

                    <div class="center-info">

                        <div>
                            <span class="info-label">
                                Starting from
                            </span>

                            <strong>
                                ₹${price}
                            </strong>
                        </div>

                        <div>
                            <span class="info-label">
                                Contact
                            </span>

                            <strong>
                                ${escapeHTML(phone)}
                            </strong>
                        </div>

                    </div>

                    <div class="service-tags">

                        ${
                            services.length
                                ? services.map(service => `
                                    <span class="service-tag">
                                        ${escapeHTML(service)}
                                    </span>
                                `).join("")
                                : `
                                    <span class="service-tag">
                                        General Service
                                    </span>
                                  `
                        }

                    </div>

                    ${
                        center.description
                            ? `
                                <p class="center-description">
                                    ${escapeHTML(center.description)}
                                </p>
                              `
                            : ""
                    }

                    <div class="center-footer">

                        <a
                            class="call-btn"
                            href="tel:${escapeHTML(phone)}"
                        >
                            📞 Call
                        </a>

                        <button
                            type="button"
                            class="book-center-btn"
                            onclick="bookCenter(
                                '${escapeHTML(center.name)}',
                                '${center.id}'
                            )"
                        >
                            Book Service
                        </button>

                    </div>

                </div>
            `;

            centerGrid.appendChild(card);
        });
    }

    // ==========================================
    // APPLY FILTERS
    // ==========================================

    function applyFilters() {

        const searchValue =
            searchInput
                ? searchInput.value.trim().toLowerCase()
                : "";

        const selectedService =
            serviceFilter
                ? serviceFilter.value
                : "all";

        const selectedRating =
            ratingFilter
                ? ratingFilter.value
                : "all";

        const sortValue =
            sortSelect
                ? sortSelect.value
                : "rating";

        let filtered = serviceCenters.filter(center => {

            // ----------------------------------
            // SEARCH
            // ----------------------------------

            const matchesSearch =
                !searchValue ||
                center.name
                    .toLowerCase()
                    .includes(searchValue) ||

                center.services.some(service =>
                    String(service)
                        .toLowerCase()
                        .includes(searchValue)
                );

            // ----------------------------------
            // SERVICE FILTER
            // ----------------------------------

            const matchesService =
                selectedService === "all" ||
                center.services.includes(selectedService);

            // ----------------------------------
            // RATING FILTER
            // ----------------------------------

            let matchesRating = true;

            if (selectedRating !== "all") {

                const minimumRating =
                    parseFloat(selectedRating);

                matchesRating =
                    center.rating >= minimumRating;
            }

            return (
                matchesSearch &&
                matchesService &&
                matchesRating
            );
        });

        // ======================================
        // SORT
        // ======================================

        switch (sortValue) {

            case "rating":

                filtered.sort(
                    (a, b) =>
                        b.rating - a.rating
                );

                break;

            case "price-low":

                filtered.sort(
                    (a, b) =>
                        a.price - b.price
                );

                break;

            case "price-high":

                filtered.sort(
                    (a, b) =>
                        b.price - a.price
                );

                break;

            case "name":

                filtered.sort(
                    (a, b) =>
                        a.name.localeCompare(b.name)
                );

                break;

            case "distance":

                filtered.sort(
                    (a, b) =>
                        a.distance - b.distance
                );

                break;

            default:
                break;
        }

        renderCenters(filtered);
    }

    // ==========================================
    // SEARCH
    // ==========================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );
    }

    // ==========================================
    // SERVICE FILTER
    // ==========================================

    if (serviceFilter) {

        serviceFilter.addEventListener(
            "change",
            applyFilters
        );
    }

    // ==========================================
    // RATING FILTER
    // ==========================================

    if (ratingFilter) {

        ratingFilter.addEventListener(
            "change",
            applyFilters
        );
    }

    // ==========================================
    // SORT
    // ==========================================

    if (sortSelect) {

        sortSelect.addEventListener(
            "change",
            applyFilters
        );
    }

    // ==========================================
    // RESET FILTERS
    // ==========================================

    window.resetFilters = function () {

        if (searchInput) {
            searchInput.value = "";
        }

        if (serviceFilter) {
            serviceFilter.value = "all";
        }

        if (ratingFilter) {
            ratingFilter.value = "all";
        }

        if (sortSelect) {
            sortSelect.value = "rating";
        }

        applyFilters();
    };

    // ==========================================
    // BOOK SERVICE CENTER
    // ==========================================

    window.bookCenter = function (
        centerName,
        centerId
    ) {

        const params =
            new URLSearchParams();

        params.set(
            "center",
            centerName
        );

        if (centerId) {
            params.set(
                "center_id",
                centerId
            );
        }

        window.location.href =
            `booking.html?${params.toString()}`;
    };

    // ==========================================
    // USE MY LOCATION
    // ==========================================

    if (locationBtn) {

        locationBtn.addEventListener(
            "click",
            () => {

                if (!navigator.geolocation) {

                    alert(
                        "Location service is not supported by your browser."
                    );

                    return;
                }

                locationBtn.disabled = true;

                locationBtn.textContent =
                    "📍 Getting Location...";

                navigator.geolocation.getCurrentPosition(

                    position => {

                        console.log(
                            "User Location:",
                            position.coords.latitude,
                            position.coords.longitude
                        );

                        locationBtn.disabled = false;

                        locationBtn.textContent =
                            "📍 Location Enabled";

                        alert(
                            "Location permission granted.\n\n" +
                            "Service-center GPS distance calculation " +
                            "will be connected in the next step."
                        );
                    },

                    error => {

                        console.warn(
                            "Location Error:",
                            error
                        );

                        locationBtn.disabled = false;

                        locationBtn.textContent =
                            "📍 Use My Location";

                        alert(
                            "Location permission was not granted."
                        );
                    },

                    {
                        enableHighAccuracy: false,
                        timeout: 10000,
                        maximumAge: 300000
                    }
                );
            }
        );
    }

    // ==========================================
    // SIDEBAR TOGGLE
    // ==========================================

    const sidebar =
        document.querySelector(".sidebar");

    const menuToggle =
        document.querySelector(".menu-toggle");

    if (menuToggle && sidebar) {

        menuToggle.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle("open");
            }
        );
    }

    // ==========================================
    // LOGOUT
    // ==========================================

    window.logout = function () {

        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");

        localStorage.removeItem("aiVehicleUser");
        localStorage.removeItem("rememberLogin");

        window.location.href =
            "login.html";
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    loadServiceCenters();

});