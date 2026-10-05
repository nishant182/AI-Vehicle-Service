/* =========================================================
   BOOKING HISTORY
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

    const bookingList =
        document.getElementById("bookingList");

    const emptyState =
        document.getElementById("bookingEmptyState");

    const searchInput =
        document.getElementById("bookingSearch");

    const statusFilter =
        document.getElementById("statusFilter");

    const sortSelect =
        document.getElementById("bookingSort");

    const resultCount =
        document.getElementById("bookingResultCount");

    const clearFiltersBtn =
        document.getElementById("clearFiltersBtn");

    const totalBookings =
        document.getElementById("totalBookings");

    const pendingBookings =
        document.getElementById("pendingBookings");

    const confirmedBookings =
        document.getElementById("confirmedBookings");

    const completedBookings =
        document.getElementById("completedBookings");

    /* =====================================================
       DATA
       ===================================================== */

    let bookings = [];

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
       FORMAT DATE
       ===================================================== */

    function formatDate(dateString) {

        if (!dateString) {
            return "-";
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    /* =====================================================
       FORMAT TIME
       ===================================================== */

    function formatTime(timeString) {

        if (!timeString) {
            return "-";
        }

        const value = String(timeString);

        const match = value.match(/^(\d{1,2}):(\d{2})/);

        if (!match) {
            return value;
        }

        let hours = Number(match[1]);
        const minutes = match[2];

        const period = hours >= 12 ? "PM" : "AM";

        if (hours === 0) {
            hours = 12;
        } else if (hours > 12) {
            hours -= 12;
        }

        return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
    }

    /* =====================================================
       FORMAT CURRENCY
       ===================================================== */

    function formatCurrency(amount) {

        const number = Number(amount) || 0;

        return "₹" + number.toLocaleString("en-IN");
    }

    /* =====================================================
       STATUS CLASS
       ===================================================== */

    function getStatusClass(status) {

        const value = String(status || "")
            .toLowerCase()
            .trim();

        switch (value) {

            case "pending":
                return "status-pending";

            case "confirmed":
                return "status-confirmed";

            case "in progress":
            case "in-progress":
                return "status-in-progress";

            case "completed":
                return "status-completed";

            case "cancelled":
            case "canceled":
                return "status-cancelled";

            default:
                return "status-pending";
        }
    }

    /* =====================================================
       STATUS TEXT
       ===================================================== */

    function getStatusText(status) {

        if (!status) {
            return "Pending";
        }

        const value =
            String(status).toLowerCase();

        if (
            value === "in-progress" ||
            value === "in progress"
        ) {
            return "In Progress";
        }

        if (
            value === "canceled"
        ) {
            return "Cancelled";
        }

        return status;
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
       LOAD BOOKINGS FROM BACKEND
       ===================================================== */

    async function loadBookings() {

        try {

            const {
                response,
                data
            } = await apiRequest("/bookings");

            console.log(
                "Booking History API Status:",
                response.status
            );

            console.log(
                "Booking History API Response:",
                data
            );

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                localStorage.removeItem("accessToken");
                sessionStorage.removeItem("accessToken");
                localStorage.removeItem("aiVehicleUser");

                window.location.href = "login.html";
                return;
            }

            if (!response.ok) {

                throw new Error(
                    data?.detail ||
                    "Failed to load booking history."
                );
            }

            bookings = Array.isArray(data)
                ? data
                : [];

            /*
             * Backend booking records only contain IDs.
             * Enrich them with vehicle/service/service-center
             * names for the UI.
             */

            await enrichBookings();

            updateSummary();
            renderBookings();

        } catch (error) {

            console.error(
                "Booking History Load Error:",
                error
            );

            bookings = [];

            updateSummary();
            renderBookings();

            if (emptyState) {

                emptyState.classList.add("show");

                const emptyTitle =
                    emptyState.querySelector("h3");

                const emptyText =
                    emptyState.querySelector("p");

                if (emptyTitle) {
                    emptyTitle.textContent =
                        "Unable to load bookings";
                }

                if (emptyText) {
                    emptyText.textContent =
                        error.message ||
                        "Please try again.";
                }
            }
        }
    }

    /* =====================================================
       ENRICH BOOKINGS
       ===================================================== */

    async function enrichBookings() {

        try {

            const [
                vehiclesResult,
                servicesResult,
                centersResult
            ] = await Promise.all([

                apiRequest("/vehicles"),

                apiRequest("/services"),

                apiRequest("/service-centers")
            ]);

            const vehicles =
                Array.isArray(vehiclesResult.data)
                    ? vehiclesResult.data
                    : [];

            const services =
                Array.isArray(servicesResult.data)
                    ? servicesResult.data
                    : [];

            const centers =
                Array.isArray(centersResult.data)
                    ? centersResult.data
                    : [];

            bookings = bookings.map(booking => {

                const vehicle =
                    vehicles.find(
                        item =>
                            Number(item.id) ===
                            Number(booking.vehicle_id)
                    );

                const service =
                    services.find(
                        item =>
                            Number(item.id) ===
                            Number(booking.service_id)
                    );

                const center =
                    centers.find(
                        item =>
                            Number(item.id) ===
                            Number(booking.service_center_id)
                    );

                return {
                    ...booking,

                    bookingId:
                        `VIS-${String(
                            booking.id
                        ).padStart(6, "0")}`,

                    vehicleId:
                        booking.vehicle_id,

                    vehicleName:
                        vehicle
                            ? `${vehicle.brand} ${vehicle.model}`
                            : "Vehicle",

                    registrationNumber:
                        vehicle?.registration_number ||
                        "Not available",

                    service:
                        service?.name ||
                        "Vehicle Service",

                    serviceCenter:
                        center?.name ||
                        "Service Center",

                    appointmentDate:
                        booking.booking_date,

                    appointmentTime:
                        booking.booking_time,

                    estimatedCost:
                        booking.estimated_price,

                    note:
                        booking.notes || "",

                    createdAt:
                        booking.created_at ||
                        booking.booking_date
                };
            });

        } catch (error) {

            console.warn(
                "Booking enrichment failed:",
                error
            );

            bookings = bookings.map(booking => ({
                ...booking,

                bookingId:
                    `VIS-${String(
                        booking.id
                    ).padStart(6, "0")}`,

                vehicleId:
                    booking.vehicle_id,

                service:
                    "Vehicle Service",

                serviceCenter:
                    "Service Center",

                appointmentDate:
                    booking.booking_date,

                appointmentTime:
                    booking.booking_time,

                estimatedCost:
                    booking.estimated_price
            }));
        }
    }

    /* =====================================================
       UPDATE SUMMARY
       ===================================================== */

    function updateSummary() {

        const total =
            bookings.length;

        const pending =
            bookings.filter(
                booking =>
                    String(booking.status)
                        .toLowerCase() === "pending"
            ).length;

        const confirmed =
            bookings.filter(
                booking =>
                    String(booking.status)
                        .toLowerCase() === "confirmed"
            ).length;

        const completed =
            bookings.filter(
                booking =>
                    String(booking.status)
                        .toLowerCase() === "completed"
            ).length;

        if (totalBookings) {
            totalBookings.textContent = total;
        }

        if (pendingBookings) {
            pendingBookings.textContent = pending;
        }

        if (confirmedBookings) {
            confirmedBookings.textContent = confirmed;
        }

        if (completedBookings) {
            completedBookings.textContent = completed;
        }
    }

    /* =====================================================
       FILTER BOOKINGS
       ===================================================== */

    function getFilteredBookings() {

        let filtered = [...bookings];

        const searchValue =
            String(searchInput?.value || "")
                .trim()
                .toLowerCase();

        const statusValue =
            statusFilter?.value || "all";

        const sortValue =
            sortSelect?.value || "newest";

        /* SEARCH */

        if (searchValue) {

            filtered =
                filtered.filter(booking => {

                    const searchableText = [

                        booking.bookingId,

                        booking.vehicleName,

                        booking.registrationNumber,

                        booking.service,

                        booking.serviceCenter,

                        booking.appointmentDate,

                        booking.status

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return searchableText
                        .includes(searchValue);
                });
        }

        /* STATUS */

        if (statusValue !== "all") {

            filtered =
                filtered.filter(booking => {

                    const status =
                        String(
                            booking.status || ""
                        ).toLowerCase();

                    return status ===
                        statusValue.toLowerCase();
                });
        }

        /* SORT */

        filtered.sort((a, b) => {

            switch (sortValue) {

                case "oldest":

                    return new Date(
                        a.createdAt || 0
                    ) -
                    new Date(
                        b.createdAt || 0
                    );

                case "date-near":

                    return new Date(
                        a.appointmentDate ||
                        "9999-12-31"
                    ) -
                    new Date(
                        b.appointmentDate ||
                        "9999-12-31"
                    );

                case "date-far":

                    return new Date(
                        b.appointmentDate ||
                        "0001-01-01"
                    ) -
                    new Date(
                        a.appointmentDate ||
                        "0001-01-01"
                    );

                case "cost-low":

                    return Number(
                        a.estimatedCost || 0
                    ) -
                    Number(
                        b.estimatedCost || 0
                    );

                case "cost-high":

                    return Number(
                        b.estimatedCost || 0
                    ) -
                    Number(
                        a.estimatedCost || 0
                    );

                case "newest":
                default:

                    return new Date(
                        b.createdAt || 0
                    ) -
                    new Date(
                        a.createdAt || 0
                    );
            }
        });

        return filtered;
    }

    /* =====================================================
       RENDER BOOKINGS
       ===================================================== */

    function renderBookings() {

        const filteredBookings =
            getFilteredBookings();

        if (resultCount) {

            resultCount.textContent =
                `${filteredBookings.length} booking${
                    filteredBookings.length === 1
                        ? ""
                        : "s"
                }`;
        }

        if (!bookingList) {
            return;
        }

        bookingList.innerHTML = "";

        /* EMPTY */

        if (filteredBookings.length === 0) {

            bookingList.style.display = "none";

            if (emptyState) {

                emptyState.classList.add("show");

                const emptyTitle =
                    emptyState.querySelector("h3");

                const emptyText =
                    emptyState.querySelector("p");

                if (emptyTitle) {

                    emptyTitle.textContent =
                        bookings.length === 0
                            ? "No bookings yet"
                            : "No matching bookings";
                }

                if (emptyText) {

                    emptyText.textContent =
                        bookings.length === 0
                            ? "Your service bookings will appear here after you book a service."
                            : "Try changing your search or filter to find another booking.";
                }
            }

            return;
        }

        bookingList.style.display = "flex";

        if (emptyState) {
            emptyState.classList.remove("show");
        }

        filteredBookings.forEach(booking => {

            bookingList.appendChild(
                createBookingCard(booking)
            );
        });
    }

    /* =====================================================
       CREATE BOOKING CARD
       ===================================================== */

    function createBookingCard(booking) {

        const card =
            document.createElement("div");

        card.className =
            "booking-history-card";

        const statusClass =
            getStatusClass(booking.status);

        const statusText =
            getStatusText(booking.status);

        const isPending =
            String(booking.status || "")
                .toLowerCase() === "pending";

        const isCancelled =
            String(booking.status || "")
                .toLowerCase()
                .includes("cancel");

        card.innerHTML = `

            <div class="booking-card-header">

                <div class="booking-card-id">

                    <span>Booking ID</span>

                    <strong>
                        ${escapeHTML(
                            booking.bookingId ||
                            booking.id ||
                            "N/A"
                        )}
                    </strong>

                </div>

                <span class="booking-status ${statusClass}">
                    ${escapeHTML(statusText)}
                </span>

            </div>

            <div class="booking-details-grid">

                <div class="booking-detail-item">

                    <span class="detail-label">
                        Vehicle
                    </span>

                    <span class="detail-value">
                        <i class="fa-solid fa-car"></i>
                        ${escapeHTML(
                            booking.vehicleName ||
                            "Vehicle"
                        )}
                    </span>

                </div>

                <div class="booking-detail-item">

                    <span class="detail-label">
                        Registration
                    </span>

                    <span class="detail-value">
                        <i class="fa-regular fa-id-card"></i>
                        ${escapeHTML(
                            booking.registrationNumber ||
                            "Not available"
                        )}
                    </span>

                </div>

                <div class="booking-detail-item">

                    <span class="detail-label">
                        Service Center
                    </span>

                    <span class="detail-value">
                        <i class="fa-solid fa-location-dot"></i>
                        ${escapeHTML(
                            booking.serviceCenter ||
                            "Service Center"
                        )}
                    </span>

                </div>

                <div class="booking-detail-item">

                    <span class="detail-label">
                        Appointment
                    </span>

                    <span class="detail-value">
                        <i class="fa-regular fa-calendar"></i>
                        ${escapeHTML(
                            formatDate(
                                booking.appointmentDate
                            )
                        )}
                    </span>

                </div>

                <div class="booking-detail-item">

                    <span class="detail-label">
                        Time
                    </span>

                    <span class="detail-value">
                        <i class="fa-regular fa-clock"></i>
                        ${escapeHTML(
                            formatTime(
                                booking.appointmentTime
                            )
                        )}
                    </span>

                </div>

            </div>

            <div class="booking-service-highlight">

                <div class="booking-service-icon">

                    <i class="fa-solid fa-screwdriver-wrench"></i>

                </div>

                <div class="booking-service-info">

                    <span>
                        Selected Service
                    </span>

                    <strong>
                        ${escapeHTML(
                            booking.service ||
                            "Vehicle Service"
                        )}
                    </strong>

                </div>

                <div class="booking-cost">

                    <span>
                        Estimated Cost
                    </span>

                    <strong>
                        ${formatCurrency(
                            booking.estimatedCost
                        )}
                    </strong>

                </div>

            </div>

            <div class="booking-card-actions">

                <button
                    type="button"
                    class="booking-action-btn primary"
                    data-action="view"
                    data-booking-id="${escapeHTML(
                        booking.id
                    )}"
                >
                    <i class="fa-regular fa-eye"></i>
                    View Details
                </button>

                ${
                    isPending
                        ? `
                            <button
                                type="button"
                                class="booking-action-btn danger"
                                data-action="cancel"
                                data-booking-id="${escapeHTML(
                                    booking.id
                                )}"
                            >
                                <i class="fa-solid fa-xmark"></i>
                                Cancel
                            </button>
                        `
                        : ""
                }

                ${
                    !isCancelled
                        ? `
                            <button
                                type="button"
                                class="booking-action-btn"
                                data-action="book-again"
                                data-booking-id="${escapeHTML(
                                    booking.id
                                )}"
                            >
                                <i class="fa-solid fa-rotate-right"></i>
                                Book Again
                            </button>
                        `
                        : ""
                }

            </div>
        `;

        return card;
    }

    /* =====================================================
       FIND BOOKING
       ===================================================== */

    function findBooking(bookingId) {

        return bookings.find(
            booking =>
                String(booking.id) ===
                String(bookingId)
        );
    }

    /* =====================================================
       VIEW BOOKING
       ===================================================== */

    async function viewBooking(bookingId) {

        try {

            const {
                response,
                data
            } = await apiRequest(
                `/bookings/${bookingId}`
            );

            if (!response.ok) {

                throw new Error(
                    data?.detail ||
                    "Unable to load booking."
                );
            }

            const vehicle =
                bookings.find(
                    booking =>
                        Number(booking.id) ===
                        Number(bookingId)
                );

            const details = [

                `Booking ID: ${
                    vehicle?.bookingId ||
                    `VIS-${String(
                        data.id
                    ).padStart(6, "0")}`
                }`,

                `Vehicle: ${
                    vehicle?.vehicleName ||
                    "-"
                }`,

                `Registration: ${
                    vehicle?.registrationNumber ||
                    "-"
                }`,

                `Service: ${
                    vehicle?.service ||
                    "-"
                }`,

                `Service Center: ${
                    vehicle?.serviceCenter ||
                    "-"
                }`,

                `Date: ${
                    formatDate(
                        data.booking_date
                    )
                }`,

                `Time: ${
                    formatTime(
                        data.booking_time
                    )
                }`,

                `Estimated Cost: ${
                    formatCurrency(
                        data.estimated_price
                    )
                }`,

                `Status: ${
                    getStatusText(
                        data.status
                    )
                }`,

                `Notes: ${
                    data.notes || "-"
                }`
            ];

            alert(details.join("\n"));

        } catch (error) {

            console.error(
                "View Booking Error:",
                error
            );

            alert(
                error.message ||
                "Unable to load booking details."
            );
        }
    }

    /* =====================================================
       CANCEL BOOKING
       ===================================================== */

    async function cancelBooking(bookingId) {

        const booking =
            findBooking(bookingId);

        if (!booking) {
            return;
        }

        const status =
            String(
                booking.status || ""
            ).toLowerCase();

        if (status !== "pending") {

            alert(
                "Only pending bookings can be cancelled."
            );

            return;
        }

        const confirmed =
            confirm(
                `Are you sure you want to cancel booking ${
                    booking.bookingId || ""
                }?`
            );

        if (!confirmed) {
            return;
        }

        try {

            const {
                response,
                data
            } = await apiRequest(
                `/bookings/${bookingId}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        status: "Cancelled"
                    })
                }
            );

            console.log(
                "Cancel Booking API Status:",
                response.status
            );

            console.log(
                "Cancel Booking API Response:",
                data
            );

            if (!response.ok) {

                throw new Error(
                    data?.detail ||
                    "Unable to cancel booking."
                );
            }

            alert(
                "Booking cancelled successfully."
            );

            await loadBookings();

        } catch (error) {

            console.error(
                "Cancel Booking Error:",
                error
            );

            alert(
                error.message ||
                "Unable to cancel booking."
            );
        }
    }

    /* =====================================================
       BOOK AGAIN
       ===================================================== */

    function bookAgain(bookingId) {

        const booking =
            findBooking(bookingId);

        if (!booking) {
            return;
        }

        const params =
            new URLSearchParams();

        if (booking.vehicleId) {

            params.set(
                "vehicleId",
                booking.vehicleId
            );
        }

        if (booking.service) {

            params.set(
                "service",
                booking.service
            );
        }

        if (booking.serviceCenter) {

            params.set(
                "center",
                booking.serviceCenter
            );
        }

        window.location.href =
            `booking.html?${params.toString()}`;
    }

    /* =====================================================
       CARD ACTIONS
       ===================================================== */

    if (bookingList) {

        bookingList.addEventListener(
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

                const bookingId =
                    button.dataset.bookingId;

                if (action === "view") {

                    viewBooking(
                        bookingId
                    );

                } else if (
                    action === "cancel"
                ) {

                    cancelBooking(
                        bookingId
                    );

                } else if (
                    action === "book-again"
                ) {

                    bookAgain(
                        bookingId
                    );
                }
            }
        );
    }

    /* =====================================================
       SEARCH
       ===================================================== */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderBookings
        );
    }

    /* =====================================================
       STATUS FILTER
       ===================================================== */

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            renderBookings
        );
    }

    /* =====================================================
       SORT
       ===================================================== */

    if (sortSelect) {

        sortSelect.addEventListener(
            "change",
            renderBookings
        );
    }

    /* =====================================================
       CLEAR FILTERS
       ===================================================== */

    if (clearFiltersBtn) {

        clearFiltersBtn.addEventListener(
            "click",
            () => {

                if (searchInput) {
                    searchInput.value = "";
                }

                if (statusFilter) {
                    statusFilter.value = "all";
                }

                if (sortSelect) {
                    sortSelect.value = "newest";
                }

                renderBookings();
            }
        );
    }

    /* =====================================================
       NEW BOOKING
       ===================================================== */

    const newBookingBtn =
        document.querySelector(
            ".new-booking-btn"
        );

    if (newBookingBtn) {

        newBookingBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

                window.location.href =
                    "booking.html";
            }
        );
    }

    /* =====================================================
       SIDEBAR TOGGLE
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

    const logoutBtn =
        document.querySelector(
            ".logout-btn"
        );

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

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

    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    loadBookings();

});