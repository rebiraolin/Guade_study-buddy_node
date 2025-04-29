// Validate session data for group-based sessions only
exports.validateSessionData = (data) => {
  // Common required fields for all sessions
  const requiredFields = ['title', 'description', 'subject', 'courseCode', 'dateTime', 'duration'];
  for (const field of requiredFields) {
    if (!data[field]) {
      return `${field} is required`;
    }
  }
  // Validate dateTime
  const dateTime = new Date(data.dateTime);
  if (isNaN(dateTime.getTime())) {
    return 'Invalid dateTime format';
  }
  if (dateTime < new Date()) {
    return 'dateTime cannot be in the past';
  }
  // Validate duration
  if (data.duration <= 0) {
    return 'Duration must be greater than 0';
  }
  return null; // No validation errors
}; 