const mongoose = require("mongoose");
const {json} = require("express");
const Console = require("console");
//const {ObjectId} = require("mongodb");
const local = 'mongodb://localhost:27017/mainDB';
const db = mongoose.connection;
mongoose.connect(local,
    {
        useNewUrlParser: true,
        //useFindAndModify: false,
        useUnifiedTopology: true

    }

, function (error){

    });
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
    console.log("Connected successfully");
/*
    deleteItemByDocId(doc,"623dae283ec8ad206bf34778","Tony is a great programmer", function (map){
        if(map) {
            //console.log(map)
        }else {
            //console.log("DB not found");
        }
    })

 */




/*

  findByName(doc,"Tonielro", function (map){
      if(map) {
          //console.log(map.get("customData"))
      }else {
          //console.log("DB not found");
      }
  });

 */
//getAll("rooms");
    //deleteAll("rooms")
    //deleteAll("users")
    /*getAll("Tony", function(map){
        if(map) {

            all.push(JSON.stringify(map));
            //console.log(all.toString());
        }
    });

     */
/*

    let obj = {userId: "56rf3098vqw458"};
    insert("rooms/roomId", obj, function (docId){
        mongoose.connection.close(function (er){

        })

    })



/*
    findDoc("rooms/Tony", function (result){
        if(result) {
            //console.log(result);
        }
    })

 */
   // //console.log("final: "+all);
    //db.dropDatabase();
    /*
    const obj = {property: 'publicRoom', activeUsers: 1};
    findByValue("rooms", obj, function (map){

    })


    const obj = {roomId: "Tony"};
    findMoves("rooms", obj,function (moves){
        //console.log(JSON.stringify(moves));
    })

     */

});


function insert(doc, data, listener){
    db.collection(doc).insertOne(data, function (err, result){
        if (err) throw err;
        if(result) {
           // //console.log(JSON.stringify(result))
            let map = new Map(Object.entries(result));
            listener(map.get("insertedId"));
        }else {
            listener();
        }
    })
}
function findBy(doc, userId, listener){
    db.collection(doc).findOne(userId, function (err, result){
        if (err)throw err;
        if(result) {
           // //console.log("ROOM FOUND"+JSON.stringify(result))
            let map = new Map(Object.entries(result));
            listener(map);
        }else {
            listener();
        }
    })
}
function findByProperty(doc, property, listener){
    db.collection(doc).findOne({property: property, activeUsers: 1}, function (err, result){
        if (err) throw err;
        if(result) {
            ////console.log(JSON.stringify(result))
            let map = new Map(Object.entries(result));
            listener(map);
        }else {
            listener();
        }
    });


}
function findByDocId(doc, docId, listener){
    db.collection(doc).findOne({_id: ObjectId(docId)}, function (err, result){
        if (err)throw err;
        if(result) {
            ////console.log(JSON.stringify(result))
            let map = new Map(Object.entries(result));
            listener(map);
        }else {
            listener();
        }
    })
}
function findByValue(doc, value, listener){
    db.collection(doc).findOne(value, function (err, result){
        if (err)throw err;
        if(result) {
           // //console.log(JSON.stringify(result))
            let map = new Map(Object.entries(result));
            listener(map);
        }else {
            listener();
        }
    })
}
function updateDoc(doc, docId, data, listener){
    db.collection(doc).findOneAndUpdate(docId, {$set:data}, function (err, result){
        if (err)throw err;
        if(result) {
           // //console.log("UPDATED: "+JSON.stringify(result))
            let map = new Map(Object.entries(result));
            listener(map);
        }else {
            listener();
        }
    })
}
function updateById(doc, item, value, listener){
    db.collection(doc).updateOne(item, {$set:value}, function(err, res) {
        if (err) throw err;
        if(res) {
             //console.log("UPDATED: "+JSON.stringify(res))
            let map = new Map(Object.entries(res));
            listener(map);
        }else {
            listener();
        }
    });
}



function customDataByUserName(doc, id, data, listener){
    db.collection(doc).findOneAndUpdate({id}, {$set:{customData: data}}, function (err, result){
        if (err)throw err;
        if(result) {
            ////console.log(JSON.stringify(result))
            let map = new Map(Object.entries(result));
            listener(map);
        }else {
            listener();
        }
    })
}
function deleteItemByName(doc, userName, listener){
    db.collection(doc).deleteOne({name: userName}, function (err, result){
        if(err) throw err;
        listener(result);
    })
}
function deleteItemById(doc, userId, listener){
    db.collection(doc).deleteOne({id: userId}, function (err, result){
        if(err) throw err;
        listener(result);
    })
}
function deleteItemByDocId(doc, docId, listener){
    db.collection(doc).deleteOne({_id: ObjectId(docId)}, function (err, result){
        if(err) throw err;
        if(result) {
            listener(result);
        }
    })
}
function getAll(doc, listener){
   db.collection(doc).find({}, { projection: { _id: 0, userId: 1} }).toArray(function(err, result) {
        if (err) throw err;

        if(result){
            let map = new Map();
            for (let i = 0; i < result.length; i++){
            }

            listener(result);
        }

    });

    //db.collection(doc).find();
}
function deleteAll(doc){
    db.collection(doc).drop({}, function (error, result) {

    });
}
function deleteById(doc, value){
    db.collection(doc).deleteOne(value, function (error, result) {
    });
}
async function addHouse(houseId, room){
    const someModel = mongoose.model('house', roomR );
    await someModel.insertMany(room);
}


async function findMoves(doc, item, listener) {
    let moves = [];
    try {
        const options = {
            projection: { _id: 0, moves: 1},
        };

        const cursor = db.collection(doc).find(item, options);
        if ((await cursor.count()) === 0) {

            //console.log("No documents found!");
        }
        await cursor.forEach(function (result){
            moves.push(result.moves);
        });

    } finally {
        if(moves.length > 0){
            listener(moves);
        }else {
            listener();
        }

    }
}
async function getCount(doc, listener) {
    let count = 0;
    try {
        const options = {
            projection: {_id: 0},
        };

        const cursor = db.collection(doc).find({}, options);
        count = await cursor.count();
        if ((await cursor.count()) === 0) {

            //console.log("No documents found!");
        }
        /*
        await cursor.forEach(function (result) {
            moves.push(result.moves);
        });

         */

    } finally {
        listener(count);
    }
}


module.exports = {insert, findBy, findByProperty, findByDocId, deleteItemById, deleteItemByName, deleteItemByDocId,
    customDataByUserName, getAll, findMoves, addHouse, updateDoc, updateById, findByValue, deleteById: deleteById, getCount};