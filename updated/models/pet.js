const mongoose = require('mongoose');
const Review = require('./review')
const Schema = mongoose.Schema;


// https://res.cloudinary.com/douqbebwk/image/upload/w_300/v1600113904/QR Reunite/gxgle1ovzd2f3dgcpass.png

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const opts = { toJSON: { virtuals: true } };

const PetSchema = new Schema({
  petname: String,
  images: [ImageSchema],
  species:String,
  breed:String,
  color:String,
  hair:String,
  location: String,
  lostDate: String,
  status: String,
  gender:String,
  lostLocation:String,
  phone:Number,
  age: Number,
  geometry: {
      type: {
          type: String,
          enum: ['Point'],
          required: true
      },
      coordinates: {
          type: [Number],
          required: true
      }
  },
  description: String,
  author: {
      type: Schema.Types.ObjectId,
      ref: 'User'
  },

}, opts);


PetSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <strong><a href="/pets/${this._id}">${this.petname}</a><strong>
    <p>${this.description.substring(0, 20)}...</p>`
});



PetSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Pet', PetSchema);
