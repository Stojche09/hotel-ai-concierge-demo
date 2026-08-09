const API_URL =
    "http://127.0.0.1:8000/booking/message";


function toggleChat() {

    const widget =
        document.getElementById("chat-widget");

    widget.classList.toggle("open");

    if (widget.classList.contains("open")) {

        setTimeout(() => {

            document
                .getElementById("message")
                .focus();

        }, 200);

    }
}


function addUserMessage(message) {

    const chatBox =
        document.getElementById("chat-box");

    const messageContainer =
        document.createElement("div");

    messageContainer.className =
        "user-message";

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent =
        message;

    messageContainer.appendChild(
        bubble
    );

    chatBox.appendChild(
        messageContainer
    );

    scrollToBottom();
}


function addAIMessage(message) {

    const chatBox =
        document.getElementById("chat-box");

    const messageContainer =
        document.createElement("div");

    messageContainer.className =
        "ai-message";

    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.textContent =
        "🤖";

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent =
        message;

    messageContainer.appendChild(
        avatar
    );

    messageContainer.appendChild(
        bubble
    );

    chatBox.appendChild(
        messageContainer
    );

    scrollToBottom();
}


function showTypingIndicator() {

    const chatBox =
        document.getElementById("chat-box");

    const typingContainer =
        document.createElement("div");

    typingContainer.id =
        "typing-indicator";

    typingContainer.className =
        "typing-message";

    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.textContent =
        "🤖";

    const bubble =
        document.createElement("div");

    bubble.className =
        "typing-bubble";

    bubble.textContent =
        "Assistant is typing...";

    typingContainer.appendChild(
        avatar
    );

    typingContainer.appendChild(
        bubble
    );

    chatBox.appendChild(
        typingContainer
    );

    scrollToBottom();
}


function removeTypingIndicator() {

    const typingIndicator =
        document.getElementById(
            "typing-indicator"
        );

    if (typingIndicator) {
        typingIndicator.remove();
    }
}


function scrollToBottom() {

    const chatBox =
        document.getElementById("chat-box");

    chatBox.scrollTop =
        chatBox.scrollHeight;
}


async function sendMessage() {

    const input =
        document.getElementById("message");

    const message =
        input.value.trim();

    if (!message) {
        return;
    }

    addUserMessage(message);

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

                    body: JSON.stringify({
                        message: message
                    })
                }
            );

        if (!response.ok) {

            throw new Error(
                "Server returned an error."
            );

        }

        const data =
            await response.json();

        removeTypingIndicator();

        const aiResponse =
            data.response ||
            data.message ||
            data.reply ||
            "I'm sorry, I couldn't process that request.";

        addAIMessage(
            aiResponse
        );

    } catch (error) {

        console.error(
            "Chat error:",
            error
        );

        removeTypingIndicator();

        addAIMessage(
            "I'm sorry, the concierge is temporarily unavailable."
        );
    }
}


document
    .getElementById("message")
    .addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();
            }
        }
    );