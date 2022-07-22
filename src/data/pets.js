const {ObjectId} = require('mongodb');
const mongoCollections = require('../config/mongoCollections');
const users = mongoCollections.users;
const usersJs = require('./users');

module.exports = {
    createPet,
    getPetById,
    getAllPets
};

function throwErrorString(str){
    if(typeof str !== 'string') throw new Error("(One of) Input must be a string.");
    str=str.trim();
    if(str.length === 0) throw new Error("(One of) Input is empty.");
    return str;
}

//Input those information to create a pet. You must put username, petname, species. Others are not required, you can choose not input them.
async function createPet(username,petname,species,img,age,sex,breed,color,hair,discription,lostDate,lostLocation,...theArgs){
    if(!username|| !petname || !species) throw "You should input username, pet name and species";
    if(theArgs.length>0) throw "Number of inputs are exceed upper limit";

    const usersCollection = await users();
    const findUser = await usersCollection.findOne({username:{ $regex: username, $options: '$i' }});
    if(findUser === null) throw "Error: No user with that id.";

    let newPetId = new ObjectId()
    let newPet = {
        _id: newPetId,
        petname:petname,
        species:species,
        img:img,
        age:age,
        sex:sex,
        breed:breed,
        color:color,
        hair:hair,
        discription:discription,
        lostDate:lostDate,
        lostLocation:lostLocation
    }

    findUser.pets.push(newPet);

    const updateInfo = await usersCollection.updateOne({username:{ $regex: username, $options: '$i' }}, { $set: findUser});
    if (!updateInfo.matchedCount && !updateInfo.modifiedCount) {
        throw new Error("Could not creat pet successfully.");
    }

    let result = await getPetById(newPetId.toString());

    return result;
}

//Input a petId and return all the information about this pet
async function getPetById(petId,...theArgs){
    if(!petId) throw new Error("Should input petId.");
    if(theArgs.length>0) throw new Error("This function has only 1 input.");
    petId=throwErrorString(petId);
    if (!ObjectId.isValid(petId)) throw new Error("ID is not a valid Object ID.");
    petId = ObjectId(petId);
    
    const usersCollection = await users();
    const userArr = await usersCollection.find({'pets._id': petId}).toArray();

    if(userArr.length === 0) throw new Error("No user with that id.");
    const getUser=userArr[0];

    let result={};
    for(let i=0;i<getUser.pets.length;i++){
        if(petId.toString() === getUser.pets[i]._id.toString()){
            result = getUser.pets[i];
            break;
        }
    }
    result._id =result._id.toString();
    return result;
}

//Input username and return all the pet the user owns.
async function getAllPets(username,...theArgs){
    if(!username) throw new Error("Should input username.");
    if(theArgs.length>0) throw new Error("This function has only 1 input.");

    const usersCollection = await users();
    const findUser = await usersCollection.findOne({username:{ $regex: username, $options: '$i' }});
    if (findUser === null) throw "No user with that username.";

    for(let i=0;i<findUser.pets.length;i++){
        findUser.pets[i]._id=findUser.pets[i]._id.toString();
    }

    return findUser.pets;
}