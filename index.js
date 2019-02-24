'use strict';
require('dotenv').config()
const express = require('express');
const multer = require('multer');
const mysql = require('mysql');
const bodyParser = require('body-parser');


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB
});

const app = express();
const http = require('http').Server(app);
const server = app.listen(2222 ,() => {console.log('server running on port 2222')});
const io = require('socket.io').listen(server);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

io.on('connection', (socket) => {
    socket.on('message', (message) => {
        console.log('kikkel');
    });
    console.log('a user has connected.');
});

db.connect((err) => {
    if(err){
        throw err;
    }
    console.log('mysql connected..');
});

app.get('/list', (req, res) => {
    let query = 'SELECT * FROM list ORDER BY date DESC;';
    db.query(query, (err, result) => {
        if(err) throw err;
        res.send(result);
    })
});

app.post('/post/item', (req, res) => {
    //console.log(req.body);
    let item = req.body.item;
    let user = req.body.user;
    db.query( 'INSERT IGNORE INTO list (item, user, date) VALUES (?, ?, CURRENT_TIMESTAMP());', [item, user],  (err, result) => {
        if(err) throw err;
       // console.log(result);
        io.emit('message', req.body);
        res.json(req.body).status(200);
    });
});

app.delete('/delete/item', (req, res) => {
    console.log(req.body);
   let item = req.body.item;
   console.log('poistettava esine: ' + item);
   db.query('DELETE FROM list WHERE item=?', [item], (err, result) => {
       if(err) throw err;
      // console.log(result);
       res.json(req.body).status(200);
   })
});



