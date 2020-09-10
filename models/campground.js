const mongoose = require("mongoose");
const Comment = require("./comment");
const Review = require("./review");



// Campground Collection schema
const campgroundSchema = new mongoose.Schema
({
    // Basic information
    name: String,
    price: String,
    image: String,
    imageId: String,
    description: String,

    // Google Map API
    location: String,
    lat: Number,
    lng: Number,

    // Moment JS - Time passed since date created
    createdAt: { type: Date, default: Date.now },

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

    // Like feature
    likes: [
        {
            // "id" is a reference to a User Collection "id"
            // When referring to id of author, needs to use"req.user._id"
            type: mongoose.Schema.Types.ObjectId,
            // Refer to User Collection schema
            // module.exports = mongoose.model("User", UserSchema)
            ref: "User"
        }
    ],

    // Comments feature
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            // Refer to Comment Collection schema
            // module.exports = mongoose.model("Comment", commentSchema)
            ref: "Comment"
        }
    ],

    // Review feature
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],

    // Rating feature
    rating: {
        type: Number,
        default: 0
    }
});


// Create a new Collection named "campgrounds" (pluralize) in the database,
// apply the Schema on to it.
// and eventually export the "model"
module.exports = mongoose.model("Campground", campgroundSchema);