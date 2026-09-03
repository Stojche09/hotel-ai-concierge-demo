(function () {

    const API_URL =
        "https://hotel-ai-backend-production.up.railway.app/booking/message";


    /*
    ==========================================
    CREATE WIDGET CONTAINER
    ==========================================
    */

    const widgetRoot =
        document.createElement("div");

    widgetRoot.id =
        "hotel-ai-concierge-root";

    document.body.appendChild(
        widgetRoot
    );


    /*
    ==========================================
    CREATE SHADOW DOM
    ==========================================

    Shadow DOM keeps the widget CSS isolated
    from the hotel's existing website CSS.
    */

    const shadow =
        widgetRoot.attachShadow({
            mode: "open"
        });


    /*
    ==========================================
    WIDGET HTML
    ==========================================
    */

    shadow.innerHTML = `

        <style>

            * {
                box-sizing: border-box;
            }


            /* =========================
               FLOATING BUTTON
            ========================= */

            .chat-toggle {
                position: fixed;

                right: 24px;
                bottom: 24px;

                width: 64px;
                height: 64px;

                border: none;
                border-radius: 50%;

                background:
                    linear-gradient(
                        135deg,
                        #1b5e20,
                        #2e7d32
                    );

                color: white;

                font-size: 28px;

                cursor: pointer;

                box-shadow:
                    0 8px 25px rgba(0, 0, 0, 0.22);

                transition:
                    transform 0.2s ease,
                    box-shadow 0.2s ease;

                z-index: 999999;
            }

            .chat-toggle:hover {
                transform: scale(1.07);

                box-shadow:
                    0 10px 30px rgba(0, 0, 0, 0.28);
            }


            /* =========================
               CHAT WINDOW
            ========================= */

            .chat-widget {
                position: fixed;

                right: 24px;
                bottom: 100px;

                width: 380px;
                height: 560px;

                background: white;

                border-radius: 18px;

                box-shadow:
                    0 15px 45px rgba(0, 0, 0, 0.22);

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


            /* =========================
               HEADER
            ========================= */

            .chat-header {
                background:
                    linear-gradient(
                        135deg,
                        #1b5e20,
                        #2e7d32
                    );

                color: white;

                padding: 16px;

                display: flex;
                align-items: center;
                justify-content: space-between;
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

                background:
                    rgba(255, 255, 255, 0.18);

                border-radius: 50%;

                font-size: 22px;
            }

            .chat-title {
                font-size: 16px;
                font-weight: 700;
            }

            .chat-status {
                margin-top: 3px;

                font-size: 12px;

                display: flex;
                align-items: center;

                gap: 6px;

                opacity: 0.9;
            }

            .status-dot {
                width: 8px;
                height: 8px;

                background: #4ade80;

                border-radius: 50%;
            }

            .close-button {
                border: none;

                background: transparent;
                color: white;

                font-size: 20px;

                cursor: pointer;

                padding: 5px;
            }


            /* =========================
               MESSAGES
            ========================= */

            .chat-box {
                flex: 1;

                padding: 18px;

                overflow-y: auto;

                background: #f7f9f8;

                display: flex;
                flex-direction: column;

                gap: 14px;

                scroll-behavior: smooth;
            }


            /* AI MESSAGE */

            .ai-message {
                display: flex;
                align-items: flex-end;

                gap: 8px;

                max-width: 85%;

                align-self: flex-start;
            }

            .message-avatar {
                width: 30px;
                height: 30px;

                min-width: 30px;

                display: flex;
                align-items: center;
                justify-content: center;

                background: white;

                border-radius: 50%;

                box-shadow:
                    0 2px 6px rgba(0, 0, 0, 0.08);
            }

            .ai-message .message-bubble {
                background: #e8f5e9;

                color: #1f2937;

                padding: 11px 14px;

                border-radius:
                    16px
                    16px
                    16px
                    4px;

                line-height: 1.4;

                font-size: 14px;

                box-shadow:
                    0 2px 8px rgba(0, 0, 0, 0.06);

                word-break: break-word;
            }


            /* USER MESSAGE */

            .user-message {
                display: flex;

                max-width: 80%;

                align-self: flex-end;
            }

            .user-message .message-bubble {
                background: #1976d2;

                color: white;

                padding: 11px 14px;

                border-radius:
                    16px
                    16px
                    4px
                    16px;

                line-height: 1.4;

                font-size: 14px;

                word-break: break-word;
            }


            /* =========================
               TYPING
            ========================= */

            .typing-message {
                display: flex;
                align-items: center;

                gap: 8px;

                align-self: flex-start;
            }

            .typing-bubble {
                background: #e8f5e9;

                padding: 10px 14px;

                border-radius: 16px;

                font-size: 13px;

                color: #64748b;

                box-shadow:
                    0 2px 8px rgba(0, 0, 0, 0.06);
            }


            /* =========================
               INPUT
            ========================= */

            .input-area {
                padding: 12px;

                border-top:
                    1px solid #e5e7eb;

                background: white;

                display: flex;
                align-items: center;

                gap: 8px;
            }

            .message-input {
                flex: 1;

                height: 44px;

                border:
                    1px solid #d1d5db;

                border-radius: 22px;

                padding:
                    0
                    16px;

                font-size: 14px;

                outline: none;

                transition:
                    border-color 0.2s ease,
                    box-shadow 0.2s ease;
            }

            .message-input:focus {
                border-color: #2e7d32;

                box-shadow:
                    0 0 0 3px
                    rgba(46, 125, 50, 0.10);
            }

            .send-button {
                width: 44px;
                height: 44px;

                border: none;

                border-radius: 50%;

                background: #1b5e20;
                color: white;

                font-size: 18px;

                cursor: pointer;

                display: flex;
                align-items: center;
                justify-content: center;

                transition:
                    background 0.2s ease,
                    transform 0.1s ease;
            }

            .send-button:hover {
                background: #2e7d32;
            }

            .send-button:active {
                transform: scale(0.96);
            }


            /* =========================
               MOBILE
            ========================= */

            @media (max-width: 500px) {

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
            aria-label="Open Hotel Makpetrol AI Concierge"
        >
            💬
        </button>


        <!-- CHAT WINDOW -->

        <div class="chat-widget">

            <div class="chat-header">

                <div class="chat-header-info">

                    <div class="chat-avatar">
                        🏨
                    </div>

                    <div>

                        <div class="chat-title">
                            Hotel Makpetrol
                        </div>

                        <div class="chat-status">

                            <span class="status-dot"></span>

                            AI Concierge Online

                        </div>

                    </div>

                </div>

                <button
                    class="close-button"
                    aria-label="Close Hotel Makpetrol AI Concierge"
                >
                    ✕
                </button>

            </div>


            <div class="chat-box">

                <div class="ai-message">

                    <div class="message-avatar">
                        🤖
                    </div>

                    <div class="message-bubble">
                        Hello! Welcome to Hotel Makpetrol.
                        How can I help you today?
                    </div>

                </div>

            </div>


            <div class="input-area">

                <input
                    class="message-input"
                    type="text"
                    placeholder="Ask about your stay..."
                    autocomplete="off"
                >

                <button
                    class="send-button"
                    aria-label="Send message"
                >
                    ➤
                </button>

            </div>

        </div>
    `;


    /*
    ==========================================
    ELEMENT REFERENCES
    ==========================================
    */

    const toggleButton =
        shadow.querySelector(
            ".chat-toggle"
        );

    const widget =
        shadow.querySelector(
            ".chat-widget"
        );

    const closeButton =
        shadow.querySelector(
            ".close-button"
        );

    const sendButton =
        shadow.querySelector(
            ".send-button"
        );

    const input =
        shadow.querySelector(
            ".message-input"
        );

    const chatBox =
        shadow.querySelector(
            ".chat-box"
        );


    /*
    ==========================================
    OPEN / CLOSE
    ==========================================
    */

    function toggleChat() {

        widget.classList.toggle(
            "open"
        );

        if (
            widget.classList.contains(
                "open"
            )
        ) {

            setTimeout(
                function () {

                    input.focus();

                },
                200
            );
        }
    }


    toggleButton.addEventListener(
        "click",
        toggleChat
    );

    closeButton.addEventListener(
        "click",
        toggleChat
    );


    /*
    ==========================================
    SCROLL
    ==========================================
    */

    function scrollToBottom() {

        chatBox.scrollTop =
            chatBox.scrollHeight;
    }


    /*
    ==========================================
    USER MESSAGE
    ==========================================
    */

    function addUserMessage(
        message
    ) {

        const container =
            document.createElement(
                "div"
            );

        container.className =
            "user-message";

        const bubble =
            document.createElement(
                "div"
            );

        bubble.className =
            "message-bubble";

        bubble.textContent =
            message;

        container.appendChild(
            bubble
        );

        chatBox.appendChild(
            container
        );

        scrollToBottom();
    }


    /*
    ==========================================
    AI MESSAGE
    ==========================================
    */

    function addAIMessage(
        message
    ) {

        const container =
            document.createElement(
                "div"
            );

        container.className =
            "ai-message";

        const avatar =
            document.createElement(
                "div"
            );

        avatar.className =
            "message-avatar";

        avatar.textContent =
            "🤖";

        const bubble =
            document.createElement(
                "div"
            );

        bubble.className =
            "message-bubble";

        bubble.textContent =
            message;

        container.appendChild(
            avatar
        );

        container.appendChild(
            bubble
        );

        chatBox.appendChild(
            container
        );

        scrollToBottom();
    }


    /*
    ==========================================
    TYPING INDICATOR
    ==========================================
    */

    function showTypingIndicator() {

        removeTypingIndicator();

        const container =
            document.createElement(
                "div"
            );

        container.className =
            "typing-message";

        container.id =
            "typing-indicator";

        const avatar =
            document.createElement(
                "div"
            );

        avatar.className =
            "message-avatar";

        avatar.textContent =
            "🤖";

        const bubble =
            document.createElement(
                "div"
            );

        bubble.className =
            "typing-bubble";

        bubble.textContent =
            "Hotel Makpetrol Concierge is typing...";

        container.appendChild(
            avatar
        );

        container.appendChild(
            bubble
        );

        chatBox.appendChild(
            container
        );

        scrollToBottom();
    }


    function removeTypingIndicator() {

        const indicator =
            shadow.querySelector(
                "#typing-indicator"
            );

        if (indicator) {
            indicator.remove();
        }
    }


    /*
    ==========================================
    SEND MESSAGE
    ==========================================
    */

    async function sendMessage() {

        const message =
            input.value.trim();

        if (!message) {
            return;
        }

        addUserMessage(
            message
        );

        input.value = "";

        input.focus();

        showTypingIndicator();


        try {

            const response =
                await fetch(
                    API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                message: message
                            })
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Server returned ${response.status}`
                );
            }


            const data =
                await response.json();


            removeTypingIndicator();


            const aiResponse =
                data.reply ||
                data.response ||
                data.message ||
                "I'm sorry, I couldn't process that request.";


            addAIMessage(
                aiResponse
            );

        } catch (error) {

            console.error(
                "Hotel Makpetrol Concierge error:",
                error
            );

            removeTypingIndicator();

            addAIMessage(
                "I'm sorry, the Hotel Makpetrol AI Concierge is temporarily unavailable. Please try again shortly."
            );
        }
    }


    /*
    ==========================================
    SEND BUTTON
    ==========================================
    */

    sendButton.addEventListener(
        "click",
        sendMessage
    );


    /*
    ==========================================
    ENTER KEY
    ==========================================
    */

    input.addEventListener(
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

})();