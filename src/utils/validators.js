// Validate session data for group-based sessions only
exports.validateSessionData = (data) => {
  // Common required fields for all sessions
  const requiredFields = ['title', 'description', 'subject', 'courseCode', 'dateTime', 'duration', 'creator']; // Ensure 'creator' is here
  const errors = [];
  for (const field of requiredFields) {
      if (!data[field]) errors.push(`${field} is required`);
  }
  // Validate dateTime
  if (isNaN(new Date(data.dateTime).getTime())) errors.push('Invalid dateTime format');
  if (new Date(data.dateTime) < new Date()) errors.push('dateTime cannot be in the past');
  if (data.duration <= 0) errors.push('Duration must be greater than 0');

  return errors.length ? errors : null;
};