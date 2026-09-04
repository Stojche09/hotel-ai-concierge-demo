(function () {

    /*
    ============================================================
    HOTEL AI CONCIERGE WIDGET
    ============================================================

    Multi-hotel:
    - Hotel Makpetrol
    - Hotel Belica

    Guest session isolation:
    - New tab = new guest session
    - Duplicated tab = new guest session
    - Refresh same tab = same guest session
    ============================================================
    */


    // =========================================================
    // API
    // =========================================================

    const API_URL =
        "https://hotel-ai-backend-production.up.railway.app/booking/message";


    // =========================================================
    // CURRENT SCRIPT / HOTEL
    // =========================================================

    const currentScript =
        document.currentScript;


    const HOTEL_ID =
        (
            currentScript?.dataset?.hotel ||
            "makpetrol"
        )
            .trim()
            .toLowerCase();


    // =========================================================
    // HOTEL CONFIG
    // =========================================================

    const HOTEL_CONFIG = {

        makpetrol: {

            name:
                "Hotel Makpetrol",

            primaryColor:
                "#1d4ed8",

            primaryHover:
                "#1e40af",

            welcomeMessage:
                "Hello! Welcome to Hotel Makpetrol. How can I help you today?",

            placeholder:
                "Ask Hotel Makpetrol AI Concierge...",

            errorMessage:
                "I'm sorry, the Hotel Makpetrol AI Concierge is temporarily unavailable. Please try again."
        },


        belica: {

            name:
                "Hotel Belica",

            primaryColor:
                "#2e7d32",

            primaryHover:
                "#1b5e20",

            welcomeMessage:
                "Hello! Welcome to Hotel Belica. How can I help you today?",

            placeholder:
                "Ask Hotel Belica AI Concierge...",

            errorMessage:
                "I'm sorry, the Hotel Belica AI Concierge is temporarily unavailable. Please try again."
        }
    };


    const hotelConfig =
        HOTEL_CONFIG[HOTEL_ID] ||
        HOTEL_CONFIG.makpetrol;


    // =========================================================
    // GUEST SESSION
    // =========================================================
    //
    // Browser behavior:
    //
    // Normal new tab:
    // -> new session
    //
    // Duplicated tab:
    // -> browser may copy sessionStorage,
    //    so we detect that this is NOT a reload
    //    and generate a fresh session
    //
    // Refresh:
    // -> keep current session
    //
    // =========================================================

    const SESSION_STORAGE_KEY =
        `hotel_ai_session_${HOTEL_ID}`;


    function createSessionId() {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID ===
                "function"
        ) {

            return window.crypto.randomUUID();
        }


        return (
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 12)
        );
    }


    const navigationEntries =
        performance.getEntriesByType(
            "navigation"
        );


    const navigationEntry =
        navigationEntries.length > 0
            ? navigationEntries[0]
            : null;


    const isReload =
        navigationEntry?.type ===
        "reload";


    let SESSION_ID =
        sessionStorage.getItem(
            SESSION_STORAGE_KEY
        );


    /*
    If this page is NOT a reload, create
    a fresh guest session.

    This also protects us when the browser
    copies sessionStorage during "Duplicate tab".
    */

    if (
        !isReload ||
        !SESSION_ID
    ) {

        SESSION_ID =
            createSessionId();


        sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            SESSION_ID
        );
    }


    console.log(
        "Hotel AI Concierge loaded:",
        {
            hotel_id:
                HOTEL_ID,

            session_id:
                SESSION_ID,

            navigation_type:
                navigationEntry?.type ||
                "unknown"
        }
    );


    // =========================================================
    // REMOVE OLD WIDGET IF PRESENT
    // =========================================================

    const existingWidget =
        document.getElementById(
            "hotel-ai-concierge-root"
        );


    if (existingWidget) {

        existingWidget.remove();
    }


    // =========================================================
    // ROOT
    // =========================================================

    const widgetRoot =
        document.createElement(
            "div"
        );


    widgetRoot.id =
        "hotel-ai-concierge-root";


    document.body.appendChild(
        widgetRoot
    );


    // =========================================================
    // SHADOW DOM
    // =========================================================

    const shadow =
        widgetRoot.attachShadow({
            mode: "open"
        });


    // =========================================================
    // HTML + CSS
    // =========================================================

    shadow.innerHTML = `

        <style>

            * {
                box-sizing: border-box;
            }


            /*
            ==========================================
            FLOATING BUTTON
            ==========================================
            */

            .chat-toggle {

                position: fixed;

                right: 24px;
                bottom: 24px;

                width: 64px;
                height: 64px;

                border: none;
                border-radius: 50%;

                background:
                    ${hotelConfig.primaryColor};

                color: white;

                font-size: 27px;

                cursor: pointer;

                display: flex;

                align-items: center;
                justify-content: center;

                box-shadow:
                    0 8px 25px
                    rgba(0, 0, 0, 0.22);

                transition:
                    transform 0.2s ease,
                    box-shadow 0.2s ease,
                    background 0.2s ease;

                z-index: 999999;
            }


            .chat-toggle:hover {

                transform:
                    scale(1.07);

                background:
                    ${hotelConfig.primaryHover};

                box-shadow:
                    0 10px 30px
                    rgba(0, 0, 0, 0.28);
            }


            /*
            ==========================================
            CHAT WINDOW
            ==========================================
            */

            .chat-widget {

                position: fixed;

                right: 24px;
                bottom: 100px;

                width: 380px;
                height: 560px;

                max-height:
                    calc(100vh - 130px);

                background: white;

                border-radius: 18px;

                box-shadow:
                    0 15px 45px
                    rgba(0, 0, 0, 0.22);

                display: flex;
                flex-direction: column;

                overflow: hidden;

                opacity: 0;

                visibility: hidden;

                transform:
                    translateY(20px)
                    scale(0.97);

                transition:
                    opacity 0.2s ease,
                    transform 0.2s ease,
                    visibility 0.2s ease;

                z-index: 999998;

                font-family:
                    Arial,
                    Helvetica,
                    sans-serif;
            }


            .chat-widget.open {

                opacity: 1;

                visibility: visible;

                transform:
                    translateY(0)
                    scale(1);
            }


            /*
            ==========================================
            HEADER
            ==========================================
            */

            .chat-header {

                background:
                    ${hotelConfig.primaryColor};

                color: white;

                padding: 16px;

                display: flex;

                align-items: center;

                justify-content:
                    space-between;

                flex-shrink: 0;
            }


            .chat-header-info {

                display: flex;

                align-items: center;

                gap: 12px;
            }


            .chat-avatar {

                width: 42px;
                height: 42px;

                display: flex;

                align-items: center;

                justify-content: center;

                border-radius: 50%;

                background:
                    rgba(
                        255,
                        255,
                        255,
                        0.18
                    );

                font-size: 21px;
            }


            .chat-title {

                font-size: 16px;

                font-weight: 700;

                margin-bottom: 4px;
            }


            .chat-status {

                display: flex;

                align-items: center;

                gap: 6px;

                font-size: 12px;

                opacity: 0.9;
            }


            .status-dot {

                width: 8px;
                height: 8px;

                border-radius: 50%;

                background: #86efac;
            }


            .close-button {

                width: 34px;
                height: 34px;

                border: none;

                border-radius: 50%;

                background:
                    rgba(
                        255,
                        255,
                        255,
                        0.12
                    );

                color: white;

                font-size: 17px;

                cursor: pointer;

                transition:
                    background 0.2s ease;
            }


            .close-button:hover {

                background:
                    rgba(
                        255,
                        255,
                        255,
                        0.22
                    );
            }


            /*
            ==========================================
            MESSAGES
            ==========================================
            */

            .messages {

                flex: 1;

                padding: 16px;

                overflow-y: auto;

                background: #f8fafc;

                display: flex;

                flex-direction: column;

                gap: 12px;
            }


            .message {

                max-width: 82%;

                padding:
                    10px
                    13px;

                border-radius: 14px;

                font-size: 14px;

                line-height: 1.45;

                white-space: pre-wrap;

                word-wrap: break-word;
            }


            .assistant-message {

                align-self: flex-start;

                background: white;

                color: #1f2937;

                border:
                    1px solid
                    #e5e7eb;

                border-bottom-left-radius:
                    5px;

                box-shadow:
                    0 2px 5px
                    rgba(
                        0,
                        0,
                        0,
                        0.04
                    );
            }


            .user-message {

                align-self: flex-end;

                background:
                    ${hotelConfig.primaryColor};

                color: white;

                border-bottom-right-radius:
                    5px;
            }


            /*
            ==========================================
            TYPING
            ==========================================
            */

            .typing-message {

                align-self: flex-start;

                padding:
                    10px
                    14px;

                background: white;

                border:
                    1px solid
                    #e5e7eb;

                border-radius: 14px;

                border-bottom-left-radius:
                    5px;

                font-size: 13px;

                color: #6b7280;
            }


            .typing-dots {

                display: inline-flex;

                gap: 3px;

                margin-left: 4px;
            }


            .typing-dot {

                width: 5px;
                height: 5px;

                border-radius: 50%;

                background: #9ca3af;

                animation:
                    typingPulse
                    1.2s
                    infinite;
            }


            .typing-dot:nth-child(2) {

                animation-delay:
                    0.2s;
            }


            .typing-dot:nth-child(3) {

                animation-delay:
                    0.4s;
            }


            @keyframes typingPulse {

                0%,
                60%,
                100% {

                    opacity: 0.35;

                    transform:
                        translateY(0);
                }


                30% {

                    opacity: 1;

                    transform:
                        translateY(-3px);
                }
            }


            /*
            ==========================================
            QUICK ACTIONS
            ==========================================
            */

            .quick-actions {

                display: flex;

                gap: 7px;

                padding:
                    10px
                    12px;

                background: white;

                border-top:
                    1px solid
                    #edf0f4;

                overflow-x: auto;

                flex-shrink: 0;
            }


            .quick-action {

                flex-shrink: 0;

                border:
                    1px solid
                    ${hotelConfig.primaryColor};

                background: white;

                color:
                    ${hotelConfig.primaryColor};

                padding:
                    7px
                    10px;

                border-radius: 18px;

                font-size: 12px;

                cursor: pointer;

                transition:
                    background 0.2s ease,
                    color 0.2s ease;
            }


            .quick-action:hover {

                background:
                    ${hotelConfig.primaryColor};

                color: white;
            }


            /*
            ==========================================
            INPUT
            ==========================================
            */

            .chat-input-container {

                padding: 12px;

                background: white;

                border-top:
                    1px solid
                    #e5e7eb;

                display: flex;

                align-items: center;

                gap: 8px;

                flex-shrink: 0;
            }


            .message-input {

                flex: 1;

                height: 44px;

                border:
                    1px solid
                    #d1d5db;

                border-radius: 22px;

                padding:
                    0
                    16px;

                font-size: 14px;

                outline: none;

                min-width: 0;

                transition:
                    border-color 0.2s ease,
                    box-shadow 0.2s ease;
            }


            .message-input:focus {

                border-color:
                    ${hotelConfig.primaryColor};

                box-shadow:
                    0 0 0 3px
                    rgba(
                        59,
                        130,
                        246,
                        0.1
                    );
            }


            .send-button {

                width: 44px;
                height: 44px;

                flex-shrink: 0;

                border: none;

                border-radius: 50%;

                background:
                    ${hotelConfig.primaryColor};

                color: white;

                font-size: 18px;

                cursor: pointer;

                display: flex;

                align-items: center;

                justify-content: center;

                transition:
                    background 0.2s ease,
                    opacity 0.2s ease;
            }


            .send-button:hover {

                background:
                    ${hotelConfig.primaryHover};
            }


            .send-button:disabled {

                opacity: 0.6;

                cursor: default;
            }


            /*
            ==========================================
            MOBILE
            ==========================================
            */

            @media (
                max-width: 500px
            ) {

                .chat-toggle {

                    right: 16px;
                    bottom: 16px;

                    width: 58px;
                    height: 58px;
                }


                .chat-widget {

                    right: 12px;
                    left: 12px;

                    bottom: 88px;

                    width: auto;

                    height: 70vh;

                    max-height: 600px;
                }
            }

        </style>



        <!-- FLOATING BUTTON -->

        <button
            class="chat-toggle"
            aria-label="Open ${hotelConfig.name} AI Concierge"
            type="button"
        >
            💬
        </button>



        <!-- CHAT WINDOW -->

        <div
            class="chat-widget"
        >

            <!-- HEADER -->

            <div
                class="chat-header"
            >

                <div
                    class="chat-header-info"
                >

                    <div
                        class="chat-avatar"
                    >
                        🏨
                    </div>


                    <div>

                        <div
                            class="chat-title"
                        >
                            ${hotelConfig.name}
                        </div>


                        <div
                            class="chat-status"
                        >

                            <span
                                class="status-dot"
                            ></span>

                            AI Concierge Online

                        </div>

                    </div>

                </div>


                <button
                    class="close-button"
                    aria-label="Close ${hotelConfig.name} AI Concierge"
                    type="button"
                >
                    ✕
                </button>

            </div>



            <!-- MESSAGES -->

            <div
                class="messages"
            ></div>



            <!-- QUICK ACTIONS -->

            <div
                class="quick-actions"
            >

                <button
                    class="quick-action"
                    data-message="I want to book a room"
                    type="button"
                >
                    Book a room
                </button>


                <button
                    class="quick-action"
                    data-message="Do you have WiFi?"
                    type="button"
                >
                    WiFi
                </button>


                <button
                    class="quick-action"
                    data-message="Do you have parking?"
                    type="button"
                >
                    Parking
                </button>

            </div>



            <!-- INPUT -->

            <div
                class="chat-input-container"
            >

                <input
                    class="message-input"
                    type="text"
                    placeholder="${hotelConfig.placeholder}"
                    autocomplete="off"
                >


                <button
                    class="send-button"
                    aria-label="Send message"
                    type="button"
                >
                    ➤
                </button>

            </div>

        </div>
    `;


    // =========================================================
    // ELEMENTS
    // =========================================================

    const chatToggle =
        shadow.querySelector(
            ".chat-toggle"
        );


    const chatWidget =
        shadow.querySelector(
            ".chat-widget"
        );


    const closeButton =
        shadow.querySelector(
            ".close-button"
        );


    const messages =
        shadow.querySelector(
            ".messages"
        );


    const messageInput =
        shadow.querySelector(
            ".message-input"
        );


    const sendButton =
        shadow.querySelector(
            ".send-button"
        );


    const quickActions =
        shadow.querySelectorAll(
            ".quick-action"
        );


    // =========================================================
    // STATE
    // =========================================================

    let isSending =
        false;


    // =========================================================
    // ADD MESSAGE
    // =========================================================

    function addMessage(
        text,
        sender
    ) {

        const messageElement =
            document.createElement(
                "div"
            );


        messageElement.classList.add(
            "message"
        );


        if (
            sender === "user"
        ) {

            messageElement.classList.add(
                "user-message"
            );

        } else {

            messageElement.classList.add(
                "assistant-message"
            );
        }


        messageElement.textContent =
            text;


        messages.appendChild(
            messageElement
        );


        scrollToBottom();
    }


    // =========================================================
    // TYPING
    // =========================================================

    function showTyping() {

        removeTyping();


        const typing =
            document.createElement(
                "div"
            );


        typing.className =
            "typing-message";


        typing.id =
            "hotel-ai-typing";


        typing.innerHTML = `

            Assistant is typing

            <span
                class="typing-dots"
            >

                <span
                    class="typing-dot"
                ></span>

                <span
                    class="typing-dot"
                ></span>

                <span
                    class="typing-dot"
                ></span>

            </span>
        `;


        messages.appendChild(
            typing
        );


        scrollToBottom();
    }


    function removeTyping() {

        const typing =
            shadow.getElementById(
                "hotel-ai-typing"
            );


        if (typing) {

            typing.remove();
        }
    }


    // =========================================================
    // SCROLL
    // =========================================================

    function scrollToBottom() {

        requestAnimationFrame(
            function () {

                messages.scrollTop =
                    messages.scrollHeight;
            }
        );
    }


    // =========================================================
    // SEND MESSAGE
    // =========================================================

    async function sendMessage(
        suppliedMessage = null
    ) {

        if (isSending) {
            return;
        }


        const message =
            (
                suppliedMessage ??
                messageInput.value
            )
                .trim();


        if (!message) {
            return;
        }


        addMessage(
            message,
            "user"
        );


        messageInput.value =
            "";


        isSending =
            true;


        sendButton.disabled =
            true;


        showTyping();


        try {

            const response =
                await fetch(
                    API_URL,
                    {

                        method:
                            "POST",


                        headers: {

                            "Content-Type":
                                "application/json"
                        },


                        body:
                            JSON.stringify({

                                hotel_id:
                                    HOTEL_ID,

                                session_id:
                                    SESSION_ID,

                                message:
                                    message
                            })
                    }
                );


            const data =
                await response.json()
                    .catch(
                        () => ({})
                    );


            removeTyping();


            if (!response.ok) {

                console.error(
                    "Hotel AI API error:",
                    {
                        status:
                            response.status,

                        data:
                            data
                    }
                );


                addMessage(
                    data.detail ||
                    hotelConfig.errorMessage,
                    "assistant"
                );


                return;
            }


            /*
            Keep server-returned session ID
            in case backend normalized it.
            */

            if (
                data.session_id &&
                data.session_id !==
                    SESSION_ID
            ) {

                SESSION_ID =
                    data.session_id;


                sessionStorage.setItem(
                    SESSION_STORAGE_KEY,
                    SESSION_ID
                );
            }


            const reply =
                data.reply ||
                "I'm sorry, I could not generate a response.";


            addMessage(
                reply,
                "assistant"
            );


        } catch (error) {

            removeTyping();


            console.error(
                "Hotel AI request failed:",
                error
            );


            addMessage(
                hotelConfig.errorMessage,
                "assistant"
            );


        } finally {

            isSending =
                false;


            sendButton.disabled =
                false;


            messageInput.focus();
        }
    }


    // =========================================================
    // OPEN / CLOSE
    // =========================================================

    function openChat() {

        chatWidget.classList.add(
            "open"
        );


        messageInput.focus();
    }


    function closeChat() {

        chatWidget.classList.remove(
            "open"
        );
    }


    chatToggle.addEventListener(
        "click",
        function () {

            const isOpen =
                chatWidget.classList.contains(
                    "open"
                );


            if (isOpen) {

                closeChat();

            } else {

                openChat();
            }
        }
    );


    closeButton.addEventListener(
        "click",
        closeChat
    );


    // =========================================================
    // SEND BUTTON
    // =========================================================

    sendButton.addEventListener(
        "click",
        function () {

            sendMessage();
        }
    );


    // =========================================================
    // ENTER
    // =========================================================

    messageInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );


    // =========================================================
    // QUICK ACTIONS
    // =========================================================

    quickActions.forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const message =
                        button.dataset.message;


                    sendMessage(
                        message
                    );
                }
            );
        }
    );


    // =========================================================
    // INITIAL MESSAGE
    // =========================================================

    addMessage(
        hotelConfig.welcomeMessage,
        "assistant"
    );


})();