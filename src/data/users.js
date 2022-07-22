const {ObjectId} = require('mongodb');
const mongoCollections = require('../config/mongoCollections');
const bcrypt = require('bcryptjs');
const users = mongoCollections.users;
const saltRounds = 10;

module.exports = {
    createUser,
    getUserById,
    getUserByUsername,
    checkUser,
    updateUser,
    updateUserQR,
    getAllUsers
};

function checkUsername(username){
    if(typeof username !== 'string') throw "Error: The username must be a string";
    username=username.trim();
    if(! /^[\d\w]+$/.test(username)) throw "Error: The username only include alphanumeric characters";
    if(username.length<4) throw "Error: The username should be at least 4 characters long";
    if(username.length>16) throw "Error: The username should be no more than 16 characters long";
//    username=username.toLowerCase();
    return username;
}

function checkPassword(password){
    if(typeof password !== 'string') throw "Error: The password must be a string";
    if(password.indexOf(" ")!==-1) throw "Error: The password should not include empty spaces and spaces";
    if(password.length<6) throw "Error: The password should be at least 6 characters long";
    return password;
}

async function createUser(username, password, address, email, phone, receiveNotice, ...theArgs){
    if(!username|| !password|| !address|| !email|| !phone|| !receiveNotice) throw "Error: Input Incomplete"
    if(theArgs.length>0) throw "Number of inputs are exceed upper limit";
    username = checkUsername(username);
    password = checkPassword(password);

    const usersCollection = await users();
    const findUser = await usersCollection.findOne({username:{ $regex: username, $options: '$i' }});
    if(findUser) throw "Error: The username is already in used";

    const hash = await bcrypt.hash(password, saltRounds);
    let newUsers = {
        username:username,
        password:hash,
        address: address,
        email:email,
        phone:phone,
        receiveNotice:receiveNotice,
        qrCode:undefined,
        pets:[]
    };
    const insertInfo = await usersCollection.insertOne(newUsers);
    if(insertInfo.insertedCount === 0) throw "Error: Could not add users";

    const newId = insertInfo.insertedId;
    const user = await getUserById(newId);
    if(user) return user;
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

async function getUserByUsername(username,...theArgs){
    if(!username) throw "You must provide an id to search for";
    if(theArgs.length>0) throw "This function has only 1 input";

    const usersCollection = await users();
    const findUser = await usersCollection.findOne({username:{ $regex: username, $options: '$i' }});
    if(findUser === null) throw "Error: No user with that username";
    findUser._id =findUser._id.toString();
    return findUser;
};


async function checkUser(username, password,...theArgs){
    if(!username||!password) throw "Error: You should input both username and password";
    if(theArgs.length>0) throw "Number of inputs are exceed upper limit";
    username = checkUsername(username);
    password = checkPassword(password);

    const usersCollection = await users();
    const findUser = await usersCollection.findOne({username:{ $regex: username, $options: '$i' }});
    if(findUser === null) throw "Error: Either the username or password is invalid";

    let compareToMatch = false;

    try {
        compareToMatch = await bcrypt.compare(password, findUser.password);
    } catch (e) {
        //no op
    }

    if (compareToMatch) {
        return {authenticated: true};
    } else {
        throw "Error: Either the username or password is invalid";
    }
}

async function updateUser (username, password, address, email, phone, receiveNotice, ...theArgs) {
    if(!username|| !password|| !address|| !email|| !phone) throw "Error: Input Incomplete";
    if(theArgs.length>0) throw "Number of inputs are exceed upper limit";
    username = checkUsername(username);
    password = checkPassword(password);
    
    const usersCollection = await users();
    const findUser = await usersCollection.findOne({username:{ $regex: username, $options: '$i' }});
    if (findUser === null) throw "No user with that username.";

    const hash = await bcrypt.hash(password, saltRounds);
    const qrCode=findUser.qrCode;
    const pets=findUser.pets;
    let updateUsers = {
        password:hash,
        address:address,
        email:email,
        phone:phone,
        receiveNotice:receiveNotice,
        qrCode:qrCode,
        pets:pets
    };
    const updateInfo = await usersCollection.updateOne({username:{ $regex: username, $options: '$i' }}, { $set: updateUsers});
    if (!updateInfo.matchedCount && !updateInfo.modifiedCount) {
        throw new Error("Could not update user successfully.");
    }

    let result = await getUserByUsername(username);
    return result;
}

async function updateUserQR(username,qrCode,...theArgs){
    if(!username||!qrCode) throw "Error: Should input both username and QRcode";
    if(theArgs.length>0) throw "Number of inputs are exceed upper limit";

    const usersCollection = await users();
    const findUser = await usersCollection.findOne({username:{ $regex: username, $options: '$i' }});
    if (findUser === null) throw "No user with that username.";

    const password=findUser.password;
    const address=findUser.address;
    const email=findUser.email;
    const phone=findUser.phone;
    const receiveNotice=findUser.receiveNotice;
    const pets=findUser.pets;

    let updateUsers = {
        password:password,
        address:address,
        email:email,
        phone:phone,
        receiveNotice:receiveNotice,
        qrCode:qrCode,
        pets:pets
    };

    const updateInfo = await usersCollection.updateOne({username:{ $regex: username, $options: '$i' }}, { $set: updateUsers});
    if (!updateInfo.matchedCount && !updateInfo.modifiedCount) {
        throw new Error("Could not update QRcode successfully.");
    }

    let result = await getUserByUsername(username);
    return result;
}

async function getAllUsers(...theArgs){
    if(theArgs.length>0) throw "This function has no input.";

    const usersCollection = await users();
    const usersAll = await usersCollection.find({}).toArray();

    for(let i=0; i<usersAll.length; i++){
        usersAll[i]._id=usersAll[i]._id.toString();
    }

    return usersAll;
};

// async function findVolunteer (location, distance,...theArgs) {
//     if(!location||!distance) throw "Error: You should input both location and distance";
//     if(theArgs.length>0) throw "Number of inputs are exceed upper limit";

//     const usersCollection = await users();
//     //const volunteersArr = await usersCollection.find({address:{ $nearSphere : location, $maxDistance: distance }}).toArray();
//     const volunteersArr = await usersCollection.find({address:{ 
//         $near: {
//             $geometry: location,
//             $maxDistance: distance
//      }}}).toArray();
//     if(volunteersArr.length === 0) throw "Error: No volunteers near by";

//     return volunteersArr;
// }