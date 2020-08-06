const mongoose = require("mongoose");


const commentSchema = mongoose.Schema
({
    author: {
        id: {                                                           // "id" is a reference to a User model "id"
                                                                        // needs to match"req.user._id"
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String                                                // "username" is a reference to a User model "username",
                                                                        // needs to match "req.user.username"
    },
    createdAt: { type: Date, default: Date.now },                       // Moment JS - Time passed since date created
    text: String
});


module.exports = mongoose.model("Comment", commentSchema);