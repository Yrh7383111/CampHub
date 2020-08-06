const mongoose = require("mongoose");
const Comment = require("./comment");
const Review = require("./review");


const campgroundSchema = new mongoose.Schema                                  // Declare a Schema for the Collection in the database
({
    name: String,
    price: String,
    image: String,
    imageId: String,
    description: String,

    location: String,                                                       // For Google Map API
    lat: Number,                                                            // For Google Map API
    lng: Number,                                                            // For Google Map API

    createdAt: { type: Date, default: Date.now },                           // Moment JS - Time passed since date created

    author: {
        id: {                                                               // "id" is a reference to a User model "id"
                                                                            // needs to match"req.user._id"
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String                                                    // "username" is a reference to a User model "username",
                                                                            // needs to match "req.user.username"
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"                                                  // "Comment" needs to match
                                                                            // module.exports = mongoose.model("Comment", commentSchema);
        }
    ],

    // Allow campground model to support the "like" feature
    likes: [                                                                //  Hold ObjectId references to the particular users who like the campground
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    // Allow campground model to support the "review" feature
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],

    // Allow campground model to support the "rate" feature
    rating: {
        type: Number,
        default: 0
    }
});


module.exports = mongoose.model("Campground", campgroundSchema);           // Create a new Collection named "campgrounds" (pluralize) in the database,
                                                                           // apply the Schema on to it.
                                                                           // and eventually export the "model"