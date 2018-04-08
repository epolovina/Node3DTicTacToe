var express = require('express');
var app = express();
var http = require('http');
var flash = require('express-flash');
var session = require('express-session');
var MongoClient = require('mongodb').MongoClient;
var port = process.env.PORT || 8080;
var server = http.createServer(app).listen(port);
var io = require('socket.io')(server);
var clientsConnected = 0;
var url = '';
var databaseString = '';
var collectionString = '';
var isErys = true;
if(isErys){
    url = 'mongodb://root:toor@ds119129.mlab.com:19129/cmpt218_epolovin';
    databaseString = "cmpt218_epolovin";
    collectionString = "registeredUsers";
}
else{
     url = 'mongodb://root:root@ds117469.mlab.com:17469/cmpt218';
     databaseString = "cmpt218";
     collectionString = "test";
}

var dLBegin = `<dl>`;
var dLend = `</dl>`;
var dDBegin = `<dd>`;
var dDend = `</dd>`;
var dTBegin = `<dt>`;
var dTend = `</dt>`;
var bigDtag = ``;

app.use(express.json());
app.use(express.urlencoded({extended:false}));

var options = {
	dotfile: 'ignore',
	etag:false,
	extensions: ['htm','html'],
	index: 'html/login.html'
}

// Serve public directory
app.use('/',express.static('./public',options));
app.use(flash());

function checkIfUserisLoggedin(req,res,next){
    if(req.session.user){
        var sid=req.sessionID;
        console.log('SID:',sid);
        next();
    }else{
        req.flash('error','Please Log In');
        res.redirect('/');
    }
}

////////////// CREATE SESSION /////////////////
app.use(session({
    name:"session",
    secret:"CMPT218",
    maxAge: 1000 //set age to 2 hours but we can change it
}));

/////////////////// POST REGISTRATION API ///////////////////
app.post('/registrationAPI', function(req,res,next) {

    /////////////////// MONGO INSERT ///////////////
    console.log(req.body);
    console.log("attempting to connect to database");
	MongoClient.connect(url, function(err, client) {
        if (err) {
            console.log("error connecting to database");
            throw err;
        }
        console.log("connected to database");
        var database = client.db(databaseString);
        var collection = database.collection(collectionString);

        var documentToDatabase = {
            username : req.body.username,
            password : req.body.password,
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            age : req.body.age,
            gender : req.body.gender,
            email : req.body.email,
            stats : {
                wins: null,
                losses:null,
                gameArray:[]
            }
        };

        collection.insert(documentToDatabase, function() {
            console.log("the document was inserted to the database hopefully");
            res.redirect('/');
            
        });
    });
});

///////////////////// POST LOGIN /////////////////////////
app.post('/', function(req,res,next){

    //////////////// MONGO FIND //////////////
    console.log("attempting to connect to database");
	MongoClient.connect(url, function(err, client) {
        if (err) {
            console.log("error connecting to database");
            throw err;
        }
        console.log("connected to database");
        var database = client.db(databaseString);
        var collection = database.collection(collectionString);
        collection.find({}).toArray(function(err,result){
            if(err) {throw err};

            var user = null;
            result.forEach(function(userEntered){
                if(userEntered.username===req.body.username){
                    user = userEntered;
                }
            });
            if (!user){
                req.flash('error','No user found');
                res.redirect('/');
            } else if (req.body.password === user.password){
                // success
                req.session.user = user;
                res.redirect('/html/landing');
            } else {
                req.flash('error','Wrong Password');
                res.redirect('/');
            }
        });
    });
});
///////////////////// GET LOGIN /////////////////////////
app.get('/',function(req,res){
    var error = req.flash('error');

    var form =
    `<!DOCTYPE HTML>
        <html lang='en'>
            <head>
                <meta charset="UTF-8" />
                <title>Login</title>
                <script src='https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js'></script>
                <script src='../js/login.js'></script>
                <link rel='stylesheet' href='../css/style.css	' />
            </head>
            <body>
                <h1>Login</h1>
                <div id='inputForm'>
                    <form action="/" method="POST">
                        <label for='username'>Username:</label> <br>
                        <input name='username' type="text" placeholder="username" id="usernameInput" /><br/>
                        <label for='password'>Password:</label> <br>
                        <input name='password' type='password' placeholder='password' id="passwordInput" /><br/>
                        <!-- <input class="buttons" type='button' value='SEND' id="submitBtn" onclick="login()" /> -->
                        <button>LOGIN</button>
                    </form>
                    <div id="error">${error}</div>
                    <a href="html/register.html">Register</a>
                </div>               
            </body>
            </html>`;
    res.end(form);
});

