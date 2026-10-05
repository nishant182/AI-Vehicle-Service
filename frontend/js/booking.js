/* =========================================================
   VEHICLEAI - BOOKING
   Backend Connected Booking System
========================================================= */

const API_BASE_URL = "https://ai-vehicle-service.onrender.com";

let vehicles = [];
let services = [];
let serviceCenters = [];

let selectedVehicle = null;
let selectedService = null;
let selectedCenter = null;


/* =========================================================
   AUTH
========================================================= */

function getToken() {
    return (
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken")
    );
}

function getUser() {
    try {
        return JSON.parse(
            localStorage.getItem("aiVehicleUser") ||
            sessionStorage.getItem("aiVehicleUser") ||
            "null"
        );
    } catch {
        return null;
    }
}

function requireLogin() {
    if (!getToken() || !getUser()) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(endpoint, options = {}) {

    const token = getToken();

    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
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

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {

        throw new Error(
            data?.detail ||
            data?.message ||
            `Request failed (${response.status})`
        );
    }

    return data;
}


/* =========================================================
   PAGE INIT
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    if (!requireLogin()) return;

    setupSidebar();
    setupLogout();
    setupDate();

    await loadVehicles();
    await loadServices();
    await loadServiceCenters();

    setupEvents();
    applyUrlParameters();

    updateSummary();
});


/* =========================================================
   LOAD VEHICLES
========================================================= */

async function loadVehicles() {

    try {

        const data = await apiRequest("/vehicles");

        vehicles = Array.isArray(data) ? data : [];

        console.log(
            "Booking Vehicles API Response:",
            vehicles
        );

        renderVehicles();

    } catch (error) {

        console.error(
            "Booking Vehicles API Error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load vehicles."
        );
    }
}


/* =========================================================
   RENDER VEHICLES
========================================================= */

function renderVehicles() {

    const select =
        document.getElementById("vehicleSelect");

    const emptyMessage =
        document.getElementById("vehicleEmptyMessage");

    if (!select) {
        console.error(
            "vehicleSelect not found."
        );
        return;
    }

    select.innerHTML = `
        <option value="">
            Select a vehicle
        </option>
    `;

    if (!vehicles.length) {

        if (emptyMessage) {
            emptyMessage.style.display = "block";
        }

        return;
    }

    if (emptyMessage) {
        emptyMessage.style.display = "none";
    }

    vehicles.forEach(vehicle => {

        const option =
            document.createElement("option");

        option.value = vehicle.id;

        option.textContent =
            `${vehicle.brand || ""} ${vehicle.model || ""}`.trim()
            + (
                vehicle.registration_number
                    ? ` — ${vehicle.registration_number}`
                    : ""
            );

        select.appendChild(option);
    });


    /*
       Automatically select first vehicle
    */

    select.value = String(
        vehicles[0].id
    );

    selectedVehicle = vehicles[0];

    updateSummary();
}


/* =========================================================
   LOAD SERVICES
========================================================= */

async function loadServices() {

    try {

        const data =
            await apiRequest("/services");

        services =
            Array.isArray(data)
                ? data
                : [];

        console.log(
            "Booking Services API Response:",
            services
        );

        renderServices();

    } catch (error) {

        console.error(
            "Booking Services API Error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load services."
        );
    }
}


/* =========================================================
   RENDER SERVICES
========================================================= */

function renderServices() {

    const container =
        document.querySelector(".service-options");

    if (!container) {

        console.error(
            ".service-options not found."
        );

        return;
    }

    /*
       Remove old hardcoded service options
    */

    container.innerHTML = "";


    services.forEach((service, index) => {

        const label =
            document.createElement("label");

        label.className =
            "service-option";


        const icon =
            getServiceIcon(service.name);


        label.innerHTML = `

            <input
                type="radio"
                name="service"
                value="${service.id}"
                data-service-id="${service.id}"
                ${index === 0 ? "checked" : ""}
            >

            <div class="service-option-content">

                <div class="service-option-icon">
                    ${icon}
                </div>

                <div>

                    <strong>
                        ${escapeHtml(service.name)}
                    </strong>

                    <span>
                        ${escapeHtml(
                            service.description ||
                            "Professional vehicle service"
                        )}
                    </span>

                </div>

            </div>

            <span class="service-price">
                ₹${Number(
                    service.base_price || 0
                ).toLocaleString("en-IN")}
            </span>

        `;


        container.appendChild(label);
    });


    /*
       Select first service
    */

    if (services.length) {

        selectedService =
            services[0];
    }


    updateSummary();
}


/* =========================================================
   LOAD SERVICE CENTERS
========================================================= */

async function loadServiceCenters() {

    try {

        const data =
            await apiRequest(
                "/service-centers"
            );

        serviceCenters =
            Array.isArray(data)
                ? data
                : [];

        console.log(
            "Booking Service Centers API Response:",
            serviceCenters
        );

        renderServiceCenters();

    } catch (error) {

        console.error(
            "Booking Service Centers API Error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load service centers."
        );
    }
}


/* =========================================================
   RENDER SERVICE CENTERS
========================================================= */

function renderServiceCenters() {

    const container =
        document.getElementById(
            "centerOptions"
        );

    if (!container) {

        console.error(
            "centerOptions not found."
        );

        return;
    }


    container.innerHTML = "";


    serviceCenters.forEach(
        (center, index) => {

            const label =
                document.createElement("label");

            label.className =
                "center-option";


            const icon =
                center.name &&
                center.name.toLowerCase().includes("ev")
                    ? "⚡"
                    : "🔧";


            label.innerHTML = `

                <input
                    type="radio"
                    name="center"
                    value="${center.id}"
                    data-center-id="${center.id}"
                    ${index === 0 ? "checked" : ""}
                >

                <div class="center-option-content">

                    <div class="center-option-icon">
                        ${icon}
                    </div>

                    <div>

                        <strong>
                            ${escapeHtml(
                                center.name ||
                                "Service Center"
                            )}
                        </strong>

                        <span>
                            ${
                                center.rating
                                    ? `★ ${escapeHtml(
                                        String(center.rating)
                                    )}`
                                    : "Service Center"
                            }
                            ${
                                center.review_count
                                    ? ` • ${escapeHtml(
                                        String(
                                            center.review_count
                                        )
                                    )} reviews`
                                    : ""
                            }
                        </span>

                        <small>
                            ${escapeHtml(
                                center.address ||
                                "Address not available"
                            )}
                        </small>

                    </div>

                </div>

            `;


            container.appendChild(label);
        }
    );


    if (serviceCenters.length) {

        selectedCenter =
            serviceCenters[0];
    }


    updateSummary();
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    /* Vehicle */

    const vehicleSelect =
        document.getElementById(
            "vehicleSelect"
        );

    if (vehicleSelect) {

        vehicleSelect.addEventListener(
            "change",
            () => {

                const vehicleId =
                    Number(
                        vehicleSelect.value
                    );

                selectedVehicle =
                    vehicles.find(
                        vehicle =>
                            Number(vehicle.id) ===
                            vehicleId
                    ) || null;

                updateSummary();
            }
        );
    }


    /* Service */

    document.addEventListener(
        "change",
        event => {

            if (
                event.target.matches(
                    'input[name="service"]'
                )
            ) {

                const serviceId =
                    Number(
                        event.target.value
                    );

                selectedService =
                    services.find(
                        service =>
                            Number(service.id) ===
                            serviceId
                    ) || null;

                updateSummary();
            }


            /* Center */

            if (
                event.target.matches(
                    'input[name="center"]'
                )
            ) {

                const centerId =
                    Number(
                        event.target.value
                    );

                selectedCenter =
                    serviceCenters.find(
                        center =>
                            Number(center.id) ===
                            centerId
                    ) || null;

                updateSummary();
            }
        }
    );


    /* Date */

    const dateInput =
        document.getElementById(
            "bookingDate"
        );

    if (dateInput) {

        dateInput.addEventListener(
            "change",
            updateSummary
        );
    }


    /* Time */

    const timeInput =
        document.getElementById(
            "bookingTime"
        );

    if (timeInput) {

        timeInput.addEventListener(
            "change",
            updateSummary
        );
    }


    /* Confirm */

    const confirmButton =
        document.getElementById(
            "confirmBookingBtn"
        );

    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            createBooking
        );
    }
}


