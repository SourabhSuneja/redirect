// test data in JSON format
const student = {
      "name": "Bhavya Choudhary",
      "grade": 8,
      "section": "A2",
      "DOB": "7-Sep-11",
      "gender": "F",
      "marks": {
          "Periodic Test 1": {
              "English": "20/20",
              "Hindi": "18/20",
              "Maths": "17/20",
              "Science": "20/20",
              "SST": "18/20",
              "Sanskrit": "15/20",
              "Computer": "20/20",
              "GK": "16/20"
          }
      },
      "address": "can't be shared",
      "contact": "can't be shared",
      "house": "Emerald",
      "qualities": "very sincere, innocent, bit introvert, obeys teachers, needs to be a bit more open, highly creative. Shows a lot of enthusiasm in creative things like designing, language writing etc.",
      "interests": "coding, drawing, artistic works",
      "achievements": "consistent high performance in academics, has developed many games in Scratch in her coding classes, experimented with robotics, actively contributed towards school magazine",
      "complaints": "no complaints at all",
      "class teacher": "Mrs. Abhilasha Joshi"
};

const student2 = {
      "name": "Harshita",
      "grade": 8,
      "section": "A2",
      "DOB": "16-Dec-12",
      "gender": "F",
      "marks": {
          "Periodic Test 1": {
              "English": "19/20",
              "Hindi": "19/20",
              "Maths": "18/20",
              "Science": "20/20",
              "SST": "18/20",
              "Sanskrit": "11/20",
              "Computer": "20/20",
              "GK": "20/20"
          }
      },
      "address": null,
      "contact": null,
      "house": "Ruby",
      "qualities": "very sincere, obeys teachers, but talkative at times",
      "complaints": "sometimes loses focus. otherwise all good",
      "class teacher": "Mrs. Abhilasha Joshi",
      "feedback": "Sanskrit score low, couldn't complete exam on time. otherwise good. needs to focus a bit on maths too"
};

const student3 = {
      "name": "Aryan Choudhary",
      "grade": 10,
      "section": "A1",
      "DOB": "12-Nov-12",
      "gender": "F",
      "marks": {
          "Term 2 Examination": {
              "English": "70/70",
              "Hindi": "65/70",
              "Maths": "78/80",
              "Science": "75/80",
              "SST": "80/80",
              "Sanskrit": "75/80",
              "Computer": "30/30",
              "GK": "30/30"
          }
      },
      "address": null,
      "contact": null,
      "house": "Ruby",
      "qualities": "very sincere, obeys teachers, but talkative at times",
      "complaints": "",
      "class teacher": "",
      "feedback": "must learn to behave properly in class"
};

const student4 = {
      "name": "Yashasvi Kumawat",
      "grade": 8,
      "section": "A2",
      "DOB": "24-Dec",
      "gender": "F",
      "marks": {
          "Periodic Test 1": {
              "English": "20/20",
              "Hindi": "18/20",
              "Maths": "16/20",
              "Science": "19/20",
              "SST": "15/20",
              "Sanskrit": "13/20",
              "Computer": "20/20",
              "GK": "19/20"
          }
      },
      "address": "can't be shared",
      "contact": "can't be shared",
      "house": "Sapphire",
      "qualities": "sincere, introvert, very shy, can benefit from working on her confidence and being a little more open. Has depths of qualities only waiting to be realised",
      "interests": "artistic pursuits, drawing, dance",
      "achievements": "academically good, has developed games in Scratch in her coding classes, experimented with robotics, shows a very calm and sincere attitude",
      "complaints": "no complaints at all",
      "class teacher": "Mrs. Abhilasha Joshi"
};

// global variable to store response fetched from AI
let AIResponse;

async function sendMessage() {
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const typingIndicator = document.createElement('div');
  const message = userInput.value.trim();
  const query = "Now use this JSON data to answer questions related to this student: \n" + JSON.stringify(student) + "\n\nQuestion: " + message;
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

  return text;
}


