const PORT = process.env.PORT || 5000;
const ONLINE = "192.168.0.176";
const HOTSPOT = "172.20.10.4"
const app = require('express')();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
	adapter: require("socket.io-redis")({
	}),
	transports: [ 'websocket', 'polling' ],
	//connectTimeout: 500
});
const crypto = require("crypto");
const { setupWorker } = require("@socket.io/sticky");
const { addUser, getUser, deleteUser, getUsers, getUserById, addUserCustomData, getUserCustomData, updateUser,
	getUserCount
} = require('./user')
const {addRoom, getAvailableRoom, deleteRoom, getRoomById, roomExist, addGameData, deleteGameData, deleteUserInRoom,
	deleteEmptyRoom, addCustomData, getCustomData, getUserData, deleteUserFromRoom, joinRoom, addUserId, rejoin,
	reconnect, getMoves, addGameMoves, getRoomCount
} = require('./rooms')
const {getKey, encrypt, decrypt, secure, original} = require('./auth');
const randomId = () => crypto.randomBytes(8).toString("hex");


io.use((socket, next) => {
	//console.log("Key found: nothing");
	const raw = socket.handshake.auth.token;
	const session = socket.handshake.auth.session;
	const token = decrypt(raw);
	let key = getKey(token);
	if(key) {
		socket.sessionID = session;
		//console.log("Key found: "+token);
		////console.log("Socket Info: Session: "+socket.sessionID+" Name: "+socket.userName);
		next();
	}else {
		//console.log("Token not found")
		next(new Error("Illegal"));
	}

	//let key = getKey(token);

})
/**
 * For testing purposer.
 * Connect to Internet using computer address.
 * Remove before production
 */
/*
server.listen(PORT, ONLINE, async function () {
	//console.log("Server is now running on " + PORT);


});

 */





/*
For production
*/
server.listen(PORT, function () {
	console.log("Server is now running on "+PORT);
});

