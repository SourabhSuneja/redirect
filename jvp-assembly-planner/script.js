const PASSKEY = "1";
let assemblies = [];
let additionalRolesCount = 0;

const authForm = document.getElementById('authForm');
const schedulerForm = document.getElementById('schedulerForm');
const upcomingAssemblies = document.getElementById('upcomingAssemblies');
const passKeyInput = document.getElementById('passkey');
const authenticateBtn = document.getElementById('authenticateBtn');
const assemblyForm = document.getElementById('assemblyForm');
const conductingClassSelect = document.getElementById('conductingClass');
const addRoleBtn = document.getElementById('addRoleBtn');
const additionalRolesDiv = document.getElementById('additionalRoles');
const assembliesTableBody = document.getElementById('assembliesTableBody');
const emptyState = document.getElementById('emptyState');
const aiModal = document.getElementById('aiModal');
const closeAiModal = document.getElementById('closeAiModal');
const aiOptions = document.getElementById('aiOptions');
const aiModalTitle = document.getElementById('aiModalTitle');
const aiModalDescription = document.getElementById('aiModalDescription');
const toast = document.getElementById('toast');
const suggestThemeBtn = document.getElementById('suggestThemeBtn');
const suggestThoughtBtn = document.getElementById('suggestThoughtBtn');
const suggestWordBtn = document.getElementById('suggestWordBtn');
const aiAssistantModal = document.getElementById('aiAssistantModal');
const closeAiAssistantModal = document.getElementById('closeAiAssistantModal');
const aiResponseModal = document.getElementById('aiResponseModal');
const closeAiResponseModal = document.getElementById('closeAiResponseModal');
const aiResponseTitle = document.getElementById('aiResponseTitle');
const aiResponseContent = document.getElementById('aiResponseContent');
const copyResponseBtn = document.getElementById('copyResponseBtn');

let currentAssemblyData = null;

async function init() {
   populateClasses();
   await loadAssembliesFromServer();
   updateAssembliesTable();
   setupEventListeners();
}

function populateClasses() {
   const classes = [];
   for (let grade = 1; grade <= 12; grade++) {
      for (let section = 1; section <= 4; section++) {
         classes.push(`${grade}-A${section}`);
      }
   }

   classes.forEach(className => {
      const option = document.createElement('option');
      option.value = className;
      option.textContent = className;
      conductingClassSelect.appendChild(option);
   });
}

async function loadAssembliesFromServer() {
   const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

   assemblies = await selectData(
      "assemblies",
      false,
      "*",
      [],
      [],
      "date",
      "asc",
      [{
         column: "date",
         operator: "gte",
         value: today
      }]
   );
}

async function saveAssembliesToServer(newAssemblyData) {
   showProcessingDialog();
   const result = await upsertData("assemblies", newAssemblyData, ["date"]);

   if (result) {
      await showDialog({
         title: 'Success',
         message: 'Assembly schedule updated successfully!',
         type: 'alert'
      });
      showToast('Assembly schedule updated successfully!');
   } else {
      await showDialog({
         title: 'Error',
         message: 'Error updating assembly schedule!',
         type: 'alert'
      });
      showToast('Error updating assembly schedule!', 'error');
   }
   return result;
}

async function deleteFromServer(dateToDelete) {
   showProcessingDialog();
   const result = await deleteRow('assemblies', ['date'], [dateToDelete]);

   if (result) {
      await showDialog({
         title: 'Success',
         message: 'Assembly deleted successfully!',
         type: 'alert'
      });
      showToast('Assembly deleted successfully!');
   } else {
      await showDialog({
         title: 'Error',
         message: 'Error updating assembly schedule!',
         type: 'alert'
      });
      showToast('Error updating assembly schedule!', 'error');
   }
   return result;
}