/* =========================================================
   DATE
========================================================= */

function setupDate() {

    const dateInput =
        document.getElementById(
            "bookingDate"
        );

    if (!dateInput) return;


    const today =
        new Date();


    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    const todayString =
        `${year}-${month}-${day}`;


    dateInput.min =
        todayString;


    if (!dateInput.value) {

        dateInput.value =
            todayString;
    }
}


/* =========================================================
   CREATE BOOKING
========================================================= */

async function createBooking() {

    if (!selectedVehicle) {

        showMessage(
            "Please select a vehicle."
        );

        return;
    }


    if (!selectedService) {

        showMessage(
            "Please select a service."
        );

        return;
    }


    if (!selectedCenter) {

        showMessage(
            "Please select a service center."
        );

        return;
    }


    const dateInput =
        document.getElementById(
            "bookingDate"
        );

    const timeInput =
        document.getElementById(
            "bookingTime"
        );

    const notesInput =
        document.getElementById(
            "bookingNote"
        );


    const bookingDate =
        dateInput?.value;

    const selectedTime =
        timeInput?.value;


    if (!bookingDate) {

        showMessage(
            "Please select appointment date."
        );

        return;
    }


    if (!selectedTime) {

        showMessage(
            "Please select preferred time."
        );

        return;
    }


    /*
       IMPORTANT:
       HTML time is:
       10:00 AM

       Backend expects:
       10:00
    */

    const bookingTime =
        convertTimeTo24Hour(
            selectedTime
        );


    if (!bookingTime) {

        showMessage(
            "Invalid booking time."
        );

        return;
    }


    /*
       Check past date
    */

    const selectedDate =
        new Date(
            `${bookingDate}T00:00:00`
        );

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    if (selectedDate < today) {

        showMessage(
            "Booking date cannot be in the past."
        );

        return;
    }


    const notes =
        notesInput?.value.trim() ||
        null;


    /*
       EXACT backend payload
    */

    const payload = {

        vehicle_id:
            Number(
                selectedVehicle.id
            ),

        service_id:
            Number(
                selectedService.id
            ),

        service_center_id:
            Number(
                selectedCenter.id
            ),

        booking_date:
            bookingDate,

        booking_time:
            bookingTime,

        notes:
            notes
    };


    console.log(
        "Creating Booking:",
        payload
    );


    const button =
        document.getElementById(
            "confirmBookingBtn"
        );


    const originalText =
        button?.textContent;


    try {

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Booking...";
        }


        const booking =
            await apiRequest(
                "/bookings",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        console.log(
            "Booking API Status: 201"
        );

        console.log(
            "Booking API Response:",
            booking
        );


        if (!booking) return;


        showBookingModal(
            booking
        );


    } catch (error) {

        console.error(
            "Booking API Error:",
            error
        );


        showMessage(
            error.message ||
            "Booking failed."
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                originalText ||
                "Confirm Booking →";
        }
    }
}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const vehicleElement =
        document.getElementById(
            "summaryVehicle"
        );

    const serviceElement =
        document.getElementById(
            "summaryService"
        );

    const centerElement =
        document.getElementById(
            "summaryCenter"
        );

    const dateElement =
        document.getElementById(
            "summaryDate"
        );

    const timeElement =
        document.getElementById(
            "summaryTime"
        );

    const costElement =
        document.getElementById(
            "summaryCost"
        );


    if (vehicleElement) {

        vehicleElement.textContent =
            selectedVehicle
                ? `${selectedVehicle.brand || ""} ${selectedVehicle.model || ""}`.trim()
                : "Not selected";
    }


    if (serviceElement) {

        serviceElement.textContent =
            selectedService?.name ||
            "Not selected";
    }


    if (centerElement) {

        centerElement.textContent =
            selectedCenter?.name ||
            "Not selected";
    }


    const dateInput =
        document.getElementById(
            "bookingDate"
        );

    const timeInput =
        document.getElementById(
            "bookingTime"
        );


    if (dateElement) {

        dateElement.textContent =
            dateInput?.value
                ? formatDate(
                    dateInput.value
                )
                : "Not selected";
    }


    if (timeElement) {

        timeElement.textContent =
            timeInput?.value ||
            "Not selected";
    }


    const price =
        Number(
            selectedService?.base_price ||
            0
        );


    if (costElement) {

        costElement.textContent =
            `₹${price.toLocaleString(
                "en-IN"
            )}`;
    }
}


