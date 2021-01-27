const mongoose = require("mongoose");



// Notifications Collection schema
const notificationSchema = new mongoose.Schema({
	username: String,
	campgroundId: String,
	isRead: { type: Boolean, default: false }
});



// Create a new Collection named "notifications" (pluralize) in the database,
// apply the Schema on to it.
// and eventually export the "model"
module.exports = mongoose.model("Notification", notificationSchema);