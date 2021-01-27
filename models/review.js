const mongoose = require("mongoose");



// Review Collections schema
const reviewSchema = new mongoose.Schema({
    // Rating
    rating: {
        type: Number,
        // Rating is required
        required: "Please provide a rating (1-5 stars).",
        // Define min and max values
        min: 1,
        max: 5,
        // Add validation to see if the entry is an integer
        validate: {
            // Validator accepts a function definition which it uses for validation
            validator: Number.isInteger,
            message: "{ VALUE } is not an integer value."
        }
    },

    // Review text
    text: { type: String },

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

    // Campground associated with the review
    campground: {
        type: mongoose.Schema.Types.ObjectId,
        // Refer to Campground Collection schema
        // module.exports = mongoose.model("Campground", campgroundSchema)
        ref: "Campground"
    }
}, {
    // If timestamps are set to true,
    // mongoose assigns createdAt and updatedAt fields to your schema, and the type assigned is Date.
    timestamps: true
});



// Create a new Collection named "reviews" (pluralize) in the database,
// apply the Schema on to it.
// and eventually export the "model"
module.exports = mongoose.model("Review", reviewSchema);