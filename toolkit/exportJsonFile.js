const file=require('./file.js');

let exportJsonFile =function (fileName,data){
    const json=JSON.stringify(data,null,4);
    return file.write(fileName,json);
}

module.exports=exportJsonFile;