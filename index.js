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
   let query = 'SELECT * FROM history';
   db.query(query, (err, result) =>{
     if(err) throw err;
     res.json(result);
   })
});

app.get('/get/history/images', (req, res) => {
   console.log('getting stat images routes');
   let path_01 = { file_path:'http://192.168.8.101/node/get/history/images/kulutus_all_time.png'};
   let path_02 = { file_path: 'http://192.168.8.101/node/get/history/images/elias_ostetuimmat.png'};
    let path_03 = { file_path: 'http://192.168.8.101/node/get/history/images/heli_ostetuimmat.png'};
    const process = spawn('python3', ["data_handler.py"]);
    process.stdout.on('data', (data) => {
        res.json([path_01, path_02, path_03])
    });

});



app.get('/get/history/images/:dest', (req, res) =>{
    let date= new Date();
    let month = (date.getUTCMonth()+1) <10 ? '0'+ (date.getUTCMonth()+1) : date.getUTCMonth()+1;
    let day = date.getUTCDate() < 10 ? '0'+ date.getUTCDate() : date.getUTCDate();
    let year = date.getUTCFullYear();
    let fulldate = year + '-' + month + '-' + day +'/';

    res.sendFile(req.params.dest, {root:__dirname + "/uploads/" + fulldate});
});

app.post('/post/register', (req, res) => {
   let item = req.body.item;
   let price = req.body.price;
   let user = req.body.user;
    console.log('somebody trying to register new item: ' + item + ' with a price of ' + price);
    db.query( 'INSERT IGNORE INTO prices VALUES (?, ?);', [item, price],  (err, result) => {
        if(err) throw err;

        db.query( 'INSERT INTO history (item, user, price, date, action) VALUES (?, ?, ?, CURRENT_TIMESTAMP(), ?);', [item, user, price, 'rekisteröinti'], (err, result) =>{
            if(err) throw err;
            console.log('..registering logged succesfully!');
            res.json({message:'Query OK'}).status(200);
        });
    });

});

app.post('/post/buyItem', (req, res) => {
    let user = req.body.user;
    let item = req.body.item;
    let price = req.body.price;
    console.log(user + ' trying to buy ' + item + '..');
    db.query( 'INSERT INTO history (item, user, price, date, action) VALUES (?, ?, ?, CURRENT_TIMESTAMP(), ?);', [item, user, price, 'osto'], (err, result) =>{
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

        db.query( 'INSERT INTO history (item, user, date, action) VALUES (?, ?, CURRENT_TIMESTAMP(), ?);', [item, user, 'lisäys'], (err, result) =>{
            if(err) throw err;

            console.log('adding an item logged succesfully!');
            res.json({message:'Query OK'}).status(200);
        });
    });
});

app.put('/put/item', (req, res) =>{
    console.log(req.body.body);
    let itemChanged = req.body.itemChanged;
    let item = req.body.item;
    let user = req.body.user;
    let price = req.body.price;
    let previousPrice = req.body.previousPrice;

    // - if a item AND price were updated, then ->
    // - if I would've had time, I should've made a rollback system (in case one of the queries doesn't go through for some reason)
    // - but since I don't have a lot of extra time for that, I just made the system so watertight that it shouldn't ever fail (because the scope of this project is so small)

    // - first it updates the prices table with the new information
    // - then it updates the current shopping list with the new information
    // - then it updates the history with the new prices and names
    // - lastly it logs the update action itself into the history.

    if(item && price) {
        db.query('UPDATE prices SET item=(?), price=(?) WHERE item=(?)', [item, price, itemChanged], (err, result) => {
            if(err) throw err;

            db.query('UPDATE list SET item=(?) WHERE item=(?)', [item, itemChanged], (err, result) => {
                if(err) throw err;

                db.query( 'UPDATE history SET item=(?), price=(?) WHERE item=(?)', [item, price, itemChanged], (err, result) => {
                    if (err) throw err;

                    db.query( 'INSERT INTO history (item, previousName, user, price, previousPrice, date, action) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), ?);', [item, itemChanged, user, price, previousPrice, 'päivitys'], (err, result) =>{
                        if(err) throw err;
                        console.log('..update logged succesfully!');
                        res.json({message:'Query OK'}).status(200);
                    });
                })
            })
        })
    }

    // - if only the price was updated, then ->

    else if(!item && price){
        db.query('UPDATE prices SET price=(?) WHERE item=(?)', [price, itemChanged], (err, result) => {
            if(err) throw err;
            console.log('update item price succesful!');

            db.query( 'UPDATE history SET price=(?) WHERE item=(?)', [price, itemChanged], (err, result) => {
                if (err) throw err;

                db.query( 'INSERT INTO history (item, user, price, previousPrice, date, action) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(), ?);', [itemChanged, user, price, previousPrice, 'päivitys'], (err, result) =>{
                    if(err) throw err;
                    console.log('..update logged succesfully!');
                    res.json({message:'Query OK'}).status(200);
                });
            })

        })
    }

    // - if only the item name was updated, then ->

    else {
        db.query('UPDATE prices SET item=(?) WHERE item=(?)', [item, itemChanged], (err, result) => {
            if (err) throw err;

            db.query('UPDATE list SET item=(?) WHERE item=(?)', [item, itemChanged], (err, result) => {
                if(err) throw err;
                console.log('list updated');

                db.query( 'UPDATE history SET item=(?) WHERE item=(?)', [item, itemChanged], (err, result) => {
                    if (err) throw err;

                    db.query( 'INSERT INTO history (item, previousName, user, date, action) VALUES (?, ?, ?,  CURRENT_TIMESTAMP(), ?);', [item, itemChanged, user, 'päivitys'], (err, result) =>{
                        if(err) throw err;
                        console.log('..update logged succesfully!');
                        res.json({message:'Query OK'}).status(200);
                    });
                });
            });
        })
    }
});

app.delete('/delete/item', (req, res) => {
   let id = req.body.id;
   let item = req.body.item;
   let user = req.body.user;
   let purchase = req.body.purchase;
    console.log(user + ' trying to delete ' + item + ' from the list..');
   db.query('DELETE FROM list WHERE id=?', [id], (err, result) => {
       if(err) throw err;

       // - if the item wasnt bought but deleted, log the action
       // - this is to prevent logging the deletion WHEN buying an item -- it's unneccesery to log a deletion in that context.

       if(!purchase){
           db.query( 'INSERT INTO history (item, user, date, action) VALUES (?, ?, CURRENT_TIMESTAMP(), ?);', [item, user, 'poisto'], (err, result) =>{
               if(err) throw err;

               console.log('..deletion logged succesfully!');
               res.json({message:'Query OK'}).status(200);
           });
       }else{
           console.log('..deletion  succesful!');
           res.json({message:'Query OK'}).status(200);
       }

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

