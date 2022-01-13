const express = require('express');
const mysql = require('mysql2');
const argv = require('yargs').argv;
const app = express();
const cors = require('cors');
const mailer = require('nodemailer');

const multer = require('multer');
const exphbs = require('express-handlebars');
const fs = require('fs');
const e = require('express');
let d = "";
const corsOpts = {
    origin: '*',
  
    methods: [
      'GET',
      'POST',
    ]
  };
app.use(cors({
    origin: '*'
}));
app.use(express.json());
require('dotenv').config();
const host = process.env.host;
const us = process.env.user
const ps = process.env.pass
const r = process.env.db
const p = process.env.port
app.use('/uploads', express.static('uploads'));
const db = mysql.createConnection({
    host: host,
    user: us,
    password: ps,
    database: r,
});

app.get('/getfile/:path', (req, res) => {
    res.download('./uploads/'+req.params.path);
})
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        d = new Date().getDate() + new Date().getTime() + file.originalname
        cb(null, d);
    }
});

const filefilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png' ){
        console.log(file.encoding);
        cb(null, true);
    }
    else{
        cb(new Error("Unsupported file"), false);
    }
}
app.get('/', (req, res) => {
    res.send("Welcome");
})
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024*1024*10
    },
    fileFilter: filefilter
});
const tp = mailer.createTransport({
    service:"gmail",
    auth: {
        user:"capture31122021@gmail.com",
        pass:"Capture@123"
    }
})
// app.use(function(req, res, next) {
//         res.setHeader('Access-Control-Allow-Origin', '*');
// });
app.post('/login', (req, res) => {
    const user = req.body.user
    const pass = req.body.pass
    console.log(user+' '+pass);
    db.query("SELECT password FROM username WHERE user = '"+user+"'", (err, result) => {
        console.log(user+" "+pass);
        if(err){
            console.log(err.message);
            res.send("Check your credentials");
        }
        else{
            if(pass === result[0].password){
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                res.send("User can proceed!!!");
            }
            else{
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                res.send("Incorrect password!!");
            }
        }
    })
});

