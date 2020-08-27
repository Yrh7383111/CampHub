const express = require("express");
const router = express.Router({mergeParams: true});                               // Merge parameters from "campgrounds.js" and "comments.js"
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const middleware = require("../middleware");



// NEW - Show the form to add a new comment to a particular campground
// Functionality: Allow users to add new comments
// Invoke "app.get("/campgrounds/:id/comments/new", function(req, res)"
router.get("/new", middleware.isLoggedIn, async function(req, res)                      // Hide the functionality - add a new comment, to User who is not logged in
                                                                                        // isLoggedIn - Middleware
                                                                                        // If the User is logged in, then execute the next step.
                                                                                        // Otherwise, prevent from executing the next step
{
    // Find campground by id

    // "req.params.id" refers to the "id" of a particular campground
    // Corresponds to "app.use("/campgrounds/:id/comments", commentRoutes)" (code) in "app.js" (file)
    try
    {
        const foundCampground = await Campground.findById(req.params.id);
        if (!foundCampground)
        {
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }
        // Else
        // Direct to "new.ejs" in "comments" directory
        res.render("comments/new", {campground: foundCampground});
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong");
        return res.redirect("back");
    }
});


// CREATE - Add a new comment (req.body.comment) to the database
// Invoke "app.post("/campgrounds/:id/comments", function(req, res)"                    // Hide the functionality - add a new comment, to User who is not logged in
router.post("/", middleware.isLoggedIn, async function(req, res)                        // isLoggedIn - Middleware
                                                                                        // If the User is logged in, then execute the next step.
                                                                                        // Otherwise, prevent from executing the next step
{
    // Lookup campground using ID

    // "req.params.id" refers to the "id" of a particular campground
    // Corresponds to "app.use("/campgrounds/:id/comments", commentRoutes)" (code) in "app.js" (file)
    try
    {
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

            // Add username and id to comment
            comment.author.id = req.user._id;                                       // "comment.author.id" needs to match Comment Data Model
            comment.author.username = req.user.username;                            // "comment.author.username" needs to match Comment Data Model
            // Save comment
            comment.save();

            // "campground.comments" is an array
            foundCampground.comments.push(comment);
            // Save campground
            foundCampground.save();

            req.flash("success", "Your comment was successfully added.");
            // Invoke "app.get(app.get("/campgrounds/:id, function(req, res)"
            // Direct to "show.ejs" in "campgrounds" directory
            res.redirect('/campgrounds/' + foundCampground._id);

        }
        catch(err)
        {
            console.log(err.message);
            req.flash("error", "Something went wrong");
            return res.redirect("back");
        }
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong");
        return res.redirect("back");
    }
});


// Edit - Show the form to edit a existing comment
// Invoke "app.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res)"
router.get("/:comment_id/edit", middleware.checkCommentOwnership, async function(req, res)
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
            res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
        }
        catch(err)
        {
            console.log(err.message);
            req.flash("error", "Something went wrong");
            return res.redirect("back");
        }
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong");
        return res.redirect("back");
    }
});


// UPDATE - Update a existing comment to the database
// Invoke "app.put("/:comment_id", middleware.checkCommentOwnership, function(req, res)"
router.put("/:comment_id", middleware.checkCommentOwnership, async function(req, res)
{
    // "req.params.comment_id" refers to the "id" of a particular comment
    // Corresponds "router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res)"
    try
    {
        let updatedComment = await Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment);

        req.flash("success", "Your comment was successfully edited.");
        res.redirect("/campgrounds/" + req.params.id );

    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong");
        return res.redirect("back");
    }
});


// DELETE - Delete a existing comment
// Invoke "app.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res)"
router.delete("/:comment_id", middleware.checkCommentOwnership, async function(req, res)
{
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
        req.flash("error", "Something went wrong");
        return res.redirect("back");
    }
});



module.exports = router;                    // Export "router"