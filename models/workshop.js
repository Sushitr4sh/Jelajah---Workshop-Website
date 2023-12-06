const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const Review = require("./review");

const ImageSchema = new Schema({
  url: String,
  filename: String,
});

/* Now we can do this: */
ImageSchema.virtual("thumbnail").get(function () {
  /* this refers to particular image of ImageSchema in images array */
  return this.url.replace("/upload", "/upload/w_300");
});

const opts = { toJSON: { virtuals: true } };

const workshopSchema = new Schema({
  title: String,
  category: {
    type: String,
    enum: ["Crafting", "Cooking"],
  },
  location: String,
  locationDetail: String,
  images: [ImageSchema],
  description: String,
  duration: Number,
  price: Number,
  rating: {
    type: Number,
    default: 0,
  },
  totalRating: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
});

module.exports = mongoose.model("Workshop", workshopSchema);