function updateAssembliesTable() {
   assembliesTableBody.innerHTML = '';

   const sortedAssemblies = [...assemblies].sort((a, b) => new Date(a.date) - new Date(b.date));
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   const futureAssemblies = sortedAssemblies.filter(assembly => new Date(assembly.date) >= today);
   const upcomingAssemblies = futureAssemblies.slice(0, 10);

   if (upcomingAssemblies.length === 0) {
      emptyState.classList.remove('hidden');
   } else {
      emptyState.classList.add('hidden');
   }

   upcomingAssemblies.forEach((assembly, index) => {
      const row = document.createElement('tr');
      const date = new Date(assembly.date);
      const formattedDate = date.toLocaleDateString('en-US', {
         weekday: 'short',
         year: 'numeric',
         month: 'short',
         day: 'numeric'
      });

      let additionalRolesHTML = '';
      if (assembly.additional_roles && assembly.additional_roles.length > 0) {
         additionalRolesHTML = assembly.additional_roles.map(role => `<span class="badge badge-secondary">${role.role}: ${role.student}</span>`).join(' ');
      } else {
         additionalRolesHTML = '—';
      }

      row.innerHTML = `
    <td>${formattedDate}</td>
    <td>${assembly.theme}</td>
    <td><span class="badge badge-primary">${assembly.conducting_class}</span></td>
    <td>${assembly.anchoring_by || '—'}</td>
    <td>${assembly.thought || '—'}</td>
    <td>${assembly.word_of_the_day || '—'}</td>
    <td>${assembly.news_by || '—'}</td>
    <td>${additionalRolesHTML}</td>
    <td>
        <button class="btn btn-danger btn-sm" onclick="deleteAssembly('${assembly.date}')"><i class="fas fa-trash"></i></button>
        <button class="btn btn-primary btn-sm" onclick="showAiAssistantModal('${assembly.date}')"><i class="fas fa-robot"></i></button>
    </td>
`;
      assembliesTableBody.appendChild(row);
   });
}

function setupEventListeners() {
   authenticateBtn.addEventListener('click', handleAuthentication);
   assemblyForm.addEventListener('submit', handleFormSubmit);
   addRoleBtn.addEventListener('click', addRole);
   suggestThemeBtn.addEventListener('click', () => showAiSuggestions('theme'));
   suggestThoughtBtn.addEventListener('click', () => showAiSuggestions('thought'));
   suggestWordBtn.addEventListener('click', () => showAiSuggestions('word'));
   closeAiModal.addEventListener('click', hideAiModal);
   closeAiAssistantModal.addEventListener('click', hideAiAssistantModal);
   document.getElementById('scriptOption').addEventListener('click', () => handleAiAssistantOption('script'));
   document.getElementById('skitOption').addEventListener('click', () => handleAiAssistantOption('skit'));
   document.getElementById('suggestionOption').addEventListener('click', () => handleAiAssistantOption('suggestions'));
   closeAiResponseModal.addEventListener('click', hideAiResponseModal);
   copyResponseBtn.addEventListener('click', copyResponseToClipboard);
}

function handleAuthentication() {
   const enteredPasskey = passKeyInput.value.trim();
   if (enteredPasskey === PASSKEY) {
      authForm.classList.add('hidden');
      schedulerForm.classList.remove('hidden');
      upcomingAssemblies.classList.remove('hidden');
      showToast('Authentication successful!');
   } else {
      showToast('Invalid passkey! Please try again.', 'error');
      passKeyInput.value = '';
      passKeyInput.focus();
   }
}

