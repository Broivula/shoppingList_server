'use strict';
require('dotenv').config();
const express = require('express');
const app = express();
const multer = require('multer');
const mysql = require('mysql');
const bodyParser = require('body-parser');


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB
});

const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

app.use(function(req, res, next)
{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
    next();
});

/*
io.on('connection', (socket) => {
   console.log('new connection with and id ' + socket.id);

   socket.on('new_item', (data) => {
      console.log('message: ' + data);
       io.emit('new_item', {item:data.item, event:'new_item'});
       console.log('new item sent!');
   })

});
*/

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


db.connect((err) => {
    if(err){
        throw err;
    }
    console.log('mysql connected..');
});

app.get('/get/list', (req, res) => {
    let query = 'SELECT p.item, l.user, l.date, p.price FROM prices p, list l  WHERE p.item = l.item ORDER BY date DESC;';
    db.query(query, (err, result) => {
        if(err) throw err;
        res.send(result);
    })
});


app.get('/get/registeredItems', (req, res) => {
   let query = 'SELECT item FROM prices';
   db.query(query, (err, result) => {
       if(err) throw err
       res.send(result);
   })
});

app.post('/post/register', (req, res) => {
   let item = req.body.item;
   let price = req.body.price;
    db.query( 'INSERT IGNORE INTO prices VALUES (?, ?);', [item, price],  (err, result) => {
        if(err) throw err;
        // console.log(result);
        res.json(req.body).status(200);
    });

});

app.post('/post/item', (req, res) => {
    //console.log(req.body);
    let item = req.body.item;
    let user = req.body.user;
    db.query( 'INSERT IGNORE INTO list (item, user, date) VALUES (?, ?, CURRENT_TIMESTAMP());', [item, user],  (err, result) => {
        if(err) throw err;
        // console.log(result);
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

server.listen(2222 ,() => {console.log('server running on port 2222')});

