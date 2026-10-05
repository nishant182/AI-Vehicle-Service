/* =========================================
   AI VEHICLE ASSISTANT
   Backend Connected Version
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       API CONFIG
    ===================================== */

    const API_BASE_URL = "https://ai-vehicle-service.onrender.com";

    /* =====================================
       AUTH HELPERS
    ===================================== */

    function getAccessToken() {

        return (
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken")
        );

    }


    function getLoggedInUser() {

        return localStorage.getItem("aiVehicleUser");

    }


    const token = getAccessToken();
    const user = getLoggedInUser();


    if (!token || !user) {

        window.location.href = "login.html";

        return;

    }


    /* =====================================
       ELEMENTS
    ===================================== */

    const menuBtn =
        document.getElementById("menuBtn");

    const sidebar =
        document.getElementById("sidebar");

    const input =
        document.getElementById("problemInput");

    const sendBtn =
        document.getElementById("sendProblemBtn");

    const chatMessages =
        document.getElementById("chatMessages");

    const clearChatBtn =
        document.getElementById("clearChatBtn");

    const clearHistoryBtn =
        document.getElementById("clearHistoryBtn");

    const recentQuestions =
        document.getElementById("recentQuestions");

    const vehicleSelector =
        document.getElementById("aiVehicleSelector");

    const logoutBtn =
        document.getElementById("logoutBtn");


    /* =====================================
       MOBILE MENU
    ===================================== */

    if (menuBtn && sidebar) {

        menuBtn.addEventListener("click", () => {

            sidebar.classList.toggle("active");

        });

    }


    /* =====================================
       LOGOUT
    ===================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener("click", () => {

            localStorage.removeItem("accessToken");
            sessionStorage.removeItem("accessToken");

            localStorage.removeItem("aiVehicleUser");
            localStorage.removeItem("rememberLogin");

            window.location.href = "login.html";

        });

    }


    /* =====================================
       VEHICLES
    ===================================== */

    let vehicles = [];
    let selectedVehicle = null;


    async function loadVehicles() {

        if (!vehicleSelector) {
            return;
        }


        try {

            vehicleSelector.innerHTML = `
                <option value="">
                    Loading vehicles...
                </option>
            `;


            const response = await fetch(
                `${API_BASE_URL}/vehicles`,
                {
                    method: "GET",

                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );


            if (response.status === 401 ||
                response.status === 403) {

                handleAuthenticationError();

                return;

            }


            if (!response.ok) {

                throw new Error(
                    `Vehicles API failed: ${response.status}`
                );

            }


            vehicles = await response.json();


            console.log(
                "AI Assistant Vehicles API Response:",
                vehicles
            );


            vehicleSelector.innerHTML = "";


            if (!Array.isArray(vehicles) ||
                vehicles.length === 0) {

                vehicleSelector.innerHTML = `
                    <option value="">
                        No vehicles found
                    </option>
                `;

                updateSelectedVehicle();

                return;

            }


            vehicles.forEach((vehicle) => {

                const option =
                    document.createElement("option");


                option.value =
                    vehicle.id;


                option.textContent =
                    `${vehicle.brand || "Vehicle"} ${
                        vehicle.model || ""
                    } - ${
                        vehicle.registration_number ||
                        "No Registration"
                    }`;


                vehicleSelector.appendChild(
                    option
                );

            });


            selectedVehicle =
                vehicles[0];


            vehicleSelector.value =
                selectedVehicle.id;


            updateSelectedVehicle();


            vehicleSelector.addEventListener(
                "change",
                updateSelectedVehicle
            );


        } catch (error) {

            console.error(
                "Vehicle loading error:",
                error
            );


            vehicleSelector.innerHTML = `
                <option value="">
                    Unable to load vehicles
                </option>
            `;

        }

    }


    /* =====================================
       UPDATE SELECTED VEHICLE
    ===================================== */

    function updateSelectedVehicle() {

        if (!vehicleSelector) {
            return;
        }


        const selectedId =
            vehicleSelector.value;


        selectedVehicle =
            vehicles.find(
                vehicle =>
                    String(vehicle.id) ===
                    String(selectedId)
            );


        const vehicleName =
            document.getElementById(
                "selectedVehicleName"
            );


        const vehicleReg =
            document.getElementById(
                "selectedVehicleReg"
            );


        if (!selectedVehicle) {

            if (vehicleName) {

                vehicleName.textContent =
                    "No vehicle selected";

            }


            if (vehicleReg) {

                vehicleReg.textContent =
                    "Add a vehicle first";

            }


            return;

        }


        if (vehicleName) {

            vehicleName.textContent =
                `${selectedVehicle.brand || "Vehicle"} ${
                    selectedVehicle.model || ""
                }`;

        }


        if (vehicleReg) {

            vehicleReg.textContent =
                selectedVehicle.registration_number ||
                "No Registration";

        }

    }


    /* =====================================
       QUICK QUESTIONS
    ===================================== */

    document
        .querySelectorAll(".quick-question")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (!input) {
                        return;
                    }


                    input.value =
                        button.dataset.question || "";


                    input.focus();

                }
            );

        });


    /* =====================================
       SEND BUTTON
    ===================================== */

    if (sendBtn) {

        sendBtn.addEventListener(
            "click",
            sendMessage
        );

    }


    /* =====================================
       ENTER TO SEND
    ===================================== */

    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );

    }


    /* =====================================
       SEND MESSAGE
    ===================================== */

    async function sendMessage() {

        if (!input) {
            return;
        }


        const question =
            input.value.trim();


        /* Empty question */

        if (!question) {

            input.focus();

            return;

        }


        /* Character validation */

        if (question.length < 3) {

            addAIMessage(
                "Please describe the vehicle problem in a little more detail.",
                [],
                [],
                "Please provide at least a few words describing the problem."
            );

            input.focus();

            return;

        }


        if (question.length > 2000) {

            addAIMessage(
                "Your problem description is too long.",
                [],
                [],
                "Please keep the description within 2000 characters."
            );

            return;

        }


        /* Vehicle validation */

        if (!selectedVehicle) {

            addAIMessage(
                "No vehicle is selected.",
                [],
                [
                    "Add a vehicle from My Vehicles.",
                    "Select a vehicle before asking the AI assistant."
                ],
                "The AI assistant needs a vehicle to analyze the reported problem."
            );

            return;

        }


        /* User message */

        addUserMessage(
            question
        );


        input.value = "";


        /* Save question */

        saveQuestion(
            question
        );


        /* Disable send */

        setSendButtonState(
            true
        );


        /* AI typing */

        showTyping();


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/ai-assistant/analyze`,
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            vehicle_id:
                                Number(
                                    selectedVehicle.id
                                ),

                            problem:
                                question

                        })
                    }
                );


            console.log(
                "AI Assistant API Status:",
                response.status
            );


            /* Authentication */

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                removeTyping();

                handleAuthenticationError();

                return;

            }


            /* Read response */

            const data =
                await response.json();


            console.log(
                "AI Assistant API Response:",
                data
            );


            /* Backend error */

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "AI Assistant request failed."
                );

            }


            /* Remove typing */

            removeTyping();


            /* AI response */

            addAIMessage(
                getAIResponseTitle(
                    data.urgency
                ),

                Array.isArray(
                    data.possible_causes
                )
                    ? data.possible_causes
                    : [],

                Array.isArray(
                    data.recommended_actions
                )
                    ? data.recommended_actions
                    : [],

                data.disclaimer ||
                    "This AI response provides general guidance only and is not a final mechanical diagnosis.",

                data.urgency
            );


        } catch (error) {

            console.error(
                "AI Assistant Error:",
                error
            );


            removeTyping();


            addAIMessage(
                "I couldn't connect to the AI service.",
                [],
                [
                    "Make sure the FastAPI backend is running.",
                    "Check that the OpenAI API key is configured in backend/.env.",
                    "Try sending the problem again."
                ],
                error.message ||
                    "AI service is currently unavailable."
            );

        } finally {

            setSendButtonState(
                false
            );

        }

    }


    /* =====================================
       AI RESPONSE TITLE
    ===================================== */

    function getAIResponseTitle(
        urgency
    ) {

        switch (
            String(urgency || "").toLowerCase()
        ) {

            case "critical":

                return "This problem may require immediate attention.";

            case "high":

                return "This problem may require prompt inspection.";

            case "medium":

                return "Here are the possible causes and recommended actions.";

            default:

                return "Based on the information you provided, here are some possibilities.";

        }

    }


    /* =====================================
       SEND BUTTON STATE
    ===================================== */

    function setSendButtonState(
        loading
    ) {

        if (!sendBtn) {
            return;
        }


        sendBtn.disabled =
            loading;


        if (loading) {

            sendBtn.dataset.originalText =
                sendBtn.textContent;


            sendBtn.textContent =
                "Analyzing...";

        } else {

            sendBtn.textContent =
                sendBtn.dataset.originalText ||
                "Send";

        }

    }


    /* =====================================
       USER MESSAGE
    ===================================== */

    function addUserMessage(
        text
    ) {

        if (!chatMessages) {
            return;
        }


        const message =
            document.createElement("div");


        message.className =
            "chat-message user-message";


        message.innerHTML = `

            <div class="message-content">

                <span class="message-name">
                    You
                </span>

                <div class="message-bubble">
                    ${escapeHTML(text)}
                </div>

            </div>

            <div class="message-avatar">
                NB
            </div>

        `;


        chatMessages.appendChild(
            message
        );


        scrollChat();

    }


    /* =====================================
       AI MESSAGE
    ===================================== */

    function addAIMessage(
        title,
        possibleCauses,
        recommendations,
        safety,
        urgency = ""
    ) {

        if (!chatMessages) {
            return;
        }


        const message =
            document.createElement("div");


        message.className =
            "chat-message ai-message";


        const causes =
            Array.isArray(
                possibleCauses
            )
                ? possibleCauses
                : [];


        const actions =
            Array.isArray(
                recommendations
            )
                ? recommendations
                : [];


        const causesHTML =
            causes.length > 0
                ? causes
                    .map(
                        cause =>
                            `<li>${escapeHTML(
                                String(cause)
                            )}</li>`
                    )
                    .join("")
                : `
                    <li>
                        No specific causes were returned.
                    </li>
                `;


        const recommendationsHTML =
            actions.length > 0
                ? actions
                    .map(
                        item =>
                            `<li>${escapeHTML(
                                String(item)
                            )}</li>`
                    )
                    .join("")
                : `
                    <li>
                        No specific actions were returned.
                    </li>
                `;


        const urgencyHTML =
            urgency
                ? `
                    <div class="ai-urgency">
                        <strong>Urgency:</strong>
                        ${escapeHTML(
                            String(urgency)
                        )}
                    </div>
                `
                : "";


        message.innerHTML = `

            <div class="message-avatar">
                ✦
            </div>

            <div class="message-content">

                <span class="message-name">
                    VehicleAI
                </span>

                <div class="message-bubble">

                    ${escapeHTML(title)}

                    ${urgencyHTML}

                    <div class="ai-result">

                        <div class="ai-result-section">

                            <strong>
                                Possible causes
                            </strong>

                            <ul>
                                ${causesHTML}
                            </ul>

                        </div>


                        <div class="ai-result-section">

                            <strong>
                                Recommended actions
                            </strong>

                            <ul>
                                ${recommendationsHTML}
                            </ul>

                        </div>


                        <div class="ai-result-section">

                            <strong>
                                Safety note
                            </strong>

                            <p>
                                ${escapeHTML(
                                    String(safety)
                                )}
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        `;


        chatMessages.appendChild(
            message
        );


        scrollChat();

    }


    /* =====================================
       TYPING INDICATOR
    ===================================== */

    function showTyping() {

        if (!chatMessages) {
            return;
        }


        if (
            document.getElementById(
                "aiTypingMessage"
            )
        ) {

            return;

        }


        const message =
            document.createElement("div");


        message.id =
            "aiTypingMessage";


        message.className =
            "chat-message ai-message";


        message.innerHTML = `

            <div class="message-avatar">
                ✦
            </div>

            <div class="message-content">

                <span class="message-name">
                    VehicleAI
                </span>

                <div class="typing-message">

                    <span></span>
                    <span></span>
                    <span></span>

                </div>

            </div>

        `;


        chatMessages.appendChild(
            message
        );


        scrollChat();

    }


    /* =====================================
       REMOVE TYPING
    ===================================== */

    function removeTyping() {

        const typing =
            document.getElementById(
                "aiTypingMessage"
            );


        if (typing) {

            typing.remove();

        }

    }


    /* =====================================
       CHAT SCROLL
    ===================================== */

    function scrollChat() {

        if (!chatMessages) {
            return;
        }


        chatMessages.scrollTop =
            chatMessages.scrollHeight;

    }


    /* =====================================
       CLEAR CHAT
    ===================================== */

    if (clearChatBtn) {

        clearChatBtn.addEventListener(
            "click",
            () => {

                removeTyping();


                chatMessages.innerHTML = `

                    <div class="chat-message ai-message">

                        <div class="message-avatar">
                            ✦
                        </div>

                        <div class="message-content">

                            <span class="message-name">
                                VehicleAI
                            </span>

                            <div class="message-bubble">

                                Chat cleared. 👋

                                <br><br>

                                Tell me about your
                                vehicle problem and
                                I'll help you understand
                                the possible causes.

                            </div>

                        </div>

                    </div>

                `;

            }
        );

    }


    /* =====================================
       HISTORY
    ===================================== */

    function saveQuestion(
        question
    ) {

        let history =
            JSON.parse(
                localStorage.getItem(
                    "aiVehicleAIHistory"
                )
            ) || [];


        history.unshift({

            question:
                question,

            date:
                new Date().toISOString()

        });


        history =
            history.slice(
                0,
                6
            );


        localStorage.setItem(
            "aiVehicleAIHistory",
            JSON.stringify(history)
        );


        renderHistory();

    }


    function renderHistory() {

        const history =
            JSON.parse(
                localStorage.getItem(
                    "aiVehicleAIHistory"
                )
            ) || [];


        if (!recentQuestions) {
            return;
        }


        if (history.length === 0) {

            recentQuestions.innerHTML = `

                <div class="empty-ai-history">

                    <span>✦</span>

                    <p>
                        Your recent questions
                        will appear here.
                    </p>

                </div>

            `;

            return;

        }


        recentQuestions.innerHTML =
            "";


        history.forEach(
            item => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "recent-question-card";


                card.innerHTML = `

                    <span>✦</span>

                    <p>
                        ${escapeHTML(
                            item.question
                        )}
                    </p>

                `;


                recentQuestions.appendChild(
                    card
                );

            }
        );

    }


    renderHistory();


    /* =====================================
       CLEAR HISTORY
    ===================================== */

    if (clearHistoryBtn) {

        clearHistoryBtn.addEventListener(
            "click",
            () => {

                localStorage.removeItem(
                    "aiVehicleAIHistory"
                );


                renderHistory();

            }
        );

    }


    /* =====================================
       AUTH ERROR
    ===================================== */

    function handleAuthenticationError() {

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


    /* =====================================
       HTML ESCAPE
    ===================================== */

    function escapeHTML(
        value
    ) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            value == null
                ? ""
                : String(value);


        return div.innerHTML;

    }


    /* =====================================
       INITIALIZE
    ===================================== */

    loadVehicles();

});