async function handleFormSubmit(event) {
   event.preventDefault();

   const assemblyDate = document.getElementById('assemblyDate').value;
   const existingIndex = assemblies.findIndex(assembly => assembly.date === assemblyDate);


   if (assemblyDate) {
      const selectedDate = new Date(assemblyDate);
      const today = new Date();

      // Set the time portion to 00:00:00 for accurate date comparison
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
         showDialog({
            title: 'Error',
            message: "You can't schedule an assembly for a past date!",
            type: 'alert'
         });
         showToast("Can't schedule an assembly for a past date!", 'error');
         return;
      }
   }

   const newAssemblyData = {
      date: assemblyDate,
      theme: document.getElementById('theme').value.trim(),
      conducting_class: document.getElementById('conductingClass').value.trim(),
      anchoring_by: document.getElementById('anchorStudent').value.trim() || null,
      thought_by: document.getElementById('thoughtStudent').value.trim() || null,
      thought: document.getElementById('thought').value.trim() || null,
      word_student: document.getElementById('wordStudent').value.trim() || null,
      word_of_the_day: document.getElementById('word').value.trim() || null,
      news_by: document.getElementById('newsStudent').value.trim() || null,
      additional_roles: []
   };

   const roleEntries = document.querySelectorAll('.role-entry');
   roleEntries.forEach(entry => {
      const roleInput = entry.querySelector('.role-name');
      const studentInput = entry.querySelector('.role-student');

      if (roleInput.value && studentInput.value) {
         newAssemblyData.additional_roles.push({
            role: roleInput.value,
            student: studentInput.value
         });
      }
   });

   const success = await saveAssembliesToServer(newAssemblyData);

   if (!success) {
      return
   }

   if (existingIndex !== -1) {
      assemblies[existingIndex] = newAssemblyData;
   } else {
      assemblies.push(newAssemblyData);
   }

   updateAssembliesTable();
   assemblyForm.reset();
   resetAdditionalRoles();
}

async function deleteAssembly(dateToDelete) {

   const date = new Date(dateToDelete);
   const day = date.getDate();
   const month = date.toLocaleString('default', {
      month: 'long'
   });
   const year = date.getFullYear();

   // Function to get ordinal suffix
   const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
   };

   const formattedDate = `${getOrdinal(day)} ${month}, ${year}`;
   const message = 'Are you sure you want to delete the assembly scheduled for ' + formattedDate + '?';

   const confirmDelete = await showDialog({
      title: 'Confirm Delete',
      message: message,
      type: 'confirm'
   });

   if (confirmDelete) {
      const success = deleteFromServer(dateToDelete);
      if (success) {
         assemblies = assemblies.filter(assembly => assembly.date !== dateToDelete);
      } else {
         return;
      }
      updateAssembliesTable();
   }
}

function addRole() {
   additionalRolesCount++;
   if (additionalRolesDiv.classList.contains('hidden')) {
      additionalRolesDiv.classList.remove('hidden');
   }
   const roleEntry = document.createElement('div');
   roleEntry.className = 'role-entry';
   roleEntry.innerHTML = `
                 <input type="text" class="role-name" placeholder="Role Name" required>
                 <input type="text" class="role-student" placeholder="Student Name" required>
                 <span class="role-remove" onclick="removeRole(this)">
                     <i class="fas fa-times-circle"></i>
                 </span>
             `;
   additionalRolesDiv.appendChild(roleEntry);
}

function removeRole(element) {
   const roleEntry = element.parentElement;
   roleEntry.remove();
   additionalRolesCount--;
   if (additionalRolesCount === 0) {
      additionalRolesDiv.classList.add('hidden');
   }
}

function resetAdditionalRoles() {
   additionalRolesDiv.innerHTML = '';
   additionalRolesCount = 0;
   additionalRolesDiv.classList.add('hidden');
}

function showAiSuggestions(type) {
   aiOptions.innerHTML = '';
   let title = '';
   let description = '';
   let suggestions = [];

   switch (type) {
      case 'theme':
         title = 'Assembly Theme Suggestions';
         description = 'Select a theme for your assembly:';
         suggestions = [
            'Environmental Awareness: Reduce, Reuse, Recycle',
            'Unity in Diversity: Celebrating Our Differences',
            'Digital Citizenship: Being Responsible Online',
            'Health and Wellness: Mind, Body, and Spirit',
            'Leadership and Teamwork: Together We Achieve More'
         ];
         break;

      case 'thought':
         title = 'Thought of the Day Suggestions';
         description = 'Select a thought for your assembly:';
         suggestions = [
            'Education is not the filling of a pail, but the lighting of a fire.',
            'The future belongs to those who believe in the beauty of their dreams.',
            'The only way to do great work is to love what you do.',
            'Success is not final, failure is not fatal: It is the courage to continue that counts.',
            'Be the change that you wish to see in the world.'
         ];
         break;

      case 'word':
         title = 'Word of the Day Suggestions';
         description = 'Select a word for your assembly:';
         suggestions = [
            'Perseverance - Persistence in doing something despite difficulty or delay in achieving success.',
            'Integrity - The quality of being honest and having strong moral principles.',
            'Resilience - The capacity to recover quickly from difficulties; toughness.',
            'Empathy - The ability to understand and share the feelings of another.',
            'Innovation - The action or process of innovating; a new method, idea, product, etc.'
         ];
         break;
   }

   aiModalTitle.textContent = title;
   aiModalDescription.textContent = description;

   suggestions.forEach((suggestion, index) => {
      const option = document.createElement('div');
      option.className = 'ai-option';
      option.textContent = suggestion;
      option.addEventListener('click', () => {
         selectAiSuggestion(type, suggestion);
         hideAiModal();
      });
      aiOptions.appendChild(option);
   });

   aiModal.style.display = 'flex';
}

