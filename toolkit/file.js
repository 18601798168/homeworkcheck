const fs=require('fs');

function read(fileName){
  return new Promise((resolve,reject)=>{
      fs.readFile(fileName,"utf8",function(err,textFileData){
          if(err){
              reject(err);
              return;
          }
          resolve(textFileData)
      })
  })
}

function write(fileName,textFileData){
    return new Promise((resolve,reject)=>{
        fs.writeFile(fileName,'\ufeff'+textFileData,{encoding: 'utf8'},(err)=>{
            if(err){
                reject(err);
                return;
            }

            resolve();
        })
    })
}

module.exports={
    read:read,
    write:write
}