const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
const { scrap } = require('./scraper.js');
const port = process.env.PORT || 2004;

const clientPath = path.normalize(__dirname + '/../client/');

const session = require('express-session')({
    secret: '5f24da74a89e101858436f91fbe9eec73233d4fa73c6b983e89e79d69892763b',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 8,
        secure: false,
    },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(clientPath));
app.use(session);

if (app.get('env') === 'production') {
    app.set('trust proxy', 1);
    session.cookie.secure = true;
}

app.get('/', function(req, res) {
    if (req.session.loggedIn){
        res.redirect('/dashboard');
    } else {
        res.sendFile(clientPath + 'html/index.html');
    }
});

app.get('/dashboard', function(req, res) {
    if (req.session.loggedIn){
        res.sendFile(clientPath + 'html/dashboard.html');
    } else {
        res.redirect('/');
    }
});

app.post('/login', function(req, res) {
    req.session.email = req.body.email;
    req.session.password = req.body.password;

    if (req.body.weeks < 1 || req.body.weeks > 8){
        req.session.weeks = 1;
    } else {
        req.session.weeks = req.body.weeks;
    }

    new Promise((resolve, reject) => {
        scrap({req: req, res: res});
        resolve();
    });
})

app.post('/getGrades', function(req, res) {
    res.send({grades: req.session.grades});
});

app.post('/getPlanning', function(req, res) {
    res.send({planning: req.session.calendar});
});

app.post('/getAbsences', function(req, res) {
    res.send({absences: req.session.absences});
});

app.post('/refresh', function(req, res) {
    console.log(`\nRefresh request, from ${req.session.email.replace(/@.*$/, '')}`);

    new Promise((resolve, reject) => {
        scrap({req: req, res: res});
        resolve();
    });
});

app.post('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});

server.listen(port, ()=>{
    console.log('Server started on port', port);
})
