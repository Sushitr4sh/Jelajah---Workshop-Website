const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  gender: {
    type: String,
  },
  birthDate: {
    type: Date,
  },
  email: {
    type: String,
    required: true,
    unique: [true, "This email address has already been registered as a user"],
  },
  phoneNumber: {
    type: String,
  },
  address: {
    type: String,
  },
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
