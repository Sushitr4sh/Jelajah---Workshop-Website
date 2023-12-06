module.exports.isLoggedIn = (req, res, next) => {
  /* There something called user in request object that is put automatically by passport. This will contain the information about the user. It will also going to be automatically filled in with the deserialized information from the session.*/

  /* We can use this helper method from password, it's called isAuthenticated and it's automatically added to request object itself. */

  /* Also, just a note: you still need to add the req.session.returnTo = req.originalUrl line to the isLoggedIn middleware (in the middleware.js file), like this: */
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash("error", "You must be logged in First");
    return res.redirect("/login");
  }
  next();
};
