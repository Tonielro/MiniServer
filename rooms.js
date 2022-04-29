const Console = require("console");
const {insert, findByProperty, updateDoc, findBy, findDoc, updateById, findByValue, deleteByRoomId, deleteById,
    customDataByUserName, findMoves, getCount
} = require("./dbase");
//const {get} = require("ioredis/built/promiseContainer");
const rooms = [];
let defaultRoomId = 1000000;
const doc = "rooms"
class GameMoves {
    constructor(sender, gameData, reply, dataId) {
        this.sender = sender;
        this.move = gameData;
        this.reply = reply;
        this.id = dataId
    }
}

class Room {
    constructor(owner, roomId, maxUser, property) {
        this.owner = owner;
        this.roomId = roomId;
        this.maxUser = maxUser;
        this.property = property;
        this.activeUsers = 0;
        this.users = [];
        this.moves = [];
        this.moveId = null;
        this.customData = "";
        this.isFull = false;
    }

}
function getUserFromRoomByName(room, name){
    if(room && name) {
        let users = room.users;
        for (let i = 0; i < users.length; i++) {
            if (users[i].name === name) {
               //console.log("User found :" + users[i].name);
                return users[i];
            }
        }
    }
}
function getUserFromRoomByID(room, userId){
    if(room && userId) {
        let users = room.users;
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === userId) {
               //console.log("User found :" + users[i].name);
                return users[i];
            }
        }
    }
}
function addUserId(roomId, userId){
    let obj = {userId: userId};
    insert(roomId, obj, function (docId){
    })
}
function getRoomUsers(roomId, listener){
    findDoc(roomId, function (users){
        if(users){
            listener(users)
        }else {
            listener();
        }
    })
}

function addRoom(owner, roomId, userId,  maxUser, property, customData, listener) {
    if(owner && roomId && maxUser && property) {
        let obj = {owner: owner};
        findBy(doc, obj, function (map){
            if(!map){
                let room = new Room(owner, roomId, maxUser, property);
                room.customData = customData;
                room.users.push(owner);
                room.activeUsers += 1;
                insert(doc, room, function (docId){
                    if(docId){
                        listener(room);
                    }else {
                        listener();
                    }
                })
            }else {
                listener();
            }
        })


    }
}
function joinRoom(sender, prop, listener){
    if(sender && prop) {
        const obj = {property: prop, activeUsers: 1};
        const propertyUpdate = Date.now().toString();
        findByValue(doc, obj, function (map) {
            if (map) {
                let room = new Room(map.get("owner"), map.get("roomId"), map.get("maxUser"));
                room.users = map.get("users");
                let active = map.get("activeUsers");
                active += 1;
                room.activeUsers = active;
                room.users.push(sender);
                room.isFull = room.activeUsers === room.maxUser;
                //console.log("JOINING" + room.users)
                if (room.isFull) {
                    room.property = propertyUpdate;
                }
                let roomIdObj = {roomId: room.roomId};
                let data = {property: room.property, activeUsers: active, users: room.users, isFull: room.isFull}
                ///let docId = map.get("_id");
                updateById(doc, roomIdObj, data, function (result) {
                    if (result) {
                        listener(room);
                    } else {
                        listener();
                    }
                });

            } else {
                listener();
            }
        })
    }else {
        listener();
    }
}

function reconnect(room_id, listener){
    if(room_id) {
        const obs = {roomId: '' + room_id};
        findByValue(doc, obs, function (map) {
            if (map) {
                let room = new Room(map.get("owner"), map.get("roomId"), map.get("maxUser"));
                room.users = map.get("users");
                listener(room);
            } else {
                listener();
            }
        })
    }else {
        listener();
    }
}
function addGameMoves(sender, roomId, gameData, reply, dataId) {
    if(sender && roomId && gameData) {
        const obs = {roomId: roomId};
        findByValue(doc, obs, function (map){
            if(map){
                let gameMove = new GameMoves(sender, gameData, reply, dataId);
                let room = new Room(map.get("owner"), map.get("roomId"), map.get("maxUser")) ;
                room.moveId = get("moveId");
                room.moves = map.get("moves");
                room.activeUsers =  map.get("activeUsers");
                if(room.moveId === dataId)return;
                room.moveId = dataId;
                if(room.moves.length >= 10){
                    room.moves.splice(0, 1);
                }
                room.moves.push(gameMove);
                //console.log("ROOM FOUND: "+JSON.stringify(room.users))
                let roomIdObj = {roomId: room.roomId};
                let data = {moves: room.moves, moveId: room.moveId};
                updateById(doc, roomIdObj, data, function (result){
                });
            }
        })
    }


}
function getMoves(roomId, listener){
    const item = {roomId: roomId};
    findMoves(doc, item, function (moves) {
        if (moves) {
            listener(moves);
        } else {
            listener();
        }
    }).then( r =>{});

}