function hideAiModal() {
   aiModal.style.display = 'none';
}

function selectAiSuggestion(type, suggestion) {
   switch (type) {
      case 'theme':
         document.getElementById('theme').value = suggestion;
         break;

      case 'thought':
         document.getElementById('thought').value = suggestion;
         break;

      case 'word':
         const wordPart = suggestion.split(' - ')[0];
         document.getElementById('word').value = wordPart;
         break;
   }
}

function showToast(message, type = 'success') {
   toast.textContent = message;
   toast.className = `toast show ${type === 'error' ? 'toast-error' : ''}`;
   setTimeout(() => {
      toast.classList.remove('show');
   }, 3000);
}


function showAiAssistantModal(assemblyDate) {
   // Find the assembly data for the selected date
   currentAssemblyData = assemblies.find(assembly => assembly.date === assemblyDate);

   if (currentAssemblyData) {
      aiAssistantModal.style.display = 'flex';
   } else {
      showToast('Assembly data not found!', 'error');
   }
}

function hideAiAssistantModal() {
   aiAssistantModal.style.display = 'none';
}

function handleAiAssistantOption(optionType) {
   if (!currentAssemblyData) {
      showToast('No assembly selected!', 'error');
      return;
   }

   // This function will pass the assembly data and option type to your AI handler
   requestAiAssistance(currentAssemblyData, optionType);

   // Hide the modal after selection
   hideAiAssistantModal();

   // Show a message to indicate that the request is being processed
   showToast('Processing your AI assistance request...', 'success');
}

function requestAiAssistance(assemblyData, assistanceType) {
   console.log('Assembly Data:', assemblyData);
   console.log('Assistance Type:', assistanceType);

   // Show loading state in the response modal
   showLoadingInResponseModal(assistanceType, assemblyData);

   // Prepare request data
   const requestData = {
      assemblyData: assemblyData,
      assistanceType: assistanceType
   };

   // Here's where you would make your actual API call to your AI service
   // For demonstration, we'll simulate a response after a delay
   // In your actual implementation, replace this with your API call

   // Simulated API call with timeout to mimic network delay
   setTimeout(() => {
      // This is where you would normally process the response from your AI service
      // For demo purposes, we'll just show a sample response
      const sampleResponse = getSampleResponse(assistanceType, assemblyData);

      // Update the modal with the response
      showAiResponseModal(assistanceType, sampleResponse, assemblyData);
   }, 2000);

   // In your actual implementation:
   /*
   fetchFromAiService(requestData)
       .then(response => {
           showAiResponseModal(assistanceType, response.content, assemblyData);
       })
       .catch(error => {
           console.error('Error fetching AI response:', error);
           showToast('Failed to get AI response. Please try again.', 'error');
           hideAiResponseModal();
       });
   */
}

function showAiResponseModal(responseType, responseContent, assemblyData) {
   // Set the title based on the response type
   let title = 'AI Response';
   let subtitle = '';

   switch (responseType) {
      case 'script':
         title = 'Anchoring Script';
         subtitle = `For ${formatDate(assemblyData.date)} Assembly on "${assemblyData.theme}"`;
         break;
      case 'skit':
         title = 'Assembly Skit';
         subtitle = `For ${formatDate(assemblyData.date)} Assembly on "${assemblyData.theme}"`;
         break;
      case 'suggestions':
         title = 'Assembly Enhancement Suggestions';
         subtitle = `For ${formatDate(assemblyData.date)} Assembly on "${assemblyData.theme}"`;
         break;
      default:
         title = 'AI Response';
   }

   // Set the title and content
   aiResponseTitle.innerHTML = title + `<div class="response-subtitle">${subtitle}</div>`;
   aiResponseContent.innerHTML = formatResponse(responseContent);

   // Show the modal
   aiResponseModal.style.display = 'flex';
}

