let mongoose = require('mongoose');

//Article Schema
let articleSchema = mongoose.Schema({
    search_term:{
        type:String,
    },
    date:{
        type:Date
    }
});

let History = module.exports = mongoose.model('search_histories',articleSchema);