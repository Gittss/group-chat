const mongoose=require('mongoose')

var chatSchema=new mongoose.Schema({
    message:String,
    sender:String
})

const Chat=mongoose.model('Chat',chatSchema)
module.exports=Chat