/////////////////// GET LANDING ////////////////////
app.get('/html/landing',checkIfUserisLoggedin, function(req,res){

    var userStatsTag = '';
    user=req.session.user;
    var uname = user.username; //sees username in session
    console.log(uname);
    
    ///////////////// MONGO FIND /////////////////////
    MongoClient.connect(url,function(err,client){
        if(err){throw err;}
        var database = client.db(databaseString);
        var collection = database.collection(collectionString);

        var stats = '';
        var wins = '';
        var losses = '';
        var gamesPlayed = '';
        var gameId = '';
        var timeStarted = '';
        var winner = '';
        var loser = '';
        var numMoves = '';
        var numberofgamesPlayed = '';

        collection.find({username:uname}).toArray(function(err,result){

            stats += dTBegin + "<b>Stats:</b>" + dTend;
            wins += dDBegin+"<b>Wins: </b>"+result[0].stats.wins+dDend;
            losses += dDBegin+"<b>Losses: </b>"+result[0].stats.losses+dDend;
            gamesPlayed += dTBegin + "<b>Games Played: </b>" + dTend + "<br>";


            console.log((result[0].stats.wins));
            console.log((result[0].stats.losses));
            
            for(var i=0; i < result[0].stats.gameArray.length; i++){

                gameId = dDBegin+"<b>Game ID: </b>"+result[0].stats.gameArray[i].gameId+dDend;
                timeStarted = dDBegin+"<b>Time Started: </b>"+result[0].stats.gameArray[i].timeStarted+dDend;
                winner = dDBegin+"<b>Winner: </b>"+result[0].stats.gameArray[i].winner+dDend;
                loser = dDBegin+"<b>Loser: </b>"+result[0].stats.gameArray[i].loser+dDend;
                numMoves = dDBegin+"<b>Number of Moves: </b>"+result[0].stats.gameArray[i].numberOfMoves+dDend;
                
                numberofgamesPlayed+=gameId+timeStarted+winner+loser+numMoves+"<br>";
            }
            userStatsTag += dLBegin + 
                                stats+
                                    wins+
                                    losses+
                                    dDBegin+
                                        dLBegin+
                                            gamesPlayed+
                                            numberofgamesPlayed+
                                        dLend+
                                    dDend+
                            dLend;

                var landing = `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8" />
                        <title>Landing</title>
                        <script src='https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js'></script>
                        <script src='../js/landing.js'></script>
                        <link rel='stylesheet' href='../css/style.css' />
                    </head>
                    <body>
                        <div id="userStats">
                            <p>Displaying Game Statistics for ${uname}</p>
                            ${userStatsTag}
                        </div>
                        <button onclick="newGame()">New Game</button>
                        <button onclick="logout()">Logout</button>
                        <script src="/socket.io/socket.io.js"></script>
                    </body>
                    </html>`;
            
            // }
            res.end(landing);
        });
    });
});

////////////////// GAME HTML ////////////////
var usernameArray = [];

