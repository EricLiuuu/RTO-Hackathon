const Pet = require('../models/pet');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({
  accessToken: mapBoxToken
});
const {
  cloudinary
} = require("../cloudinary");


module.exports.index = async (req, res) => {
  const allPets = await Pet.find({}).populate('popupText');
  const pets = await Pet.find({status: "lost"}).populate('popupText');
  console.log(pets)
  res.render('pets/index', {allPets, pets})
}

module.exports.renderNewForm = (req, res) => {
  res.render('pets/new');
}
module.exports.renderLostForm = (req, res) => {
  res.render('pets/lost');
}
module.exports.renderJoinForm = (req, res) => {
  res.render('pets/join');
}
module.exports.renderSuccessForm = async (req, res) => {
  // const pet = await Pet.findById(req.params.id);
  res.render('pets/success');
}

module.exports.createPet = async (req, res, next) => {
  const geoData = await geocoder.forwardGeocode({
    query: req.body.pet.location,
    limit: 1
  }).send()
  const pet = new Pet(req.body.pet);
  pet.geometry = geoData.body.features[0].geometry;
  pet.images = req.files.map(f => ({
    url: f.path,
    filename: f.filename
  }));
  pet.author = req.user._id;
  await pet.save();
  req.flash('success', 'Successfully add a new pet!');
  // res.redirect(`/pets/${pet._id}`)
  res.redirect(`/pets/${pet._id}/success`)
}

module.exports.showPet = async (req, res, ) => {
  console.log(req.params.id)
  const pet = await Pet.findById(req.params.id).populate({
    path: 'reviews',
    populate: {
      path: 'author'
    }
  }).populate('author');
  if (!pet) {
    req.flash('error', 'Cannot find that pet!');
    return res.redirect('/pets');
  }
  res.render('pets/show', {pet});
}

module.exports.showOwnerPet = async (req, res, ) => {
  const pets = await Pet.find({author: req.params.currentUser})
  if (!pets) {
    req.flash('error', 'Cannot find that pet!');
    return res.redirect('/pets');
  }
  res.render('pets/mypets', {pets});
}



module.exports.renderEditForm = async (req, res) => {
  const {
    id
  } = req.params;
  const pet = await Pet.findById(id)
  if (!pet) {
    req.flash('error', 'Cannot find that pet!');
    return res.redirect('/pets');
  }
  res.render('pets/edit', {
    pet
  });
}

module.exports.updatePet = async (req, res) => {
  const {
    id
  } = req.params;
  console.log(req.body);
  const pet = await Pet.findByIdAndUpdate(id, {
    ...req.body.pet
  });
  const imgs = req.files.map(f => ({
    url: f.path,
    filename: f.filename
  }));
  pet.images.push(...imgs);
  await pet.save();
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await pet.updateOne({
      $pull: {
        images: {
          filename: {
            $in: req.body.deleteImages
          }
        }
      }
    })
  }
  req.flash('success', 'Successfully updated pet!');
  res.redirect(`/pets/${pet._id}`)
}

module.exports.deletePet = async (req, res) => {
  const {
    id
  } = req.params;
  await Pet.findByIdAndDelete(id);
  console.log(req)
  req.flash('success', 'Successfully deleted pet')
  res.redirect(`/pets/mypets/${req.user._id}`);
}
