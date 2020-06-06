const express=require('express')
const mongoose=require('mongoose')
var app=express()
var server=require('http').createServer(app)
const io=require('socket.io').listen(server)
const Chat=require('./models/chat')
require('dotenv/config')
var users=[]
var connections=[]

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
    res.sendFile(__dirname+'/index.html')
})

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