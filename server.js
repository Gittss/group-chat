const express=require('express')
const mongoose=require('mongoose')
const exphand=require('express-handlebars')
const path=require('path')
const bodyparser=require('body-parser')
var app=express()
var server=require('http').createServer(app)
const io=require('socket.io').listen(server)
const Chat=require('./models/chat')
const User=require('./models/user')
require('dotenv/config')
var users=[]
var connections=[]

app.use(bodyparser.urlencoded({extended:true}))
app.use(bodyparser.json())

app.set('views',path.join(__dirname,'/views/'))
app.engine('hbs',exphand({extname:'hbs', defaultLayout:'mainLayout', layoutsDir:__dirname+'/views/layouts/'}))
app.set('view engine','hbs')

//-----------------DB Connection--------------------------
mongoose.connect(process.env.MONGODB_URI,{useNewUrlParser:true, useUnifiedTopology:true},(err)=>{
    if(!err) console.log('MongoDB connected')
    else console.log('MongDB error : ',err)
})

//-----------------Server setup--------------------------
server.listen(process.env.PORT || 3000,(err)=>{
    if(!err) console.log('Server running...')
})

//--------------------Routes-----------------------------

app.get('/',(req,res)=>{
    res.render('home')
    //res.sendFile(__dirname+'/index.html')
})

app.get('/signup',(req,res)=>{
    res.render('signup')
})

app.post('/signup',(req,res)=>{
    User.findOne({username:req.body.username},(err,obj)=>{
        if(obj===null) {
            addUser(req,res)
        }
        else {
            res.render('signup',{username:'Username already taken'})
        };
    });
})

app.get('/login',(req,res)=>{
    res.render('login')
})

app.post('/login',(req,res)=>{
    User.findOne({username:req.body.username},(err,doc)=>{
        if(!err){
            if(doc!=null){
                if(req.body.password=='') res.render('login',{pass:'Enter password'})
                else if(req.body.password!=doc.password)
                    res.render('login',{pass:'Incorrect password'})
                else res.render('chat',{user:doc})
            }
            else res.render('login',{
                username:'user not found'
            })
        }
        else console.log('error in login -> '+err);
    })
})

function addUser(req,res){
    var user=new User()
    user.username=req.body.username;
    user.password=req.body.password;
    user.save((err)=>{
        if(!err){
            res.render('chat',{user:user});
            console.log('Signup successful');
        }
        else{
            if(err.name=='ValidationError'){
                handleValidationError(err,req.body);
                res.render("signup",{user: req.body});
            }
            else console.log('error in Signing up -> '+err);
        }
    });
};

function handleValidationError(err,body){
    for(field in err.errors){
        switch(err.errors[field].path){
            case 'username':
                body['usernameError']=err.errors[field].message;
                break;
            case 'password':
                body['passwordError']=err.errors[field].message;
                break;
            default: break;
        }
    }
};

io.sockets.on('connection',socket =>{
    connections.push(socket)
    console.log('Connected : %s people connected',connections.length)

    socket.on('disconnect',data=>{
        users.splice(users.indexOf(socket.username),1)
        updateUsernames()
        connections.splice(connections.indexOf(socket),1)
        console.log('Diconnected : %s people connected',connections.length)
    })
    
    socket.on('send message',data=>{
        //--------saving messages into DB------
        var chat=new Chat({
            message:data,
            sender:socket.username
        })
        chat.save((err)=>{
            if(!err) console.log('Message saved : '+data)
            else console.log(err)
        })
        io.sockets.emit('new message',{msg: data, user:socket.username})
    })

    socket.on('new user',(data,callback)=>{
        callback(true)
        socket.username=data
        users.push(socket.username)
        updateUsernames()
    })

    

    function updateUsernames(){
        io.sockets.emit('get users',users)
    }
})