io.on('connection', async function (socket) {
	socket.room = null;
	socket.roomId = null;

	/**
	 * Register user.
	 */
	socket.on('connectWithName', function (name) {
		socket.userName = name;
		socket.join(name);
		////console.log(socket.sessionID);
		addUser(name, socket.sessionID, function (docId){
			if(docId) {
				//socket.userName = name;
				////console.log(name+" Connected! : "+docId);
				socket.emit('onConnected', {name: name, sessionId: socket.sessionID});
			}else {
				////console.log(name+"User already exist!");
				socket.emit('error', { info: `${name} is already in use. Choose a different name.`, errorCode: 1 });
			}
		});

	});
	socket.on('userCustomData', async function (userName, customData){
		addUserCustomData(userName, customData, function (bool){
			if(bool){
				////console.log("User custom data saved: "+customData)
				socket.emit('onUserCustomData', {customData: customData});
			}
		})
	});
	socket.on('getUserCustomData', async function (userName){
		getUserCustomData(userName, function (customData){
			if(customData){
				////console.log("User custom data Requested: "+customData)
				socket.emit('onGetUserCustomData', {owner: userName, customData: customData});
			}
		})

	});
	/**
	 * Create a new room with given property
	 */
	socket.on('createRoom', async function (roomOwner, maxUser, property, customData) {
		////console.log("Room creation called");
		if(roomOwner && maxUser && property) {
			let mRoomId = socket.handshake.issued.toString();
			addRoom(roomOwner, mRoomId, socket.sessionID, maxUser, property, customData, function (room){
				if(room){
					////console.log("Room created successfully: "+room);
					socket.roomId = mRoomId;
					socket.room = room.users;
					socket.join(room.users);
					socket.emit('roomCreated', {roomId: mRoomId, owner: roomOwner, maxUser: maxUser, docId: "docId"});
				}else {
					////console.log("Room cannot be created");
					socket.emit('error', {info: "Room cannot be created from empty value.", errorCode: 2});
				}
			})

		}


	});
	/**
	 * Join a room that has exact property
	 */
	socket.on('joinRoomWith', async function (sender, property) {
		joinRoom(sender, property, function (room){
			if(room){
				socket.roomId = room.roomId;
				socket.room = room.users;
				//console.log(socket.room);
				socket.join(room.users);
				socket.emit("roomJoined", {roomId: room.roomId, owner: room.owner, maxUser: room.maxUser});
				socket.broadcast.to(socket.room).emit("userJoinRoom", {sender:sender, activeUsers: room.activeUsers});
				if(room.isFull){
					io.in(socket.room).emit("roomFull", {sender: sender, owner: room.owner});
				}
			}else {
				socket.emit('RoomError', {info: `Room is filled up.`, errorCode: 3});
			}
			//getClusters();
		})

	});
	socket.on('updateRoom', async function (roomId){
		//console.log("ROOM update Request received");
		getRoomById(roomId, function (room) {
			if (room) {
				//console.log("ROOM updated: "+JSON.stringify(room));
				socket.room = room.users;
				socket.emit("roomUpdated", {users: room.activeUsers});
			}

		})
	});
	/**
	 * Lock the specified room by changing the room property.
	 * This is useful when you don't want another person to join a room.
	 */
	socket.on('lockRoom', async function (roomId, lockData){
		let room = getRoomById(roomId);
		if(room){
			room.property = lockData;
			socket.emit('onRoomLocked', {lockData: lockData});
		}
	})
	socket.on('startGame', async function (roomId, sender){
		io.in(socket.room).emit('onStartGame', {sender: sender});
	})
	socket.on('gameStarted', async function (sender){
		getUser(sender, function (user){
			if(user){
				socket.broadcast.to(user.id).emit('onGameStarted', {sender: sender});
			}
		})
	})
	/**
	 * Leave the specified room
	 */
	socket.on('leaveRoom', async function (user, roomId) {
		if(user && roomId) {
			deleteUserInRoom(roomId, socket.id);
			socket.leave(roomId);
			socket.emit('onLeaveRoom', {user: user});
		}
	});

	/**
	 * Delete the specified room
	 */
	socket.on('deleteRoom', async function (roomId) {
		if(roomId) {
			deleteRoom(roomId);
			socket.emit('onDeleteRoom', {room: roomId});
		}
	});

	socket.on('addRoomCustomData', async function (roomId, customData){
		addCustomData(roomId, customData, function (result){
			if(result) {
				socket.emit("onAddRoomCustomData", {result: true});
			}else {
				socket.emit("onAddRoomCustomData", {result: false});
			}
		});


	});
	socket.on('getRoomCustomData', async function (roomId){
		getCustomData(roomId, function (customData){
			if(customData) {
				socket.emit('onGetRoomCustomData', {customData: customData});
			}
		});

	});
	/**
	 * Send Message to user in a room except the sender.
	 */
	socket.on('sendGameData', async function (player, roomId, gameData) {
		//console.log("Game data received: "+roomId);
		//addGameData(player, roomId, gameData);

		if(roomId) {
			if(socket.room){
				//console.log("ROOM: "+socket.room)
				socket.broadcast.to(socket.room).emit('gameData', {sender: player, data: gameData});
			}else {
				//console.log("ROOM: ready to fetch")
				getRoomById(roomId, function (room) {
					if (room) {
						//console.log("ROOM: "+room.toString())
						socket.room = room;
						socket.broadcast.to(socket.room).emit('gameData', {sender: player, data: gameData});
					}

				})
			}

			//io.to(room).emit('gameData', { sender: player, data: gameData });
		}
	});
	/**
	 * Send Message to user in a room except the sender.
	 */
	socket.on('gameDataWithFeedback', async function (player, roomId, gameData, reply, dataId, isResend) {
		//console.log("Game data received"+player+", "+roomId+", "+gameData+", "+reply+", "+dataId);
		/*
		if(!isResend) {
			addGameMoves(player, roomId, gameData, reply, dataId);
		}

		 */
		if(roomId) {
			if(socket.room){
				//console.log("ROOM: "+socket.room)
				socket.broadcast.to(socket.room).emit('onGameDataWithFeedback', {sender: player, data: gameData, reply: reply, dataId:dataId});
			}
			}
			//io.to(room).emit('gameData', { sender: player, data: gameData });
	});
	socket.on('sendFeedback', async function (fromPlayer, sender, data){
		//console.log("Feedback received 1");
		if(sender){
			//console.log("Feedback received 2");
			socket.broadcast.in(sender).emit("feedback", {sender: fromPlayer, data: data});
		}
	});
	socket.on('privateMsg', async function (sender, receiver,  msg){
		if(receiver){
			//console.log("Private message send: "+msg)
			socket.broadcast.in(receiver).emit("onPrivateMsg", {sender: sender, msg: msg});
		}
	});
	/**
	 * Check if a player is active.
	 */
	socket.on('userStatus', async function (user){
		getUser(user, function (player){
			if(player){
				socket.emit("onUserStatus", {user: player, status: true});
			}else {
				socket.emit("onUserStatus", {user: user, status: false});
			}
		})

	});
	/**
	 * Check if a player is active.
	 */
	socket.on('getUsers', async function (){
		let players = getUsers();
		socket.emit("onGetUsers", {users: players});

	});
	/**
	 * Get the number of users currently online.
	 */
	socket.on('getUserCount', async function(){
		getUserCount(function (count){
			socket.emit("userCount", {count: count});
		})

	})
	/**
	 * Get the number of users currently online.
	 */
	socket.on('getRoomCount', async function(){
		getRoomCount(function (count){
			socket.emit("roomCount", {count: count});
		})

	})
	/**
	 * Get saved game data from specified room.
	 */
	socket.on('getMoves', async function (roomId){
		if(roomId){
			getMoves(roomId, function (moves){
				if(moves) {
					socket.emit("onGetMoves", {gameData: moves});
				}else {
					socket.emit("onGetMoves", {gameData: []});
				}
			})
		}

	});
	/**
	 * Delete saved game data from specified room.
	 */
	socket.on('deleteGameData', async function (roomId, dataId){
		deleteGameData(roomId, dataId)
		socket.emit("onGameDataDeleted");
	});
	socket.on('userReconnected', async function (userName, roomId, sessionId) {
		socket.userName = userName;
		socket.join(userName);
		socket.sessionID = sessionId;
		reconnect(roomId, function (room){
			if(room) {
				socket.room = room.users;
				socket.join(socket.room);
				socket.broadcast.to(socket.room).emit('onUserReconnected', {user: userName});
			}
		})
		addUser(userName, sessionId, function (map) {

		})

	} );
	socket.on('pauseResume', async function (roomId, userName, code){

		//let room = getRoomById(roomId);
		if(socket.room){
			socket.broadcast.to(socket.room).emit('onPauseResume', {user: userName, code: code});
		}
	})
	socket.on('chatMsg', async function (roomId, sender, msg){
		//let room = getRoomById(roomId);
		if(socket.room){
			socket.broadcast.to(socket.room).emit('onChatMsg', {sender:sender, msg:msg})
		}
	})
	/*
	socket.on("disconnect", (reason) => {
		//console.log(reason);
		switch (reason){
			case "ping timeout": //This happens when client is closed without socket.disconnect, switching of network.
				//socket.broadcast.to(socket.rooms[0]).emit('onUserDisconnected', {user: user.name, code: 5});
				break;
			case "transport close": //When network switches from maybe WiFi to 4g.
				break;
			case "client namespace disconnect": //When client has disconnected the socket using socket.disconnect.
				break;
			case "transport error": //When connection has encountered error.
				break;

		}

	});

	 */

	socket.on('disconnect', async (reason ) =>  {
		//console.log("USER DISCONNECTED: Reason = "+reason);
		if(socket.room) {
			const matchingSockets = await io.in(socket.room).allSockets();
			//console.log(matchingSockets);
			const isDisconnected = matchingSockets.size === 0;
			if (isDisconnected) {
				deleteRoom(socket.roomId);
			}else {
				socket.broadcast.to(socket.room).emit('onUserDisconnected', {user: socket.userName, reason: reason});
			}
		}else {

		}
		if(socket.userName){
			deleteUser(socket.userName)
		}

	});




});
setupWorker(io);


