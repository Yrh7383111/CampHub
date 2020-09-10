// MongoDB schema
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const Review = require("../models/review");



// All the Middleware will be stored here
let middlewareObj = {};


// Campground ownership check
middlewareObj.checkCampgroundOwnership = async function(req, res, next) {
    // req.isAuthenticated() - function from "passport" package
    if (req.isAuthenticated())
    {
        try
        {
            const foundCampground = await Campground.findById(req.params.id);
            if (!foundCampground)
            {
                req.flash("error", "Campground not found");
                return res.redirect("back");
            }
            // Else
            // Authorization -
            // 1. The user is the creator of the campground
            // 2. The user is an admin
            if ((foundCampground.author.id.equals(req.user._id)) || (req.user.isAdmin))
            {
                next();
            }
            else {
                req.flash("error", "Sorry, you don't have the permission...");
                res.redirect("back");
            }

        }
        catch(err)
        {
            console.log(err.message);
            req.flash("error", "Something went wrong");
            res.redirect("back");
        }
    }
    else {
        req.flash("error", "You need to be logged in!");
        res.redirect("back");
    }
};

// Comment ownership check
middlewareObj.checkCommentOwnership = async function(req, res, next) {
    if (req.isAuthenticated())
    {
        try
        {
            const foundComment = await Comment.findById(req.params.comment_id);
            if (!foundComment)
            {
                req.flash("error", "Comment not found");
                return res.redirect("back");
            }
            // Else
            // Authorization -
            // 1. The user is the creator of the comment
            // 2. The user is an admin
            if ((foundComment.author.id.equals(req.user._id)) || (req.user.isAdmin))
            {
                next();
            }
            else {
                req.flash("error", "Sorry, you don't have the permission...");
                res.redirect("back");
            }
        }
        catch(err)
        {
            console.log(err.message);
            req.flash("error", "Something went wrong");
            res.redirect("back");
        }

    }
    else {
        req.flash("error", "You need to be logged in!");
        res.redirect("back");
    }
};

// Review ownership check
middlewareObj.checkReviewOwnership = async function(req, res, next) {
    if (req.isAuthenticated())
    {
        try
        {
            const foundReview = await Review.findById(req.params.review_id);
            if (!foundReview)
            {
                req.flash("error", "Review not found");
                return res.redirect("back");
            }
            // Else
            // Authorization -
            // 1. The user is the creator of the review
            // 2. The user is an admin
            if (foundReview.author.id.equals(req.user._id))
            {
                next();
            }
            else {
                req.flash("error", "Sorry, you don't have the permission...");
                res.redirect("back");
            }

        }
        catch(err)
        {
            console.log(err.message);
            req.flash("error", "Something went wrong");
            return res.redirect("back");
        }

    }
    else {
        req.flash("error", "You need to be logged in!");
        res.redirect("back");
    }
};

// Review existence check
middlewareObj.checkReviewExistence = async function (req, res, next) {
    if (req.isAuthenticated())
    {
        try
        {
            const foundCampground = await Campground.findById(req.params.id).populate("reviews");
            if (!foundCampground)
            {
                req.flash("error", "Campground not found");
                return res.redirect("back");
            }
            // Else
            // Check if req.user._id exists in foundCampground.reviews
            // some() - return true if a review with the currently logged in user is found
            let foundUserReview = foundCampground.reviews.some(function (review)
            {
                return review.author.id.equals(req.user._id);
            });
            if (foundUserReview)
            {
                req.flash("error", "You already wrote a review.");
                return res.redirect("/campgrounds/" + foundCampground._id);
            }
            else {
                // If the review was not found, go to the next middleware
                next();
            }
        }
        catch(err)
        {
            console.log(err.message);
            req.flash("error", "Something went wrong");
            res.redirect("back");
        }

    }
    else {
        req.flash("error", "You need to be logged in!");
        res.redirect("back");
    }
};


// User login check
middlewareObj.isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated())
    {
        return next();
    }
    else {
        req.flash("error", "You need to be logged in!");
        // Add some one-time use data before redirecting to the route
        // Invoke "/login" URL
        res.redirect("/login");
    }
};



module.exports = middlewareObj;