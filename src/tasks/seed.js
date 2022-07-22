const dbConnection = require('../config/mongoConnection');
const { pets } = require('../data');
const data = require('../data');
const users = data.users;

//use "npm run seed" to add the seeds
const main = async () => {
    const db = await dbConnection.dbConnection();
    await db.dropDatabase();

//create the a user catperson
    const catperson = await users.createUser("catperson","123123",[-94.1743, 36.3507], "catperson@gmail.com","1234567890","true");

//Authenticated user login, check the password
    const checkCatperson = await users.checkUser("catperson","123123");
    console.log("checkCatperson:",checkCatperson,"\n");

//add qrcode for user catperson
    await users.updateUserQR("catperson","a string for generate QR code");

    // const updateCatperson = await users.updateUser("catperson","123123","(36.350798, -94.174383)", "dogperson@gmail.com","1234567890")

    // const getCatperson = await users.getUserByUsername("catperson");
    // console.log("getCatperson:",getCatperson)

//create the 2 pets for the user catperson
    const shokora = await pets.createPet("catperson","shokora","cat","noImg","kitten","female","tabby cat","black","short hair","Lovely kitten, like play","07/22/2022","(36.350798, -94.174383)")
    const banira = await pets.createPet("catperson","banira","cat","noImg","kitten","female","white cat","white","long hair","Shy, but sweet and kind")

//get catperson all pets
    const allcatpersonPets = await pets.getAllPets("catperson");
    console.log("allcatpersonPets:\n",allcatpersonPets,"\n");

//create the 4 volunteers
    const volunteer00 = await users.createUser("volunteer00","123123",[-94.1743, 36.3507], "volunteer00@gmail.com","1234567800","true");
    const volunteer01 = await users.createUser("volunteer01","123123",[-94.1744, 36.3508], "volunteer01@gmail.com","1234567801","true");
    const volunteer02 = await users.createUser("volunteer02","123123",[-94.1763, 36.3527], "volunteer02@gmail.com","1234567802","true");
    const volunteer03 = await users.createUser("volunteer03","123123",[-94.1743, 72.3507], "volunteer03@gmail.com","1234567803","true");

//find the volunteers near to catperson(TBD)
    // const findVolunteers = await users.findVolunteer(catperson.address,5000)
    // console.log(findVolunteers)

//Get all users
    const allUsers = await users.getAllUsers();
    //console.log("allUsers:\n",allUsers);

    console.log('Done seeding database');
    dbConnection.closeConnection();
};

main().catch(console.log);