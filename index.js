var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cookieParser = require('cookie-parser');

//app.use(express.static(__dirname)); // So CSS works
app.use(cookieParser());
let port = 3000;
var i = 0;
var userList = [];
var chatHistory = [];

app.get('/list', function(req, res){
  res.send(req.cookies);
});

app.get('/', function(req, res){
  console.log("Cookie Parsing");

  if (req.cookies['SengA3']) {
    console.log('Cookie found. Value: ' + req.cookies['SengA3']);
  }
  else {
    res.cookie('SengA3', 0);
    console.log("No Cookie found. Cookie Sent");
  }

  app.use(express.static(__dirname)); // So CSS works
  res.sendFile(__dirname + '/index.html');
})

var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

io.on('connection', function(socket){
  socket.thisUser = 'user_'+ i;
  socket.color = [000,000,000];
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
    //Nickname Change
    if (msg.startsWith("/nick ")) {
      var newNick = msg.slice(6);
      var oldNick = socket.thisUser;
      console.log('Potential new nick: ' + newNick);
      if (userList.indexOf(newNick) === -1) {
        console.log('nickname is good');
        userList.splice(userList.indexOf(oldNick), 1, newNick);
        msg = oldNick + ' Changed their name to ' + newNick;
        console.log(userList);
        //Push changes
        socket.thisUser = newNick;
        io.emit('user update', userList);
        chatHistory.push(msg);
        io.emit('chat message', msg);
      }
      else {
        console.log('nickname already exists');
        socket.emit('chat message', 'That nickname is in use. Please try another');
      }
    }
    //Change Color
    else if (msg.startsWith("/nickcolor")){
      var newclr = msg.slice(11);
      if (newclr.length === 9) {
        console.log('Changing color for ' + socket.thisUser);
        socket.color = [newclr.substr(0,3), newclr.substr(3,3), newclr.substr(6,3)]
        console.log(socket.color);
        var colorFormat = '<span style=color:rgb(' + socket.color[0] + ',' + socket.color[1] + ',' + socket.color[2] + ')>';
        socket.emit('chat message', 'You\'ve got a new color. It looks like ' + colorFormat + 'this!</span>');
      }
      else {
        console.log('Bad format from color request by: ' + socket.thisUser);
        socket.emit('chat message', 'Bad color format. RGB value must be 9 numbers. Preprend 0s to numbers under 100');
      }


    }
    //Normal Message
    else {
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
      var colorFormat = '<span style=color:rgb(' + socket.color[0] + ',' + socket.color[1] + ',' + socket.color[2] + ')>';
      console.log('message: ' + msg); //Could save the message with the formatting if needed.
      chatHistory.push(msg);
      socket.broadcast.emit('chat message', colorFormat + msg + '</span>');
      socket.emit('chat message', '<b>' +colorFormat + msg +'</span></b>' );
    }

    //Final Stuff
    console.log('Chat History Length: ' + chatHistory.length);
    if (chatHistory.length > 200) {
      chatHistory.shift(); //Remove from front of array;
    }
  });
});

http.listen(port, function(){
  console.log('listening on *:3000');
});
