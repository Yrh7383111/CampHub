const express = require("express");
const router = express.Router({mergeParams: true});
const async = require("async");
const Campground = require("../models/campground");
const Review = require("../models/review");
const middleware = require("../middleware");



// General idea:
// The campground show page will show only 5 latest campground reviews,
// and that there will be a link to see all the reviews, which is the index route defined below


// INDEX - Show all reviews in the database
// Invoke "app.get("/campgrounds/:id/reviews", function(req, res)"
router.get("/", async function (req, res) {
    try
    {
        // Sort the populated reviews array to show the latest first
        const foundCampground = await Campground.findById(req.params.id).populate({ path: "reviews", options: { sort: { createdAt: -1 } } });
        if (!foundCampground)
        {
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }
        // Else
        res.render("reviews/index", { campground: foundCampground });
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong in reviews GET");
        res.redirect("back");
    }
});


// NEW - Show the form to add a new review to a particular campground
// Invoke "app.get("/campgrounds/:id/reviews/new", function(req, res)"
// middleware.checkReviewExistence - one single review per user
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, async function (req, res) {
    try
    {
        const foundCampground =  await Campground.findById(req.params.id);
        if (!foundCampground)
        {
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }
        // Else
        res.render("reviews/new", {campground: foundCampground});
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong in reviews GET new");
        res.redirect("back");
    }
});


// CREATE - Add a new review to the database
// Invoke "app.post("/campgrounds/:id/reviews", function(req, res)"
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, async function (req, res) {
    try
    {
        let foundCampground = await Campground.findById(req.params.id).populate("reviews");
        if (!foundCampground)
        {
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }
        // Else
        try
        {
            let review =  await Review.create(req.body.review);

            review.author.id = req.user._id;
            review.author.username = req.user.username;
            review.campground = foundCampground;
            review.save();

            foundCampground.reviews.push(review);
            // Calculate the new average review for the campground
            foundCampground.rating = calculateAverage(foundCampground.reviews);
            foundCampground.save();

            req.flash("success", "Your review was successfully added.");
            res.redirect("/campgrounds/" + foundCampground._id);
        }
        catch(err)
        {
            console.log(err.message);
            req.flash("error", "Something went wrong in reviews POST");
            return res.redirect("back");
        }
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong in reviews POST");
        res.redirect("back");
    }
});


// Edit - Show the form to edit a existing review
// Invoke "app.get("/campgrounds/:id/reviews/:review_id/edit", function(req, res)"
router.get("/:review_id/edit", middleware.checkReviewOwnership, async function (req, res) {
    try
    {
        const foundReview = await Review.findById(req.params.review_id);
        if (!foundReview)
        {
            req.flash("error", "Review not found");
            return res.redirect("back");
        }
        // Else
        res.render("reviews/edit", {campground_id: req.params.id, review: foundReview});
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong in reviews GET edit");
        res.redirect("back");
    }
});


// UPDATE - Update a existing review to the database
// Invoke "app.put("/campgrounds/:id/reviews/:review_id", function(req, res)"
router.put("/:review_id", middleware.checkReviewOwnership, async function (req, res) {
    try
    {
        await Review.findByIdAndUpdate(req.params.review_id, req.body.review, { new: true });

        try
        {
            let foundCampground = await Campground.findById(req.params.id).populate("reviews");
            if (!foundCampground)
            {
                req.flash("error", "Campground not found");
                return res.redirect("back");
            }
            // Else
            // Recalculate campground average
            foundCampground.rating = calculateAverage(foundCampground.reviews);
            foundCampground.save();

            req.flash("success", "Your review was successfully edited.");
            res.redirect("/campgrounds/" + foundCampground._id);

        }
        catch(err)
        {
            console.log(err.message);
            req.flash("error", "Something went wrong in reviews PUT");
            res.redirect("back");
        }
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong in reviews PUT");
        res.redirect("back");
    }
});


// Delete - Delete a review
// Invoke "app.delete("/campgrounds/:id/reviews/:review_id", function(req, res)"
router.delete("/:review_id", middleware.checkReviewOwnership, async function (req, res) {
    try
    {
        await Review.findByIdAndRemove(req.params.review_id);

        try
        {
            // $pull - remove the deleted ObjectId review reference from the campground's reviews array
            let updatedCampground = await Campground.findByIdAndUpdate(req.params.id, { $pull: { reviews: req.params.review_id } }, { new: true }).populate("reviews");
            // Recalculate campground average
            updatedCampground.rating = calculateAverage(updatedCampground.reviews);
            updatedCampground.save();

            req.flash("success", "Your review was successfully deleted.");
            res.redirect("/campgrounds/" + req.params.id);
        }
        catch(err)
        {
            console.log(err.message);
            req.flash("error", "Something went wrong in reviews DELETE");
            res.redirect("back");
        }
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong in reviews DELETE");
        res.redirect("back");
    }
});



// Calculate the average rating
// It takes the array of populated reviews,
// then calculates an average rating and returns it from the function, which will later be assigned to "campground.rating".
function calculateAverage(reviews) {
    let sum = 0;

    if (reviews.length === 0)
    {
        return 0;
    }
    else {
        reviews.forEach(function (element) {
            sum += element.rating;
        });
        return (sum / reviews.length);
    }
}



// Export "router"
module.exports = router;