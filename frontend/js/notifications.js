/* =========================================
   AI VEHICLE SERVICE
   NOTIFICATIONS JAVASCRIPT
   BACKEND CONNECTED VERSION
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const API_BASE_URL = "http://127.0.0.1:8000";

    /* =========================================
       AUTH
    ========================================= */

    function getToken() {
        return (
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken")
        );
    }

    const token = getToken();
    const userData =
        localStorage.getItem("aiVehicleUser") ||
        sessionStorage.getItem("aiVehicleUser");

    if (!token || !userData) {
        window.location.href = "login.html";
        return;
    }

    const authHeaders = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };


    /* =========================================
       DOM ELEMENTS
    ========================================= */

    const unreadCountElement =
        document.getElementById("unreadCount");

    const sidebarCountElement =
        document.getElementById("sidebarNotificationCount");

    const markAllReadBtn =
        document.getElementById("markAllReadBtn");

    const notificationsContainer =
        document.getElementById("notificationsContainer");

    const emptyState =
        document.getElementById("notificationsEmpty");

    const filterButtons =
        document.querySelectorAll(".notification-filter");


    /* =========================================
       NOTIFICATION DATA
    ========================================= */

    let notifications = [];
    let currentFilter = "all";


    /* =========================================
       API HELPER
    ========================================= */

    async function apiRequest(url, options = {}) {

        const response = await fetch(
            `${API_BASE_URL}${url}`,
            {
                ...options,
                headers: {
                    ...authHeaders,
                    ...(options.headers || {})
                }
            }
        );

        if (response.status === 401 || response.status === 403) {

            localStorage.removeItem("accessToken");
            sessionStorage.removeItem("accessToken");

            localStorage.removeItem("aiVehicleUser");
            sessionStorage.removeItem("aiVehicleUser");

            window.location.href = "login.html";

            return null;
        }

        return response;
    }


    /* =========================================
       LOAD NOTIFICATIONS
    ========================================= */

    async function loadNotifications() {

        try {

            const response =
                await apiRequest("/notifications");

            if (!response) return;

            console.log(
                "Notifications API Status:",
                response.status
            );

            const data = await response.json();

            console.log(
                "Notifications API Response:",
                data
            );

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Unable to load notifications"
                );

            }

            notifications = Array.isArray(data)
                ? data
                : [];

            renderNotifications();

        } catch (error) {

            console.error(
                "Notifications API Error:",
                error
            );

            notifications = [];

            renderNotifications();

        }

    }


    /* =========================================
       NORMALIZE NOTIFICATION
    ========================================= */

    function normalizeNotification(notification) {

        return {

            id: notification.id,

            title:
                notification.title ||
                "Notification",

            message:
                notification.message ||
                "",

            type:
                notification.notification_type ||
                "general",

            isRead:
                Boolean(notification.is_read),

            createdAt:
                notification.created_at ||
                null

        };

    }


    /* =========================================
       FORMAT DATE
    ========================================= */

    function formatDate(dateValue) {

        if (!dateValue) {
            return "Recently";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Recently";
        }

        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    /* =========================================
       TYPE ICON
    ========================================= */

    function getNotificationIcon(type) {

        const icons = {

            service:
                "fa-wrench",

            maintenance:
                "fa-tools",

            booking:
                "fa-calendar-check",

            reminder:
                "fa-bell",

            vehicle:
                "fa-car",

            health:
                "fa-heartbeat",

            alert:
                "fa-triangle-exclamation",

            system:
                "fa-circle-info",

            general:
                "fa-bell"

        };

        return icons[type] || icons.general;

    }


    /* =========================================
       TYPE LABEL
    ========================================= */

    function getNotificationType(type) {

        const labels = {

            service: "Service",

            maintenance: "Maintenance",

            booking: "Booking",

            reminder: "Reminder",

            vehicle: "Vehicle",

            health: "Vehicle Health",

            alert: "Alert",

            system: "System",

            general: "General"

        };

        return labels[type] || "General";

    }


    /* =========================================
       RENDER NOTIFICATIONS
    ========================================= */

    function renderNotifications() {

        if (!notificationsContainer) return;

        notificationsContainer.innerHTML = "";

        const normalizedNotifications =
            notifications.map(normalizeNotification);

        const filteredNotifications =
            normalizedNotifications.filter(
                notification => {

                    if (currentFilter === "all") {
                        return true;
                    }

                    if (currentFilter === "unread") {
                        return !notification.isRead;
                    }

                    return (
                        notification.type ===
                        currentFilter
                    );

                }
            );


        /* =====================================
           EMPTY STATE
        ===================================== */

        if (filteredNotifications.length === 0) {

            updateEmptyState(true);
            updateUnreadCount();
            return;

        }

        updateEmptyState(false);


        /* =====================================
           GROUP BY DATE
        ===================================== */

        const groups = {};

        filteredNotifications.forEach(
            notification => {

                const groupName =
                    getDateGroup(
                        notification.createdAt
                    );

                if (!groups[groupName]) {
                    groups[groupName] = [];
                }

                groups[groupName].push(
                    notification
                );

            }
        );


        /* =====================================
           CREATE GROUPS
        ===================================== */

        Object.entries(groups).forEach(
            ([groupName, groupNotifications]) => {

                const group =
                    document.createElement("div");

                group.className =
                    "notification-group";


                const groupTitle =
                    document.createElement("h3");

                groupTitle.className =
                    "notification-group-title";

                groupTitle.textContent =
                    groupName;

                group.appendChild(groupTitle);


                groupNotifications.forEach(
                    notification => {

                        const card =
                            createNotificationCard(
                                notification
                            );

                        group.appendChild(card);

                    }
                );


                notificationsContainer.appendChild(
                    group
                );

            }
        );


        updateUnreadCount();

    }


    /* =========================================
       CREATE NOTIFICATION CARD
    ========================================= */

    function createNotificationCard(
        notification
    ) {

        const card =
            document.createElement("div");

        card.className =
            "notification-card";

        card.dataset.id =
            notification.id;

        card.dataset.type =
            notification.type;


        if (!notification.isRead) {

            card.classList.add("unread");

        }


        /* =====================================
           ICON
        ===================================== */

        const icon =
            document.createElement("div");

        icon.className =
            "notification-icon";

        icon.innerHTML =
            `<i class="fas ${getNotificationIcon(
                notification.type
            )}"></i>`;


        /* =====================================
           CONTENT
        ===================================== */

        const content =
            document.createElement("div");

        content.className =
            "notification-content";


        const title =
            document.createElement("h4");

        title.textContent =
            notification.title;


        const message =
            document.createElement("p");

        message.textContent =
            notification.message;


        const meta =
            document.createElement("div");

        meta.className =
            "notification-meta";


        const type =
            document.createElement("span");

        type.className =
            "notification-type";

        type.textContent =
            getNotificationType(
                notification.type
            );


        const date =
            document.createElement("span");

        date.className =
            "notification-date";

        date.textContent =
            formatDate(
                notification.createdAt
            );


        meta.appendChild(type);
        meta.appendChild(date);

        content.appendChild(title);
        content.appendChild(message);
        content.appendChild(meta);


        /* =====================================
           ACTIONS
        ===================================== */

        const actions =
            document.createElement("div");

        actions.className =
            "notification-actions";


        if (!notification.isRead) {

            const readButton =
                document.createElement("button");

            readButton.type =
                "button";

            readButton.className =
                "notification-read-btn";

            readButton.title =
                "Mark as read";

            readButton.innerHTML =
                '<i class="fas fa-check"></i>';


            readButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    markNotificationAsRead(
                        notification.id
                    );

                }
            );


            actions.appendChild(
                readButton
            );

        } else {

            const readButton =
                document.createElement("button");

            readButton.type =
                "button";

            readButton.className =
                "notification-read-btn";

            readButton.title =
                "Already read";

            readButton.disabled =
                true;

            readButton.style.opacity =
                "0.5";

            readButton.innerHTML =
                '<i class="fas fa-check-double"></i>';

            actions.appendChild(
                readButton
            );

        }


        /* =====================================
           UNREAD DOT
        ===================================== */

        if (!notification.isRead) {

            const dot =
                document.createElement("span");

            dot.className =
                "unread-dot";

            actions.appendChild(dot);

        }


        /* =====================================
           FINAL CARD
        ===================================== */

        card.appendChild(icon);
        card.appendChild(content);
        card.appendChild(actions);


        /* =====================================
           CARD CLICK
        ===================================== */

        card.addEventListener(
            "click",
            () => {

                if (!notification.isRead) {

                    markNotificationAsRead(
                        notification.id
                    );

                }

            }
        );


        return card;

    }


    /* =========================================
       DATE GROUP
    ========================================= */

    function getDateGroup(dateValue) {

        if (!dateValue) {
            return "Recent";
        }

        const date =
            new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Recent";
        }

        const now =
            new Date();

        const today =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );

        const notificationDate =
            new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );

        const difference =
            Math.floor(
                (today - notificationDate) /
                (1000 * 60 * 60 * 24)
            );

        if (difference === 0) {
            return "Today";
        }

        if (difference === 1) {
            return "Yesterday";
        }

        if (difference <= 7) {
            return "This Week";
        }

        return "Older";

    }


    /* =========================================
       UPDATE UNREAD COUNT
    ========================================= */

    function updateUnreadCount() {

        const unreadCount =
            notifications.filter(
                notification =>
                    !notification.is_read
            ).length;


        if (unreadCountElement) {

            unreadCountElement.textContent =
                unreadCount;

        }


        if (sidebarCountElement) {

            if (unreadCount > 0) {

                sidebarCountElement.textContent =
                    unreadCount;

                sidebarCountElement.style.display =
                    "inline-flex";

            } else {

                sidebarCountElement.style.display =
                    "none";

            }

        }

    }


    /* =========================================
       MARK SINGLE NOTIFICATION AS READ
    ========================================= */

    async function markNotificationAsRead(
        notificationId
    ) {

        try {

            const response =
                await apiRequest(
                    `/notifications/${notificationId}/read`,
                    {
                        method: "PUT"
                    }
                );

            if (!response) return;


            console.log(
                "Mark Notification Read Status:",
                response.status
            );


            const data =
                await response.json();

            console.log(
                "Mark Notification Read Response:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Unable to mark notification as read"
                );

            }


            const notification =
                notifications.find(
                    item =>
                        item.id ===
                        notificationId
                );

            if (notification) {

                notification.is_read = true;

            }


            renderNotifications();

        } catch (error) {

            console.error(
                "Mark Notification Read Error:",
                error
            );

        }

    }


    /* =========================================
       MARK ALL AS READ
    ========================================= */

    if (markAllReadBtn) {

        markAllReadBtn.addEventListener(
            "click",
            async () => {

                try {

                    const response =
                        await apiRequest(
                            "/notifications/read-all",
                            {
                                method: "PUT"
                            }
                        );

                    if (!response) return;


                    console.log(
                        "Mark All Notifications Status:",
                        response.status
                    );


                    const data =
                        await response.json();

                    console.log(
                        "Mark All Notifications Response:",
                        data
                    );


                    if (!response.ok) {

                        throw new Error(
                            data.detail ||
                            "Unable to mark all notifications as read"
                        );

                    }


                    notifications.forEach(
                        notification => {

                            notification.is_read =
                                true;

                        }
                    );


                    renderNotifications();


                    markAllReadBtn.innerHTML =
                        '<i class="fas fa-check-double"></i> All read';


                    setTimeout(() => {

                        markAllReadBtn.innerHTML =
                            '<i class="fas fa-check-double"></i> Mark all as read';

                    }, 1800);


                } catch (error) {

                    console.error(
                        "Mark All Notifications Error:",
                        error
                    );

                }

            }
        );

    }


    /* =========================================
       FILTER NOTIFICATIONS
    ========================================= */

    filterButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );


                button.classList.add(
                    "active"
                );


                currentFilter =
                    button.dataset.filter ||
                    "all";


                renderNotifications();

            }
        );

    });


    /* =========================================
       LOGOUT
    ========================================= */

    const logoutButton =
        document.querySelector(".logout-btn");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            event => {

                const confirmLogout =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmLogout) {

                    event.preventDefault();
                    return;

                }


                localStorage.removeItem(
                    "accessToken"
                );

                sessionStorage.removeItem(
                    "accessToken"
                );

                localStorage.removeItem(
                    "aiVehicleUser"
                );

                sessionStorage.removeItem(
                    "aiVehicleUser"
                );

            }
        );

    }


    /* =========================================
       EMPTY STATE
    ========================================= */

    function updateEmptyState(isEmpty) {

        if (!emptyState) return;


        if (isEmpty) {

            emptyState.classList.add("show");

            if (notificationsContainer) {

                notificationsContainer.style.display =
                    "none";

            }

        } else {

            emptyState.classList.remove("show");

            if (notificationsContainer) {

                notificationsContainer.style.display =
                    "block";

            }

        }

    }


    /* =========================================
       INITIAL LOAD
    ========================================= */

    await loadNotifications();

});