const API_BASE_URL = "https://ai-vehicle-service.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {

    const adminNavItem = document.getElementById("adminNavItem");

    if (!adminNavItem) {
        console.log("Admin menu element not found.");
        return;
    }

    const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

    console.log("Admin menu token:", !!token);

    if (!token) {
        return;
    }

    try {

        const response = await fetch(
            `${ADMIN_MENU_API}/auth/me`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        console.log("Admin check status:", response.status);

        const user = await response.json();

        console.log("Admin check user:", user);

        if (user.is_admin === true) {
            adminNavItem.style.display = "flex";
            console.log("Admin Dashboard enabled.");
        }

    } catch (error) {

        console.error(
            "Admin menu error:",
            error
        );
    }
});