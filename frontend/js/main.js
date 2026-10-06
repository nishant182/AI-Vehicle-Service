document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       NAVBAR ACTIVE LINK
    ===================================================== */

    const navLinks = document.querySelectorAll(".nav-links a");

    navLinks.forEach(link => {

        link.addEventListener("click", () => {

            navLinks.forEach(item => {
                item.classList.remove("active");
            });

            link.classList.add("active");
        });

    });


    /* =====================================================
       MOBILE SIDEBAR
    ===================================================== */

    const sidebar = document.querySelector(".sidebar");

    if (!sidebar) {
        return;
    }


    /* ---------- Find existing menu button ---------- */

    let menuButton = document.querySelector(
        ".menu-btn, .menu-toggle, .sidebar-toggle, #menuBtn, #menuToggle"
    );


    /* ---------- Create menu button if it doesn't exist ---------- */

    if (!menuButton) {

        menuButton = document.createElement("button");

        menuButton.className = "menu-btn";
        menuButton.type = "button";
        menuButton.innerHTML = "☰";
        menuButton.setAttribute("aria-label", "Open menu");

        document.body.appendChild(menuButton);
    }


    /* ---------- Sidebar overlay ---------- */

    let overlay = document.querySelector(".sidebar-overlay");

    if (!overlay) {

        overlay = document.createElement("div");

        overlay.className = "sidebar-overlay";

        document.body.appendChild(overlay);
    }


    /* =====================================================
       OPEN SIDEBAR
    ===================================================== */

    function openSidebar() {

        sidebar.classList.add("open");
        overlay.classList.add("show");

        document.body.classList.add("sidebar-open");

        menuButton.innerHTML = "✕";
        menuButton.setAttribute("aria-label", "Close menu");
    }


    /* =====================================================
       CLOSE SIDEBAR
    ===================================================== */

    function closeSidebar() {

        sidebar.classList.remove("open");
        overlay.classList.remove("show");

        document.body.classList.remove("sidebar-open");

        menuButton.innerHTML = "☰";
        menuButton.setAttribute("aria-label", "Open menu");
    }


    /* =====================================================
       TOGGLE SIDEBAR
    ===================================================== */

    function toggleSidebar() {

        if (sidebar.classList.contains("open")) {
            closeSidebar();
        } else {
            openSidebar();
        }

    }


    /* Make function available to HTML onclick */

    window.toggleSidebar = toggleSidebar;


    /* =====================================================
       MENU BUTTON CLICK
    ===================================================== */

    menuButton.addEventListener("click", toggleSidebar);


    /* =====================================================
       OVERLAY CLICK
    ===================================================== */

    overlay.addEventListener("click", closeSidebar);


    /* =====================================================
       CLOSE SIDEBAR WHEN NAV ITEM CLICKED
    ===================================================== */

    const sidebarLinks = sidebar.querySelectorAll("a");

    sidebarLinks.forEach(link => {

        link.addEventListener("click", () => {

            if (window.innerWidth <= 850) {
                closeSidebar();
            }

        });

    });


    /* =====================================================
       ESC KEY
    ===================================================== */

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            closeSidebar();
        }

    });


    /* =====================================================
       WINDOW RESIZE
    ===================================================== */

    window.addEventListener("resize", () => {

        if (window.innerWidth > 850) {
            closeSidebar();
        }

    });

});