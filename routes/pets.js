const express = require('express');
const router = express.Router();
const pets = require('../controllers/pets');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validatePet } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const Pet = require('../models/pet');

router.route('/')
    .get(catchAsync(pets.index))
    .post(isLoggedIn, upload.array('image'), catchAsync(pets.createPet))


router.get('/new', isLoggedIn, pets.renderNewForm)
router.get('/lost', isLoggedIn, pets.renderLostForm)

router.route('/join')
      .get(isLoggedIn, pets.renderJoinForm)
      .post(isLoggedIn, pets.finishJoin)
router.get('/nearUsers', isLoggedIn, pets.findNear)

router.route('/:id')
    .get(catchAsync(pets.showPet))
    .put(isLoggedIn, isAuthor, upload.array('image'), catchAsync(pets.updatePet))
    .delete(isLoggedIn, isAuthor, catchAsync(pets.deletePet));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(pets.renderEditForm))
router.route('/:id/success')
    .get(isLoggedIn, isAuthor, catchAsync(pets.renderSuccessForm))
    .put(isLoggedIn, isAuthor, catchAsync(pets.updatePet))
router.route('/mypets/:currentUser')
        .get(catchAsync(pets.showOwnerPet))

module.exports = router;
