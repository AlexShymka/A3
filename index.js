var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname)); // So CSS works
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
var i = 0;
var userList = [];
var chatHistory = [];

var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

io.on('connection', function(socket){
  socket.thisUser = 'user_'+ i;
  userList.push(socket.thisUser);
	console.log(socket.thisUser + ' connected');
  console.log(userList);

  socket.emit('register', socket.thisUser, chatHistory);
  io.emit('user update', userList);
  i++;

	socket.on('disconnect', function(){
    console.log('user ' + socket.thisUser + ' disconnected');
    userList.splice(userList.indexOf(socket.thisUser), 1);
    console.log(userList);
    io.emit('user update', userList);
  })

  socket.on('chat message', function(msg){
    var msgdate = new Date();
    var msgMins = msgdate.getMinutes();
    if (msgMins < 10) {
      msgMins = '0' + msgMins;
    }
    var msgHours = msgdate.getHours();
    if (msgHours < 10) {
      msgHours = '0' + msgHours;
    }
    var formattedDate = weekdays[msgdate.getDay()] + ' ' + months[msgdate.getMonth()] +' ' + msgdate.getDate() + ' ' + (msgdate.getYear() + 1900) + ' ' + msgHours + ':'+ msgMins +'; ';
    msg = formattedDate + socket.thisUser + ": " + msg;
    console.log('message: ' + msg);
    socket.broadcast.emit('chat message', msg);
    socket.emit('chat message', '<b>' + msg +'</b>' );
    chatHistory.push(msg);
    console.log('Chat History Length: ' + chatHistory.length);
    if (chatHistory.length > 200) {
      chatHistory.shift(); //Remove from front of array;
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
