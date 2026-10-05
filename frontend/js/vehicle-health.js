/* =========================================================
   AI VEHICLE SERVICE
   VEHICLE HEALTH — API CONNECTED + 3D MONITOR
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       API CONFIG
    ===================================================== */

    const API_BASE_URL = "http://127.0.0.1:8000";


    /* =====================================================
       AUTH HELPERS
    ===================================================== */

    function getAccessToken() {

        return (
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken")
        );

    }


    function getSavedUser() {

        const userData =
            localStorage.getItem("aiVehicleUser") ||
            sessionStorage.getItem("aiVehicleUser");

        if (!userData) {
            return null;
        }

        try {
            return JSON.parse(userData);
        } catch (error) {
            console.warn("User data could not be parsed.");
            return null;
        }

    }


    const accessToken = getAccessToken();
    const savedUser = getSavedUser();


    /* =====================================================
       AUTH CHECK
    ===================================================== */

    if (!accessToken || !savedUser) {

        window.location.href = "login.html";
        return;

    }


    /* =====================================================
       DOM ELEMENTS
    ===================================================== */

    const viewer =
        document.getElementById("vehicle3DViewer");

    const modelContainer =
        document.getElementById("vehicleModelContainer");

    const loading =
        document.getElementById("viewerLoading");

    const resetButton =
        document.getElementById("resetCamera");

    const zoomInButton =
        document.getElementById("zoomIn");

    const zoomOutButton =
        document.getElementById("zoomOut");

    const vehicleSelect =
        document.getElementById("vehicleSelect");

    const overallScore =
        document.getElementById("overallScore");

    const topbarUserName =
        document.getElementById("topbarUserName");

    const selectedTitle =
        document.getElementById("selectedComponentTitle");

    const componentStatus =
        document.getElementById("componentStatus");

    const componentScore =
        document.getElementById("componentScore");

    const componentScoreFill =
        document.getElementById("componentScoreFill");

    const currentStatus =
        document.getElementById("componentCurrentStatus");

    const lastChecked =
        document.getElementById("componentLastChecked");

    const maintenance =
        document.getElementById("componentMaintenance");

    const aiRecommendation =
        document.getElementById("aiRecommendation");


    /* =====================================================
       VEHICLE HEALTH DATA
    ===================================================== */

    let healthData = null;
    let vehicles = [];
    let selectedVehicleId = null;


    /* =====================================================
       COMPONENT CONFIG
    ===================================================== */

    const componentConfig = {

        engine: {
            title: "Engine",
            scoreKey: "engine_score"
        },

        brakes: {
            title: "Brakes",
            scoreKey: "brakes_score"
        },

        battery: {
            title: "Battery",
            scoreKey: "battery_score"
        },

        tyres: {
            title: "Tyres",
            scoreKey: "tyres_score"
        },

        oil: {
            title: "Engine Oil",
            scoreKey: "oil_score"
        }

    };


    /* =====================================================
       THREE.JS VARIABLES
    ===================================================== */

    let scene;
    let camera;
    let renderer;
    let controls;

    let vehicleModel = null;

    let animationFrame;

    const cameraInitialPosition = {
        x: 4.7,
        y: 2.8,
        z: 6.2
    };


    /* =====================================================
       API REQUEST HELPER
    ===================================================== */

    async function apiRequest(
        endpoint,
        options = {}
    ) {

        const token = getAccessToken();

        if (!token) {

            window.location.href = "login.html";
            return null;

        }

        const headers = {
            ...(options.headers || {}),
            "Authorization": `Bearer ${token}`
        };

        if (
            options.body &&
            !(options.body instanceof FormData)
        ) {

            headers["Content-Type"] =
                "application/json";

        }

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}${endpoint}`,
                    {
                        ...options,
                        headers
                    }
                );


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                localStorage.removeItem("accessToken");
                sessionStorage.removeItem("accessToken");

                localStorage.removeItem("aiVehicleUser");
                sessionStorage.removeItem("aiVehicleUser");

                window.location.href = "login.html";

                return null;

            }


            if (!response.ok) {

                let errorMessage =
                    `API request failed: ${response.status}`;

                try {

                    const errorData =
                        await response.json();

                    if (errorData.detail) {
                        errorMessage =
                            errorData.detail;
                    }

                } catch (error) {
                    // Ignore JSON parsing error.
                }

                throw new Error(errorMessage);

            }

            return await response.json();

        } catch (error) {

            console.error(
                "API Error:",
                error
            );

            throw error;

        }

    }


    /* =====================================================
       LOAD VEHICLES
    ===================================================== */

    async function loadVehicles() {

        if (!vehicleSelect) {
            return;
        }

        try {

            console.log(
                "Loading vehicles for Vehicle Health..."
            );


            const data =
                await apiRequest(
                    "/vehicles"
                );


            if (!data) {
                return;
            }


            vehicles = Array.isArray(data)
                ? data
                : [];


            console.log(
                "Vehicle Health Vehicles API Response:",
                vehicles
            );


            vehicleSelect.innerHTML = "";


            if (vehicles.length === 0) {

                const option =
                    document.createElement("option");

                option.value = "";
                option.textContent =
                    "No vehicles found";

                vehicleSelect.appendChild(
                    option
                );

                return;

            }


            vehicles.forEach(
                (vehicle) => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        vehicle.id;


                    const vehicleName =
                        `${vehicle.brand || ""} ${vehicle.model || ""}`
                            .trim();


                    option.textContent =
                        vehicleName ||
                        `Vehicle #${vehicle.id}`;


                    vehicleSelect.appendChild(
                        option
                    );

                }
            );


            /* ---------------------------------------------
               Select first vehicle
            --------------------------------------------- */

            selectedVehicleId =
                vehicles[0].id;

            vehicleSelect.value =
                selectedVehicleId;


            await loadVehicleHealth(
                selectedVehicleId
            );


        } catch (error) {

            console.error(
                "Could not load vehicles:",
                error
            );

            showHealthError(
                "Vehicle data could not be loaded."
            );

        }

    }


    /* =====================================================
       LOAD VEHICLE HEALTH
    ===================================================== */

    async function loadVehicleHealth(
        vehicleId
    ) {

        if (!vehicleId) {
            return;
        }


        selectedVehicleId =
            Number(vehicleId);


        console.log(
            "Loading Vehicle Health:",
            selectedVehicleId
        );


        try {

            showLoading(true);


            const data =
                await apiRequest(
                    `/vehicle-health/${selectedVehicleId}`
                );


            if (!data) {
                return;
            }


            healthData =
                data;


            console.log(
                "Vehicle Health API Response:",
                healthData
            );


            updateVehicleHealthUI(
                healthData
            );


        } catch (error) {

            console.error(
                "Vehicle Health API Error:",
                error
            );

            showHealthError(
                "Vehicle health data could not be loaded."
            );

        } finally {

            showLoading(false);

        }

    }


    /* =====================================================
       UPDATE VEHICLE HEALTH UI
    ===================================================== */

    function updateVehicleHealthUI(
        data
    ) {

        if (!data) {
            return;
        }


        /* ---------------------------------------------
           Overall Score
        --------------------------------------------- */

        if (overallScore) {

            overallScore.textContent =
                data.overall_score ?? "--";

        }


        /* ---------------------------------------------
           Quick Stats
        --------------------------------------------- */

        updateQuickStat(
            "engine",
            data.engine_score
        );

        updateQuickStat(
            "brakes",
            data.brakes_score
        );

        updateQuickStat(
            "battery",
            data.battery_score
        );

        updateQuickStat(
            "tyres",
            data.tyres_score
        );


        /* ---------------------------------------------
           Vehicle Model Text
        --------------------------------------------- */

        updateVehicleModelText();


        /* ---------------------------------------------
           Select Engine Initially
        --------------------------------------------- */

        selectComponent("engine");


        /* ---------------------------------------------
           Overall Recommendations
        --------------------------------------------- */

        updateOverallRecommendation(
            data
        );

    }


    /* =====================================================
       QUICK STAT UPDATE
    ===================================================== */

    function updateQuickStat(
        component,
        score
    ) {

        if (score === undefined || score === null) {
            return;
        }


        const selectors = {

            engine: [
                '[data-health-component="engine"]',
                "#engineScore"
            ],

            brakes: [
                '[data-health-component="brakes"]',
                "#brakesScore"
            ],

            battery: [
                '[data-health-component="battery"]',
                "#batteryScore"
            ],

            tyres: [
                '[data-health-component="tyres"]',
                "#tyresScore"
            ]

        };


        const possibleSelectors =
            selectors[component] || [];


        for (
            const selector
            of possibleSelectors
        ) {

            const element =
                document.querySelector(
                    selector
                );


            if (element) {

                element.textContent =
                    score;

                break;

            }

        }

    }


    /* =====================================================
       UPDATE VEHICLE MODEL TEXT
    ===================================================== */

    function updateVehicleModelText() {

        const vehicle =
            vehicles.find(
                (item) =>
                    Number(item.id) ===
                    Number(selectedVehicleId)
            );


        if (!vehicle) {
            return;
        }


        const vehicleText =
            `${vehicle.brand || ""} ${vehicle.model || ""}, ${vehicle.year || ""}`
                .replace(/\s+/g, " ")
                .trim();


        /*
         * Update common vehicle information
         * without depending on a specific HTML ID.
         */

        document
            .querySelectorAll(
                ".vehicle-model-name, .selected-vehicle-name, [data-vehicle-name]"
            )
            .forEach(
                (element) => {

                    element.textContent =
                        vehicleText;

                }
            );


        document
            .querySelectorAll(
                ".vehicle-model-label, .selected-vehicle-label, [data-vehicle-label]"
            )
            .forEach(
                (element) => {

                    const fuel =
                        vehicle.fuel_type
                            ? ` • ${vehicle.fuel_type}`
                            : "";

                    element.textContent =
                        `${vehicleText}${fuel}`;

                }
            );

    }


    /* =====================================================
       OVERALL RECOMMENDATION
    ===================================================== */

    function updateOverallRecommendation(
        data
    ) {

        if (!data.recommendations) {
            return;
        }


        const recommendations =
            Array.isArray(
                data.recommendations
            )
                ? data.recommendations
                : [];


        /*
         * Existing AI recommendation card
         * remains component-specific.
         *
         * Overall recommendations are also
         * exposed to any matching element.
         */

        document
            .querySelectorAll(
                "#overallRecommendation, " +
                "#healthRecommendation, " +
                "[data-overall-recommendation]"
            )
            .forEach(
                (element) => {

                    if (
                        recommendations.length
                    ) {

                        element.textContent =
                            recommendations.join(" ");

                    }

                }
            );

    }


    /* =====================================================
       COMPONENT DATA FROM API
    ===================================================== */

    function getComponentData(
        componentName
    ) {

        if (!healthData) {
            return null;
        }


        const config =
            componentConfig[
                componentName
            ];


        if (!config) {
            return null;
        }


        const score =
            Number(
                healthData[
                    config.scoreKey
                ]
            );


        let status =
            "Good";

        let statusClass =
            "good";

        let currentStatus =
            "Operating normally";

        let maintenanceText =
            "No immediate service required";

        let recommendation =
            "Vehicle component is currently operating normally.";


        if (score < 60) {

            status =
                "Critical";

            statusClass =
                "critical";

            currentStatus =
                "Immediate inspection recommended";

            maintenanceText =
                "Service should be scheduled soon";

            recommendation =
                "This component requires attention. " +
                "Please arrange an inspection or service.";

        } else if (score < 80) {

            status =
                "Attention";

            statusClass =
                "warning";

            currentStatus =
                "Inspection recommended";

            maintenanceText =
                "Maintenance should be planned soon";

            recommendation =
                "This component may require attention " +
                "during the next maintenance visit.";

        }


        /*
         * Use backend recommendations when
         * they are available.
         */

        const recommendations =
            Array.isArray(
                healthData.recommendations
            )
                ? healthData.recommendations
            : [];


        if (recommendations.length) {

            const matchingRecommendation =
                getMatchingRecommendation(
                    componentName,
                    recommendations
                );


            if (matchingRecommendation) {

                recommendation =
                    matchingRecommendation;

            }

        }


        return {

            title:
                config.title,

            score,

            status,

            statusClass,

            currentStatus,

            lastChecked:
                formatUpdatedAt(
                    healthData.updated_at
                ),

            maintenance:
                maintenanceText,

            recommendation

        };

    }


    /* =====================================================
       FIND MATCHING RECOMMENDATION
    ===================================================== */

    function getMatchingRecommendation(
        componentName,
        recommendations
    ) {

        const keywords = {

            engine: [
                "engine"
            ],

            brakes: [
                "brake"
            ],

            battery: [
                "battery"
            ],

            tyres: [
                "tyre",
                "tire"
            ],

            oil: [
                "oil"
            ]

        };


        const words =
            keywords[
                componentName
            ] || [];


        return recommendations.find(
            (recommendation) => {

                const text =
                    String(
                        recommendation
                    ).toLowerCase();


                return words.some(
                    (word) =>
                        text.includes(word)
                );

            }
        ) || null;

    }


    /* =====================================================
       FORMAT UPDATED TIME
    ===================================================== */

    function formatUpdatedAt(
        value
    ) {

        if (!value) {
            return "Recently";
        }


        try {

            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "Recently";

            }


            return date.toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

        } catch (error) {

            return "Recently";

        }

    }


    /* =====================================================
       COMPONENT SELECTION
    ===================================================== */

    function selectComponent(
        componentName
    ) {

        const data =
            getComponentData(
                componentName
            );


        if (!data) {
            return;
        }


        /* ---------------------------------------------
           Title
        --------------------------------------------- */

        if (selectedTitle) {

            selectedTitle.textContent =
                data.title;

        }


        /* ---------------------------------------------
           Score
        --------------------------------------------- */

        if (componentScore) {

            componentScore.textContent =
                data.score;

        }


        if (componentScoreFill) {

            componentScoreFill.style.width =
                `${data.score}%`;

        }


        /* ---------------------------------------------
           Current Status
        --------------------------------------------- */

        if (currentStatus) {

            currentStatus.textContent =
                data.currentStatus;

        }


        /* ---------------------------------------------
           Last Checked
        --------------------------------------------- */

        if (lastChecked) {

            lastChecked.textContent =
                data.lastChecked;

        }


        /* ---------------------------------------------
           Maintenance
        --------------------------------------------- */

        if (maintenance) {

            maintenance.textContent =
                data.maintenance;

        }


        /* ---------------------------------------------
           Recommendation
        --------------------------------------------- */

        if (aiRecommendation) {

            aiRecommendation.textContent =
                data.recommendation;

        }


        /* ---------------------------------------------
           Status Badge
        --------------------------------------------- */

        if (componentStatus) {

            componentStatus.className =
                `component-status ${data.statusClass}`;


            let icon =
                "fa-circle-check";


            if (
                data.statusClass ===
                "warning"
            ) {

                icon =
                    "fa-triangle-exclamation";

            }


            if (
                data.statusClass ===
                "critical"
            ) {

                icon =
                    "fa-circle-exclamation";

            }


            componentStatus.innerHTML =
                `<i class="fa-solid ${icon}"></i> ${data.status}`;

        }


        /* ---------------------------------------------
           Active Component Card
        --------------------------------------------- */

        document
            .querySelectorAll(
                ".component-card"
            )
            .forEach(
                (card) => {

                    card.classList.toggle(
                        "active",
                        card.dataset.component ===
                        componentName
                    );

                }
            );


        /* ---------------------------------------------
           Active Hotspot
        --------------------------------------------- */

        document
            .querySelectorAll(
                ".vehicle-hotspot"
            )
            .forEach(
                (hotspot) => {

                    hotspot.classList.toggle(
                        "selected",
                        hotspot.dataset.component ===
                        componentName
                    );

                }
            );

    }


    /* =====================================================
       HOTSPOT EVENTS
    ===================================================== */

    document
        .querySelectorAll(
            ".vehicle-hotspot"
        )
        .forEach(
            (hotspot) => {

                hotspot.addEventListener(
                    "click",
                    () => {

                        const component =
                            hotspot.dataset.component;

                        selectComponent(
                            component
                        );

                    }
                );

            }
        );


    /* =====================================================
       COMPONENT CARD EVENTS
    ===================================================== */

    document
        .querySelectorAll(
            ".component-card"
        )
        .forEach(
            (card) => {

                card.addEventListener(
                    "click",
                    () => {

                        const component =
                            card.dataset.component;

                        selectComponent(
                            component
                        );

                    }
                );

            }
        );


    /* =====================================================
       VEHICLE SELECTOR EVENT
    ===================================================== */

    if (vehicleSelect) {

        vehicleSelect.addEventListener(
            "change",
            async (event) => {

                const vehicleId =
                    event.target.value;


                console.log(
                    "Selected vehicle:",
                    vehicleId
                );


                if (!vehicleId) {
                    return;
                }


                await loadVehicleHealth(
                    vehicleId
                );

            }
        );

    }


    /* =====================================================
       BUTTON EVENTS
    ===================================================== */

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetCamera
        );

    }


    if (zoomInButton) {

        zoomInButton.addEventListener(
            "click",
            zoomIn
        );

    }


    if (zoomOutButton) {

        zoomOutButton.addEventListener(
            "click",
            zoomOut
        );

    }


    /* =====================================================
       THREE.JS INITIALIZE
    ===================================================== */

    function init3D() {

        if (!modelContainer) {
            return;
        }


        if (
            typeof THREE ===
            "undefined"
        ) {

            console.error(
                "Three.js is not loaded."
            );

            showLoading(false);

            return;

        }


        scene =
            new THREE.Scene();


        scene.background =
            new THREE.Color(
                0x07111d
            );


        camera =
            new THREE.PerspectiveCamera(
                45,
                getViewerWidth() /
                getViewerHeight(),
                0.1,
                1000
            );


        camera.position.set(
            cameraInitialPosition.x,
            cameraInitialPosition.y,
            cameraInitialPosition.z
        );


        renderer =
            new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });


        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio,
                2
            )
        );


        renderer.setSize(
            getViewerWidth(),
            getViewerHeight()
        );


        renderer.outputEncoding =
            THREE.sRGBEncoding;


        renderer.shadowMap.enabled =
            true;


        renderer.shadowMap.type =
            THREE.PCFSoftShadowMap;


        modelContainer.appendChild(
            renderer.domElement
        );


        if (
            typeof THREE.OrbitControls !==
            "undefined"
        ) {

            controls =
                new THREE.OrbitControls(
                    camera,
                    renderer.domElement
                );


            controls.enableDamping =
                true;


            controls.dampingFactor =
                0.07;


            controls.enablePan =
                false;


            controls.minDistance =
                3.2;


            controls.maxDistance =
                9;


            controls.target.set(
                0,
                0.75,
                0
            );

        }


        addLights();

        createFloor();

        loadVehicleModel();


        window.addEventListener(
            "resize",
            handleResize
        );


        animate();

    }


    /* =====================================================
       LIGHTS
    ===================================================== */

    function addLights() {

        const ambient =
            new THREE.AmbientLight(
                0xffffff,
                1.7
            );

        scene.add(
            ambient
        );


        const keyLight =
            new THREE.DirectionalLight(
                0xffffff,
                2.8
            );

        keyLight.position.set(
            5,
            8,
            6
        );

        keyLight.castShadow =
            true;

        scene.add(
            keyLight
        );


        const blueLight =
            new THREE.PointLight(
                0x3fa9ff,
                4,
                15
            );

        blueLight.position.set(
            -5,
            3,
            2
        );

        scene.add(
            blueLight
        );


        const backLight =
            new THREE.PointLight(
                0x1b72bd,
                3,
                12
            );

        backLight.position.set(
            3,
            2,
            -5
        );

        scene.add(
            backLight
        );

    }


    /* =====================================================
       FLOOR
    ===================================================== */

    function createFloor() {

        const geometry =
            new THREE.CircleGeometry(
                5,
                64
            );


        const material =
            new THREE.MeshStandardMaterial({
                color: 0x0b1c2c,
                transparent: true,
                opacity: 0.72,
                roughness: 0.9,
                metalness: 0.1
            });


        const floor =
            new THREE.Mesh(
                geometry,
                material
            );


        floor.rotation.x =
            -Math.PI / 2;


        floor.position.y =
            -0.65;


        floor.receiveShadow =
            true;


        scene.add(
            floor
        );


        const ringGeometry =
            new THREE.RingGeometry(
                2.7,
                2.73,
                64
            );


        const ringMaterial =
            new THREE.MeshBasicMaterial({
                color: 0x2389d3,
                transparent: true,
                opacity: 0.22,
                side: THREE.DoubleSide
            });


        const ring =
            new THREE.Mesh(
                ringGeometry,
                ringMaterial
            );


        ring.rotation.x =
            -Math.PI / 2;


        ring.position.y =
            -0.63;


        scene.add(
            ring
        );

    }


    /* =====================================================
       LOAD VEHICLE MODEL
    ===================================================== */

    function loadVehicleModel() {

        if (
            typeof THREE.GLTFLoader ===
            "undefined"
        ) {

            createFallbackVehicle();

            showLoading(false);

            return;

        }


        const loader =
            new THREE.GLTFLoader();


        const modelPath =
            "assets/models/car.glb";


        loader.load(

            modelPath,

            (gltf) => {

                vehicleModel =
                    gltf.scene;


                prepareVehicleModel(
                    vehicleModel
                );


                scene.add(
                    vehicleModel
                );


                showLoading(false);

            },

            undefined,

            (error) => {

                console.warn(
                    "3D car model could not be loaded.",
                    error
                );


                createFallbackVehicle();

                showLoading(false);

            }

        );

    }


    /* =====================================================
       PREPARE REAL MODEL
    ===================================================== */

    function prepareVehicleModel(
        model
    ) {

        const box =
            new THREE.Box3().setFromObject(
                model
            );


        const size =
            new THREE.Vector3();


        const center =
            new THREE.Vector3();


        box.getSize(
            size
        );


        box.getCenter(
            center
        );


        model.position.x -=
            center.x;


        model.position.y -=
            center.y;


        model.position.z -=
            center.z;


        const maxDimension =
            Math.max(
                size.x,
                size.y,
                size.z
            );


        const targetSize =
            4.6;


        const scale =
            targetSize /
            maxDimension;


        model.scale.setScalar(
            scale
        );


        model.position.y =
            -0.15;


        model.traverse(
            (child) => {

                if (
                    child.isMesh
                ) {

                    child.castShadow =
                        true;

                    child.receiveShadow =
                        true;

                }

            }
        );

    }


    /* =====================================================
       FALLBACK VEHICLE
    ===================================================== */

    function createFallbackVehicle() {

        if (vehicleModel) {

            scene.remove(
                vehicleModel
            );

        }


        vehicleModel =
            new THREE.Group();


        const bodyMaterial =
            new THREE.MeshPhysicalMaterial({
                color: 0x1675b8,
                metalness: 0.72,
                roughness: 0.25,
                clearcoat: 0.8,
                clearcoatRoughness: 0.15
            });


        const bodyGeometry =
            new THREE.BoxGeometry(
                4.5,
                0.85,
                1.8
            );


        const body =
            new THREE.Mesh(
                bodyGeometry,
                bodyMaterial
            );


        body.position.y =
            0.25;


        body.castShadow =
            true;


        vehicleModel.add(
            body
        );


        const cabinMaterial =
            new THREE.MeshPhysicalMaterial({
                color: 0x0b1b2b,
                metalness: 0.4,
                roughness: 0.18,
                transparent: true,
                opacity: 0.92
            });


        const cabinGeometry =
            new THREE.BoxGeometry(
                2.25,
                0.78,
                1.55
            );


        const cabin =
            new THREE.Mesh(
                cabinGeometry,
                cabinMaterial
            );


        cabin.position.set(
            -0.15,
            0.95,
            0
        );


        cabin.rotation.z =
            -0.03;


        cabin.castShadow =
            true;


        vehicleModel.add(
            cabin
        );


        const hoodGeometry =
            new THREE.BoxGeometry(
                1.1,
                0.38,
                1.72
            );


        const hood =
            new THREE.Mesh(
                hoodGeometry,
                bodyMaterial
            );


        hood.position.set(
            1.58,
            0.72,
            0
        );


        hood.castShadow =
            true;


        vehicleModel.add(
            hood
        );


        const rearGeometry =
            new THREE.BoxGeometry(
                0.85,
                0.55,
                1.72
            );


        const rear =
            new THREE.Mesh(
                rearGeometry,
                bodyMaterial
            );


        rear.position.set(
            -1.7,
            0.62,
            0
        );


        rear.castShadow =
            true;


        vehicleModel.add(
            rear
        );


        createWindow(
            vehicleModel,
            -0.82,
            1.25,
            0
        );


        createWindow(
            vehicleModel,
            0.42,
            1.25,
            0
        );


        const wheelPositions = [

            [1.48, -0.2, 0.92],
            [1.48, -0.2, -0.92],
            [-1.48, -0.2, 0.92],
            [-1.48, -0.2, -0.92]

        ];


        wheelPositions.forEach(
            (position) => {

                createWheel(
                    vehicleModel,
                    position
                );

            }
        );


        createHeadlight(
            vehicleModel,
            2.27,
            0.43,
            0.58
        );


        createHeadlight(
            vehicleModel,
            2.27,
            0.43,
            -0.58
        );


        const grilleGeometry =
            new THREE.BoxGeometry(
                0.08,
                0.28,
                0.85
            );


        const grilleMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x02070c,
                metalness: 0.5,
                roughness: 0.35
            });


        const grille =
            new THREE.Mesh(
                grilleGeometry,
                grilleMaterial
            );


        grille.position.set(
            2.28,
            0.27,
            0
        );


        vehicleModel.add(
            grille
        );


        vehicleModel.position.y =
            0.05;


        scene.add(
            vehicleModel
        );

    }


    /* =====================================================
       WINDOW
    ===================================================== */

    function createWindow(
        parent,
        x,
        y,
        z
    ) {

        const geometry =
            new THREE.BoxGeometry(
                0.85,
                0.48,
                1.48
            );


        const material =
            new THREE.MeshPhysicalMaterial({
                color: 0x06121e,
                metalness: 0.25,
                roughness: 0.08,
                transparent: true,
                opacity: 0.92
            });


        const windowMesh =
            new THREE.Mesh(
                geometry,
                material
            );


        windowMesh.position.set(
            x,
            y,
            z
        );


        parent.add(
            windowMesh
        );

    }


    /* =====================================================
       WHEEL
    ===================================================== */

    function createWheel(
        parent,
        position
    ) {

        const tyreGeometry =
            new THREE.CylinderGeometry(
                0.47,
                0.47,
                0.28,
                32
            );


        const tyreMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x05080b,
                roughness: 0.86,
                metalness: 0.08
            });


        const tyre =
            new THREE.Mesh(
                tyreGeometry,
                tyreMaterial
            );


        tyre.rotation.x =
            Math.PI / 2;


        tyre.position.set(
            position[0],
            position[1],
            position[2]
        );


        tyre.castShadow =
            true;


        parent.add(
            tyre
        );


        const rimGeometry =
            new THREE.CylinderGeometry(
                0.25,
                0.25,
                0.3,
                24
            );


        const rimMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x8795a3,
                metalness: 0.8,
                roughness: 0.25
            });


        const rim =
            new THREE.Mesh(
                rimGeometry,
                rimMaterial
            );


        rim.rotation.x =
            Math.PI / 2;


        rim.position.set(
            position[0],
            position[1],
            position[2]
        );


        parent.add(
            rim
        );

    }


    /* =====================================================
       HEADLIGHT
    ===================================================== */

    function createHeadlight(
        parent,
        x,
        y,
        z
    ) {

        const geometry =
            new THREE.BoxGeometry(
                0.08,
                0.18,
                0.3
            );


        const material =
            new THREE.MeshStandardMaterial({
                color: 0xccecff,
                emissive: 0x57baff,
                emissiveIntensity: 3
            });


        const light =
            new THREE.Mesh(
                geometry,
                material
            );


        light.position.set(
            x,
            y,
            z
        );


        parent.add(
            light
        );

    }


    /* =====================================================
       ANIMATION
    ===================================================== */

    function animate() {

        animationFrame =
            requestAnimationFrame(
                animate
            );


        if (controls) {

            controls.update();

        }


        renderer.render(
            scene,
            camera
        );

    }


    /* =====================================================
       RESET CAMERA
    ===================================================== */

    function resetCamera() {

        if (!camera) {
            return;
        }


        camera.position.set(
            cameraInitialPosition.x,
            cameraInitialPosition.y,
            cameraInitialPosition.z
        );


        if (controls) {

            controls.target.set(
                0,
                0.75,
                0
            );


            controls.update();

        }

    }


    /* =====================================================
       ZOOM IN
    ===================================================== */

    function zoomIn() {

        if (!camera) {
            return;
        }


        const direction =
            new THREE.Vector3();


        camera.getWorldDirection(
            direction
        );


        camera.position.addScaledVector(
            direction,
            0.45
        );

    }


    /* =====================================================
       ZOOM OUT
    ===================================================== */

    function zoomOut() {

        if (!camera) {
            return;
        }


        const direction =
            new THREE.Vector3();


        camera.getWorldDirection(
            direction
        );


        camera.position.addScaledVector(
            direction,
            -0.45
        );

    }


    /* =====================================================
       RESIZE
    ===================================================== */

    function handleResize() {

        if (
            !camera ||
            !renderer
        ) {

            return;

        }


        const width =
            getViewerWidth();


        const height =
            getViewerHeight();


        camera.aspect =
            width / height;


        camera.updateProjectionMatrix();


        renderer.setSize(
            width,
            height
        );

    }


    function getViewerWidth() {

        return (
            modelContainer?.clientWidth ||
            viewer?.clientWidth ||
            800
        );

    }


    function getViewerHeight() {

        return (
            modelContainer?.clientHeight ||
            viewer?.clientHeight ||
            470
        );

    }


    /* =====================================================
       LOADING STATE
    ===================================================== */

    function showLoading(
        show
    ) {

        if (!loading) {
            return;
        }


        loading.classList.toggle(
            "hidden",
            !show
        );

    }


    /* =====================================================
       HEALTH ERROR
    ===================================================== */

    function showHealthError(
        message
    ) {

        console.error(
            message
        );


        const errorElement =
            document.querySelector(
                "#vehicleHealthError, " +
                ".vehicle-health-error, " +
                "[data-health-error]"
            );


        if (errorElement) {

            errorElement.textContent =
                message;

            errorElement.classList.remove(
                "hidden"
            );

        }

    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            (event) => {

                event.preventDefault();


                const confirmLogout =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmLogout) {
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


                localStorage.removeItem(
                    "aiVehicleProfile"
                );


                window.location.href =
                    "login.html";

            }
        );

    }


    /* =====================================================
       TOPBAR USER
    ===================================================== */

    if (topbarUserName) {

        const profileData =
            localStorage.getItem(
                "aiVehicleProfile"
            ) ||
            localStorage.getItem(
                "aiVehicleUser"
            ) ||
            sessionStorage.getItem(
                "aiVehicleUser"
            );


        if (profileData) {

            try {

                const profile =
                    JSON.parse(
                        profileData
                    );


                if (profile.name) {

                    topbarUserName.textContent =
                        profile.name;

                }

            } catch (error) {

                console.warn(
                    "Profile data could not be loaded."
                );

            }

        }

    }


    /* =====================================================
       INITIALIZE PAGE
    ===================================================== */

    showLoading(true);


    /*
     * Start 3D independently.
     * API data is loaded separately.
     */

    init3D();


    /*
     * Load real user vehicles and
     * then their health information.
     */

    loadVehicles();

});