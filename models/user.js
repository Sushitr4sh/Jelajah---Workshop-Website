const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const Workshop = require("./workshop");

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
  level: {
    type: Number,
    default: 1,
  },
  completedWorkshop: [
    {
      type: Schema.Types.ObjectId,
      ref: "Workshop",
    },
  ],
  wishlist: [
    {
      type: Schema.Types.ObjectId,
      ref: "Workshop",
    },
  ],
  cart: [
    {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
    },
  ],
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
