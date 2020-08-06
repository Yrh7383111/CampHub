const Campground = require("../models/campground");
const Comment = require("../models/comment");
const Review = require("../models/review");


// All the Middleware will be stored here
let middlewareObj = {};



middlewareObj.checkCampgroundOwnership = async function(req, res, next)
{
    // User Authentication - To check if a user is logged in or not
    if(req.isAuthenticated())
    {
        try
        {
            const foundCampground = await Campground.findById(req.params.id);
            if(!foundCampground)
            {
                req.flash("error", "Campground not found");
                return res.redirect("back");
            }
            // Else
            // Authorization - To check if a user is given permission to do certain operations
            if((foundCampground.author.id.equals(req.user._id)) || (req.user.isAdmin))      // "foundCampground.author.id" - Mongo object
                                                                                             // "req.user._id" - String
                                                                                            // Admin User Role Authorization
            {
                next();                                                                     // If yes, then proceed to the next step,
            }
            else {
                req.flash("error", "Sorry, you don't have the permission...");
                res.redirect("back");                                                       // otherwise, go back to the previous page
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


middlewareObj.checkCommentOwnership = async function(req, res, next)
{
    // User Authentication - To check if a user is logged in or not
    if(req.isAuthenticated())
    {
        try
        {
            const foundComment = await  Comment.findById(req.params.comment_id);
            if (!foundComment)
            {
                req.flash("error", "Comment not found");
                return res.redirect("back");
            }
            // Else

            // Authorization - To check if a user is given permission to do certain operations
            if((foundComment.author.id.equals(req.user._id)) || (req.user.isAdmin))                 // Admin User Role Authorization
            {
                next();                                                                             // If yes, then proceed to the next step,
            }
            else {
                req.flash("error", "Sorry, you don't have the permission...");
                res.redirect("back");                                                               // otherwise, go back to the previous page
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


middlewareObj.checkReviewOwnership = async function(req, res, next)
{
    if (req.isAuthenticated())
    {
        try
        {
            const foundReview = await Review.findById(req.params.review_id);
            if(!foundReview)
            {
                req.flash("error", "Review not found");
                return res.redirect("back");
            }
            // Else

            // Authorization - To check if a user is given permission to do certain operations
            if(foundReview.author.id.equals(req.user._id))
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


middlewareObj.checkReviewExistence = async function (req, res, next)
{
    if (req.isAuthenticated())
    {
        try
        {
            const foundCampground = await Campground.findById(req.params.id).populate("reviews");
            if(!foundCampground)
            {
                req.flash("error", "Campground not found");
                return res.redirect("back");
            }
            // Else

            // Check if req.user._id exists in foundCampground.reviews
            let foundUserReview = foundCampground.reviews.some(function (review)        // some() - return true a review with the currently logged in user was found
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


// Middleware function declaration - To check if the User if logged in or not
middlewareObj.isLoggedIn = function(req, res, next)                                         // Three parameters
{
    // If the User is logged in, then execute the next step.
    // Otherwise, prevent from executing the next step
    if(req.isAuthenticated())                                                               // req.isAuthenticated() - function from "passport" package
    {
        return next();
    }
    else {
        req.flash("error", "You need to be logged in!");                                    // req.flash(Key, Value)
                                                                                            // Add some one-time use data before redirecting to the route
        // Invoke "app.get(app.get("/campgrounds/:id, function(req, res)"
        // and then direct to "show.ejs" in "campgrounds" directory
        res.redirect("/login");
    }
};



module.exports = middlewareObj;