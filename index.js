'use strict';
require('dotenv').config();
const express = require('express');
const app = express();
const multer = require('multer');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const fs = require('fs');
const spawn = require('child_process').spawn;


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
    let query = 'SELECT l.item, l.user, l.date, l.id, p.price FROM prices p, list l  WHERE p.item = l.item ORDER BY l.item;';
    db.query(query, (err, result) => {
        if(err) throw err;
        res.send(result);
    });


});


app.get('/get/registeredItems', (req, res) => {
   let query = 'SELECT * FROM prices';
   db.query(query, (err, result) => {
       if(err) throw err;
       res.send(result);
   })
});

app.get('/get/history', (req, res) => {
    console.log('python fetching history...');
   let query = 'SELECT * FROM history';
   db.query(query, (err, result) =>{
     if(err) throw err;
     console.log('sent history to the python script!');
     res.json(result);
   })
});

app.get('/get/history/images', (req, res) => {
   console.log('getting stat images routes');
   let file_path_obj = { file_path:'http://192.168.8.101/node/get/history/images/kulutus_all_time.png'};
    const process = spawn('python3', ["data_handler.py"]);
    process.stdout.on('data', (data) => {
        res.json([file_path_obj])
    });

});



app.get('/get/history/images/:dest', (req, res) =>{
    let date= new Date();
    let month = (date.getUTCMonth()+1) <10 ? '0'+ (date.getUTCMonth()+1) : date.getUTCMonth()+1;
    let day = date.getUTCDate();
    let year = date.getUTCFullYear();
    let fulldate = year + '-' + month + '-' + day +'/';

    res.sendFile(req.params.dest, {root:__dirname + "/uploads/" + fulldate});
});

app.post('/post/register', (req, res) => {
   let item = req.body.item;
   let price = req.body.price;
    console.log('somebody trying to register new item: ' + item + ' with a price of ' + price);
    db.query( 'INSERT IGNORE INTO prices VALUES (?, ?);', [item, price],  (err, result) => {
        if(err) throw err;
         console.log('registered succesfully!');
        res.json(req.body).status(200);
    });

});

app.post('/post/buyItem', (req, res) => {
    let user = req.body.user;
    let item = req.body.item;
    let price = req.body.price;
    console.log(user + ' trying to buy ' + item + '..');
    db.query( 'INSERT INTO history (item, user, price, date) VALUES (?, ?, ?, CURRENT_TIMESTAMP());', [item, user, price], (err, result) =>{
        if(err) throw err;
        console.log('..transaction logged succesfully!');
        res.json({message:'Query OK'}).status(200);
    });
});

app.post('/post/item', (req, res) => {
    //console.log(req.body);
    let item = req.body.item;
    let user = req.body.user;
    console.log(user + ' is adding a '+ item + ' to the list...');
    db.query( 'INSERT INTO list (item, user, date) VALUES (?, ?, CURRENT_TIMESTAMP());', [item, user],  (err, result) => {
        if(err) throw err;
        console.log('..succesfully added!');
        res.json({message:'Query OK'}).status(200);
    });
});

app.delete('/delete/item', (req, res) => {
   let id = req.body.id;
   let item = req.body.item;
    console.log('somebody trying to delete ' + item + ' from the list..');
   db.query('DELETE FROM list WHERE id=?', [id], (err, result) => {
       if(err) throw err;
      console.log('..deletion succesful!');
       res.json(req.body).status(200);
   })
});


//just a function to keep the db connection up
setInterval(() =>{
    db.query('SELECT * FROM prices', (err, result) =>{
        if(err) throw err;
        //console.log('just keeping up the connection to the database..')
    })
}, 100000);


server.listen(2222 ,() => {console.log('server running on port 2222')});

