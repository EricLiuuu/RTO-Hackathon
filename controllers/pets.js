const Pet = require('../models/pet');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const nodemailer = require('nodemailer');
const geocoder = mbxGeocoding({
  accessToken: mapBoxToken
});
const {
  cloudinary
} = require("../cloudinary");
const qr = require("qrcode");

module.exports.index = async (req, res) => {
  const allPets = await Pet.find({}).populate('popupText');
  const pets = await Pet.find({
    status: "lost"
  }).populate('popupText');
  console.log(pets)
  res.render('pets/index', {
    allPets,
    pets
  })
}

/////////////////////////////////email/////////////////////////
module.exports.findNear = async (req, res) => {
  const pets = await Pet.find({
    author: req.user.id
  })
  const location = pets[0].geometry
  console.log(location)
  const myEmail = process.env.EMAIL //use this email to send notification to nearby users
  const myPassword = process.env.EMAIL_PASSWORD
  const nearPets = await Pet.find({
    geometry: {
      $near: {
        $geometry: location,
        $maxDistance: 8000
      }
    }
  })
  emailList = [];
  for (pet of nearPets) {
    emailList.push(pet.email);
  }
  emailString = emailList.toString();

  const transporter = nodemailer.createTransport({
    service: 'gmail',  //CHOOSE YOUR EMAIL SERVICE
    auth: {
      user: myEmail,
      pass: myPassword
    }
  });

  const mailOptions = {
    from: myEmail,
    to: emailString,
    subject: 'This is a lost pet alert near you!',
    text: 'Please see the link: http://localhost:3000/pets/'.concat(req.params)
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
      req.flash('error', 'Something went wrong!');
      res.redirect('/pets')
    } else {
      req.flash('success', 'Successfully sent the lost alert!');
      res.redirect('/pets')
    }
  });
}

module.exports.finishJoin = (req, res) => {
  req.flash('success', 'Successfully join the community!');
  res.redirect('/pets');
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
module.exports.updateEmail = async (req, res) => {
  const {
    id
  } = req.params;
  console.log(req.body);
  const pet = await Pet.findByIdAndUpdate(id, {
    ...req.body.pet
  });
  await pet.save();
  res.redirect("/");
}

module.exports.renderSuccessForm = async (req, res) => {
  const {
    id
  } = req.params;
  const pet = await Pet.findById(id)
  if (!pet) {
    req.flash('error', 'Cannot find that pet!');
    return res.redirect('/pets');
  }


  const petid = req.params.id;
  const url = `pets/${req.params.id}`;
  console.log(url)

  const src = qr.toDataURL(url, (err, src) => {
    if (err) res.send("Error occured");

    // Let us return the QR code image as our response and set it to be the source used in the webpage
    res.render("pets/success", {
      pet,
      src
    });
  });
  // res.render('pets/success');
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
  console.log(req.params.id);
  const pet = await Pet.findById(req.params.id).populate({
    path: 'reviews',
    populate: {
      path: 'author'
    }
  }).populate('author');
  const url = `pets/${pet._id}`;
  console.log(url)

  const src = qr.toDataURL(url, (err, src) => {
    if (err) res.send("Error occured");

    // Let us return the QR code image as our response and set it to be the source used in the webpage
    res.render("pets/show", {
      src,
      pet
    });
  });


}
module.exports.showOwnerPet = async (req, res, ) => {
  const pets = await Pet.find({
    author: req.params.currentUser
  })
  if (!pets) {
    req.flash('error', 'Cannot find that pet!');
    return res.redirect('/pets');
  }
  res.render('pets/mypets', {
    pets
  });
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
  const {id} = req.params;

  const pet = await Pet.findByIdAndUpdate(id, {
    ...req.body.pet
  });
  const geoData = await geocoder.forwardGeocode({
    query: req.body.pet.location,
    limit: 1
  }).send()
  pet.geometry = geoData.body.features[0].geometry;
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