function formatResponse(content) {
   // Convert line breaks to <br> tags and preserve formatting
   // This is a simple implementation - you may want to enhance it based on your needs
   return content.replace(/\n/g, '<br>');
}

function hideAiResponseModal() {
   aiResponseModal.style.display = 'none';
}

function copyResponseToClipboard() {
   // Get text content
   const content = aiResponseContent.innerText || aiResponseContent.textContent;

   // Create a temporary textarea element to copy from
   const textarea = document.createElement('textarea');
   textarea.value = content;
   document.body.appendChild(textarea);
   textarea.select();

   try {
      // Execute copy command
      document.execCommand('copy');
      showCopyFeedback();
   } catch (err) {
      console.error('Failed to copy: ', err);
      showToast('Failed to copy content!', 'error');
   } finally {
      document.body.removeChild(textarea);
   }
}

function showCopyFeedback() {
   // Create and show feedback element
   const feedback = document.createElement('span');
   feedback.className = 'copy-feedback';
   feedback.innerHTML = '<i class="fas fa-check"></i> Copied!';

   // Add it next to the button
   copyResponseBtn.parentNode.appendChild(feedback);

   // Show feedback
   setTimeout(() => {
      feedback.classList.add('show');
   }, 10);

   // Remove feedback after 2 seconds
   setTimeout(() => {
      feedback.classList.remove('show');
      setTimeout(() => {
         feedback.remove();
      }, 300);
   }, 2000);

   // Also show toast
   showToast('Content copied to clipboard!');
}

// Helper function to format date nicely
function formatDate(dateStr) {
   const date = new Date(dateStr);
   return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
   });
}