/**
 * Save data to a room.
 * @param roomId Room id.
 * @param customData Data to be saved.
 * @param listener
 */
function addCustomData(roomId, customData, listener){
    let id = {roomId: roomId};
    customDataByUserName(doc, id, customData, function (map){
        if(map){
            //console.log("CUSTOM ROOM DATA")
            listener(true);
        }else {
            listener();
        }
    })
}

/**
 * Get saved custom data fom a given room.
 * @param roomId Room Id.
 * @returns {string|*} Result.
 */
function getCustomData(roomId, listener){
    if(roomId) {
        let obj = {roomId: roomId};
        findBy(doc, obj, function (map) {
            if (map) {
                listener(map.get("customData"));
            } else {
                listener();
            }
        })
    }
}

/**
 * Delete specified gameData;
 * @param roomId The Id of the specified rum.
 * @param id The Id of the gameData to be deleted.
 * @returns {*}
 */
function deleteGameData(roomId, id){
    if(roomId && id) {
        let room = getRoomById(roomId);
        let moves = room.moves;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i] === id) {
                moves.splice(i, 1);
            }
        }
    }
}

/**
 * Remove a particular user from a room.
 * @param roomId Room id
 * @param id User id
 */
function deleteUserFromRoom(roomId, id){
    if(roomId && id) {
        let room = getRoomById(roomId);
        if (room) {
            let users = room.users;
            for (let i = 0; i < users.length; i++) {
                if (users[i].id === id) {
                    users.splice(i, 1);
                }
            }
        }
    }
}

/**
 * Delete any room that is empty.
 */
function deleteEmptyRoom(){
    for (let i = 0; i < rooms.length; i++){
        if(rooms[i].users.length <= 0){
            rooms.splice(i, 1);
        }
    }
}

/**
 * Remove user from a room
 * @param socketId
 */
function removeUserFromRoom(socketId){
    let index = 0;
    while (index < rooms.length){
        let users = rooms[index].users;
        //console.log("User Remove: "+data);
        for(let i = 0; i < users.length; i++){
            let user = users[i];
            if(user === socketId){
                users.splice(i, 1);
                //console.log("USER FOUND: "+user);
            }
        }
        index++;
    }

    deleteEmptyRoom();
}
function getRoomCount(listener){
    getCount(doc, function (count){
        listener(count);
    }).then();
}

function roomExist(owner){
    if(owner) {
        return rooms.find(room => room.owner.trim().toLowerCase() === owner.trim().toLowerCase());
    }
}
function setRoomId(){
    if(defaultRoomId >= 100000000){
        defaultRoomId = 1000000;
    }else{
        defaultRoomId += 1;
    }
    return defaultRoomId.toString();
}

function getAvailableRoom(property) {
    if(property) {
        for (let i = 0; i < rooms.length; i++) {
            if (rooms[i].property === property) {
                let max = rooms[i].maxUser;
                let active = rooms[i].activeUsers;
                if (active < max) {
                    rooms[i].activeUsers += 1;
                    if (max === 4) {
                        switch (active) {
                            case 3:
                                return rooms[i];
                            case 2:
                                return rooms[i];
                            default:
                                return rooms[i];

                        }
                    } else {
                        return rooms[i];
                    }

                }
            }
        }
    }
}
/**
 * Find room by room id.
 * @returns {*} Returns the room if found.
 * @param owner Room owner
 */
function getRoomByOwner(owner){
    if(owner) {
        return rooms.find(room => room.owner === owner);
    }
}
/**
 * Find room by room id.
 * @param id The id of the room to be found.
 * @param listener
 * @returns {*} Returns the room if found.
 */
function getRoomById(id, listener){

    if(id) {
        let obj = {roomId: id};
        findBy(doc, obj, function (map){
            if(map){
                let room = new Room();
                room.users = map.get("users");
                room.roomId = map.get("roomId");
                room.owner = map.get("owner");
                room.maxUser = map.get("maxUser");
                room.moves = map.get("moves");
                room.property = map.get("property");
                room.customData = map.get("customData");
                room.activeUsers = map.get("activeUsers");
                listener(room);
            }else {
              listener();
            }
        })
    }

}

/*
 * Check if rooms[] is empty.
 * @returns {boolean} true or false;
 */
function isEmpty(){
    return rooms.length <= 0;
}

/**
 * Delete a given room with the specified id.
 * @param id Room identity.
 * @returns {*} return a room.
 */
function deleteRoom(id){
    const obj = {roomId: ''+id};
    deleteById(doc, obj);
}
module.exports = {addRoom, joinRoom, reconnect, getAvailableRoom, deleteRoom, getRoomById, roomExist, getRoomByOwner, addGameMoves,
    deleteGameData, deleteUserFromRoom, deleteEmptyRoom, addCustomData, getCustomData, getUserFromRoomByName,
    getUserFromRoomByID, addUserId, getRoomUsers, getMoves, getRoomCount}