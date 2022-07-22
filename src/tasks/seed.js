const dbConnection = require('../config/mongoConnection');
const data = require('../data');
const users = data.users;

const main = async () => {
    const db = await dbConnection.dbConnection();
    await db.dropDatabase();

    const catperson = await users.createUser("catperson","123123","cat town, cat planet", "catperson@gmail.com","1234567890");

//  const checkCatperson = await users.checkUser("checkCatperson","123");
//  console.log("checkCatperson:",checkCatperson);

    console.log('Done seeding database');
    dbConnection.closeConnection();
};

main().catch(console.log);