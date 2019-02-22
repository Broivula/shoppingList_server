'use strict';
const express = require('express');
const multer = require('multer');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const upload = multer({dest: 'uploads/'});

const db = mysql.createConnection({
    host: 'localhost',
    user: 'elias_rasp_pi',
    password: 'ripirapiDF20PI',
    database: 'shopping_list_app'
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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
      console.log(result);
    })
});

app.post('/post/item', (req, res) => {
    console.log(req.body);
    let item = req.body.item;
    let user = req.body.user;
    db.query( 'INSERT IGNORE INTO list (item, user, date) VALUES (?, ?, CURRENT_TIMESTAMP());', [item, user],  (err, result) => {
        if(err) throw err;
        console.log(result);
        res.json(req.body).status(200);
    });
});

app.delete('/delete/item', (req, res) => {
   let item = req.body.item;
   console.log('poistettava esine: ' + item);
   db.query('DELETE FROM list WHERE item=?', [item], (err, result) => {
       if(err) throw err;
       console.log(result);
       res.json(req.body).status(200);
   })
});



app.listen(2222 ,() => {console.log('server running on port 2222')});