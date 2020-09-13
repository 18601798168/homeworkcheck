var express=require('express');
var app=express();
var path=require('path');
let port = 3001;
let readFile="C:\fakepath";

app.set('views','./views');
app.set('view engine','ejs')

console.log('__dirname',__dirname);
console.log('public path',path.join(__dirname,'public'));


app.use(express.static('./public',{
    maxAge:'0',
    etag:true
}));

app.use(express.static('./files',{
    maxAge:'0',
    etag:true
}));

app.use('/static',express.static(path.join(__dirname,'public')));


app.get('/',(req,res)=>{
  // res.sendFile('/index.html')
  res.render('index');
})


app.post('/',(req,res)=>{
    res.send('Got a post request');
})

app.put('/user',(req,res)=>{
    res.send('Got a PUT request at /user')
})

app.delete('/user',(req,res)=>{
    res.send('Got a DELETE request at /user')
})

app.use((req,res,next)=>{
    res.status(404).send("sorry can not find that");
})

app.use((err,req,res,next)=>{
    console.error(err.stack);
    res.status(500).send('something broke!')
})

app.listen(port,()=>{
    console.log('app is listending on port',port);
})