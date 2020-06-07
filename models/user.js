const mongoose=require('mongoose')
const Chat=require('./chat')

var userSchema=new mongoose.Schema({
    username:{type:String, unique:true, lowercase:true, required:'Field required'},
    password:{type:String, required:'Field required'},
    chats:[{
        user:this,
        message:{type:String, ref:Chat}
    }]
})

const User=mongoose.model('User',userSchema)
module.exports=User