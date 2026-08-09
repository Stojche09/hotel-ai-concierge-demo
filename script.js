async function sendMessage() {

    const input = document.getElementById("message");

    const chatBox = document.getElementById("chat-box");

    const message = input.value;

    if (message.trim() === "") return;

    // Show user's message

   chatBox.innerHTML += `
<div class="user-message">
👤 ${message}
</div>
`;

    input.value = "";

    // Send message to FastAPI

    const typingMessage = document.createElement("div");

typingMessage.className = "ai-message";

typingMessage.id = "typing";

typingMessage.innerHTML = "🤖 Assistant is typing...";

chatBox.appendChild(typingMessage);

chatBox.scrollTop = chatBox.scrollHeight;

   const response = await fetch("http://127.0.0.1:8000/booking/message", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        message: message
    })
});

const data = await response.json();

chatBox.innerHTML += `
<div class="ai-message">
🤖 ${data.reply}
</div>
`;
    document.getElementById("typing").remove();

    // Show AI response


    chatBox.scrollTop = chatBox.scrollHeight;

}
document.getElementById("message").addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        sendMessage();

    }

});