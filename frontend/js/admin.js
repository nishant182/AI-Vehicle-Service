/* =========================================
   ADMIN DASHBOARD
   VehicleAI - Backend Connected
========================================= */

const API_BASE_URL = "http://127.0.0.1:8000";


/* =========================================
   AUTH HELPERS
========================================= */

function getToken() {
    return (
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken")
    );
}


function authHeaders() {
    const token = getToken();

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


function logout() {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");

    localStorage.removeItem("aiVehicleUser");
    sessionStorage.removeItem("aiVehicleUser");

    localStorage.removeItem("rememberLogin");

    window.location.href = "login.html";
}


/* =========================================
   ADMIN AUTH CHECK
   Uses protected ADMIN API directly
========================================= */

async function checkAdminAccess() {

    const token = getToken();

    console.log("Admin Token Available:", !!token);

    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    try {

        /*
         * IMPORTANT:
         * Do NOT depend on /auth/me is_admin field.
         * The backend /admin/stats endpoint itself
         * verifies whether the logged-in user is admin.
         */

        const response = await fetch(
            `${API_BASE_URL}/admin/stats`,
            {
                method: "GET",
                headers: authHeaders()
            }
        );

        console.log(
            "Admin Permission Check Status:",
            response.status
        );

        const data = await response.json();

        console.log(
            "Admin Permission Check Response:",
            data
        );


        /* Not logged in / invalid token */

        if (response.status === 401) {

            console.error(
                "Admin authentication failed."
            );

            logout();
            return false;
        }


        /* Logged in but NOT admin */

        if (response.status === 403) {

            console.error(
                "User is not an admin:",
                data
            );

            alert(
                data.detail || "Admin access required."
            );

            window.location.href = "dashboard.html";

            return false;
        }


        /* Other backend errors */

        if (!response.ok) {

            console.error(
                "Admin API error:",
                data
            );

            alert(
                data.detail ||
                "Unable to access Admin Dashboard."
            );

            return false;
        }


        /*
         * 200 = backend accepted the user as admin.
         */

        console.log(
            "✅ Admin access verified successfully."
        );


        /*
         * Load current user information only
         * for displaying name/avatar.
         */

        try {

            const userResponse = await fetch(
                `${API_BASE_URL}/auth/me`,
                {
                    method: "GET",
                    headers: authHeaders()
                }
            );

            if (userResponse.ok) {

                const user = await userResponse.json();

                console.log(
                    "Current Admin User:",
                    user
                );

                setAdminUser(user);
            }

        } catch (userError) {

            console.warn(
                "Could not load admin user details:",
                userError
            );
        }


        return true;

    } catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        alert(
            "Unable to connect to backend."
        );

        return false;
    }
}


/* =========================================
   ADMIN USER
========================================= */

function setAdminUser(user) {

    const name = user.name || "Admin";

    const initials = name
        .split(" ")
        .filter(Boolean)
        .map(word => word.charAt(0))
        .join("")
        .substring(0, 2)
        .toUpperCase();


    const nameElements = [
        document.getElementById("adminName"),
        document.getElementById("topAdminName")
    ];


    nameElements.forEach(element => {

        if (element) {
            element.textContent = name;
        }

    });


    const avatarElements = [
        document.getElementById("adminAvatar"),
        document.getElementById("topAdminAvatar")
    ];


    avatarElements.forEach(element => {

        if (element) {
            element.textContent = initials;
        }

    });
}


/* =========================================
   LOAD ADMIN STATS
========================================= */

