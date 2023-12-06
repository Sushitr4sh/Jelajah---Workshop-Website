const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const Workshop = require("./workshop");
const User = require("./user");

const reservationSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  workshop: {
    type: Schema.Types.ObjectId,
    ref: "Workshop",
  },
  guest: Number,
  totalPrice: Number,
  date: String,
  time: String,
});

module.exports = mongoose.model("Reservation", reservationSchema);
