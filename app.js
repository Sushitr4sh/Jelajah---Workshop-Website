if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

/* Express */
const express = require("express");
const app = express();
const port = 3000;

/* Mongoose */
const mongoose = require("mongoose");

const methodOverride = require("method-override");

const helmet = require("helmet");

const path = require("path");

const moment = require("moment");

/* Mongoose Models */
const User = require("./models/user");

/* EJS */
const ejsMate = require("ejs-mate");

/* Error Handlling */

/* Cookies, Session, and Flash */
const session = require("express-session");
const flash = require("connect-flash");

/* Connect Mongo */
const MongoStore = require("connect-mongo");

/* Passport */
const passport = require("passport");
const LocalStrategy = require("passport-local");

/* mongoSanitize*/
const mongoSanitize = require("express-mongo-sanitize");

const dbUrl = "mongodb://127.0.0.1:27017/jelajah";

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(dbUrl);
  console.log("Database Connected");
}

/* View Engine */
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* Middleware etc */
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(mongoSanitize());

const secret = "PENJELAJAH";
const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret,
  },
});
store.on("error", function (e) {
  console.log(e);
});

app.use(
  session({
    store,
    name: "session",
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    },
  }),
);

app.use(flash());

/* app.use(helmet());
const scriptSrcUrls = ["https://cdn.tailwindcss.com", "https://unpkg.com/"];
const styleSrcUrls = [
  "https://fonts.googleapis.com/",
  "https://cdnjs.cloudflare.com/",
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'"],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://s3.amazonaws.com/stabled.response/",
      ],
    },
  }),
); */

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.idError = req.flash("idError");
  next();
});

app.get("/", (req, res) => {
  res.render("workshops/index");
});

app.get("/login", (req, res) => {
  res.render("users/login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("/");
  },
);

app.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    } else {
      res.redirect("/");
    }
  });
});

app.get("/signup", (req, res) => {
  res.render("users/signup");
});

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, (err) => {
      if (err) res.send(err);
      else {
        res.redirect("/");
      }
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
});

app.get("/account/:id", (req, res) => {
  res.render("users/account");
});

app.get("/account/:id/personal-info", (req, res) => {
  res.render("users/personal-info");
});

app.put("/account/:id/personal-info", async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, {
    $set: { ...req.body },
  });
  /* const imgs = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  campground.images.push(...imgs); */
  await user.save();

  /* if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await campground.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
    console.log(campground);
  }
 */
  /* req.flash("success", "Successfully updated campground!"); */
  res.redirect(`/account/${id}/personal-info`);
});

app.get("/workshops", (req, res) => {
  res.render("workshops/workshop");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
