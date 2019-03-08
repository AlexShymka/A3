var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cookieParser = require('cookie-parser');

//Genuine Alex Shymka Code.
//Variables and cookie parser
app.use(cookieParser());
let port = 3000;
var i = 0;
var onlineUsers = []; //Current online users
var allUsers = [];  //Every name that has ever been taken
var userColor = [];
var chatHistory = [];

var username;

app.get('/list', function(req, res){
  res.send(req.cookies);
});

app.get('/', function(req, res){
  console.log("Cookie Parsing");

  //If they have a cookie that becomes they're username
  if (req.cookies['SengA3']) {
    username = req.cookies['SengA3'];
    console.log('Cookie found. Value: ' + req.cookies['SengA3']);
  }
  else {  //else we assign them a new username
    username = 'user_'+ i;
    i++;
    res.cookie('SengA3', username);
    allUsers.push(username);
    console.log(allUsers);
    userColor[allUsers.indexOf(username)] = '#000000';
    console.log(userColor);
    console.log("No Cookie found. Cookie Sent");
  }
//Send them the page
  app.use(express.static(__dirname)); // So CSS works
  res.sendFile(__dirname + '/index.html');
});


console.log("init_done");

io.on('connection', function(socket){
  console.log("connection...");
  console.log(username + " Connecting");
  socket.thisUser = username;
  socket.color = userColor[allUsers.indexOf(socket.thisUser)];
  onlineUsers.push(socket.thisUser);
  console.log(socket.thisUser + ' connected' + 'with color' + socket.color );

  //Fix for bug that appeared when starting and stopping the server a bunch during development.
  if (socket.color === undefined && username != undefined) {
    console.log("color is undefined. Fixing that");
    userColor[allUsers.indexOf(username)] = '#000000';
    socket.color = userColor[allUsers.indexOf(username)];
    console.log('color now: ' + socket.color);
  }

  console.log(onlineUsers);

  socket.emit('register', socket.thisUser, chatHistory);
  io.emit('user update', onlineUsers);

  //When they disconnect remove them from the list of online users.
	socket.on('disconnect', function(){
    onlineUsers.splice(onlineUsers.indexOf(socket.thisUser), 1);
    console.log('user ' + socket.thisUser + ' disconnected');
    console.log(onlineUsers);
    io.emit('user update', onlineUsers);
  })

  //Chat handling
  socket.on('chat message', function(msg){
    //Message Object
    var msgObj = {
      msgdate: new Date(),
      user: socket.thisUser,
      color: '#000000',
      text: '',
    };
    //Nickname Change
    if (msg.startsWith("/nick ")) {
      var newNick = msg.slice(6);
      var oldNick = socket.thisUser;
      console.log('Potential new nick: ' + newNick);
      if (allUsers.indexOf(newNick) === -1) { //Compare nick against all users.
        console.log('nickname is good');
        onlineUsers.splice(onlineUsers.indexOf(oldNick), 1, newNick);
        allUsers.splice(allUsers.indexOf(oldNick), 1, newNick);
        msg = oldNick + ' Changed their name to ' + newNick;
        console.log(onlineUsers);
        //Push changes
        socket.thisUser = newNick;
        socket.emit('new name', socket.thisUser);
        io.emit('user update', onlineUsers);
        chatHistory.push(msg);
        io.emit('server message', msg);
      }
      else {
        console.log('nickname already exists');
        socket.emit('server message', 'That nickname is in use. Please try another');
      }
    }
    //Change Color
    else if (msg.startsWith("/nickcolor")){
      var newclr = msg.slice(11);
      if (newclr.length === 6) {
        console.log('Changing color for ' + socket.thisUser);
        userColor[allUsers.indexOf(socket.thisUser)] = '#' + newclr;
        socket.color = userColor[allUsers.indexOf(socket.thisUser)];
        console.log(socket.color);
        var colorFormat = '<span style=color:' + socket.color + '>';
        socket.emit('server message', 'You\'ve got a new color. It looks like ' + colorFormat + 'this!</span>');
      }
      else {
        console.log('Bad format from color request by: ' + socket.thisUser);
        socket.emit('server message', 'Bad color format. RGB value must be length 6 hex code for the color. Leave out the #');
      }

    }
    //Normal Message
    else {
      msgObj.text = msg;
      msgObj.color = userColor[allUsers.indexOf(socket.thisUser)];
      console.log('message: ' + JSON.stringify(msgObj)); //Could save the message with the formatting if needed.
      chatHistory.push(msgObj);
      io.emit('chat message', msgObj);
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
