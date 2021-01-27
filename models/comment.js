const mongoose = require("mongoose");



// Comment Collection schema
const commentSchema = mongoose.Schema({
    // Author
    author: {
        // "id" is a reference to a User Collection "id"
        // When referring to id of author, needs to use"req.user._id"
        id: {
            type: mongoose.Schema.Types.ObjectId,
            // Refer to User Collection schema
            // module.exports = mongoose.model("User", UserSchema)
            ref: "User"
        },
        // "username" is a reference to a User model "username",
        // needs to match "req.user.username"
        username: String
    },

    // Moment JS - Time passed since date created
    createdAt: { type: Date, default: Date.now },

    // Comment text
    text: String
});



// Create a new Collection named "comments" (pluralize) in the database,
// apply the Schema on to it.
// and eventually export the "model"
module.exports = mongoose.model("Comment", commentSchema);