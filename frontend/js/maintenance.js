/* =========================================================
   MAINTENANCE MODULE
   AI Vehicle Service
   Backend Connected
   ========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       AUTH
       ===================================================== */

    const user = localStorage.getItem("aiVehicleUser");

    const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

    if (!user || !token) {
        window.location.href = "login.html";
        return;
    }


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const vehicleSelect =
        document.getElementById("vehicleSelect");

    const maintenanceHealth =
        document.getElementById("maintenanceHealth");

    const upcomingCount =
        document.getElementById("upcomingCount");

    const overdueCount =
        document.getElementById("overdueCount");

    const lastService =
        document.getElementById("lastService");

    const currentMileage =
        document.getElementById("currentMileage");

    const lastServiceDate =
        document.getElementById("lastServiceDate");

    const nextCheck =
        document.getElementById("nextCheck");

    const predictionStatus =
        document.getElementById("predictionStatus");

    const predictionText =
        document.getElementById("predictionText");

    const maintenanceList =
        document.getElementById("maintenanceList");

    const serviceCount =
        document.getElementById("serviceCount");


    let vehicles = [];
    let selectedVehicle = null;


    /* =====================================================
       API HEADERS
       ===================================================== */

    function getHeaders() {
        return {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };
    }


    /* =====================================================
       LOAD VEHICLES FROM BACKEND
       ===================================================== */

    async function loadVehicles() {

        try {

            const response = await fetch(
                `${API_BASE_URL}/vehicles`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

            console.log(
                "Maintenance Vehicles API Status:",
                response.status
            );

            if (response.status === 401 ||
                response.status === 403) {

                logout();
                return;
            }

            if (!response.ok) {

                throw new Error(
                    `Vehicles API failed: ${response.status}`
                );
            }

            vehicles = await response.json();

            console.log(
                "Maintenance Vehicles API Response:",
                vehicles
            );

            loadVehicleSelector();

        } catch (error) {

            console.error(
                "Maintenance Vehicle Loading Error:",
                error
            );

            showEmptyState(
                "Unable to load vehicles."
            );
        }
    }


    /* =====================================================
       LOAD VEHICLE SELECTOR
       ===================================================== */

    function loadVehicleSelector() {

        if (!vehicleSelect) {
            return;
        }

        vehicleSelect.innerHTML = "";

        if (!Array.isArray(vehicles) ||
            vehicles.length === 0) {

            const option =
                document.createElement("option");

            option.value = "";
            option.textContent =
                "No vehicle added";

            vehicleSelect.appendChild(option);

            loadDemoMaintenance();

            return;
        }


        vehicles.forEach(vehicle => {

            const option =
                document.createElement("option");

            option.value = vehicle.id;

            const vehicleName =
                `${vehicle.brand || "Vehicle"} ${
                    vehicle.model || ""
                }`.trim();

            option.textContent =
                `${vehicleName}${
                    vehicle.registration_number
                        ? " • " +
                          vehicle.registration_number
                        : ""
                }`;

            vehicleSelect.appendChild(option);

        });


        /* =================================================
           URL VEHICLE ID
           ================================================= */

        const params =
            new URLSearchParams(
                window.location.search
            );

        const urlVehicleId =
            params.get("id");

        if (
            urlVehicleId &&
            vehicles.some(
                vehicle =>
                    String(vehicle.id) ===
                    String(urlVehicleId)
            )
        ) {

            vehicleSelect.value =
                urlVehicleId;

        } else {

            vehicleSelect.value =
                vehicles[0].id;
        }


        updateMaintenance();
    }


    /* =====================================================
       GET SELECTED VEHICLE
       ===================================================== */

    function getSelectedVehicle() {

        const selectedId =
            vehicleSelect.value;

        return vehicles.find(
            vehicle =>
                String(vehicle.id) ===
                String(selectedId)
        ) || null;
    }


    /* =====================================================
       LOAD MAINTENANCE FROM BACKEND
       ===================================================== */

    async function updateMaintenance() {

        selectedVehicle =
            getSelectedVehicle();

        if (!selectedVehicle) {

            loadDemoMaintenance();
            return;
        }


        try {

            predictionStatus.textContent =
                "Loading maintenance information...";

            predictionText.textContent =
                "Checking your vehicle maintenance data.";


            const response = await fetch(
                `${API_BASE_URL}/maintenance/${selectedVehicle.id}`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


            console.log(
                "Maintenance API Status:",
                response.status
            );


            if (response.status === 401 ||
                response.status === 403) {

                logout();
                return;
            }


            if (response.status === 404) {

                throw new Error(
                    "Vehicle not found"
                );
            }


            if (!response.ok) {

                const errorData =
                    await response.json()
                        .catch(() => ({}));

                throw new Error(
                    errorData.detail ||
                    `Maintenance API failed: ${response.status}`
                );
            }


            const data =
                await response.json();


            console.log(
                "Maintenance API Response:",
                data
            );


            renderMaintenance(data);

        } catch (error) {

            console.error(
                "Maintenance API Error:",
                error
            );

            predictionStatus.textContent =
                "Maintenance data unavailable";

            predictionText.textContent =
                "Unable to load maintenance information from the server.";

            if (maintenanceList) {

                maintenanceList.innerHTML = `
                    <div class="empty-state">
                        <p>Unable to load maintenance data.</p>
                    </div>
                `;
            }
        }
    }


    /* =====================================================
       RENDER BACKEND DATA
       ===================================================== */

    function renderMaintenance(data) {

        const predictions =
            Array.isArray(data.predictions)
                ? data.predictions
                : [];


        const mileage =
            Number(data.current_mileage) || 0;


        /* =================================================
           VEHICLE INFORMATION
           ================================================= */

        currentMileage.textContent =
            `${formatNumber(mileage)} km`;


        lastService.textContent =
            `${formatNumber(
                selectedVehicle.last_service_km || 0
            )} km`;


        lastServiceDate.textContent =
            formatDate(
                selectedVehicle.last_service_date
            );


        /* =================================================
           COUNTS
           ================================================= */

        const overdue =
            predictions.filter(
                item =>
                    String(item.priority)
                        .toLowerCase() ===
                    "overdue"
            ).length;


        const upcoming =
            predictions.length -
            overdue;


        upcomingCount.textContent =
            upcoming;


        overdueCount.textContent =
            overdue;


        serviceCount.textContent =
            `${predictions.length} Services`;


        /* =================================================
           HEALTH
           ================================================= */

        let health = 100;

        health -= overdue * 15;


        const highPriority =
            predictions.filter(
                item =>
                    String(item.priority)
                        .toLowerCase() ===
                    "high"
            ).length;


        health -= highPriority * 5;


        health =
            Math.max(
                45,
                Math.min(100, health)
            );


        maintenanceHealth.textContent =
            `${health}%`;


        /* =================================================
           NEXT CHECK
           ================================================= */

        const sorted =
            [...predictions].sort(
                (a, b) =>
                    Number(a.remaining_km || 0) -
                    Number(b.remaining_km || 0)
            );


        const next =
            sorted.length
                ? sorted[0]
                : null;


        if (!next) {

            nextCheck.textContent =
                "Not available";

        } else if (
            Number(next.remaining_km) <= 0
        ) {

            nextCheck.textContent =
                "Due now";

        } else {

            nextCheck.textContent =
                `~${formatNumber(
                    next.remaining_km
                )} km`;
        }


        /* =================================================
           PREDICTION MESSAGE
           ================================================= */

        if (overdue > 0) {

            predictionStatus.textContent =
                "Maintenance attention recommended";

            predictionText.textContent =
                `${overdue} maintenance item${
                    overdue > 1 ? "s are" : " is"
                } currently due based on the vehicle mileage.`;

        } else if (
            next &&
            Number(next.remaining_km) <= 3000
        ) {

            predictionStatus.textContent =
                "Maintenance approaching";

            predictionText.textContent =
                "The next maintenance interval is approaching based on the current vehicle mileage.";

        } else {

            predictionStatus.textContent =
                "Maintenance currently on track";

            predictionText.textContent =
                "No immediate maintenance item is due based on the current mileage.";
        }


        /* =================================================
           SERVICES
           ================================================= */

        renderMaintenanceServices(
            predictions
        );
    }


    /* =====================================================
       RENDER SERVICES
       ===================================================== */

    function renderMaintenanceServices(
        services
    ) {

        if (!maintenanceList) {
            return;
        }

        maintenanceList.innerHTML = "";


        services
            .slice(0, 5)
            .forEach(service => {

                const item =
                    document.createElement("div");

                item.className =
                    "maintenance-item";


                const priority =
                    String(
                        service.priority || "Medium"
                    ).toLowerCase();


                const priorityClass =
                    priority === "overdue" ||
                    priority === "high"
                        ? "high"
                        : priority === "low"
                            ? "low"
                            : "medium";


                const icon =
                    getServiceIcon(
                        service.maintenance_type
                    );


                item.innerHTML = `

                    <div class="service-icon ${
                        priorityClass === "high"
                            ? "orange"
                            : priorityClass === "low"
                                ? "green"
                                : "blue"
                    }">
                        ${icon}
                    </div>

                    <div class="service-info">

                        <h4>
                            ${escapeHTML(
                                service.maintenance_type
                            )}
                        </h4>

                        <p>
                            ${escapeHTML(
                                service.reason ||
                                "Maintenance recommended."
                            )}
                        </p>

                        <span class="service-date">
                            ${
                                Number(
                                    service.remaining_km
                                ) <= 0
                                    ? "Due now"
                                    : `Due in ~${formatNumber(
                                        service.remaining_km
                                    )} km`
                            }
                        </span>

                    </div>

                    <span class="priority ${priorityClass}">
                        ${capitalize(
                            service.priority
                        )}
                    </span>

                `;


                maintenanceList.appendChild(item);

            });
    }


    /* =====================================================
       SERVICE ICON
       ===================================================== */

    function getServiceIcon(serviceName) {

        const name =
            String(serviceName || "")
                .toLowerCase();


        if (name.includes("oil")) {
            return "🛢";
        }

        if (name.includes("brake")) {
            return "🛑";
        }

        if (name.includes("tyre")) {
            return "🛞";
        }

        if (name.includes("battery")) {
            return "🔋";
        }

        return "🔧";
    }


    /* =====================================================
       FORMAT DATE
       ===================================================== */

    function formatDate(value) {

        if (!value) {
            return "Not available";
        }


        const date =
            new Date(value);


        if (Number.isNaN(
            date.getTime()
        )) {

            return value;
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
       FORMAT NUMBER
       ===================================================== */

    function formatNumber(value) {

        return (
            Number(value) || 0
        ).toLocaleString("en-IN");
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
       CAPITALIZE
       ===================================================== */

    function capitalize(value) {

        const text =
            String(value || "Medium");

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1)
        );
    }


    /* =====================================================
       DEMO STATE
       ===================================================== */

    function loadDemoMaintenance() {

        currentMileage.textContent =
            "—";

        lastService.textContent =
            "—";

        lastServiceDate.textContent =
            "—";

        nextCheck.textContent =
            "—";

        maintenanceHealth.textContent =
            "—";

        upcomingCount.textContent =
            "0";

        overdueCount.textContent =
            "0";

        serviceCount.textContent =
            "0 Services";

        predictionStatus.textContent =
            "No vehicle available";

        predictionText.textContent =
            "Add a vehicle to view maintenance predictions.";

        if (maintenanceList) {

            maintenanceList.innerHTML = `
                <div class="empty-state">
                    <p>Add a vehicle to view maintenance information.</p>
                </div>
            `;
        }
    }


    /* =====================================================
       EMPTY STATE
       ===================================================== */

    function showEmptyState(message) {

        if (maintenanceList) {

            maintenanceList.innerHTML = `
                <div class="empty-state">
                    <p>${escapeHTML(message)}</p>
                </div>
            `;
        }
    }


    /* =====================================================
       VEHICLE CHANGE
       ===================================================== */

    if (vehicleSelect) {

        vehicleSelect.addEventListener(
            "change",
            () => {

                const selectedId =
                    vehicleSelect.value;


                const url =
                    new URL(
                        window.location.href
                    );


                if (selectedId) {

                    url.searchParams.set(
                        "id",
                        selectedId
                    );

                } else {

                    url.searchParams.delete(
                        "id"
                    );
                }


                window.history.replaceState(
                    {},
                    "",
                    url
                );


                updateMaintenance();
            }
        );
    }


    /* =====================================================
       BOOK SERVICE
       ===================================================== */

    window.bookService =
        function(serviceName) {

            const vehicle =
                getSelectedVehicle();


            const params =
                new URLSearchParams();


            params.set(
                "service",
                serviceName
            );


            if (
                vehicle &&
                vehicle.id
            ) {

                params.set(
                    "vehicleId",
                    vehicle.id
                );
            }


            window.location.href =
                `booking.html?${params.toString()}`;
        };


    /* =====================================================
       SIDEBAR
       ===================================================== */

    window.toggleSidebar =
        function() {

            const sidebar =
                document.querySelector(
                    ".sidebar"
                );


            if (!sidebar) {
                return;
            }


            sidebar.classList.toggle(
                "mobile-open"
            );
        };


    /* =====================================================
       LOGOUT
       ===================================================== */

    window.logout =
        function() {

            localStorage.removeItem(
                "aiVehicleUser"
            );

            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "rememberLogin"
            );

            sessionStorage.removeItem(
                "accessToken"
            );

            window.location.href =
                "login.html";
        };


    /* =====================================================
       INITIALIZE
       ===================================================== */

    loadVehicles();

});