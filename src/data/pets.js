const {ObjectId} = require('mongodb');
const mongoCollections = require('../config/mongoCollections');
const users = mongoCollections.users;
const usersJs = require('./users');

module.exports = {
    createPet,
    getPetById
};

function throwErrorString(str){
    if(typeof str !== 'string') throw new Error("(One of) Input must be a string.");
    str=str.trim();
    if(str.length === 0) throw new Error("(One of) Input is empty.");
    return str;
}

async function createPet(username,petname,species,img,age,sex,breed,color,hair,discription,...theArgs){
    if(!username|| !petname || !species) throw "You should input username, pet name and species";
    if(theArgs.length>0) throw "Number of inputs are exceed upper limit";

    const usersCollection = await users();
    const findUser = await usersCollection.findOne({username:{ $regex: username, $options: '$i' }});
    if(findUser === null) throw "Error: No user with that id.";

    let newPetId = new ObjectId()
    let newPet = {
        _id: newPetId,
        username:username,
        petname:petname,
        species:species,
        img:img,
        age:age,
        sex:sex,
        breed:breed,
        color:color,
        hair:hair,
        discription:discription,
        lostDate:undefined
    }

    findUser.pets.push(newPet);

    const updateInfo = await usersCollection.updateOne({username:{ $regex: username, $options: '$i' }}, { $set: findUser});
    if (!updateInfo.matchedCount && !updateInfo.modifiedCount) {
        throw new Error("Could not creat pet successfully.");
    }

    let result = await getPetById(newPetId.toString());

    return result;
}

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