app.get('/html/game', checkIfUserisLoggedin,function(req,res){
    
    var game = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>3D Tic Tac Toe</title>
        <script src='https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js'></script>        
        <script src='../js/logic.js' defer></script>
        <link rel='stylesheet' href='../css/style.css' />
    </head>
        <body id="tableTest">
            <p id='playerOne'>${req.session.user.username}</p>
            <p id='playerTwo'></p>
            <br>
            <p id='turn'>Turn: </p>
            <p id='playerTurn'></p>
            <script src="/socket.io/socket.io.js"></script>
        </body>
    </html>`;
    usernameArray.push(req.session.user.username);
    res.end(game);
});

app.get('/html/gameFinished.html', checkIfUserisLoggedin, function(req,res){
    var gameFinished = `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>Landing</title>
            <script src='https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js'></script>
            <script src='../js/landing.js'></script>
            <link rel='stylesheet' href='../css/style.css' />
        </head>
        <body>
            <div id="gameStats">
    
            </div>
            <button onclick="goToLanding()">Go To Landing</button>
        </body>
    </html>`;

    res.end(gameFinished);
});

///////////////// LOGOUT ///////////////////
app.get('/logout',function(req,res){
    req.session.regenerate(function(err){
        req.flash('error','Successfully logged out');
        res.redirect('/');
    })
    usernameArray = [];
    
});


///////////////// GAME END API /////////////////
// app.post('/gameEndAPI', function(req,res,next){
//     user=req.session.user;
//     var uname = user.username; //sees username in session
//     console.log(uname);
//     console.log(req.body);
    
//     ////////////// MONGO FIND AND INSERT //////////////
//     MongoClient.connect(url, function(err,client){
//        if(err){
//             console.log("error connecting to database");
//             throw err;
//        } 
//        console.log('Connected to DB');
//        var database = client.db(databaseString);
//        var collection = database.collection(collectionString);

//        var pushStatstoDB = {
//         "timeStarted" : req.body.timeStarted,
//         "winner" : req.body.winner,
//         "loser" : req.body.loser,
//         "numberOfMoves" : req.body.numberOfMoves
//        }

//        collection.find({username:uname}).toArray(function(err, result){
//            result.stats.push(pushStatstoDB);
//            collection.update({$push:{pushStatstoDB}},function(err,result){
//                console.log(result);
               
//            });
//        });
//     });

// })

var peopleOnline = 0;
var actualpeopleOnline = 0;
var roomNum = 0;
var roomArray = [];
var roomObj = {
    "roomName" : "",
    "userArray" : []
};

function getRoomName(usernameID){
    for(var i = 0; i < roomArray.length; i++){
        for(var j = 0; j < roomArray[i].userArray.length; j++){
            if(usernameID === roomArray[i].userArray[j]){
                return roomArray[i].roomName;
            }
        }
    }
    return "";
}

io.on('connection', function(socket){
    peopleOnline++;
    actualpeopleOnline++;
    room = "room"+roomNum;

    socket.join(room);
    console.log("RoOm L340 ", room);
    
    if(peopleOnline === 1){
        roomObj.roomName = room;
        roomObj.userArray.push(usernameArray[usernameArray.length - 1]);
        console.log("room name ", room);
        console.log("username array length -1 L344", usernameArray[usernameArray.length - 1]);
        
    }

    if(peopleOnline === 2){
        roomObj.userArray.push(usernameArray[usernameArray.length - 1]);
        roomArray.push(roomObj);
        roomObj = {
            "roomName" : "",
            "userArray" : []
        };
        console.log("username array length -1 L355", usernameArray[usernameArray.length - 1]);

        console.log('there are now two players in the thing, here is the thing' + usernameArray);
        var jsonObj = {
            "usernameArray" : usernameArray,
            "isMyTurn" : true
        }
        socket.broadcast.to(getRoomName(usernameArray[usernameArray.length - 1])).emit('gameStart', jsonObj);//how to make it so that someone gets true while the other gets false
        console.log("get room name1 ",getRoomName(usernameArray[usernameArray.length - 1]));
        
        jsonObj = {
            "usernameArray" : usernameArray,
            "isMyTurn" : false
        }
        socket.emit('gameStart', jsonObj);//how to make it so that someone gets true while the other gets false
        console.log("get room name2 ",getRoomName(usernameArray[usernameArray.length - 1]));
       
        peopleOnline = 0;
        usernameArray = [];
        roomNum++;
    }
    console.log("people online", peopleOnline);
    
    console.log('new connection');
//    socket.on('myGameFinished', function(jsonObj){
//       console.log("game has finished");
//       socket.broadcast.emit('gameFinished', jsonObj);
//
//    });
    socket.on('sendUpdatedBoard',function(jsonObj){
       console.log("updated board");
       socket.broadcast.to(getRoomName(jsonObj.piece)).emit('opponentBoardUpdated', jsonObj);//only the other person gets the updated board
    });
    socket.on('disconnect', function(){
        actualpeopleOnline--;
        console.log("people online after disconnect", actualpeopleOnline);
        
        console.log("diconnected");
        
    });
    socket.on('iQuit', function(quittingPerson){
       socket.broadcast.to(getRoomName(quittingPerson)).emit('personQuit');//only the other person gets the updated board
        
    });
});


// http.createServer(app).listen(port);
console.log('running on port', port);
