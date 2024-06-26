const https = require('https');
const DataStore = require('../app-store')
const dataStore = new DataStore()
const FormData = require('form-data')
const fs = require('fs')

//上传图片到CSDN
function uploadPictureToCSDN(filePath) {
    return new Promise((resolve, reject) => {
        let formData = new FormData();
        formData.append('file', fs.createReadStream(filePath))

        let headers = formData.getHeaders()
        headers.Cookie = dataStore.getCSDNCookies() //获取Cookie
        headers["user-agent"] = "Mozilla/5.0"
        //自己的headers属性在这里追加
        let request = https.request({
                                        host: 'blog-console-api.csdn.net',
                                        method: 'POST',
                                        path: '/v1/upload/img?shuiyin=2',
                                        headers: headers
                                    }, function (res) {
            let str = '';
            res.on('data', function (buffer) {
                       str += buffer;
                   }
            );
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(str);
                    if (result.code === 200) {
                        const url = result.data.url
                        resolve(url)
                    } else {
                        reject('上传图片失败,' + result.msg)
                    }
                } else {
                    console.log(filePath)
                    try {
                        const result = JSON.parse(str);
                        reject(decodeURI(result.msg))
                    } catch (e) {
                    }
                    reject('上传图片失败:' + res.statusCode)
                }
            });
        });
        formData.pipe(request)

        request.on('error', function (e) {
            reject('网络连接异常'+e.message)
        });
    })
}

//上传文章到CSDN
function publishArticleToCSDN(title, markdowncontent, content, isPublish) {
    return new Promise((resolve, reject) => {
        const parms = {
            title: title,
            markdowncontent: markdowncontent,
            content: content,
            readType: "public",
            not_auto_saved: "1",
            source: "pc_mdeditor"
        }
        if (isPublish) {
            parms['status'] = 0
            parms['type'] = 'original'
            parms['pubStatus'] = 'draft'
            // vip阅读
            // parms['readType'] = 'read_need_vip'
            parms['Description'] = content.toString().substring(0,200)
            parms['authorized_status'] = false
            parms['categories'] = '一切皆是映射:AI人工智能与大数据原理与应用实战,一切皆是映射:深度强化学习原理与应用实战,一切皆是映射:人工智能数学基础原理与应用实战'  // 专栏
            // parms['categories'] = '深度学习与AGI通用人工智能,AI神经网络与神经计算科学,AI大型语言模型与多模态'   // 专栏
            parms['original_link'] = ''
            parms['resource_url'] = ''
            parms['tags'] = '计算科学,神经计算,深度学习,神经网络,大数据,人工智能,大型语言模型,AI,AGI,LLM,Java,Python,架构设计,Agent,RPA'
            // parms['plan_id'] = '3' // 原力计划
            // parms['creator_activity_id'] = '10663' // 活动 id

        }else {
            parms['status'] = 2
        }

        // POST
        // https://bizapi.csdn.net/blog-console-api/v3/mdeditor/saveArticle
        const json = JSON.stringify(parms)
        let request = https.request({
                                        host: 'blog-console-api.csdn.net',
                                        method: 'POST',
                                        path: '/v3/mdeditor/saveArticle',
                                        headers: {
                                            "content-type": "application/json",
                                            "cookie": dataStore.getCSDNCookies(),
                                            "user-agent": "Mozilla/5.0"
                                        }
                                    }, function (res) {
            let str = '';
            res.on('data', function (buffer) {
                       str += buffer;
                   }
            );
            res.on('end', () => {
                const result = JSON.parse(str);
                if (res.statusCode === 200) {
                    if (result.code === 200) {
                        const url = isPublish ? result.data.url
                                              : 'https://editor.csdn.net/md/?articleId='
                                                + result.data.id
                        resolve(url)
                    } else {
                        reject('发布失败,' + result.msg)
                    }
                } else {
                    reject('发布失败: ' + res.statusCode + '\n'+decodeURI(result.msg))
                }
            });
        });

        request.write(json)
        request.end();

        request.on('error', function (e) {
            reject('网络连接异常'+e.message)
        });
    })
}

exports.uploadPictureToCSDN = uploadPictureToCSDN
exports.publishArticleToCSDN = publishArticleToCSDN
