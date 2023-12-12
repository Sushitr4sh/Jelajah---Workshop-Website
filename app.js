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
const Workshop = require("./models/workshop");
const Review = require("./models/review");
const Reservation = require("./models/reservation");

/* EJS */
const ejsMate = require("ejs-mate");

/* Error Handlling */

/* Cloudinary */
const { cloudinary } = require("./cloudinary");
const { storage } = require("./cloudinary");
const multer = require("multer");
const upload = multer({ storage });

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
const workshop = require("./models/workshop");

const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/jelajah";

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

/* Home */
app.get("/", (req, res) => {
  res.render("workshops/index");
});

/* Authentication */
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

/* Account */
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

app.get("/account/:id/wishlist", async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate("wishlist");
  res.render("users/wishlist", { user });
});

app.post("/workshops/:id/wishlist/:userId", async (req, res) => {
  const { id, userId } = req.params;
  const user = await User.findById(userId);
  const workshop = await Workshop.findById(id);

  // Check if the workshop is already in the user's wishlist
  const isInWishlist = user.wishlist.some((w) => w.equals(workshop._id));

  if (isInWishlist) {
    // If the workshop is already in the wishlist, redirect to the workshop page
    res.redirect(`/workshops/${id}`);
  } else {
    // If the workshop is not in the wishlist, push it and save the user
    user.wishlist.push(workshop);
    await user.save();

    res.redirect(`/workshops/${id}`);
  }
});

app.delete("/user/:id/wishlist/:wishlistId", async (req, res) => {
  const { id, wishlistId } = req.params;
  const user = await User.findByIdAndUpdate(id, {
    $pull: { wishlist: wishlistId },
  });
  await user.save();
  res.redirect(`/account/${id}/wishlist`);
});

app.post("/user/:id/workshop/:workshopId/wishlist", async (req, res) => {
  const { id, workshopId } = req.params;
  const user = await User.findById(id).populate("cart");
  const workshop = await Workshop.findById(workshopId);
  const reservation = new Reservation(req.body);
  reservation.author = user;
  reservation.workshop = workshop;
  user.cart.push(reservation);
  await user.save();
  await reservation.save();
  res.redirect(`/${id}/cart`);
});

/* Workshops */
app.get("/workshops", async (req, res) => {
  const workshops = await Workshop.find();
  res.render("workshops/workshop", { workshops });
});

app.get("/admin", (req, res) => {
  res.render("workshops/admin");
});

app.post("/workshops", upload.array("image"), async (req, res) => {
  const workshop = new Workshop(req.body);
  workshop.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  await workshop.save();
  res.redirect("/workshops");
});

app.post("/workshops/:id/reviews", async (req, res) => {
  const { id } = req.params;
  const workshop = await Workshop.findById(id).populate("reviews");
  const review = new Review(req.body.review);
  review.author = req.user._id;
  workshop.reviews.push(review);

  // Calculate the sum of ratings
  const sumOfRatings = workshop.reviews.reduce(
    (total, review) => total + review.rating,
    0,
  );
  // Calculate the average rating
  workshop.rating = sumOfRatings / workshop.reviews.length;
  workshop.totalRating += 1;

  await review.save();
  await workshop.save();
  res.redirect(`/workshops/${id}`);
});

app.delete("/workshops/:id/reviews/:reviewId", async (req, res) => {
  const { id, reviewId } = req.params;
  const workshop = await Workshop.findByIdAndUpdate(id, {
    $pull: { reviews: reviewId },
  });
  await Review.findByIdAndDelete(reviewId);

  const newWorkshop = await Workshop.findById(id).populate("reviews");
  if (workshop.rating.length) {
    // Calculate the sum of ratings
    const sumOfRatings = newWorkshop.reviews.reduce(
      (total, review) => total + review.rating,
      0,
    );
    // Calculate the average rating
    newWorkshop.rating = sumOfRatings / newWorkshop.reviews.length;
    newWorkshop.totalRating -= 1;
  } else {
    newWorkshop.rating = 0;
    newWorkshop.totalRating = 0;
  }

  await newWorkshop.save();

  res.redirect(`/workshops/${id}`);
});

app.get("/workshops/:id", async (req, res) => {
  const { id } = req.params;
  const workshop = await Workshop.findById(id).populate({
    path: "reviews",
    populate: {
      path: "author",
    },
  });
  workshop.rating = workshop.rating.toFixed(1);
  res.render("workshops/workshop-detail", { workshop });
});

app.get("/:id/cart", async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate({
    path: "cart",
    populate: {
      path: "workshop",
    },
  });
  res.render("users/cart", { user });
});

app.get("/payment", (req, res) => {
  res.render("workshops/payment");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
