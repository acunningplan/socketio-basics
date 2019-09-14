const express = require("express");
const app = express();
const socketio = require("socket.io");
let namespaces = require("./data/namespaces");

app.use(express.static(__dirname + "/public"));

const expressServer = app.listen(9000);
const io = socketio(expressServer);

io.on("connection", socket => {
  console.log(socket.handshake);
  // Send back img and endpoint for each NS
  let nsData = namespaces.map(({ img, endpoint }) => ({ img, endpoint }));
  socket.emit("nsList", nsData);
});

namespaces.forEach(namespace => {
  io.of(namespace.endpoint).on("connection", nsSocket => {
    const username = nsSocket.handshake.query.username;
    // console.log(`${socket.id} has joined ${namespace.endpoint}`);
    nsSocket.emit("nsRoomLoad", namespace.rooms);
    nsSocket.on("joinRoom", (roomToJoin, numberOfUsersCallback) => {
      const roomToLeave = Object.keys(nsSocket.rooms)[1];
      nsSocket.leave(roomToLeave);
      updateUsersInRoom(namespace, roomToLeave);
      nsSocket.join(roomToJoin);
      // io.of("/wiki")
      //   .in(roomToJoin)
      //   .clients((error, clients) => {
      //     numberOfUsersCallback(clients.length);
      //   });
      const nsRoom = namespace.rooms.find(room => {
        return room.roomTitle === roomToJoin;
      });
      nsSocket.emit("historyCatchUp", nsRoom.history);
      updateUsersInRoom(namespace, roomToJoin);
    });
    nsSocket.on("newMessageToServer", msg => {
      const fullMsg = {
        text: msg.text,
        time: Date.now(),
        username: username,
        avatar: "https://via.placeholder.com/30"
      };
      // console.log(fullMsg);
      // console.log(nsSocket.rooms);
      const roomTitle = Object.keys(nsSocket.rooms)[1];
      const nsRoom = namespace.rooms.find(room => {
        return room.roomTitle === roomTitle;
      });
      // console.log(nsRoom);
      nsRoom.addMessage(fullMsg);
      io.of(namespace.endpoint)
        .to(roomTitle)
        .emit("messageToClients", fullMsg);
    });
  });
});

const updateUsersInRoom = (namespace, room) => {
  io.of(namespace.endpoint)
    .in(room)
    .clients((error, clients) => {
      // console.log(`There are ${clients.length} in this room`)
      io.of(namespace.endpoint)
        .in(room)
        .emit("updateMembers", clients.length);
    });
};

// io.on("connection", socket => {
//   socket.emit("messageFromServer", { data: "Welcome to the socketio server" });
//   socket.on("messageToServer", dataFromClient => {
//     console.log(dataFromClient);
//   });
//   socket.on("newMessageToServer", msg => {
//     io.emit("messageToClients", { text: msg.text });
//   });
// });
