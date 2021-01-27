const express = require("express");
// Merge parameters from "campgrounds.js" and "comments.js"
const router = express.Router({ mergeParams: true });
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const middleware = require("../middleware");



// NEW - Show the form to add a new comment to a particular campground
// Invoke "app.get("/campgrounds/:id/comments/new", function(req, res)"
// Hide the functionality - add a new comment, to User who is not logged in
// isLoggedIn - Middleware
router.get("/new", middleware.isLoggedIn, async function(req, res) {
    try
    {
        // "req.params.id" refers to the "id" of a particular campground
        // Corresponds to "app.use("/campgrounds/:id/comments", commentRoutes)" (code) in "app.js" (file)
        const foundCampground = await Campground.findById(req.params.id);
        if (!foundCampground)
        {
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }
        // Else
        res.render("comments/new", { campground: foundCampground });
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong in comments GET new");
        res.redirect("back");
    }
});


// CREATE - Add a new comment (req.body.comment) to the database
// Invoke "app.post("/campgrounds/:id/comments", function(req, res)"
// isLoggedIn - Middleware
router.post("/", middleware.isLoggedIn, async function(req, res) {
    try
    {
        // "req.params.id" refers to the "id" of a particular campground
        // Corresponds to "app.use("/campgrounds/:id/comments", commentRoutes)" (code) in "app.js" (file)
        let foundCampground = await Campground.findById(req.params.id);
        if (!foundCampground)
        {
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }
        // Else
        try
        {
            let comment = await Comment.create(req.body.comment);

            // Attach username and id to comment
            // "comment.author.id" needs to match Comment Data Model
            comment.author.id = req.user._id;
            // "comment.author.username" needs to match Comment Data Model
            comment.author.username = req.user.username;
            comment.save();

            // Add comment to comments array
            foundCampground.comments.push(comment);
            foundCampground.save();

            req.flash("success", "Your comment was successfully added.");
            res.redirect('/campgrounds/' + foundCampground._id);
        }
        catch(err)
        {
            console.log(err.message);
            req.flash("error", "Something went wrong in comments POST");
            res.redirect("back");
        }
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong in comments POST");
        res.redirect("back");
    }
});


// Edit - Show the form to edit a existing comment
// Invoke "app.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res)"
router.get("/:comment_id/edit", middleware.checkCommentOwnership, async function(req, res) {
    try
    {
        // "req.params.id" refers to the "id" of a particular campground
        // Corresponds to "app.use("/campgrounds/:id/comments", commentRoutes)" (code) in "app.js" (file)
        const foundCampground = await Campground.findById(req.params.id);
        if (!foundCampground)
        {
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }
        // Else
        try
        {
            // "req.params.comment_id" refers to the "id" of a particular comment
            // Corresponds "router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res)"
            const foundComment = await Comment.findById(req.params.comment_id);
            if (!foundComment)
            {
                req.flash("error", "Comment not found");
                return res.redirect("back");
            }
            // Else
            res.render("comments/edit", { campground_id: req.params.id, comment: foundComment });
        }
        catch(err)
        {
            console.log(err.message);
            req.flash("error", "Something went wrong in comments GET edit");
            res.redirect("back");
        }
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong in comments GET edit");
        res.redirect("back");
    }
});


// UPDATE - Update a existing comment to the database
// Invoke "app.put("/:comment_id", middleware.checkCommentOwnership, function(req, res)"
router.put("/:comment_id", middleware.checkCommentOwnership, async function(req, res) {
    try
    {
        // "req.params.comment_id" refers to the "id" of a particular comment
        // Corresponds "router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res)"
        await Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment);

        req.flash("success", "Your comment was successfully edited.");
        res.redirect("/campgrounds/" + req.params.id );
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong in comments PUT");
        res.redirect("back");
    }
});


// DELETE - Delete a existing comment
// Invoke "app.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res)"
router.delete("/:comment_id", middleware.checkCommentOwnership, async function(req, res) {
    // "req.params.comment_id" refers to the "id" of a particular comment
    // Corresponds "router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res)"
    try
    {
        await Comment.findByIdAndRemove(req.params.comment_id);

        req.flash("success", "Your comment was successfully deleted.");
        res.redirect("/campgrounds/" + req.params.id);
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong in comments DELETE");
        res.redirect("back");
    }
});



// Export "router"
module.exports = router;