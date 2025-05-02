// Classes to fetch student lists for
let classes = ['5-A1', '6-A1', '6-A2', '6-A3', '6-A4', '7-A1', '7-A2', '7-A3', '7-A4', '8-A1', '8-A2', '8-A3', '9-A1', '9-A2', '9-A3', '10-A1', '10-A2', '10-A3'];

// Global array of subjects
let subjects = [
  "English",
  "Hindi",
  "Science",
  "Maths",
  "Social Science",
  "Sanskrit",
  "Computer",
  "Data Science",
  "GK"
];

// Global class-wise list of subjects
const classwiseSubjects = {
  1: ['English', 'Hindi', 'Maths', 'EVS', 'Computer', 'GK'],
  2: ['English', 'Hindi', 'Maths', 'EVS', 'Computer', 'GK'],
  3: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Computer', 'GK'],
  4: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Computer', 'GK'],
  5: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Computer', 'GK'],
  6: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK'],
  7: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK'],
  8: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Data Science', 'GK'],
   9: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Data Science'],
   10: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Data Science'],
}

let filteredClasses = [];
let filteredSubjects = [];

// Common pre-decided exams
const exams = [
             {'name': 'PT-1', 'mm': 20},
             {'name': 'PT-2', 'mm': 20},
             {'name': 'PT-3', 'mm': 20},
             {'name': 'PT-4', 'mm': 20}
        ];

// Color mapping for updated remarks
const colorMap = {
   'Outstanding performance': '#10b981', // Green
   'Good performance': '#60a5fa', // Light Blue
   'Very good performance': '#3b82f6', // Blue
   'Fair performance': '#f59e0b', // Amber
   'Needs hard work': '#ef4444', // Red
   'Absent': '#6d28d9' // Purple
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
function getPerformanceRemark(marks, examName, computedPercentage = null) {
   let percentage;

   // If an already computed percentage value is given, generate a remark based on that
   if (computedPercentage) {
      percentage = computedPercentage;
   } else {
      if (marks === null) return 'Absent';
      const maxMarks = getMaxMarks(examName);
      percentage = (marks / maxMarks) * 100;
   }

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

function getSubjectsForClass(classValue, useFilteredSubjects=false) {
  // Extract class number from 'classValue' like '6-A2'
  let classNumber = parseInt(classValue.split('-')[0]);

  // Get the relevant subjects for that class
  let classSubjects = classwiseSubjects[classNumber];

  // If no subjects found, return an empty array
  if (!classSubjects) return [];

  // Filter the global 'subjects' or 'filteredSubjects' array to keep only those present in 'classSubjects'
  const arr = useFilteredSubjects ? filteredSubjects : subjects;

  return arr.filter(subject => classSubjects.includes(subject));
}
