var express = require('express');
var app = express();
var http = require('http');
var flash = require('express-flash');
var session = require('express-session');
var MongoClient = require('mongodb').MongoClient;

var url = '';
var collectionString = '';
var collectionString = '';
var isErys = false;
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

var port = process.env.PORT || 8080;
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
    maxAge: 1000*60*60*2 //set age to 2 hours but we can change it
}));

/////////////////// POST REGISTRATION API ///////////////////
app.post('/registrationAPI', function(req,res,next) {
    //Miguel's Database
     var databaseString = "cmpt218";
     var collectionString = "test";

    //Ery's Database
//   var databaseString = "cmpt218_epolovin";
//   var collectionString = "registeredUsers";

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
                gameArray:[
                    {
                        gameId:null, 
                        timeStarted:null,
                        winner:null,
                        loser:null,
                        numberOfMoves:null
                    }
                    
                ]
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
    uname = user.username; //sees username in session
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
            // for(var i=0;i<result.length;i++){
            // console.log((result[0].stats.gameArray[0].gameId));
            // console.log((result[0].stats.gameArray[0].timeStarted));
            // console.log((result[0].stats.gameArray[0].winner));
            // console.log((result[0].stats.gameArray[0].loser));
            // console.log((result[0].stats.gameArray[0].numberOfMoves));
            // console.log((result));
            // console.log(result[0].stats.gameArray.length); //outputs 1 for initial register

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
                        <button>New Game</button>
                        <button onclick="logout()">Logout</button>
                    </body>
                    </html>`;
            
            // }
            res.end(landing);
        });
    });
});

app.get('/logout',function(req,res){
    req.session.regenerate(function(err){
        req.flash('error','Successfully logged out');
        res.redirect('/');
    })
});

http.createServer(app).listen(port);
console.log('running on port', port);