async function loadAdminStats() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/admin/stats`,
            {
                method: "GET",
                headers: authHeaders()
            }
        );


        console.log(
            "Admin Stats API Status:",
            response.status
        );


        const data = await response.json();


        console.log(
            "Admin Stats API Response:",
            data
        );


        if (response.status === 401) {

            logout();
            return;
        }


        if (response.status === 403) {

            alert(
                data.detail ||
                "Admin access required."
            );

            window.location.href = "dashboard.html";

            return;
        }


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to load admin statistics"
            );
        }


        const totalUsers =
            document.getElementById("totalUsers");

        const totalVehicles =
            document.getElementById("totalVehicles");

        const totalBookings =
            document.getElementById("totalBookings");

        const totalServices =
            document.getElementById("totalServices");

        const totalCenters =
            document.getElementById("totalCenters");

        const totalNotifications =
            document.getElementById("totalNotifications");


        if (totalUsers) {
            totalUsers.textContent =
                data.total_users ?? 0;
        }


        if (totalVehicles) {
            totalVehicles.textContent =
                data.total_vehicles ?? 0;
        }


        if (totalBookings) {
            totalBookings.textContent =
                data.total_bookings ?? 0;
        }


        if (totalServices) {
            totalServices.textContent =
                data.total_services ?? 0;
        }


        if (totalCenters) {
            totalCenters.textContent =
                data.total_service_centers ?? 0;
        }


        if (totalNotifications) {
            totalNotifications.textContent =
                data.total_notifications ?? 0;
        }

    } catch (error) {

        console.error(
            "Admin Stats Error:",
            error
        );
    }
}


/* =========================================
   LOAD USERS
========================================= */

async function loadAdminUsers() {

    const tableBody =
        document.getElementById("usersTableBody");


    if (!tableBody) {
        return;
    }


    try {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-loading">
                    Loading users...
                </td>
            </tr>
        `;


        const response = await fetch(
            `${API_BASE_URL}/admin/users`,
            {
                method: "GET",
                headers: authHeaders()
            }
        );


        console.log(
            "Admin Users API Status:",
            response.status
        );


        const users = await response.json();


        console.log(
            "Admin Users API Response:",
            users
        );


        if (response.status === 401) {

            logout();
            return;
        }


        if (response.status === 403) {

            alert(
                users.detail ||
                "Admin access required."
            );

            window.location.href = "dashboard.html";

            return;
        }


        if (!response.ok) {

            throw new Error(
                users.detail ||
                "Failed to load users"
            );
        }


        const userCount =
            document.getElementById("userCount");


        if (userCount) {

            userCount.textContent =
                `${users.length} User${
                    users.length === 1 ? "" : "s"
                }`;

        }


        if (!users.length) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="table-empty">
                        No users found.
                    </td>
                </tr>
            `;

            return;
        }


        tableBody.innerHTML = users.map(user => {

            const createdDate =
                user.created_at
                    ? new Date(
                        user.created_at
                    ).toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    )
                    : "—";


            return `
                <tr>

                    <td>
                        #${user.id}
                    </td>

                    <td class="user-name-cell">
                        ${escapeHTML(
                            user.name || "Unknown"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            user.email || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            user.phone || "—"
                        )}
                    </td>

                    <td>
                        <span class="status-badge ${
                            user.is_active
                                ? "status-active"
                                : "status-inactive"
                        }">

                            ${
                                user.is_active
                                    ? "Active"
                                    : "Inactive"
                            }

                        </span>
                    </td>

                    <td>
                        <span class="role-badge ${
                            user.is_admin
                                ? "role-admin"
                                : "role-user"
                        }">

                            ${
                                user.is_admin
                                    ? "Admin"
                                    : "User"
                            }

                        </span>
                    </td>

                    <td>
                        ${createdDate}
                    </td>

                </tr>
            `;

        }).join("");


    } catch (error) {

        console.error(
            "Admin Users Error:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-error">
                    Unable to load users.
                </td>
            </tr>
        `;
    }
}


/* =========================================
   SECURITY
========================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================
   LOAD ADMIN DASHBOARD
========================================= */

async function loadAdminDashboard() {

    console.log(
        "Loading Admin Dashboard..."
    );


    const allowed =
        await checkAdminAccess();


    if (!allowed) {
        return;
    }


    await Promise.all([
        loadAdminStats(),
        loadAdminUsers()
    ]);


    console.log(
        "✅ Admin Dashboard loaded successfully."
    );
}


/* =========================================
   EVENTS
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const logoutBtn =
            document.getElementById(
                "logoutBtn"
            );


        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                logout
            );

        }


        const refreshBtn =
            document.getElementById(
                "refreshBtn"
            );


        if (refreshBtn) {

            refreshBtn.addEventListener(
                "click",
                loadAdminDashboard
            );

        }


        loadAdminDashboard();

    }
);