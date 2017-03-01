module.exports = {

  // Sending event to the client is connecting via socket object only
  toClient: function (socket) {
    return socket
  },

  // Sending event to all clients which is connecting to server
  toAllUniverse: function () {
    return this._io
  },

  // Sending event to all clients is connecting to this namespace
  toAllNamespace: function () {
    return this._io
                .of(this._namespace)
  },

  // Sending event to all clients, except the one is connecting via socket object
  toAllExceptClient: function (socket) {
    return socket.broadcast
  },

  // Sending event to all clients in the room
  toRoom: function (roomId) {
    return this._io
                .of(this._namespace)
                .to(roomId)
  },

  // Sending event to all clients in the room, except the one is connecting via socket
  toRoomExceptClient: function (socket, roomId) {
    return socket.broadcast.to(roomId)
  },

  // Sending event to a particular client is connecting via socketId
  toAnotherClient: function (socket, socketId) {
    return socket.broadcast.to(socketId)
  }
}
