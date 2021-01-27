const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");



const UserSchema = new mongoose.Schema({
    // Basic information
    username: { type: String, unique: true, required: true },
    password: String,
    avatar: String,
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Admin User Role Authorization
    isAdmin: { type: Boolean, default: false },

    // Notifications
    notifications: [
        {
            type: mongoose.Schema.Types.ObjectId,
            // Refer to Comment Notification schema
            // module.exports = mongoose.model("Notification", commentSchema)
            ref: 'Notification'
        }
    ],

    // Followers
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            // Refer to User Collection schema
            // module.exports = mongoose.model("User", UserSchema)
            ref: 'User'
        }
    ]
});



// "User.authenticate()" - from "UserSchema.plugin(passportLocalMongoose)"
UserSchema.plugin(passportLocalMongoose);
// Create a new Collection named "users" (pluralize) in the database,
// apply the Schema on to it.
// and eventually export the "model"
module.exports = mongoose.model("User", UserSchema);