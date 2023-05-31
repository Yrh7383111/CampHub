const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const Campground = require("../models/campground");
const Notification = require("../models/notification");
const middleware = require("../middleware");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");



// Invoke "app.get("/", function(req, res)"
router.get("/", function(req, res) {
    res.render("landing");
});


// Authentication
// NEW - Show the form to register a User
// Invoke "app.get("/register", function(req, res)"
router.get("/register", function(req, res) {
    res.render("register", {page: "register"});
});


// CREATE - Add a new User to the database
// Invoke "app.post("/register", function(req, res)"
router.post("/register", async function(req, res) {
    let newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });

    // Admin User Role Authorization
    if (req.body.adminCode === "secretcode") {
        newUser.isAdmin = true;
    }

    try {
        // Hash "req.body.password"
        // and then save it into the database
        const user = await User.register(newUser, req.body.password);

        // Authentication
        passport.authenticate("local")(req, res, function() {
            req.flash("success", "Welcome to CapmHub " + user.username);
            res.redirect("/campgrounds");
        });
    }
    catch(err) {
        console.log(err.message);
        req.flash("error", "Something went wrong in register POST");
        res.redirect("back");
    }
});


// NEW - Show the form to login
// Invoke "app.get("/login", function(req, res)"
router.get("/login", function(req, res) {
    res.render("login", {page: "login"});
});


// Login logic
// "passport.authenticate()" - Middleware
router.post("/login", passport.authenticate("local",
    // Functionality:
    // compare the user input from "login.ejs",
    // and then compare with the data in the databased
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res){});


// Logout logic
// Invoke "app.get("/logout", function(req, res)"
router.get("/logout", function(req, res) {
    // logout - function from "passport" package
    req.logout();
    req.flash("success", "Your account was successfully logged out.");
    res.redirect("/campgrounds");
});


// SHOW - Show more information about one user
// Invoke "app.get("/users/:id", function(req, res)"
router.get("/users/:id", async function(req, res) {
    try {
        const foundUser = await User.findById(req.params.id).populate("followers");
        if (!foundUser) {
            req.flash("error", "User not found");
            return res.redirect("back");
        }
        // Else
        try {
            const foundCampgrounds = await Campground.find().where("author.id").equals(foundUser._id);
            if (!foundCampgrounds) {
                req.flash("error", "Campground not found");
                return res.redirect("back");
            }
            // Else
            res.render("users/show", {user: foundUser, campgrounds: foundCampgrounds});
        }
        catch(err) {
            console.log(err.message);
            req.flash("error", "Something went wrong in users GET");
            res.redirect("back");
        }
    }
    catch(err) {
        console.log(err.message);
        req.flash("error", "Something went wrong in users GET");
        res.redirect("back");
    }
});


// Follow user
// Invoke "app.get("/follow/:id", function(req, res)"
router.get("/follow/:id", middleware.isLoggedIn, async function(req, res) {
    try {
        let foundUser = await User.findById(req.params.id);
        if (!foundUser) {
            req.flash("error", "User not found");
            return res.redirect("back");
        }
        // Else
        foundUser.followers.push(req.user._id);
        foundUser.save();

        req.flash("success", "Successfully followed " + foundUser.username + "!");
        res.redirect("/users/" + req.params.id);
    }
    catch(err) {
        console.log(err.message);
        req.flash("error", "Something went wrong in follow GET");
        res.redirect("back");
    }
});


// View all notifications
// Invoke "app.get("/notifications", function(req, res)"
router.get("/notifications", middleware.isLoggedIn, async function(req, res) {
    try {
        const foundUser = await User.findById(req.user._id).populate({
            path: "notifications",
            options: { sort: { "_id": -1 } }
        });
        if (!foundUser) {
            req.flash("error", "User not found");
            return res.redirect("back");
        }
        // Else
        let allNotifications = foundUser.notifications;
        res.render("notifications/index", { allNotifications: allNotifications });
    }
    catch(err) {
        console.log(err.message);
        req.flash("error", "Something went wrong in notifications GET");
        res.redirect("back");
    }
});


