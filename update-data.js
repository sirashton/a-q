const fs = require('fs');

// Read the current data
const data = JSON.parse(fs.readFileSync('src/data/advices.json', 'utf8'));

// Function to determine question type for UK text
function determineQuestionType(text) {
  if (!text || !text.includes('?')) {
    return null;
  }
  
  // Check if questions appear at the start (first 100 characters contain ?)
  const firstPart = text.substring(0, 100);
  if (firstPart.includes('?')) {
    return 'start';
  }
  
  // Check if questions appear at the end (last 200 characters contain ?)
  const lastPart = text.substring(text.length - 200);
  if (lastPart.includes('?')) {
    return 'end';
  }
  
  // Default to end if questions are found anywhere
  return 'end';
}

// Update NZ data
data.nz.sections.forEach(section => {
  section.advices.forEach(advice => {
    if (advice.query) {
      advice.questionType = 'end';
    } else {
      advice.questionType = null;
    }
  });
});

// Update UK data
data.uk.sections.forEach(section => {
  section.advices.forEach(advice => {
    if (advice.text) {
      advice.questionType = determineQuestionType(advice.text);
    } else {
      advice.questionType = null;
    }
  });
});

// Write the updated data back
fs.writeFileSync('src/data/advices.json', JSON.stringify(data, null, 2));

console.log('Data updated successfully!');
console.log('NZ items with questions:', data.nz.sections.reduce((count, section) => 
  count + section.advices.filter(advice => advice.questionType).length, 0));
console.log('UK items with questions:', data.uk.sections.reduce((count, section) => 
  count + section.advices.filter(advice => advice.questionType).length, 0));
