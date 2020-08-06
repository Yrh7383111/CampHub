require('dotenv').config();
const express             = require("express");
const app                 = express();
const bodyParser          = require("body-parser");
const mongoose            = require("mongoose");
const passport            = require("passport");
const LocalStrategy       = require("passport-local");
const methodOverride      = require("method-override");
const flash               = require("connect-flash");
// Require data models
const Campground          = require("./models/campground");                         // Require the Collection named "Campground"
const Comment             = require("./models/comment");                            // Require the Collection named "Comment"
const User                = require("./models/user");                               // Require the Collection named "User"
const seedDB              = require("./seeds");
// Require routes
const commentRoutes       = require("./routes/comments");
const campgroundRoutes    = require("./routes/campgrounds");
const indexRoutes         = require("./routes/index");
const reviewRoutes        = require("./routes/reviews");

mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
const promise = mongoose.connect("mongodb://127.0.0.1/CampHub");          // Connect to the local database


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));                          // Ask "app.js" to serve "public" directory
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');                                  // Moment JS - Time passed since date created
                                                                        // Now, moment is available for use in all of the view files via the variable named moment
// seedDB();



// Passport Configuration
app.use(require("express-session")
({
    secret: "Once again, Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));                   // let LocalStrategy = require("passport-local");
                                                                        // "User.authenticate()" - from "UserSchema.plugin(passportLocalMongoose)"

passport.serializeUser(User.serializeUser());                           // Encode the data from the session,
                                                                        // serialize the data,
                                                                        // and then put it back to the session

passport.deserializeUser(User.deserializeUser());                       // Read the session,
                                                                        // take the data which is encoded from the session,
                                                                        // and then unencoded it



// Middleware
app.use(async function(req, res, next)                                  // Middleware which runs for all Routes
{
    res.locals.currentUser = req.user;
    if(req.user)
    {
        try
        {
            const user = await User.findById(req.user._id).populate("notifications", null, { isRead: false }).exec();
            res.locals.notifications = user.notifications.reverse();
        }
        catch(err)
        {
            console.log(err.message);
            req.flash("error", "Something went wrong");
            return res.redirect("back");
        }
    }

    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");

    next();                                                          // next() - This is important!!!
});



// Use routes
// Use "express.Router()"
app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);                          // Clean up the Route Declaration in "campgrounds.js"
app.use("/campgrounds/:id/comments", commentRoutes);                // Clean up the Route Declaration in "comments.js"
app.use("/campgrounds/:id/reviews", reviewRoutes);



app.listen(3000, () =>
{
    console.log("YelpCamp Server has Started!");
});