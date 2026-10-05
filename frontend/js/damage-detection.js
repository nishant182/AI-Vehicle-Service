// =========================================================
// AI DAMAGE DETECTION
// Backend Connected Version
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------------------------
    // API CONFIG
    // -----------------------------------------------------

    const API_BASE_URL = "http://127.0.0.1:8000";


    // -----------------------------------------------------
    // AUTH
    // -----------------------------------------------------

    const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

    const user =
        localStorage.getItem("aiVehicleUser") ||
        sessionStorage.getItem("aiVehicleUser");

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }


    // -----------------------------------------------------
    // ELEMENTS
    // -----------------------------------------------------

    const vehicleSelect =
        document.getElementById("vehicleSelect");

    const uploadArea =
        document.getElementById("uploadArea");

    const damageImage =
        document.getElementById("damageImage");

    const uploadPlaceholder =
        document.getElementById("uploadPlaceholder");

    const imagePreview =
        document.getElementById("imagePreview");

    const previewImage =
        document.getElementById("previewImage");

    const chooseImageBtn =
        document.getElementById("chooseImageBtn");

    const removeImageBtn =
        document.getElementById("removeImageBtn");

    const analyzeBtn =
        document.getElementById("analyzeBtn");

    const analysisResult =
        document.getElementById("analysisResult");

    const newAnalysisBtn =
        document.getElementById("newAnalysisBtn");


    // -----------------------------------------------------
    // LOAD VEHICLES FROM BACKEND
    // -----------------------------------------------------

    async function loadVehicles() {

        if (!vehicleSelect) return;

        try {

            const response = await fetch(
                `${API_BASE_URL}/vehicles`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            console.log(
                "Damage Detection Vehicles API Status:",
                response.status
            );

            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }

            const vehicles = await response.json();

            console.log(
                "Damage Detection Vehicles API Response:",
                vehicles
            );

            vehicleSelect.innerHTML =
                '<option value="">Select Vehicle</option>';

            if (!Array.isArray(vehicles) || vehicles.length === 0) {

                const option =
                    document.createElement("option");

                option.value = "";
                option.textContent =
                    "No vehicle added yet";

                option.disabled = true;

                vehicleSelect.appendChild(option);

                return;
            }

            vehicles.forEach(vehicle => {

                const option =
                    document.createElement("option");

                option.value = vehicle.id;

                option.textContent =
                    `${vehicle.brand || ""} ${vehicle.model || ""} - ${vehicle.registration_number || "No Registration"}`;

                vehicleSelect.appendChild(option);

            });

            // Auto select if only one vehicle
            if (vehicles.length === 1) {
                vehicleSelect.value =
                    vehicles[0].id;
            }

        } catch (error) {

            console.error(
                "Damage Detection Vehicles Error:",
                error
            );

            alert(
                "Unable to load vehicles. Please check the backend server."
            );
        }
    }


    loadVehicles();


    // -----------------------------------------------------
    // CHOOSE IMAGE
    // -----------------------------------------------------

    if (chooseImageBtn) {

        chooseImageBtn.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                damageImage.click();

            }
        );

    }


    // -----------------------------------------------------
    // UPLOAD AREA CLICK
    // -----------------------------------------------------

    if (uploadArea) {

        uploadArea.addEventListener(
            "click",
            (event) => {

                if (
                    event.target.closest(".remove-image") ||
                    event.target.closest(".primary-btn")
                ) {
                    return;
                }

                damageImage.click();

            }
        );

    }


    // -----------------------------------------------------
    // IMAGE SELECT
    // -----------------------------------------------------

    if (damageImage) {

        damageImage.addEventListener(
            "change",
            function () {

                const file =
                    this.files[0];

                if (!file) return;

                handleImage(file);

            }
        );

    }


    // -----------------------------------------------------
    // IMAGE HANDLER
    // -----------------------------------------------------

    function handleImage(file) {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {

            alert(
                "Please upload JPG, PNG or WEBP image only."
            );

            resetImageInput();

            return;
        }


        // Frontend limit
        const maxSize =
            10 * 1024 * 1024;

        if (file.size > maxSize) {

            alert(
                "Image size must be less than 10 MB."
            );

            resetImageInput();

            return;
        }


        const reader =
            new FileReader();

        reader.onload = function (event) {

            previewImage.src =
                event.target.result;

            uploadPlaceholder.style.display =
                "none";

            imagePreview.style.display =
                "block";

            analyzeBtn.disabled =
                false;

        };

        reader.readAsDataURL(file);
    }


    // -----------------------------------------------------
    // REMOVE IMAGE
    // -----------------------------------------------------

    if (removeImageBtn) {

        removeImageBtn.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                resetImage();

            }
        );

    }


    function resetImage() {

        if (damageImage) {
            damageImage.value = "";
        }

        if (previewImage) {
            previewImage.src = "";
        }

        if (imagePreview) {
            imagePreview.style.display = "none";
        }

        if (uploadPlaceholder) {
            uploadPlaceholder.style.display = "flex";
        }

        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.classList.remove("loading");
            analyzeBtn.textContent =
                "✦ Analyze Damage";
        }

        if (analysisResult) {
            analysisResult.style.display = "none";
        }
    }


    function resetImageInput() {

        if (damageImage) {
            damageImage.value = "";
        }

    }


    // -----------------------------------------------------
    // DRAG & DROP
    // -----------------------------------------------------

    if (uploadArea) {

        uploadArea.addEventListener(
            "dragover",
            (event) => {

                event.preventDefault();

                uploadArea.classList.add(
                    "drag-active"
                );

            }
        );


        uploadArea.addEventListener(
            "dragleave",
            () => {

                uploadArea.classList.remove(
                    "drag-active"
                );

            }
        );


        uploadArea.addEventListener(
            "drop",
            (event) => {

                event.preventDefault();

                uploadArea.classList.remove(
                    "drag-active"
                );

                const file =
                    event.dataTransfer.files[0];

                if (!file) return;

                handleImage(file);

            }
        );

    }


    // -----------------------------------------------------
    // ANALYZE DAMAGE
    // -----------------------------------------------------

    if (analyzeBtn) {

        analyzeBtn.addEventListener(
            "click",
            analyzeDamage
        );

    }


    async function analyzeDamage() {

        // Check image
        if (
            !damageImage ||
            !damageImage.files ||
            !damageImage.files.length
        ) {

            alert(
                "Please upload a damage image first."
            );

            return;
        }


        // Check vehicle
        if (
            !vehicleSelect ||
            !vehicleSelect.value
        ) {

            alert(
                "Please select a vehicle first."
            );

            vehicleSelect.focus();

            return;
        }


        const file =
            damageImage.files[0];

        const vehicleId =
            vehicleSelect.value;


        // -------------------------------------------------
        // LOADING STATE
        // -------------------------------------------------

        analyzeBtn.disabled = true;

        analyzeBtn.classList.add(
            "loading"
        );

        analyzeBtn.textContent =
            "Analyzing Damage...";


        try {

            // -------------------------------------------------
            // FORM DATA
            // -------------------------------------------------

            const formData =
                new FormData();

            formData.append(
                "vehicle_id",
                vehicleId
            );

            formData.append(
                "image",
                file
            );


            // -------------------------------------------------
            // BACKEND REQUEST
            // -------------------------------------------------

            const response =
                await fetch(
                    `${API_BASE_URL}/damage-detection/analyze`,
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: formData
                    }
                );


            console.log(
                "Damage Detection API Status:",
                response.status
            );


            let data;

            try {

                data =
                    await response.json();

            } catch (jsonError) {

                data = {
                    detail:
                        "Invalid response from server."
                };

            }


            console.log(
                "Damage Detection API Response:",
                data
            );


            // -------------------------------------------------
            // AUTH ERROR
            // -------------------------------------------------

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logout();

                return;
            }


            // -------------------------------------------------
            // API ERROR
            // -------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Damage detection failed."
                );

            }


            // -------------------------------------------------
            // SHOW BACKEND RESULT
            // -------------------------------------------------

            showAnalysisResult(data);


        } catch (error) {

            console.error(
                "Damage Detection Error:",
                error
            );

            alert(
                error.message ||
                "Unable to analyze damage. Please try again."
            );

        } finally {

            analyzeBtn.disabled = false;

            analyzeBtn.classList.remove(
                "loading"
            );

            analyzeBtn.textContent =
                "✦ Analyze Damage";

        }

    }


    // -----------------------------------------------------
    // SHOW RESULT
    // -----------------------------------------------------

    function showAnalysisResult(data) {

        if (!analysisResult) return;


        // -------------------------------------------------
        // BACKEND DAMAGE DATA
        // -------------------------------------------------

        const damages =
            Array.isArray(data.damages)
                ? data.damages
                : [];


        const firstDamage =
            damages.length > 0
                ? damages[0]
                : null;


        // -------------------------------------------------
        // DAMAGE TYPE
        // -------------------------------------------------

        const damageType =
            document.getElementById(
                "damageType"
            );

        if (damageType) {

            damageType.textContent =
                firstDamage
                    ? firstDamage.damage_type
                    : "No specific damage detected";

        }


        // -------------------------------------------------
        // SEVERITY
        // -------------------------------------------------

        const damageSeverity =
            document.getElementById(
                "damageSeverity"
            );

        if (damageSeverity) {

            damageSeverity.textContent =
                firstDamage
                    ? firstDamage.severity
                    : "Unknown";

        }


        // -------------------------------------------------
        // COST
        // -------------------------------------------------

        const repairCost =
            document.getElementById(
                "repairCost"
            );

        if (repairCost) {

            repairCost.textContent =
                `₹${Number(
                    data.total_estimated_cost || 0
                ).toLocaleString("en-IN")}`;

        }


        // -------------------------------------------------
        // SERVICE
        // -------------------------------------------------

        const recommendedService =
            document.getElementById(
                "recommendedService"
            );

        if (recommendedService) {

            recommendedService.textContent =
                getRecommendedService(
                    damages
                );

        }


        // -------------------------------------------------
        // DESCRIPTION
        // -------------------------------------------------

        const analysisText =
            document.getElementById(
                "analysisText"
            );

        if (analysisText) {

            if (firstDamage) {

                analysisText.textContent =
                    firstDamage.description ||
                    data.recommendation ||
                    "Professional inspection is recommended.";

            } else {

                analysisText.textContent =
                    data.recommendation ||
                    "No visible damage was identified.";

            }

        }


        // -------------------------------------------------
        // SEVERITY BADGE
        // -------------------------------------------------

        const severityBadge =
            document.getElementById(
                "severityBadge"
            );

        if (severityBadge) {

            severityBadge.textContent =
                firstDamage
                    ? firstDamage.severity
                    : "Unknown";

        }


        // -------------------------------------------------
        // SHOW RESULT
        // -------------------------------------------------

        analysisResult.style.display =
            "block";


        // -------------------------------------------------
        // SCROLL
        // -------------------------------------------------

        setTimeout(() => {

            analysisResult.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }, 100);

    }


    // -----------------------------------------------------
    // RECOMMENDED SERVICE
    // -----------------------------------------------------

    function getRecommendedService(damages) {

        if (!damages.length) {
            return "General Inspection";
        }

        const type =
            (
                damages[0].damage_type ||
                ""
            ).toLowerCase();


        if (
            type.includes("scratch") ||
            type.includes("dent") ||
            type.includes("bumper") ||
            type.includes("body") ||
            type.includes("paint")
        ) {

            return "Denting & Painting";
        }


        if (
            type.includes("glass") ||
            type.includes("windshield")
        ) {

            return "Glass Repair";
        }


        if (
            type.includes("tyre") ||
            type.includes("tire")
        ) {

            return "Tyre Service";
        }


        if (
            type.includes("brake")
        ) {

            return "Brake Service";
        }


        return "General Inspection";
    }


    // -----------------------------------------------------
    // NEW ANALYSIS
    // -----------------------------------------------------

    if (newAnalysisBtn) {

        newAnalysisBtn.addEventListener(
            "click",
            () => {

                resetImage();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


    // -----------------------------------------------------
    // MOBILE SIDEBAR
    // -----------------------------------------------------

    const sidebarToggle =
        document.getElementById(
            "sidebarToggle"
        );

    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if (
        sidebarToggle &&
        sidebar
    ) {

        sidebarToggle.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "open"
                );

            }
        );

    }


    // -----------------------------------------------------
    // LOGOUT
    // -----------------------------------------------------

    window.logout = function () {

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

        window.location.href =
            "login.html";

    };

});