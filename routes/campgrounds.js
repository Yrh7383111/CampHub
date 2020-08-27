const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Campground = require("../models/campground");
const Notification = require("../models/notification");
const Comment = require("../models/comment");
const Review = require("../models/review");
const middleware = require("../middleware");
const NodeGeocoder = require("node-geocoder");


// Image Upload

// Configure multer
const multer = require("multer");
const storage = multer.diskStorage
({
    // When a file is uploaded, a custom name will be created
    filename: function (req, file, callback)
    {
        callback(null, Date.now() + file.originalname);
    }
});

// Specify the extension of the image
const imageFilter = function (req, file, cb)
{
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i))
    {
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};
const upload = multer({storage: storage, fileFilter: imageFilter});

// Configure cloudinary
const cloudinary = require("cloudinary");
cloudinary.config
({
    cloud_name: "dxjtrvldg",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// For Google Map API
const options = {
    provider: "google",
    httpAdapter: "https",
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};
const geocoder = NodeGeocoder(options);



// HTTP verb is ".get" -> "res.render()"
// Otherwise, -> "res.redirect()"


// INDEX - Show all campgrounds in the database
// Invoke "app.get("/campgrounds", function(req, res)"
router.get("/", async function(req, res)
{
    // Search bar variable
    let noMatch = null;

    // Pagination variable
    const perPage = 12;
    let pageQuery = parseInt(req.query.page);
    let pageNumber = pageQuery ? pageQuery : 1;


    if (req.query.search)
    {
        const  regex = new RegExp(escapeRegex(req.query.search), "gi");

        try
        {
            const allCampgrounds = await Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage);
            if (!allCampgrounds)
            {
                req.flash("error", "Campground not found");
                return res.redirect("back");
            }
            // Else
            try
            {
                const count = await Campground.countDocuments();

                if (allCampgrounds.length < 1)                                           // "allCampgrounds.length < 1" - No corresponding campgrounds found
                {
                    noMatch = "No campgrounds match that query, please try again.";
                }
                // Else
                // "page: 'campgrounds'" - Extra markup
                res.render("campgrounds/index",
                    {
                        campgrounds: allCampgrounds, page: "campgrounds",

                        // Fuzzy search
                        noMatch: noMatch,

                        // Pagination
                        current: pageNumber, pages: Math.ceil(count / perPage)
                    });
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
    }
    else {
        try
        {
            const allCampgrounds = await Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage);
            if (!allCampgrounds)
            {
                req.flash("error", "Campground not found");
                return res.redirect("back");
            }
            // Else
            try
            {
                const count = await Campground.countDocuments();

                // "page: 'campgrounds'" - Extra markup
                res.render("campgrounds/index",
                    {
                        campgrounds: allCampgrounds, page: "campgrounds",

                        // Fuzzy search
                        noMatch: noMatch,

                        // Pagination
                        current: pageNumber, pages: Math.ceil(count / perPage)
                    });
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
    }
});


// NEW - Show the form to create a new campground
// Functionality: Allow users to add new backgrounds
// Invoke "app.get("/campgrounds/new", function(req, res)"              // Hide the functionality - add a new campground, to User who is not logged in
router.get("/new", middleware.isLoggedIn, function(req, res)            // isLoggedIn - Middleware
                                                                        // If the User is logged in, then execute the next step.
                                                                        // Otherwise, prevent from executing the next step
{
    // Direct to "new.ejs" in "campgrounds" directory
    res.render("campgrounds/new");
});


// CREATE - Add a new campground (newCampground) to the database
// Invoke "app.post("/campgrounds", function(req, res)"                                         // Hide the functionality - add a new campground, to User who is not logged in
router.post("/", middleware.isLoggedIn, upload.single("image"), async function(req, res)        // isLoggedIn - Middleware
                                                                                                // If the User is logged in, then execute the next step.
                                                                                                // Otherwise, prevent from executing the next step
{
    // Obtain data from "<form action="/campgrounds" method="POST">"
    const name = req.body.name;                  // match name from <input class="form-control" type="text" name="name" placeholder="Name">
    const price = req.body.price;                // match name from <input class="form-control" type="number" name="price" placeholder="Price" min="0.01" step="0.01">
    const description = req.body.description;    // match name from <input class="form-control" type="text" name="description" placeholder="Description">
    const author = {
        id: req.user._id,
        username: req.user.username
    };

    // Google Map API
    try
    {
        const data = await geocoder.geocode(req.body.location);
        if (!data.length)
        {
            req.flash("error", "Invalid address");
            return res.redirect("back");                                // Program stops here and will not execute the code below
        }
        // Else

        // Google Map API variables
        const lat = data[0].latitude;
        const lng = data[0].longitude;
        const location = data[0].formattedAddress;

        // Image upload implementation
        try
        {
            const result = await cloudinary.uploader.upload(req.file.path);

            req.body.image = result.secure_url;                             // Add cloudinary url for the image to the campground object under image property
            const image = req.body.image;                                   // match name from <input type="file" name="image" id="image" accept="image/*" required>

            // Add image's public_id to campground object
            req.body.imageId = result.public_id;
            const imageId = req.body.imageId;

            const newCampground = {name, price, image, imageId, description, author, location, lat, lng};
            try
            {
                const newlyCreated = await Campground.create(newCampground);

                try
                {
                    const foundUser = await User.findById(req.user._id).populate("followers");
                    if (!foundUser)
                    {
                        req.flash("error", "User not found");
                        return res.redirect("back");
                    }
                    // Else
                    let newNotification = {
                        username: req.user.username,
                        campgroundId: newlyCreated.id
                    };
                    for(let follower of foundUser.followers)
                    {
                        try
                        {
                            let notification = await Notification.create(newNotification);
                            follower.notifications.push(notification);
                            await follower.save();

                            req.flash("success", "Your campground was successfully added");
                            // Invoke "app.get("/campgrounds", function(req, res)"
                            // and then direct to "index.ejs" in "campgrounds" directory
                            res.redirect("/campgrounds/" + newlyCreated.id);
                        }
                        catch(err)
                        {
                            console.log(err.message);
                            req.flash("error", "Something went wrong");
                            return res.redirect("back");
                        }
                    }
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


// SHOW - Show more information about one campground
// Invoke "app.get(app.get("/campgrounds/:id, function(req, res)"
router.get("/:id", async function(req, res)                                                     // ":id" (anonymous name)
{
    // Find the campground with provided Id

    // "req.params.id" refers to the "id" of a particular campground
    // Corresponds to "app.use("/campgrounds", campgroundRoutes)" (code) in "app.js" (file)

    // populate("comments likes") - Allow us to access details of the users who liked the campground
    try
    {
        const foundCampground = await Campground.findById(req.params.id).populate("likes").populate
        ({
            path: "reviews",
            options: {sort: {createdAt: -1}}
        }).populate
        ({
            path: "comments",
            options: {sort: {createdAt: -1}}
        });
        if (!foundCampground)
        {
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }
        // Else
        // Direct to "show.ejs" in "campgrounds" directory
        res.render("campgrounds/show", {campground:foundCampground});
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong");
        return res.redirect("back");
    }
});


// CREATE - Add a new like to the existing campground to the database
// Invoke "app.post("/:id/like", middleware.isLoggedIn, function (req, res)"
router.post("/:id/like", middleware.isLoggedIn, async function (req, res)
{
    try
    {
        let foundCampground = await Campground.findById(req.params.id);
        if (!foundCampground)
        {
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }
        // Else
        // The some() method will iterate over the foundCampground.likes array,
        // calling equals() on each element (ObjectId) to see if it matches req.user._id and stop as soon as it finds a match.

        // If it finds a match it returns true, otherwise it returns false.
        // And we store the boolean value to the foundUserLike variable.
        let foundUserLike = foundCampground.likes.some(function (like)
        {
            return like.equals(req.user._id);
        });
        if (foundUserLike)
        {
            // User already likes, so remove like
            foundCampground.likes.pull(req.user._id);
        }
        else {
            // Add the new user like
            foundCampground.likes.push(req.user);
        }

        try
        {
            await foundCampground.save();

            res.redirect("/campgrounds/" + foundCampground._id);
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


// Edit - Show the form to edit a existing campground
// Invoke "app.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res)"
router.get("/:id/edit", middleware.checkCampgroundOwnership, async function(req, res)
{
    // Find the correct campground

    // "req.params.id" refers to the "id" of a particular campground
    // Corresponds to "app.use("/campgrounds/:id/comments", commentRoutes)" (code) in "app.js" (file)
    // "req.params" - Object
    try
    {
        const foundCampground = await Campground.findById(req.params.id);
        if (!foundCampground)
        {
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }
        // Else
        // Direct to "edit.ejs" in "campgrounds" directory
        res.render("campgrounds/edit", {campground: foundCampground});
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong");
        return res.redirect("back");
    }
});


// UPDATE - Update a existing campground to the database
// Invoke "app.put("/:id",middleware.checkCampgroundOwnership, function(req, res)"
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), async function(req, res)
{
    // Protect the campground.rating field from manipulation
    delete req.body.campground.rating;

    try
    {
        const data = await geocoder.geocode(req.body.campground.location);
        if (!data.length)
        {
            req.flash("error", "Invalid address");
            return res.redirect("back");
        }
        // Else

        // Google Map API variables
        req.body.campground.location = data[0].formattedAddress;
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;

        // Find the correct campground

        // "req.params.id" - What we are trying to find
        // "req.body.campground" - What data needs to be updated
        //                       - An object which contains name, image and description properties

        // "req.params.id" refers to the "id" of a particular campground
        // Corresponds to "app.use("/campgrounds/:id/comments", commentRoutes)" (code) in "app.js" (file)
        // "req.params" - Object
        try
        {
            let foundCampground = await Campground.findById(req.params.id);
            if (!foundCampground)
            {
                req.flash("error", "Campground not found");
                return res.redirect("back");
            }
            // Else
            if (req.file)
            {
                try
                {
                    await cloudinary.uploader.destroy(foundCampground.imageId);                     // Delete the previous image in cloudinary
                    let result = await cloudinary.uploader.upload(req.file.path);                   // Upload the new image in cloudinary

                    // Update "image" property of the correct campground
                    foundCampground.imageId = result.public_id;
                    foundCampground.image = result.secure_url;
                }
                catch(err)
                {
                    console.log(err.message);
                    req.flash("error", "Something went wrong");
                    return res.redirect("back");
                }
            }

            // If not "req.file"
            // Update the remaining properties of the correct campground
            foundCampground.name = req.body.campground.name;
            foundCampground.description = req.body.campground.description;
            foundCampground.price = req.body.campground.price;
            foundCampground.location = req.body.campground.location;
            foundCampground.lat = req.body.campground.lat;
            foundCampground.lng = req.body.campground.lng;
            try
            {
                await foundCampground.save();

                req.flash("success", "Your campground was successfully edited.");
                res.redirect("/campgrounds/" + foundCampground._id);
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
    }
    catch(err)
    {
        console.log(err.message);
        req.flash("error", "Something went wrong");
        return res.redirect("back");
    }
});


// DELETE - Delete a existing campground
// Invoke "app.delete("/:id", middleware.checkCampgroundOwnership, function(req, res)"
router.delete("/:id", middleware.checkCampgroundOwnership, async function(req, res)
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

        // Delete the image in cloudinary
        await cloudinary.uploader.destroy(foundCampground.imageId);

        // Deletes all comments associated with the campground
        try
        {
            await Comment.deleteMany({"_id": {$in: foundCampground.comments}});

            // Deletes all reviews associated with the campground
            try
            {
                await Review.deleteMany({"_id": {$in: foundCampground.reviews}});

                try
                {
                    await foundCampground.deleteOne();
                    req.flash("success", "Your campground was successfully deleted.");
                    res.redirect("/campgrounds");
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


// Fuzzy Search
function escapeRegex(text)
{
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}



module.exports = router;                        // Export "router"