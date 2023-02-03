const koa = require('koa')
const app = new koa()
const yanzheng = require('./code')


app.use(yanzheng())

app.listen('9509',()=>{
    console.log('服务正在运行')
})