var express = require('express'); //our http request handler
var bodyParser = require('body-parser'); //used to funnel in form data such as login
var cookieParser = require('cookie-parser'); //used to give users cookies when logging in
var users = require('./public/data.json').users; //reads data from data.json
var missions = require('./public/data.json').missions;

var app = express(); //creates a new web server
var http = require('http').Server(app); // funnels web server through http
var io = require('socket.io')(http); // new soccket.io instance

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public')); //sets the directory to ./public
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser()); // use the cookie parser to populate request.cookies

// views is directory for all template files
app.set('views', __dirname + '/views'); // look for views in the ./views directory
app.set('view engine', 'ejs'); //set view engine to ejs

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/login', function(request, response) {
  response.render('pages/login');
});

app.post('/login', function(request, response){
	var user = request.body.username;
	var pass = request.body.password;
	var newUser = {
		user: user,
		pass: pass
	};
	for (var i in users) {
		if (users[i].user === newUser.user){
			if (users[i].pass === newUser.pass){
				response.cookie('user', users[i]);
				response.render('pages/home', {
					user_name: users[i].name,
					user_img: users[i].img
				});
				return;
			}
			else {
				console.log("right user wrong pass");
				response.render('pages/login');
				return;
			}
		}

	}

	console.log("wrong user");
	response.render('pages/login');

});

app.get('/signup', function(request, response) {
  response.render('pages/signup');
});

app.get('/logout', function(request, response) {
	response.clearCookie('user');
  	response.render('pages/login');
});

app.get('/home', function(request, response) {
	var cookie = request.cookies.user;
	if(cookie === undefined){
		console.log("error no cookie");
		response.render('pages/login');
	}
	else {
		response.render('pages/home', {
			user_name: cookie.name,
			user_img: cookie.img
		});
	}

});

app.get('/stats', function(request, response) {
  response.render('pages/stats');
});

app.get('/mission_browser', function(request, response) {
	var cookie = request.cookies.user;
	if(cookie === undefined){
		console.log("error no cookie");
		response.render('pages/login');
	}
	else {
		response.render('pages/mission_browser', {
  			missions: missions
  		});
	}

});

app.get('/history', function(request, response) {
  response.render('pages/history');
});

app.get('/mission/:missionName', function(request, response) {
	var cookie = request.cookies.user;
	if(cookie === undefined){
		console.log("error no cookie");
		response.render('pages/login');
	}
	else {
		var mission;
		for(var i = 0; i < missions.length; i++){
			if(request.params.missionName === missions[i].name){
				break;
			}
		}
		missions[i].users.push(cookie.user);
		response.render('pages/mission', {mission:missions[i],
			user: cookie});
	}

});

app.get('/leaderboards', function(request, response) {
  response.render('pages/leaderboards');
});

app.get('/edit_profile', function(request, response) {
  response.render('pages/edit_profile');
});

var allClients = [];
io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('user info', function(pack){
		console.log('pushed user info');
		var client = {
			socket: socket,
			username: pack.user,
			mission: pack.mission
		}
		allClients.push(client);
		io.emit('update users', pack.mission.users);
	});

	socket.on('disconnect', function(){
		console.log('a user disconnected');
		for(var i = 0; i < allClients.length; i++){
			if(socket === allClients[i].socket){
				break;
			}
		}
		for(var j = 0; j < missions.length; j++){
			console.log(missions[j].name);
			console.log(allClients[i].mission.name);
			if(missions[j].name === allClients[i].mission.name){
				break;
			}
		}
		for(var k = 0; k < missions[j].users.length; k++){
			console.log(allClients[i].username);
			console.log(missions[j].users[k]);
			if(allClients[i].username === missions[j].users[k]){
				break;
			}
		}
		missions[j].users.splice(k, 1);
		console.log(missions[j].users);
		io.emit('update users', missions[j].users);
	});

});


http.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));

});