/* =========================================================
   URL PARAMETERS
========================================================= */

function applyUrlParameters() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    /*
       vehicleId
    */

    const vehicleId =
        Number(
            params.get(
                "vehicleId"
            )
        );


    if (vehicleId) {

        const vehicle =
            vehicles.find(
                item =>
                    Number(item.id) ===
                    vehicleId
            );

        if (vehicle) {

            const select =
                document.getElementById(
                    "vehicleSelect"
                );

            if (select) {

                select.value =
                    String(vehicle.id);
            }

            selectedVehicle =
                vehicle;
        }
    }


    /*
       service
       Supports service ID OR service name
    */

    const serviceParam =
        params.get("service");


    if (serviceParam) {

        const service =
            services.find(
                item =>
                    String(item.id) ===
                        serviceParam ||
                    item.name
                        .toLowerCase() ===
                        serviceParam.toLowerCase()
            );


        if (service) {

            selectedService =
                service;

            const radio =
                document.querySelector(
                    `input[name="service"][value="${service.id}"]`
                );

            if (radio) {
                radio.checked =
                    true;
            }
        }
    }


    /*
       center
       Supports center ID OR center name
    */

    const centerParam =
        params.get("center");


    if (centerParam) {

        const center =
            serviceCenters.find(
                item =>
                    String(item.id) ===
                        centerParam ||
                    item.name
                        ?.toLowerCase() ===
                        centerParam.toLowerCase()
            );


        if (center) {

            selectedCenter =
                center;

            const radio =
                document.querySelector(
                    `input[name="center"][value="${center.id}"]`
                );

            if (radio) {
                radio.checked =
                    true;
            }
        }
    }


    updateSummary();
}


