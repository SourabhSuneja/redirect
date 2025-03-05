// global variable to store response fetched from AI
let AIResponse;

async function sendMessage() {
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const typingIndicator = document.createElement('div');
  const message = userInput.value.trim();
  const query = message;
  if (message) {
    logMessage(message, 'user-message');
    userInput.value = '';
    userInput.style.height = 'auto'; // Reset the height
    // show typing animation
    typingIndicator.className = 'message bot-message typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    chatBox.appendChild(typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;
    AIResponse = await window.fetchResponse(query);
    AIResponse = formatGeminiResponse(AIResponse);
    // remove typing animation and append the response to chatbox
    chatBox.removeChild(typingIndicator);
    botResponse(AIResponse);
  }
}

function logMessage(message, className) {
  const chatBox = document.getElementById('chat-box');
  const messageElement = document.createElement('div');
  messageElement.className = `message ${className}`;
  messageElement.innerHTML = message;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function botResponse(message) {
  logMessage(message, 'bot-message');
}

// Allow sending messages with Enter key
function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// Auto resize the textarea
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

// Format response returned by Gemini to be presentable in HTML
function formatGeminiResponse(text) {

  // Replace line breaks with HTML line breaks
  text = text.trim().replace(/\n/g, '<br>');

  // Replace bold formatting with HTML bold tags
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Replace italic formatting with HTML italic tags
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

  return linkify(text);
}

function linkify(text) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    if (!urlPattern.test(text)) {
        return text; // Return original text if no URL is found
    }
    return text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
}


