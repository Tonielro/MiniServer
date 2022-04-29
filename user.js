const {insert, find, findBy, customDataByUserName, updateDoc, deleteById, getCount} = require("./dbase");
const doc = "users";
const users = [];
class User {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        //this.roomId = null;
        this.customData = null;
       // this.timer = null;
    }
}
function addUser(name, id, listener){
   // users.push(new User(name, id));
    if(name && id) {
        let obj = {name: name};
        findBy(doc, obj, function (map) {
            if (!map) {
                insert(doc, new User(name, id), function (map) {
                    if (map) {
                        listener(map);
                    } else {
                        listener();
                    }
                });
            } else {
                listener();
            }
        })
    }
}

/**
 * Save data to a user.
 * @param userName user id.
 * @param customData Data to be saved.
 * @param listener
 */
function addUserCustomData(userName, customData, listener){
    let id = {name: userName};
    customDataByUserName(doc, id, customData, function (map){
        if(map){
            listener(true);
        }else {
            listener();
        }
    })
}

function getUserCustomData(userName, listener){
    if(userName) {
        let obj = {name: userName};
        findBy(doc, obj, function (map) {
            if (map) {
                listener(map.get("customData"));
            } else {
                listener();
            }
        })
    }

}
function getUser(name, listener){
    if(name) {
        let obj = {name: name};
        findBy(doc, obj, function (map){
            if(map){
                let user = new User();
                user.name = map.get(name);
                user.id = map.get("id")
                user.customData = map.get("customData")
                user.roomId = map.get("roomId");
                listener(user);
            }else {
                listener();
            }
        })
    }
}
function getUserCount(listener){
    getCount(doc, function (count){
        listener(count);
    }).then();
}
function getUserById(id, listener){
    if(id) {
        let obj = {id: id};
        findBy(doc, obj, function (map){
            if(map){
                let user = new User();
                user.name = map.get(name);
                user.id = map.get("id")
                user.customData = map.get("customData")
                user.roomId = map.get("roomId");
                listener(user);
            }else {
                listener();
            }
        })
    }
}
function updateUser(user, id, listener){
    /*
    if(user){
        let obj = {name: user};
        let data = {id: id}
        updateDoc(doc, obj, data, function (map){
            if(map){
                listener(map);
            }else {
                listener();
            }
        })
    }

     */
}

function deleteUser(name){
    const obj = {name: ''+name};
    deleteById(doc, obj);
}

function getUsers(){
    return users;
}



module.exports = {addUser, getUser, deleteUser, getUsers, getUserById,addUserCustomData, getUserCustomData, updateUser, getUserCount}