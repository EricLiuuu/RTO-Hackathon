const {ObjectId} = require('mongodb');
const mongoCollections = require('../config/mongoCollections');
const bcrypt = require('bcryptjs');
const users = mongoCollections.users;
const saltRounds = 10;

module.exports = {
    createUser,
    getUserById
};

function checkUsername(username){
    if(typeof username !== 'string') throw "Error: The username must be a string";
    username=username.trim();
    if(! /^[\d\w]+$/.test(username)) throw "Error: The username only include alphanumeric characters";
    if(username.length<4) throw "Error: The username should be at least 4 characters long";
//    username=username.toLowerCase();
    return username;
}

function checkPassword(password){
    if(typeof password !== 'string') throw "Error: The password must be a string";
    if(password.indexOf(" ")!==-1) throw "Error: The password should not include empty spaces and spaces";
    if(password.length<6) throw "Error: The password should be at least 6 characters long";
    return password;
}

async function createUser(username, password, address, email, phone, ...theArgs){
    if(!username|| !password|| !address|| !email|| !phone) throw "Error: Input Incomplete"
    username = checkUsername(username);
    password = checkPassword(password);

    const usersCollection = await users();
    const findUser = await usersCollection.findOne({username:{ $regex: username, $options: '$i' }});
    if(findUser) throw "Error: The username is already in used";

    const hash = await bcrypt.hash(password, saltRounds);
    let newUsers = {
        userId:undefined,
        username:username,
        password:hash,
        address:address,
        email:email,
        phone:phone,
        receiveNotice:false,
        qrCode:undefined,
        pets:[]
    };
    const insertInfo = await usersCollection.insertOne(newUsers);
    if(insertInfo.insertedCount === 0) throw "Error: Could not add users";

    const newId = insertInfo.insertedId;
    const user = await getUserById(newId);
    if(user) return {userInserted: true};
}

async function getUserById(id,...theArgs){
    if(!id) throw "You must provide an id to search for";
    if(theArgs.length>0) throw "This function has only 1 input";
    if(!(id instanceof ObjectId)){
        if(typeof id !== 'string') throw "Id must be a string";
        id=id.trim();
        if(id.length === 0) throw "The id is empty";
        if (!ObjectId.isValid(id)) throw "ID is not a valid Object ID";
        id = ObjectId(id);
    }

    const usersCollection = await users();
    const findUser = await usersCollection.findOne({_id: id});
    if(findUser === null) throw "Error: No user with that id";
    findUser._id =findUser._id.toString();
    return findUser;
};

