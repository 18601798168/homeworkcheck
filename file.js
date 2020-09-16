const path = require('path');
var iconv = require("iconv-lite");
var ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { students } = require('./data');
var exec = require('child_process').exec;
var exportCsvFile = require('./toolkit/exportCsvFile');
const data = require('./data');


/**
 * 使用前请配置data.js中的学生名单
 * 请在这里配置四个主要的变量  totalTime ，className,homeworkDate ，pathName 
 * 建议作业视频目录下 每个学生创建包含自己姓名的文件夹，该文件夹下直接包含作业录屏.mp4文件，个数不限
 * **/

// 设置作业合格时长，默认两小时
const totalTime = 60 * 60 * 2;

// 设置班级名称 主要是在生成报告的文件名中起作用，没有任何代码逻辑
const className="1804A";  

// 设置检查作业完成的日期  主要是在生成报告的文件名中起作用，没有任何代码逻辑
const homeworkDate = '9月14日';

// 设置作业存盘地址   注意：windows盘符使用正斜杠/ 
var pathName = "F:/9.16作业";




// 初始化数据，请勿做任何修改
students.forEach((item) => {
    item.folder = "";  //视频文件夹名称
    item.files = [];  //视频文件夹内文件名称
    item.desc = "没有视频";
    item.duration = [];
    item.qualify = true; //是否合格
    item.totaltime = 0;
    item.timestr = "";
})


// 时长显示换算
function hourstr(seconds) {
    var hours = Math.floor(seconds / (60 * 60));
    var minutes = Math.floor((seconds % (60 * 60)) / 60);
    if (hours === 0) {
        return minutes + "分";
    }

    if (minutes === 0) {
        return hours + "小时";
    } else {
        return hours + "小时" + minutes + "分"
    }

}


//文件读取
fs.readdir(pathName, function (err, files) {
    var dirs = [];
    (function iterator(i) {
        if (i == files.length) {
            students.forEach((item) => {
                if (item.folder) {
                    fs.readdir(pathName + '/' + item.folder, (err, files2) => {
                        if (files2.length > 0) {
                            item.desc = "";

                            for (let j = 0; j < files2.length; j++) {

                                if (files2[j].includes('.mp4')) {

                                    ffmpeg.ffprobe((pathName + '/' + item.folder + '/' + files2[j]), function (err, metadata) {
                                        console.log('视频地址：', (pathName + '/' + item.folder + '/' + files2[j]));
                                        if (err) {
                                            item.desc = "视频损坏";
                                            item.duration.push(0);
                                            item.files.push(files2[j]);

                                        } else {
                                            item.duration.push(metadata.format.duration);
                                            item.files.push(files2[j]);

                                        }

                                    });

                                }


                            }
                        }


                    })
                }
            })
            return;
        }
        fs.stat(path.join(pathName, files[i]), function (err, data) {

            if (data.isFile()) {
                //对于作业文件夹的文件 ，直接忽略
            } else {
                // 只处理作业文件夹下的包含学生姓名的文件夹
                students.forEach((item) => {

                    if (files[i].includes(item.name)) {
                        name = item.name;
                        item.folder = files[i];
                        return;
                    }
                });


            }
            iterator(i + 1);
        });
    })(0);
});

// 以上代码预测在15秒之内生成
console.log('处理中...请稍候');

// 等待15秒之后 处理数据生成报告
setTimeout(() => {
    students.forEach((item) => {
        // 学生文件夹下没有读取到.mp4文件，就认为不合格没有视频
        if (item.files.length === 0) {
            item.qualify = false;
            item.desc = "没有视频";
        } else {
            // 计算单个学生视频总时长
            item.totaltime = item.duration.reduce((x, y) => x + y).toFixed(2);
            item.timestr = hourstr(item.totaltime);

            if (item.files.length > 3) {
                item.qualify = false;
                item.desc = "视频超过3个";

            } else {

                if (item.totaltime >= totalTime) {
                    item.qualify = true;
                    item.desc = "";

                } else {
                    item.qualify = false;
                    item.desc = item.totaltime == 0 ? "视频损坏" : "时长不够";
                }

            }

        }

        item.qualifystr = item.qualify ? "是" : "否"
    })

  

    // 生成综合报表
    var csvData = [];
    students.forEach((item) => {
        csvData.push({ "检查人": "", "姓名": item.name, "时长": item.timestr, "作业内容": "", "备注": item.desc, "是否合格": item.qualifystr, "总人数": students.length, "合格人数": students.filter((item) => item.qualify).length })
    })
    var date = new Date();
    var fileName = date.getMonth() + 1 + '月' + date.getDate() + '日' + '作业自查-' + homeworkDate + '作业.csv';
    exportCsvFile(fileName, csvData).then(() => {
      console.log(`结果已经生成，请打开"${fileName}"文件查看`);
    });
   

    // 生成没交作业的学生名单
    var noData = [];
    noData = csvData.filter((item) => { return item['是否合格'] === '否' && item['备注'] === '没有视频' });
    var fileName2 = date.getMonth() + 1 + '月' + date.getDate() + '日' + '作业自查-' + homeworkDate + '作业没交的同学.csv';
    exportCsvFile(fileName2, noData).then(() => {
        console.log(`作业没交的名单已经生成，请打开"${fileName2}"文件查看`);
    });

    
    // 生成视频出问题的学生报表
    var errData = [];
    errData = csvData.filter((item) => { return item['是否合格'] === '否' && item['备注'] !== '没有视频' });
    var fileName3 = date.getMonth() + 1 + '月' + date.getDate() + '日' + '作业自查-' + homeworkDate + '作业有问题的同学.csv';
    exportCsvFile(fileName3, errData).then(() => {
       console.log(`作业有问题的名单已经生成，请打开"${fileName3}"文件查看`);
    });
}, 15000)