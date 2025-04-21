// Color mapping for updated remarks
const colorMap = {
   'Outstanding performance': '#10b981',       // Green
   'Good performance': '#60a5fa',         // Light Blue
   'Very good performance': '#3b82f6',              // Blue
   'Fair performance': '#f59e0b',              // Amber
   'Needs hard work': '#ef4444',               // Red
   'Absent': '#6d28d9'                         // Purple
};

// Function to get max marks considering both regular and custom exams
function getMaxMarks(examName) {
   // First check common exams
   const commonExam = exams.find(e => e.name === examName);
   if (commonExam) return commonExam.mm;

   // Then check custom exams
   const selectedClass = classSelect.value;
   const selectedSubject = subjectSelect.value;

   const customExam = customExams.find(e =>
      e.name === examName &&
      e.class === selectedClass &&
      e.subject === selectedSubject);

   return customExam ? customExam.mm : 10; // Default to 10 if not found
}

// Function to generate performance remark
function getPerformanceRemark(marks, examName) {
   if (marks === null) return 'Absent';

   const maxMarks = getMaxMarks(examName);
   const percentage = (marks / maxMarks) * 100;

   if (percentage < 50) return 'Needs hard work';
   if (percentage < 70) return 'Fair performance';
   if (percentage < 80) return 'Good performance';
   if (percentage < 90) return 'Very good performance';
   return 'Outstanding performance';
}

// Function to get CSS class for remark
function getRemarkClass(remark) {
   if (remark === 'Absent') return 'remark-absent';
   if (remark === 'Needs hard work') return 'remark-poor';
   if (remark === 'Fair performance') return 'remark-average';
   if (remark === 'Good performance' || remark === 'Very good performance') return 'remark-good';
   if (remark === 'Outstanding performance') return 'remark-excellent';
   return '';
}

function getPassingMark(examName) {
   // Assuming passing mark is 33% of maximum marks
   return getMaxMarks(examName) * 0.33;
}
