// Load environment variables from a .env file
require('dotenv').config();

// Import required libraries
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

// Create an instance of the Express application
const app = express();

// Set the view engine to use EJS templates
app.set("view engine", "ejs");

// Serve static files from the "public" directory
app.use(express.static("public"));

// Use bodyParser to parse request bodies
app.use(bodyParser.urlencoded({
  extended: true
}));

// Set up session middleware
app.use(session({
  secret: "lets get fit",
  resave: false,
  saveUninitialized: true
}));

// Initialize passport and passport session middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect to the MongoDB database
mongoose.connect("mongodb://127.0.0.1:27017/fitnessDB");

// Define the user schema for the MongoDB collection
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});

// Apply passport-local-mongoose and findOrCreate plugins to the user schema
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Create a User model from the user schema
const User = mongoose.model("User", userSchema);

// Configure passport to use local strategy for authentication
passport.use(User.createStrategy());

// Serialize user data into a session
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

// Deserialize user data from a session
passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

// Configure passport to use Google OAuth2.0 strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/index",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function (accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id
    }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Set up routes for Google authentication
app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  })
);

app.get("/auth/google/index",
  passport.authenticate("google", {
    failureRedirect: "/signup"
  }),
  function (req, res) {
    // Successful authentication, redirect to index.
    res.redirect("/index");
  }
);

// Handle root route
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

// Handle "join" post request
app.post("/join", function (req, res) {
  res.sendFile(__dirname + "/Signup/signup.html");
})

// Handle "login" post request
app.post("/login", function (req, res) {
  const user = new User({
    email: req.body.username,
    password: req.body.password
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/index");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/index");
      });
    }
  });
});

// Handle "register" post request
app.get("/register", function (req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/index");
      });
    }
  });
});

// Start the server on port 3000
app.listen(3000, function () {
  console.log("Server is running on port 3000");
});


// connect mongodb using nodejs
