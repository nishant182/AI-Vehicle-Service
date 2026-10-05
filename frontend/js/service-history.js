/* =========================================================
   SERVICE HISTORY
   AI Vehicle Service
   Backend Connected Version
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const API_BASE_URL = "https://ai-vehicle-service.onrender.com";

    /* =====================================================
       AUTH
       ===================================================== */

    const user = JSON.parse(
        localStorage.getItem("aiVehicleUser") || "null"
    );

    const accessToken =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

    if (!user || !user.loggedIn || !accessToken) {
        window.location.href = "login.html";
        return;
    }

    /* =====================================================
       ELEMENTS
       ===================================================== */

    const serviceList =
        document.getElementById("serviceHistoryList");

    const emptyState =
        document.getElementById("serviceEmptyState");

    const vehicleFilter =
        document.getElementById("vehicleFilter");

    const searchInput =
        document.getElementById("serviceSearch");

    const serviceTypeFilter =
        document.getElementById("serviceTypeFilter");

    const sortSelect =
        document.getElementById("serviceSort");

    const resultCount =
        document.getElementById("serviceResultCount");

    const clearFiltersBtn =
        document.getElementById("clearServiceFilters");

    const totalServices =
        document.getElementById("totalServices");

    const yearServices =
        document.getElementById("yearServices");

    const totalSpent =
        document.getElementById("totalSpent");

    const lastServiceDate =
        document.getElementById("lastServiceDate");

    /* =====================================================
       DATA
       ===================================================== */

    let vehicles = [];
    let serviceRecords = [];

    /* =====================================================
       API HELPER
       ===================================================== */

    async function apiRequest(url, options = {}) {

        const response = await fetch(
            `${API_BASE_URL}${url}`,
            {
                ...options,
                headers: {
                    ...(options.headers || {}),
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        return {
            response,
            data
        };
    }

    /* =====================================================
       LOAD VEHICLES
       ===================================================== */

    async function loadVehicles() {

        try {

            const {
                response,
                data
            } = await apiRequest("/vehicles");

            console.log(
                "Service History Vehicles API Status:",
                response.status
            );

            console.log(
                "Service History Vehicles API Response:",
                data
            );

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                logout();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    "Failed to load vehicles."
                );
            }

            vehicles =
                Array.isArray(data)
                    ? data
                    : [];

            loadVehicleFilter();

        } catch (error) {

            console.error(
                "Service History Vehicles Error:",
                error
            );

            vehicles = [];

            loadVehicleFilter();
        }
    }

    /* =====================================================
       LOAD SERVICE HISTORY
       ===================================================== */

    async function loadServiceHistory() {

        try {

            const {
                response,
                data
            } = await apiRequest(
                "/service-history"
            );

            console.log(
                "Service History API Status:",
                response.status
            );

            console.log(
                "Service History API Response:",
                data
            );

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                logout();
                return;
            }

            if (!response.ok) {

                throw new Error(
                    data?.detail ||
                    "Failed to load service history."
                );
            }

            serviceRecords =
                Array.isArray(data)
                    ? data.map(normalizeRecord)
                    : [];

            await enrichRecords();

            updateSummary();
            loadVehicleFilter();
            renderRecords();

        } catch (error) {

            console.error(
                "Service History Load Error:",
                error
            );

            serviceRecords = [];

            updateSummary();
            loadVehicleFilter();
            renderRecords();

            showEmptyMessage(
                "Unable to load service history",
                error.message ||
                "Please try again."
            );
        }
    }

    /* =====================================================
       NORMALIZE BACKEND RECORD
       ===================================================== */

    function normalizeRecord(record) {

        return {

            id:
                record.id,

            recordId:
                record.record_id ||
                record.recordId ||
                `SRV-${String(
                    record.id || ""
                ).padStart(6, "0")}`,

            vehicleId:
                record.vehicle_id ||
                record.vehicleId,

            serviceId:
                record.service_id ||
                record.serviceId,

            serviceCenterId:
                record.service_center_id ||
                record.serviceCenterId,

            vehicleName:
                record.vehicle_name ||
                record.vehicleName ||
                "Vehicle",

            registrationNumber:
                record.registration_number ||
                record.registrationNumber ||
                "Not Available",

            service:
                record.service_name ||
                record.service ||
                "Vehicle Service",

            serviceCenter:
                record.service_center_name ||
                record.serviceCenter ||
                "Service Center",

            serviceDate:
                record.service_date ||
                record.serviceDate ||
                record.booking_date ||
                "",

            mileage:
                Number(
                    record.mileage ||
                    record.current_mileage ||
                    0
                ),

            cost:
                Number(
                    record.cost ||
                    record.service_cost ||
                    record.estimated_price ||
                    0
                ),

            status:
                record.status ||
                "Completed",

            notes:
                record.notes ||
                "",

            createdAt:
                record.created_at ||
                record.createdAt ||
                record.service_date ||
                ""
        };
    }

    /* =====================================================
       ENRICH RECORDS
       ===================================================== */

    async function enrichRecords() {

        try {

            const [
                servicesResult,
                centersResult
            ] = await Promise.all([

                apiRequest("/services"),

                apiRequest("/service-centers")
            ]);

            const services =
                Array.isArray(servicesResult.data)
                    ? servicesResult.data
                    : [];

            const centers =
                Array.isArray(centersResult.data)
                    ? centersResult.data
                    : [];

            serviceRecords =
                serviceRecords.map(record => {

                    const vehicle =
                        vehicles.find(
                            item =>
                                Number(item.id) ===
                                Number(record.vehicleId)
                        );

                    const service =
                        services.find(
                            item =>
                                Number(item.id) ===
                                Number(record.serviceId)
                        );

                    const center =
                        centers.find(
                            item =>
                                Number(item.id) ===
                                Number(record.serviceCenterId)
                        );

                    return {

                        ...record,

                        vehicleName:
                            record.vehicleName !== "Vehicle"
                                ? record.vehicleName
                                : vehicle
                                    ? `${vehicle.brand} ${vehicle.model}`
                                    : "Vehicle",

                        registrationNumber:
                            record.registrationNumber !==
                            "Not Available"
                                ? record.registrationNumber
                                : vehicle?.registration_number ||
                                  "Not Available",

                        service:
                            record.service !==
                            "Vehicle Service"
                                ? record.service
                                : service?.name ||
                                  "Vehicle Service",

                        serviceCenter:
                            record.serviceCenter !==
                            "Service Center"
                                ? record.serviceCenter
                                : center?.name ||
                                  "Service Center"
                    };
                });

        } catch (error) {

            console.warn(
                "Service History enrichment failed:",
                error
            );
        }
    }

    /* =====================================================
       VEHICLE FILTER
       ===================================================== */

    function loadVehicleFilter() {

        if (!vehicleFilter) {
            return;
        }

        const currentValue =
            vehicleFilter.value;

        vehicleFilter.innerHTML = `
            <option value="all">
                All Vehicles
            </option>
        `;

        const uniqueVehicles = [];

        vehicles.forEach(vehicle => {

            if (
                uniqueVehicles.some(
                    item =>
                        String(item.id) ===
                        String(vehicle.id)
                )
            ) {
                return;
            }

            uniqueVehicles.push({

                id:
                    vehicle.id,

                name:
                    `${vehicle.brand || ""} ${
                        vehicle.model || ""
                    }`.trim() ||
                    "Vehicle",

                registration:
                    vehicle.registration_number ||
                    ""
            });
        });

        /* Also include vehicles found in history */

        serviceRecords.forEach(record => {

            if (!record.vehicleId) {
                return;
            }

            if (
                uniqueVehicles.some(
                    item =>
                        String(item.id) ===
                        String(record.vehicleId)
                )
            ) {
                return;
            }

            uniqueVehicles.push({

                id:
                    record.vehicleId,

                name:
                    record.vehicleName ||
                    "Vehicle",

                registration:
                    record.registrationNumber ||
                    ""
            });
        });

        uniqueVehicles.forEach(vehicle => {

            const option =
                document.createElement("option");

            option.value =
                String(vehicle.id);

            option.textContent =
                vehicle.registration
                    ? `${vehicle.name} - ${vehicle.registration}`
                    : vehicle.name;

            vehicleFilter.appendChild(
                option
            );
        });

        if (
            currentValue &&
            [...vehicleFilter.options]
                .some(
                    option =>
                        option.value ===
                        currentValue
                )
        ) {
            vehicleFilter.value =
                currentValue;
        }
    }

    /* =====================================================
       FORMAT DATE
       ===================================================== */

    function formatDate(dateString) {

        if (!dateString) {
            return "—";
        }

        const date =
            new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }

    /* =====================================================
       FORMAT CURRENCY
       ===================================================== */

    function formatCurrency(amount) {

        return "₹" +
            Number(amount || 0)
                .toLocaleString("en-IN");
    }

    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =====================================================
       UPDATE SUMMARY
       ===================================================== */

    function updateSummary() {

        const total =
            serviceRecords.length;

        const currentYear =
            new Date().getFullYear();

        const thisYear =
            serviceRecords.filter(record => {

                if (!record.serviceDate) {
                    return false;
                }

                return new Date(
                    record.serviceDate
                ).getFullYear() === currentYear;

            }).length;

        const spent =
            serviceRecords.reduce(
                (sum, record) =>
                    sum +
                    Number(record.cost || 0),
                0
            );

        const sorted =
            [...serviceRecords].sort(
                (a, b) =>
                    new Date(
                        b.serviceDate || 0
                    ) -
                    new Date(
                        a.serviceDate || 0
                    )
            );

        if (totalServices) {
            totalServices.textContent =
                total;
        }

        if (yearServices) {
            yearServices.textContent =
                thisYear;
        }

        if (totalSpent) {
            totalSpent.textContent =
                formatCurrency(spent);
        }

        if (lastServiceDate) {

            lastServiceDate.textContent =
                sorted.length
                    ? formatDate(
                        sorted[0].serviceDate
                    )
                    : "—";
        }
    }

    /* =====================================================
       FILTER + SORT
       ===================================================== */

    function getFilteredRecords() {

        let records =
            [...serviceRecords];

        const search =
            String(
                searchInput?.value || ""
            )
                .trim()
                .toLowerCase();

        const vehicle =
            vehicleFilter?.value ||
            "all";

        const serviceType =
            serviceTypeFilter?.value ||
            "all";

        const sort =
            sortSelect?.value ||
            "newest";

        /* SEARCH */

        if (search) {

            records =
                records.filter(record => {

                    const text = [

                        record.recordId,
                        record.vehicleName,
                        record.registrationNumber,
                        record.service,
                        record.serviceCenter,
                        record.serviceDate,
                        record.notes

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return text.includes(search);
                });
        }

        /* VEHICLE */

        if (vehicle !== "all") {

            records =
                records.filter(record =>
                    String(
                        record.vehicleId
                    ) === String(vehicle)
                );
        }

        /* SERVICE TYPE */

        if (serviceType !== "all") {

            records =
                records.filter(record =>
                    String(
                        record.service || ""
                    ).toLowerCase() ===
                    String(serviceType)
                        .toLowerCase()
                );
        }

        /* SORT */

        records.sort((a, b) => {

            switch (sort) {

                case "oldest":

                    return new Date(
                        a.serviceDate || 0
                    ) -
                    new Date(
                        b.serviceDate || 0
                    );

                case "cost-high":

                    return Number(
                        b.cost || 0
                    ) -
                    Number(
                        a.cost || 0
                    );

                case "cost-low":

                    return Number(
                        a.cost || 0
                    ) -
                    Number(
                        b.cost || 0
                    );

                case "mileage-high":

                    return Number(
                        b.mileage || 0
                    ) -
                    Number(
                        a.mileage || 0
                    );

                case "newest":
                default:

                    return new Date(
                        b.serviceDate || 0
                    ) -
                    new Date(
                        a.serviceDate || 0
                    );
            }
        });

        return records;
    }

    /* =====================================================
       EMPTY MESSAGE
       ===================================================== */

    function showEmptyMessage(
        titleText,
        descriptionText
    ) {

        if (!emptyState) {
            return;
        }

        emptyState.classList.add("show");

        const title =
            emptyState.querySelector("h3");

        const text =
            emptyState.querySelector("p");

        if (title) {
            title.textContent =
                titleText;
        }

        if (text) {
            text.textContent =
                descriptionText;
        }
    }

    /* =====================================================
       RENDER
       ===================================================== */

    function renderRecords() {

        const records =
            getFilteredRecords();

        if (resultCount) {

            resultCount.textContent =
                `${records.length} record${
                    records.length === 1
                        ? ""
                        : "s"
                }`;
        }

        if (!serviceList) {
            return;
        }

        serviceList.innerHTML = "";

        if (records.length === 0) {

            serviceList.style.display =
                "none";

            showEmptyMessage(
                serviceRecords.length === 0
                    ? "No Service Records"
                    : "No Matching Records",

                serviceRecords.length === 0
                    ? "Your completed vehicle services will appear here once service history is available."
                    : "Try changing your search or filters to find another service record."
            );

            return;
        }

        serviceList.style.display =
            "flex";

        if (emptyState) {
            emptyState.classList.remove(
                "show"
            );
        }

        records.forEach(record => {

            serviceList.appendChild(
                createServiceCard(record)
            );
        });
    }

    /* =====================================================
       SERVICE CARD
       ===================================================== */

    function createServiceCard(record) {

        const card =
            document.createElement("article");

        card.className =
            "service-history-card";

        const serviceName =
            String(
                record.service ||
                "Vehicle Service"
            );

        let serviceIcon =
            "fa-screwdriver-wrench";

        const lowerName =
            serviceName.toLowerCase();

        if (lowerName.includes("oil")) {
            serviceIcon = "fa-oil-can";
        }
        else if (lowerName.includes("brake")) {
            serviceIcon = "fa-circle-stop";
        }
        else if (lowerName.includes("battery")) {
            serviceIcon = "fa-car-battery";
        }
        else if (lowerName.includes("tyre")) {
            serviceIcon = "fa-circle";
        }
        else if (lowerName.includes("ac")) {
            serviceIcon = "fa-snowflake";
        }
        else if (lowerName.includes("washing")) {
            serviceIcon = "fa-droplet";
        }

        card.innerHTML = `

            <div class="service-card-header">

                <div class="service-card-title">

                    <div class="service-card-icon">
                        <i class="fa-solid ${serviceIcon}"></i>
                    </div>

                    <div class="service-card-title-text">

                        <span>
                            Service Performed
                        </span>

                        <strong>
                            ${escapeHTML(serviceName)}
                        </strong>

                    </div>

                </div>

                <span class="service-completed-badge">

                    <i class="fa-solid fa-check"></i>

                    ${escapeHTML(
                        record.status || "Completed"
                    )}

                </span>

            </div>

            <div class="service-details-grid">

                <div class="service-detail-item">

                    <span class="service-detail-label">
                        Vehicle
                    </span>

                    <span class="service-detail-value">

                        <i class="fa-solid fa-car"></i>

                        ${escapeHTML(
                            record.vehicleName ||
                            "Vehicle"
                        )}

                    </span>

                </div>

                <div class="service-detail-item">

                    <span class="service-detail-label">
                        Registration
                    </span>

                    <span class="service-detail-value">

                        <i class="fa-regular fa-id-card"></i>

                        ${escapeHTML(
                            record.registrationNumber ||
                            "Not Available"
                        )}

                    </span>

                </div>

                <div class="service-detail-item">

                    <span class="service-detail-label">
                        Service Center
                    </span>

                    <span class="service-detail-value">

                        <i class="fa-solid fa-location-dot"></i>

                        ${escapeHTML(
                            record.serviceCenter ||
                            "Service Center"
                        )}

                    </span>

                </div>

                <div class="service-detail-item">

                    <span class="service-detail-label">
                        Service Date
                    </span>

                    <span class="service-detail-value">

                        <i class="fa-regular fa-calendar"></i>

                        ${escapeHTML(
                            formatDate(
                                record.serviceDate
                            )
                        )}

                    </span>

                </div>

            </div>

            <div class="service-highlight-row">

                <div class="service-highlight">

                    <div class="service-highlight-icon">
                        <i class="fa-solid fa-gauge-high"></i>
                    </div>

                    <div class="service-highlight-text">

                        <span>
                            Vehicle Mileage
                        </span>

                        <strong>
                            ${
                                Number(record.mileage || 0)
                                    ? Number(
                                        record.mileage
                                    ).toLocaleString("en-IN") +
                                      " km"
                                    : "Not Available"
                            }
                        </strong>

                    </div>

                </div>

                <div class="service-highlight cost">

                    <div class="service-highlight-icon">
                        <i class="fa-solid fa-indian-rupee-sign"></i>
                    </div>

                    <div class="service-highlight-text">

                        <span>
                            Service Cost
                        </span>

                        <strong>
                            ${formatCurrency(
                                record.cost
                            )}
                        </strong>

                    </div>

                </div>

            </div>

            ${
                record.notes
                    ? `
                        <div class="service-notes">

                            <i class="fa-regular fa-note-sticky"></i>

                            <span>
                                ${escapeHTML(
                                    record.notes
                                )}
                            </span>

                        </div>
                    `
                    : ""
            }

            <div class="service-card-footer">

                <span class="service-record-id">

                    Service Record:

                    <strong>
                        ${escapeHTML(
                            record.recordId ||
                            record.id ||
                            "N/A"
                        )}
                    </strong>

                </span>

                <div class="service-card-actions">

                    <button
                        type="button"
                        class="service-action-btn primary"
                        data-action="view"
                        data-id="${escapeHTML(
                            record.id
                        )}"
                    >

                        <i class="fa-regular fa-eye"></i>

                        View Details

                    </button>

                    <button
                        type="button"
                        class="service-action-btn"
                        data-action="book"
                        data-id="${escapeHTML(
                            record.id
                        )}"
                    >

                        <i class="fa-solid fa-calendar-plus"></i>

                        Book Again

                    </button>

                </div>

            </div>
        `;

        return card;
    }

    /* =====================================================
       FIND RECORD
       ===================================================== */

    function findRecord(id) {

        return serviceRecords.find(
            record =>
                String(record.id) ===
                String(id)
        );
    }

    /* =====================================================
       VIEW DETAILS
       ===================================================== */

    async function viewDetails(id) {

        try {

            const {
                response,
                data
            } = await apiRequest(
                `/service-history/${id}`
            );

            if (!response.ok) {

                throw new Error(
                    data?.detail ||
                    "Unable to load service details."
                );
            }

            const record =
                findRecord(id);

            const details = [

                `Service Record: ${
                    record?.recordId ||
                    data.record_id ||
                    data.id ||
                    "-"
                }`,

                `Vehicle: ${
                    record?.vehicleName ||
                    "-"
                }`,

                `Registration: ${
                    record?.registrationNumber ||
                    "-"
                }`,

                `Service: ${
                    record?.service ||
                    "-"
                }`,

                `Service Center: ${
                    record?.serviceCenter ||
                    "-"
                }`,

                `Date: ${
                    formatDate(
                        record?.serviceDate ||
                        data.service_date
                    )
                }`,

                `Mileage: ${
                    record?.mileage
                        ? Number(
                            record.mileage
                        ).toLocaleString("en-IN") +
                          " km"
                        : "Not Available"
                }`,

                `Cost: ${
                    formatCurrency(
                        record?.cost ||
                        data.cost
                    )
                }`,

                `Notes: ${
                    record?.notes ||
                    data.notes ||
                    "No additional notes"
                }`
            ];

            alert(
                details.join("\n")
            );

        } catch (error) {

            console.error(
                "View Service History Error:",
                error
            );

            alert(
                error.message ||
                "Unable to load service details."
            );
        }
    }

    /* =====================================================
       BOOK AGAIN
       ===================================================== */

    function bookAgain(id) {

        const record =
            findRecord(id);

        if (!record) {
            return;
        }

        const params =
            new URLSearchParams();

        if (record.vehicleId) {

            params.set(
                "vehicleId",
                record.vehicleId
            );
        }

        if (record.service) {

            params.set(
                "service",
                record.service
            );
        }

        if (record.serviceCenter) {

            params.set(
                "center",
                record.serviceCenter
            );
        }

        window.location.href =
            `booking.html?${params.toString()}`;
    }

    /* =====================================================
       CARD ACTIONS
       ===================================================== */

    if (serviceList) {

        serviceList.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!button) {
                    return;
                }

                const action =
                    button.dataset.action;

                const id =
                    button.dataset.id;

                if (action === "view") {

                    viewDetails(id);

                } else if (
                    action === "book"
                ) {

                    bookAgain(id);
                }
            }
        );
    }

    /* =====================================================
       FILTER EVENTS
       ===================================================== */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderRecords
        );
    }

    if (vehicleFilter) {

        vehicleFilter.addEventListener(
            "change",
            renderRecords
        );
    }

    if (serviceTypeFilter) {

        serviceTypeFilter.addEventListener(
            "change",
            renderRecords
        );
    }

    if (sortSelect) {

        sortSelect.addEventListener(
            "change",
            renderRecords
        );
    }

    /* =====================================================
       CLEAR FILTERS
       ===================================================== */

    if (clearFiltersBtn) {

        clearFiltersBtn.addEventListener(
            "click",
            () => {

                if (vehicleFilter) {
                    vehicleFilter.value = "all";
                }

                if (searchInput) {
                    searchInput.value = "";
                }

                if (serviceTypeFilter) {
                    serviceTypeFilter.value = "all";
                }

                if (sortSelect) {
                    sortSelect.value = "newest";
                }

                renderRecords();
            }
        );
    }

    /* =====================================================
       SIDEBAR
       ===================================================== */

    const menuToggle =
        document.querySelector(
            ".menu-toggle"
        );

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    if (menuToggle && sidebar) {

        menuToggle.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "active"
                );
            }
        );
    }

    /* =====================================================
       LOGOUT
       ===================================================== */

    function logout() {

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

    const logoutBtn =
        document.querySelector(
            ".logout-btn"
        );

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

                logout();
            }
        );
    }

    /* =====================================================
       INITIALIZE
       ===================================================== */

    loadVehicles();
    loadServiceHistory();

});