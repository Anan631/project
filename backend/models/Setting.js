const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    siteName: String,
    defaultLanguage: String,
    maintenanceMode: Boolean,
    maxUploadSizeMB: Number,
    emailNotificationsEnabled: Boolean,
    loginAttemptsLimit: Number,
    passwordResetExpiry: Number,
    notificationEmail: String,
    notificationFrequency: String,
    allowedFileTypes: [String],
    fileScanning: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);


