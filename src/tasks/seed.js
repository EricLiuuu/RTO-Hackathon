const dbConnection = require('../config/mongoConnection');
const { pets } = require('../data');
const data = require('../data');
const users = data.users;

//use "npm run seed" to add the seeds
const main = async () => {
    const db = await dbConnection.dbConnection();
    await db.dropDatabase();

    const catperson = await users.createUser("catperson","123123","cat town, cat planet", "catperson@gmail.com","1234567890","true");
    const checkCatperson = await users.checkUser("catperson","123123");
    console.log("checkCatperson:",checkCatperson);

    // const updateCatperson = await users.updateUser("catperson","123123","dog town, dog planet", "dogperson@gmail.com","1234567890")

    // const getCatperson = await users.getUserByUsername("catperson");
    // console.log("getCatperson:",getCatperson)

    const shokora = await pets.createPet("catperson","shokora","cat","noImg","kitten","female","tabby cat","black","short hair","Lovely kitten, like play")
    const banira = await pets.createPet("catperson","banira","cat","noImg","kitten","female","white cat","white","long hair","Shy, but sweet and kind")

    console.log('Done seeding database');
    dbConnection.closeConnection();
};

main().catch(console.log);