/* =========================================================
   BOOKING SUCCESS MODAL
========================================================= */

function showBookingModal(
    booking
) {

    const modal =
        document.getElementById(
            "bookingSuccessModal"
        );

    if (!modal) {

        alert(
            `Booking confirmed!\nBooking ID: ${booking.id}`
        );

        return;
    }


    const bookingIdElement =
        document.getElementById(
            "generatedBookingId"
        );


    if (bookingIdElement) {

        bookingIdElement.textContent =
            `#${booking.id}`;
    }


    modal.style.display =
        "flex";
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeBookingModal() {

    const modal =
        document.getElementById(
            "bookingSuccessModal"
        );

    if (modal) {

        modal.style.display =
            "none";
    }


    /*
       Reset booking selections
       but keep vehicle data
    */

    const dateInput =
        document.getElementById(
            "bookingDate"
        );

    const timeInput =
        document.getElementById(
            "bookingTime"
        );

    const notesInput =
        document.getElementById(
            "bookingNote"
        );


    if (timeInput) {
        timeInput.value = "";
    }

    if (notesInput) {
        notesInput.value = "";
    }


    updateSummary();
}


/* =========================================================
   TIME CONVERTER
========================================================= */

function convertTimeTo24Hour(
    timeString
) {

    if (!timeString) {
        return null;
    }


    /*
       Already 24 hour
       Example: 10:00
    */

    if (
        /^\d{2}:\d{2}$/.test(
            timeString
        )
    ) {

        return timeString;
    }


    /*
       Example:
       10:00 AM
       02:00 PM
    */

    const match =
        timeString.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
        );


    if (!match) {
        return null;
    }


    let hour =
        Number(match[1]);

    const minute =
        match[2];

    const period =
        match[3].toUpperCase();


    if (
        period === "AM" &&
        hour === 12
    ) {
        hour = 0;
    }


    if (
        period === "PM" &&
        hour !== 12
    ) {
        hour += 12;
    }


    return (
        String(hour).padStart(2, "0") +
        ":" +
        minute
    );
}


/* =========================================================
   SERVICE ICON
========================================================= */

function getServiceIcon(
    serviceName
) {

    const name =
        String(
            serviceName || ""
        ).toLowerCase();


    if (name.includes("oil"))
        return "🛢️";

    if (name.includes("brake"))
        return "🛑";

    if (name.includes("battery"))
        return "🔋";

    if (name.includes("tyre"))
        return "🛞";

    if (name.includes("ac"))
        return "❄️";

    if (name.includes("washing"))
        return "🚿";

    if (
        name.includes("alignment")
    )
        return "⚙️";

    if (
        name.includes("denting") ||
        name.includes("painting")
    )
        return "🎨";

    if (name.includes("ev"))
        return "⚡";

    return "🔧";
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message
) {

    console.error(
        "Booking:",
        message
    );


    let messageBox =
        document.getElementById(
            "bookingMessage"
        );


    if (!messageBox) {

        messageBox =
            document.createElement(
                "div"
            );

        messageBox.id =
            "bookingMessage";

        messageBox.style.cssText = `
            margin: 15px 0;
            padding: 14px 18px;
            border-radius: 10px;
            background: rgba(255, 60, 60, 0.12);
            border: 1px solid rgba(255, 80, 80, 0.35);
            color: #ff8f8f;
            font-size: 14px;
        `;


        const content =
            document.querySelector(
                ".booking-content"
            );


        if (content) {
            content.prepend(
                messageBox
            );
        }
    }


    messageBox.textContent =
        message;


    messageBox.style.display =
        "block";


    setTimeout(() => {

        messageBox.style.display =
            "none";

    }, 5000);
}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const menuToggle =
        document.getElementById(
            "menuToggle"
        );

    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if (
        !menuToggle ||
        !sidebar
    ) {
        return;
    }


    menuToggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "active"
            );
        }
    );
}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    document
        .querySelectorAll(
            ".logout-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    logoutUser();
                }
            );
        });
}


function logoutUser(event) {

    if (event) {
        event.preventDefault();
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

    localStorage.removeItem(
        "rememberLogin"
    );

    sessionStorage.removeItem(
        "rememberLogin"
    );


    window.location.href =
        "login.html";
}


/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


function formatDate(
    value
) {

    if (!value) {
        return "Not selected";
    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
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