function showLoadingInResponseModal(assistanceType, assemblyData) {
   // Set the title based on response type
   let title = 'Loading AI Response';
   let subtitle = '';

   switch (assistanceType) {
      case 'script':
         title = 'Generating Anchoring Script';
         subtitle = `For ${formatDate(assemblyData.date)} Assembly on "${assemblyData.theme}"`;
         break;
      case 'skit':
         title = 'Creating Assembly Skit';
         subtitle = `For ${formatDate(assemblyData.date)} Assembly on "${assemblyData.theme}"`;
         break;
      case 'suggestions':
         title = 'Thinking of Enhancement Suggestions';
         subtitle = `For ${formatDate(assemblyData.date)} Assembly on "${assemblyData.theme}"`;
         break;
   }

   // Set the title and loading content
   aiResponseTitle.innerHTML = title + `<div class="response-subtitle">${subtitle}</div>`;
   aiResponseContent.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <div class="loading-text">Generating content with AI. This may take a moment...</div>
        </div>
    `;

   // Show the modal
   aiResponseModal.style.display = 'flex';
}

// Function to get sample responses for demonstration purposes
// Replace this with your actual AI response handling
function getSampleResponse(assistanceType, assemblyData) {
   switch (assistanceType) {
      case 'script':
         return `# Anchoring Script for "${assemblyData.theme}" Assembly

Good morning respected Principal, teachers, and my dear friends!

Welcome to today's special assembly on "${assemblyData.theme}". I, ${assemblyData.anchoring_by || '[Student Name]'}, from class ${assemblyData.conducting_class}, will be your anchor for today.

Let's begin our assembly with a moment of silence and prayer...

[Pause for prayer]

Thank you. Now, I invite ${assemblyData.thought_by || '[Student Name]'} to share today's thought of the day.

[After thought of the day]

Thank you for that insightful thought. Now, let's welcome ${assemblyData.word_student || '[Student Name]'} to introduce us to today's Word of the Day.

[After word of the day]

Now, let's stay updated with what's happening around the world. I invite ${assemblyData.news_by || '[Student Name]'} to present today's news headlines.

[After news presentation]

Thank you for keeping us informed. Now, we have a special presentation related to our theme "${assemblyData.theme}".

[Main presentation/skit]

Thank you to all the participants for that wonderful presentation. Before we conclude, I would like to remind everyone about...

[School announcements if any]

With this, we come to the end of today's assembly. Let's all stand for the National Anthem.

[National Anthem]

Thank you everyone. Have a wonderful day ahead!`;

      case 'skit':
         return `# Skit for "${assemblyData.theme}" Assembly

## Scene Setup
[Classroom setup with 5-6 students. One table at the front represents the teacher's desk]

## Characters
- Narrator
- Student 1 (Leader)
- Student 2
- Student 3
- Student 4
- Teacher

## Script

**Narrator:** [Enters from stage left] Our story today explores ${assemblyData.theme}. Watch how our characters learn an important lesson about this theme. [Exits]

**Student 1:** [Entering excitedly] Hey everyone! I've got a great idea for our class project!

**Student 2:** [Looking up from book] What is it this time?

**Student 1:** Let's create a presentation about ${assemblyData.theme.split(':')[0]}! It's so important these days.

**Student 3:** [Skeptically] Why should we care about that? That sounds boring.

**Student 4:** [Enthusiastically] Actually, I read something about this last week. It's really fascinating!

[Students engage in a discussion/debate about the theme, with conflict arising]

**Teacher:** [Enters from stage right] I couldn't help overhearing your discussion. Why don't we explore this topic together?

[Interactive scene where students discover the importance of the theme through activity/discussion]

**Student 3:** [Having a realization] I never thought about it that way before! This really matters to all of us.

**Student 2:** We could make a real difference if we all work together on this.

**Student 1:** That's what I was trying to say! When we unite for a cause, we can achieve so much more.

**Teacher:** I'm proud of how you've all come together to understand ${assemblyData.theme}. Remember this lesson as you go forward.

[All students stand together at the front of the stage]

**All Students:** [In unison] Together we learn, together we grow, together we make a difference!

[Curtain/End]

## Props Needed:
- Books for students
- Simple classroom decorations
- Posters related to the theme (optional)

## Notes for Director:
- Keep the performance under 7 minutes
- Encourage students to add their own creativity to the characters
- Practice projection so everyone in the assembly can hear clearly`;

      case 'suggestions':
         return `# Enhancement Suggestions for "${assemblyData.theme}" Assembly

## Interactive Elements
1. **Theme-Based Quiz:** Start with a quick 3-question quiz about the theme to engage the audience immediately.
2. **Audience Participation:** Include call-and-response moments where the audience repeats a key phrase related to the theme.
3. **Live Poll:** Conduct a quick show-of-hands poll about a question related to the theme.

## Visual Enhancements
1. **Props and Costumes:** Use simple props or color-coordinated clothing related to the theme.
2. **Digital Presentation:** Create a short slideshow with impactful images to display during relevant parts.
3. **Themed Decorations:** Decorate the assembly area with items representing the theme.

## Content Suggestions
1. **Real-Life Examples:** Include stories of how this theme has impacted real people or communities.
2. **Actionable Takeaways:** End with 3 specific actions students can take related to the theme.
3. **Guest Speaker:** Invite someone from the community with expertise on the theme (perhaps a parent or local professional).

## Follow-up Activities
1. **Theme Challenge:** Issue a week-long challenge related to the theme for students to complete.
2. **Reflection Board:** Set up a board where students can post their thoughts or learnings about the theme throughout the week.
3. **Class Discussions:** Provide questions for teachers to continue theme discussions in classrooms.

## Surprise Elements
1. **Flash Mob:** Arrange for a small group to perform a surprise dance or song related to the theme.
2. **Hidden Talents:** Showcase unexpected talents of students related to the theme.
3. **Mystery Box:** Have a mystery box revealed during the assembly containing something symbolic of the theme.

Remember to keep the assembly moving at a good pace - aim for no segment longer than 5 minutes to maintain attention and engagement. Good luck with your assembly!`;

      default:
         return "No content generated. Please try again.";
   }
}

window.onload = function () {
   init();
};