app.post("/signup", (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
})
// app.post('/uploadimg', upload.single('img'), (req, res) => {
//     if(req.file.filename){
//         db.query(`INSERT INTO test (imgid, img) VALUES (?, ?)`, [3, `load_file(${'./uploads/212345.jpg'})`], (err, result) => {
//             if(err){
//                 res.send(err.message);
//             }
//             else{
//                 res.send("Image uploaded");
//             }
//         })
//     }
//     else{
//         res.status(500).json({
//             message: "Something went wrong!!"
//         })
//     }
// });
app.post('/updimg', upload.single('img'), (req, res) => {
    const user = req.body.user;
    const caption = req.body.caption;
    const timestmp = new Date().getDate() + new Date().getTime();
    const fnm = d
    const imgid = user + timestmp + req.file.filename.originalname;
    if(req.file.filename){
        db.query('INSERT INTO userstorage (user, img, timestamp, caption, imgid, filename) VALUES (?,?,?,?,?,?)', [user, fnm, timestmp, caption, imgid, fnm], (err, result) => {
            if(err){
                res.send(err.message);
            }
            else{
                res.send("Image uploaded successfully in userstorage!!");
            }
        })
    }
});
app.post('/shareimg', (req, res) => {
    const sender = req.body.sender;
    const reciever = req.body.reciever;
    const fnm = req.body.fnm;
    const caption = req.body.caption;
    const g = 'no';
    const chtid = sender + reciever + new Date().getDate() + new Date().getTime();
    db.query('INSERT INTO sharedimages VALUES (?,?,?,?,?,?,?,?)', [sender, reciever, chtid, fnm, g, caption, g, g], (err, result) => {
        if(err){
            res.send(err.message);
        }
        else{
            res.send("Image shared successfully!!!");
        }
    })
});
app.post('/otpverification', (req,res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    const state = req.body.state;
    const email = req.body.email;
    db.query("SELECT user FROM username WHERE EXISTS (SELECT user FROM username WHERE user = '"+user+"')", (err, result) => {
        if(err){
            res.send(result);
        }
        else{
            if(result.length > 0){
                res.send("User already exist!!!");
            }
            else{
                db.query("INSERT INTO username (user, password, state, email) VALUES(?,?,?,?)", [user, pass,state, email], (err, result) => {
                    if(err){
                        res.send("Error in registration");
                    }
                    else{
                        const mailoptions = {
                            from: 'capture31122021@gmail.com',
                            to : email,
                            subject: 'Successful registration',
                            text: 'You have successfully registered'
                        };
                        tp.sendMail(mailoptions, (error, info) => {
                            if(error){
                                console.log("error : "+error.message);
                            }
                            else{
                                console.log("Info "+info.response);
                            }
                        });
                        db.query("CREATE TABLE "+user+" (name VARCHAR(50), status VARCHAR(50))", (eror, reslt) => {
                            if(eror){
                                console.log(eror);
                            }
                            else{
                                res.send("User successfully registered");
                            }
                        });
                    }
                });
            }
        }
    })
});
app.get('/getusers', (req, res) => {
    db.query('SELECT user FROM username', (err, result) => {
        if(err){
            res.send(err.message);
        }
        else{
            res.send(result);
        }
    })
});
app.post('/getfrnd', (req, res) => {
    const user = req.body.user;
    db.query('SELECT * FROM '+user, (err, result) => {
        if(err){
            res.send(err.message);
        }
        else{
            res.send(result);
        }
    })
})
app.post('/sendfrndreq', (req, res) => {
    const sender = req.body.sender;
    const reciever = req.body.reciever;
    db.query('INSERT INTO '+reciever+" VALUES (?,?)",[sender, 'pending'], (err, result) => {
        if(err){
            res.send(err.message);
        }
        else{
            db.query('INSERT INTO '+sender+" VALUE(?,?)", [reciever, 'pending'], (er, rst) => {
                if(er){
                    console.log(er);
                }
                else{
                    res.send("Friend request sent successfully!!!");
                }
            })
        }
    })
});
app.post('/respfrnd', (req, res) => {
    const sender = req.body.sender
    const reciever = req.body.reciever
    const resp = req.body.resp;
    if(resp === 'Confirm'){
        db.query('UPDATE '+sender+" SET status = 'Confirm' WHERE name = '"+reciever+"'", (err, result) => {
            if(err){
                res.send(err.message);
            }
            else{
                db.query('UPDATE '+reciever+" SET status = 'Confirm' WHERE name = '"+sender+"'", (er, rst) => {
                    if(er){
                        res.send(err.message);
                    }
                    else{
                        res.send("You both are now friends!!!");
                    }
                })
            }
        })
    }
    else{
        db.query('DELETE FROM '+sender+" WHERE name = '"+reciever+"'", (err, result) => {
            if(err){
                res.send(err.message);
            }
            else{
                db.query("DELETE FROM "+reciever+" WHERE name = '"+sender+"'", (er, rst) => {
                    if(er){
                        console.log(er);
                    }
                    else{
                        res.send('Friend request deleted!!!');
                    }
                })
            }
        })
    }
})
app.post('/retrievestorage', (req, res) => {
    const user = req.body.user;
    db.query("SELECT * FROM userstorage WHERE user = '"+user+"'", (err, result) => {
        if(err){
            res.send(err.message);
        }
        else{
            res.send(result);
        }
    })
});
app.post('/retrieveshared', (req, res) => {
    const sender = req.body.sender;
    const reciever = req.body.reciever;
    db.query("SELECT * FROM sharedimages WHERE sender = '"+sender+"' and reciever = '"+reciever+"'", (err, result) => {
        if(err){
            res.send(err.message);
        }
        else{
            res.send(result);
        }
    })
})
app.post('/like', (req, res) => {
    const chtid = req.body.chtid;
    db.query("UPDATE sharedimages SET like = 'yes' WHERE chtid = '"+chtid+"'", (err, result) => {
        if(err){
            res.send(err.message);
        }
        else{
            db.query("UPDATE sharedimages SET dislike = 'no' WHERE chtid = '"+chtid+"'", (er, rst) => {
                res.send("Message liked successfully!!!!");
            })
        }
    })
});
app.post('/dislike', (req, res) => {
    const chtid = req.body.chtid;
    db.query("UPDATE sharedimages SET dislike = 'yes' WHERE chtid = '"+chtid+"'", (err, result) => {
        if(err){
            res.send(err.message);
        }
        else{
            db.query("UPDATE sharedimages SET like = 'no' WHERE chtid = '"+chtid+"'", (err, result) => {
                if(err){
                    res.send(err.message);
                }
                else{
                    res.send('Message is disliked');
                }
            });
        }
    });
});
app.post('/delete/cht', (req, res) => {
    const chtid = req.body.chtid;
    db.query("DELETE FROM sharedimages WHERE chtid = '"+chtid+"'", (err, result) => {
        if(err){
            res.send(err.message);
        }
        else{
            res.send("Chat deleted");
        }
    })
})
app.post('/delete/img', (req, res) => {
    const imgid = req.body.imgid;
    db.query("DELETE FROM userstorage WHERE imgid = '"+imgid+"'", (err, result) => {
        if(err){
            res.send(err.message);
        }
        else{
            res.send("Image deleted");
        }
    })
})
app.post('/msg/seen', (req, res) => {
    const sender = req.body.sender;
    const reciever = req.body.reciever;
    db.query("UPDATE sharedimages SET seen = 'yes' WHERE sender = '"+sender+"' and reciever = '"+reciever+"'", (err, result) => {
        if(err){
            res.send(err.message);
        }
        else{
            res.send("All messages are seen");
        }
    })
})
app.post('/msgsend', (req, res) => {
    const sender = req.body.sender;
    const reciever = req.body.reciever;
    const msg = req.body.msg;
    const chtid = sender+reciever + new Date().getDate() + new Date().getTime();
    db.query("INSERT INTO sharedimages VALUES(?,?,?,?,?,?,?,?)", [sender, reciever,chtid,msg,'no','','no','no'], (err, result) => {
        if(err){
            res.send(err);
        }
        else{
            res.send("Message send successfully");
        }
    });
});

app.post('/crtgrp', (req, res) => {
    const adm = req.body.adm;
    const grpnm = adm + new Date().getDate() +  new Date().getTime();
    console.log(adm+" "+grpnm);
    db.query('INSERT INTO grp VALUES(?,?)', [grpnm, adm], (err, result) => {
        if(err){
            res.send(err.message);
        }
        else{
            res.send(grpnm);
        }
    })
});
const pt = argv.port || 3001;
app.listen( pt, () => {
    console.log("Listening at "+pt+"!!");
});