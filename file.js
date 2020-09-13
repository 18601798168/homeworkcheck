const path=require('path');
var iconv=require("iconv-lite");
var ffmpeg = require('fluent-ffmpeg');
const fs=require('fs');
const {students}=require('./data');
var exec = require('child_process').exec;
var exportCsvFile=require('./toolkit/exportCsvFile');
const data = require('./data');

students.forEach((item)=>{
    item.folder="";  //视频文件夹名称
    item.files=[];  //视频文件夹内文件名称
    item.desc="没有视频";
    item.duration=[];
    item.qualify=true; //是否合格
    item.totaltime=0;
    item.timestr="";
})


function hourstr(seconds){
    var hours=Math.floor(seconds/(60*60));
    var minutes=Math.floor((seconds%(60*60))/60);
    if(hours===0){
        return minutes+"分" ;
    }

    if(minutes===0){
        return hours+"小时";
    }else{
       return  hours+"小时"+minutes+"分" 
    }
   
}

 
var pathName = "F:/homework";
fs.readdir(pathName, function(err, files){
 //  console.log('readdir files',files);
  //  console.log('files.length',files.length);
    var dirs = [];
    (function iterator(i){
     //   console.log('iterator i',i);
      if(i == files.length) {
     //   console.log('students',students);
        students.forEach((item)=>{
            if(item.folder){
                fs.readdir(pathName+'/'+item.folder,(err,files2)=>{
                //   console.log('files2' ,files2);
                   
                   if(files2.length>0){
                        item.desc="";
                
                       for(let j=0;j<files2.length;j++){
                        
                           if(files2[j].includes('.mp4')){

                            ffmpeg.ffprobe((pathName+'/'+item.folder+'/'+files2[j]),function(err, metadata) {
                              //  console.log('视频地址：',(pathName+'/'+item.folder+'/'+files2[j]));
                             //   console.log('metadata.format.duration:',metadata.format.duration);
                                item.duration.push(metadata.format.duration);
                                item.files.push(files2[j]);
                              });

                           }
                          
                          
                       }
                    }


                })
            }
        })
        return ;
      }
      fs.stat(path.join(pathName, files[i]), function(err, data){   
          
       // console.log('data',data);
        
        if(data.isFile()){    
         //   console.log('isFile');         
          //  dirs.push(files[i]);
        }else{
          //  console.log('是目录' ,files[i]);
         
            students.forEach((item)=>{
               
                if(files[i].includes(item.name)){
                     name=item.name;
                     item.folder=files[i];
                    return;
                }
            });
           
           
        }
        iterator(i+1);
       });   
    })(0);

  
});


console.log('处理中。。。请稍候');
setTimeout(()=>{
 
 //  console.log('没有交作业的学生名单');
    students.forEach((item)=>{
        if(item.files.length===0){
         //   console.log(item.name);
            item.qualify=false;
            item.desc="没有视频";
        }else{
          item.totaltime= item.duration.reduce((x,y)=>x+y).toFixed(2);
          item.timestr=hourstr(item.totaltime);

          if(item.files.length>3){
              item.qualify=false;
              item.desc="视频超过3个";

          }else{

            if(item.totaltime>=60*60*2){
                item.qualify=true;
                
            }else{
                item.qualify=false;
                item.desc="时长不够";
            }

          }
         
        }

        item.qualifystr=item.qualify?"是":"否"
    })

    var csvData=[];
    students.forEach((item)=>{
        csvData.push({"检查人":"","姓名":item.name,"时长":item.timestr,"作业内容":"","备注":item.desc,"是否合格":item.qualifystr,"总人数":students.length,"合格人数":students.filter((item)=>item.qualify).length})
    })
    var date=new Date();
    var fileName=date.getMonth()+1+'月'+date.getDate()+'日'+'作业自查.csv';
    exportCsvFile(fileName,csvData).then(()=>{
    console.log(`结果已经生成，请打开"${fileName}"文件查看`);
    });
},4000)