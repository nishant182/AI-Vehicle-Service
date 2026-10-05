/* =========================================
   VEHICLEAI DASHBOARD
   Frontend ↔ FastAPI Dashboard API
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    const API_BASE_URL = "https://ai-vehicle-service.onrender.com";
    
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const logoutBtn = document.getElementById("logoutBtn");


    /* ===============================
       GET AUTH TOKEN
    =============================== */

    function getAccessToken() {

        return (
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken")
        );

    }


    /* ===============================
       MOBILE SIDEBAR
    =============================== */

    if (menuToggle && sidebar) {

        menuToggle.addEventListener("click", function () {

            sidebar.classList.toggle("open");

        });

    }


    /* ===============================
       LOGOUT
    =============================== */

    if (logoutBtn) {

        logoutBtn.addEventListener("click", function () {

            localStorage.removeItem("accessToken");
            sessionStorage.removeItem("accessToken");

            localStorage.removeItem("aiVehicleUser");
            localStorage.removeItem("rememberLogin");

            window.location.href = "login.html";

        });

    }


    /* ===============================
       LOGIN CHECK
    =============================== */

    const token = getAccessToken();

    const storedUser = localStorage.getItem("aiVehicleUser");

    if (!token || !storedUser) {

        window.location.href = "login.html";
        return;

    }


    /* ===============================
       LOAD DASHBOARD
    =============================== */

    loadDashboard();


    async function loadDashboard() {

        try {

            const response = await fetch(
                `${API_BASE_URL}/dashboard`,
                {
                    method: "GET",

                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );


            /* ===============================
               TOKEN / AUTH ERROR
            =============================== */

            if (response.status === 401 || response.status === 403) {

                localStorage.removeItem("accessToken");
                sessionStorage.removeItem("accessToken");
                localStorage.removeItem("aiVehicleUser");

                window.location.href = "login.html";

                return;

            }


            if (!response.ok) {

                throw new Error(
                    `Dashboard API Error: ${response.status}`
                );

            }


            const data = await response.json();

            console.log("Dashboard API Response:", data);


            /* ===============================
               DASHBOARD STATISTICS
            =============================== */

            updateDashboardStats(data);


            /* ===============================
               RECENT BOOKINGS
            =============================== */

            updateRecentBookings(data.recent_bookings);


            /* ===============================
               SERVICE HISTORY
            =============================== */

            updateServiceHistory(data.recent_service_history);


        } catch (error) {

            console.error(
                "Dashboard loading failed:",
                error
            );

        }

    }


    /* ===============================
       UPDATE DASHBOARD STATS
    =============================== */

    function updateDashboardStats(data) {

        setElementValue(
            [
                "totalVehicles",
                "total-vehicles",
                "vehicleCount"
            ],
            data.total_vehicles
        );


        setElementValue(
            [
                "totalBookings",
                "total-bookings",
                "bookingCount"
            ],
            data.total_bookings
        );


        setElementValue(
            [
                "pendingBookings",
                "pending-bookings",
                "pendingCount"
            ],
            data.pending_bookings
        );


        setElementValue(
            [
                "completedServices",
                "completed-services",
                "serviceCount"
            ],
            data.completed_services
        );


        setElementValue(
            [
                "unreadNotifications",
                "unread-notifications",
                "notificationCount"
            ],
            data.unread_notifications
        );

    }


    /* ===============================
       UPDATE RECENT BOOKINGS
    =============================== */

    function updateRecentBookings(bookings) {

        if (!Array.isArray(bookings)) {
            return;
        }

        console.log(
            "Recent Bookings:",
            bookings
        );

        /*
         * IMPORTANT:
         * Actual HTML selectors will be connected
         * according to dashboard.html.
         */

    }


    /* ===============================
       UPDATE SERVICE HISTORY
    =============================== */

    function updateServiceHistory(history) {

        if (!Array.isArray(history)) {
            return;
        }

        console.log(
            "Recent Service History:",
            history
        );

        /*
         * IMPORTANT:
         * Actual HTML selectors will be connected
         * according to dashboard.html.
         */

    }


    /* ===============================
       HELPER
    =============================== */

    function setElementValue(ids, value) {

        for (const id of ids) {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    value ?? 0;

                return;

            }

        }

    }

});