// Handle notifications
// Invoke "app.get("/notifications/:id", function(req, res)"
router.get("/notifications/:id", middleware.isLoggedIn, async function(req, res) {
    try {
        let foundNotification = await Notification.findById(req.params.id);
        if (!foundNotification) {
            req.flash("error", "Notification not found");
            return res.redirect("back");
        }
        // Else
        foundNotification.isRead = true;
        foundNotification.save();
        res.redirect(`/campgrounds/${ foundNotification.campgroundId }`);
    }
    catch(err) {
        console.log(err.message);
        req.flash("error", "Something went wrong in notifications GET");
        res.redirect("back");
    }
});


// NEW - Show the form to input user email to request for password reset
// Invoke "app.get("/forgot", function(req, res)"
router.get("/forgot", function(req, res) {
    res.render("forgot");
});


// Send the email to the user with generated token to
// Invoke "app.post("/forgot", function(req, res)"
router.post("/forgot", function(req, res, next) {
    // An array of list of functions which will be executed one by one
    async.waterfall([
        // Generate hex code for the token
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                const token = buf.toString("hex");
                done(err, token);
            });
        },

        // Generate the token
        function(token, done) {
            User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                    req.flash("error", "No account with that email address exists.");
                    return res.redirect("/forgot");
                }
                // Else
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000;
                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },

        // SMTP configurations
        function(token, user, done) {
            const smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "yelpcamp.jackson@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            const mailOptions = {
                to: user.email,
                from: "yelpcamp.jackson@gmail.com",
                subject: "YelpCamp Password Reset",
                text: "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
                    "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                    "http://" + req.headers.host + "/reset/" + token + "\n\n" +
                    "If you did not request this, please ignore this email and your password will remain unchanged.\n"
            };
            // Send the email
            smtpTransport.sendMail(mailOptions, function(err) {
                console.log("Email successfully sent");
                req.flash("success", "An e-mail has been sent to " + user.email + " with further instructions.");
                done(err, "done");
            });
        }
    ], function(err) {
        if (err) {
            console.log(err.message);
            req.flash("error", "Something went wrong");
            return res.redirect("back");
        }
        // Else
        res.redirect("/forgot");
    });
});


// NEW - Show the form to reset the new password
// Invoke "app.get("/reset/:token", function(req, res)"
router.get("/reset/:token", async function(req, res)
{
    try {
        const foundUser = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
        if (!foundUser) {
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot");
        }
        // Else
        res.render("reset", {token: req.params.token});
    }
    catch(err) {
        console.log(err.message);
        req.flash("error", "Something went wrong in reset GET");
        res.redirect("back");
    }
});


// Update the password with a valid token
// Invoke "app.post("/reset/:token", function(req, res)"
router.post("/reset/:token", function(req, res) {
    // An array of list of functions which will be executed one by one
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                if (!user) {
                    req.flash("error", "Password reset token is invalid or has expired.");
                    return res.redirect("back");
                }
                if (req.body.password !== req.body.confirm) {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect("back");
                }
                else {
                    user.setPassword(req.body.password, function(err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function(err) {
                            req.logIn(user, function(err)
                            {
                                done(err, user);
                            });
                        });
                    });
                }
            });
        },

        function(user, done) {
            let smtpTransport = nodemailer.createTransport({
                    service: "Gmail",
                    auth: {
                        user: "yelpcamp.jackson@gmail.com",
                        pass: process.env.GMAILPW
                    }
                });
            let mailOptions = {
                to: user.email,
                from: "yelpcamp.jackson@mail.com",
                subject: "Your password has been changed",
                text: "Hello,\n\n" +
                    "This is a confirmation that the password for your account " + user.email + " has just been changed.\n"
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                req.flash("success", "Your password was successfully changed.");
                done(err);
            });
        }
    ], function(err) {
        if (err) {
            console.log(err.message);
            req.flash("error", "Something went wrong");
            return res.redirect("back");
        }
        // Else
        res.redirect("/campgrounds");
    });
});


// Export "router"
module.exports = router;
