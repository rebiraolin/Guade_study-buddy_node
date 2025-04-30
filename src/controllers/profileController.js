const User = require('../models/User');

exports.editProfile = async (req, res) => {
  // Destructure fields from the request body
  // Note: File data for profilePic comes from req.file due to Multer
  const {
    name,
    major,
    year,
    bio,
    gender,
    location,
    language,
    school,
    interests,
  } = req.body;

  // Get the user ID from the authenticated request (set by authMiddleware)
  const userId = req.user.id;

  try {
    // Find the user by their ID
    const user = await User.findById(userId);

    // If user is not found (shouldn't happen with authMiddleware, but good practice)
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // --- Handle File Upload for Profile Picture ---
    if (req.file) {
      // If a file was uploaded by Multer
      // Here you would implement your logic to save the file permanently
      // This could be saving to a local 'uploads' folder, AWS S3, Cloudinary, etc.

      // Example Placeholder Logic (YOU NEED TO REPLACE THIS)
      // Assuming you save the file and get back a URL or path
      const profilePicUrl = `http://Guade-Study-Buddy.com/uploads/${
        req.file.filename || req.file.originalname
      }`; // Replace with actual storage logic result

      // Or if using memory storage and uploading to cloud storage:
      // try {
      //     const uploadResult = await uploadFileToCloudStorage(req.file.buffer, req.file.originalname); // Implement this function
      //     profilePicUrl = uploadResult.url; // Get the URL from your cloud storage result
      // } catch (uploadError) {
      //     console.error("Profile picture upload failed:", uploadError);
      //     return res.status(500).json({ message: "Failed to upload profile picture" });
      // }

      user.profilePic = profilePicUrl; // Save the URL/path in the database
      console.log(
        `Profile picture uploaded and path set for user ${userId}: ${profilePicUrl}`
      );
    } else if (req.body.profilePic === null || req.body.profilePic === '') {
      // Handle case where frontend explicitly sends null or empty string to remove profile pic
      user.profilePic = undefined; // Or null, based on how you want to represent no profile pic
      console.log(`Profile picture removed for user ${userId}`);
    }
    // --- End File Upload Handling ---

    // --- Update other profile fields from req.body ---
    // Check if each field exists in the body (frontend might only send changed fields)
    if (name !== undefined) user.name = name;
    if (major !== undefined) user.major = major;
    if (year !== undefined) user.year = year;
    if (bio !== undefined) user.bio = bio;
    // Add checks for new fields
    if (location !== undefined) user.location = location;
    if (language !== undefined) user.language = language;
    if (school !== undefined) user.school = school;

    // Special handling for interests array:
    // You might want to replace the array or add/remove items
    if (interests !== undefined) {
      // Assuming interests is sent as an array [string, string, ...]
      if (Array.isArray(interests)) {
        user.interests = interests; // Replace the whole array
      } else {
        console.warn(
          'Interests field received but was not an array for user:',
          userId
        );
        // Optionally send a warning/error back to the client
      }
    }

    // Handle gender validation/update
    if (gender !== undefined) {
      // Although schema has enum, adding a check here or in middleware is good
      const allowedGenders = ['boy', 'girl']; // Match schema enum
      if (allowedGenders.includes(gender)) {
        user.gender = gender;
      } else {
        console.warn(
          `Invalid gender value received for user ${userId}: ${gender}`
        );
        return res
          .status(400)
          .json({ message: 'Invalid gender value provided' });
      }
    }

    // Save the updated user document to the database
    const updatedUser = await user.save();

    // Send back success response with updated user data (exclude password)
    res
      .status(200)
      .json({
        message: 'Profile updated successfully',
        result: updatedUser.toObject({ getters: true, virtuals: true }),
      }); // Use .toObject to get plain JS object and include virtuals/getters if any
  } catch (error) {
    console.error('Error updating profile for user:', userId, error); // Log the specific error
    // Mongoose validation errors (e.g., invalid gender)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res
      .status(500)
      .json({ message: 'Error updating profile', error: error.message }); // Provide error detail
  }
};
