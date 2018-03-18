const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const request = require('request');
const port = process.env.PORT || 3000;
const db_url = process.env.DB_URL;
const client_id = process.env.CLIENT_ID;
const app = express();


mongoose.connect(db_url);
let db = mongoose.connection;
let History = require('./models/history');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine','pug');
app.use(express.static(path.join(__dirname, 'public')));

//Getting Root/Index Page
app.get('/',function(req,res){
    res.render('index');
});

//Sending JSON response of set of images related to search query
app.get('/api',function(req, res){

    var offset = req.query.offset;
    var searchQuery = req.query.q ? req.query.q : "";

    //Saving Search History in Database
    if(searchQuery!=""){

        let history = new History();  
        history.search_term = searchQuery;
        history.date = new Date();
        history.save(function(err){
            if(err){
                console.log(err);
                return;
            }
        });
    }

    //Fetching Data from API
    request.get('https://api.imgur.com/3/gallery/search/top/all/'+offset+'?q='+searchQuery+'&client_id='+client_id, (error, response, result) => {
        if(error) {
            return console.dir(error);
        }
        result = JSON.parse(result);
        var data = [];

        if(searchQuery!="" && result.data.length>0){
            for(var i=0; i<30; i++){
                data[i] = {
                    "title":result.data[i].title,
                    "img_url":result.data[i].link,
                    "page_url":"https://imgur.com/",
                    "success":true
                };
            }
        }
        else if(searchQuery==""){
            data = [{"success":false}];
        }
        else if(result.data.length==0){
            data = [{"status":"No record found"}];
        }
        //Sending JSON Response to client
        res.send(data);
    });

});

//Fetching Recent Search History from database
app.get('/api/latest/',function(req,res){
    var result = [];
    var dateDifference = "";
    History.find({},function(err,history){
        if(err){
            console.log(err);
        }else{
            for(var i=0,j=0; i<history.length; i++){

                //Finding Time Difference b/w current and db record time
                dateDifference = ((((new Date()).getTime())/ 1000).toFixed(0))-((((history[i].date).getTime())/ 1000).toFixed(0));
               
                //Show the History of recent 12 Hours (e.g. 43200seconds == 12 Hours)
                if(dateDifference<43200){
                    result[j] = {
                        "search_term":history[i].search_term,
                        "date":history[i].date
                    };
                    j++;
                }/*else{
                    result = [{"status":"No search history"}];
                }*/
            }
        }
        res.send(result);
    }); 
    
});


app.listen(port);