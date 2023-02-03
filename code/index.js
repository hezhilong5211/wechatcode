const config = require('../config');
const sha1 = require('sha1')
const getRawBody = require('raw-body')
const crypto = require('crypto')
/**
 * 
 *
  signature: 'a189edd9ea11227b072fd80d50d569d206389aa9',
  echostr: '6734721529180811195',
  timestamp: '1675389755',
  nonce: '1845301288'
}
 */
// 将xml2js解析出来的对象转换成直接可访问的对象
const formatMessage = result => {
    const message = {}
    if (typeof result === 'object') {
        for (let key in result) {
            if (!Array.isArray(result[key]) || !result[key].length) {
                continue
            }
            if (result[key].length === 1) {
                const val = result[key][0]
                if (typeof val === 'object') {
                    message[key] = formatMessage(val)
                } else {
                    message[key] = (val || '').trim()
                }
            } else {
                message[key] = result[key].map(item => formatMessage(item))
            }
        }
    }
    return message
}
const yanzheng = () => {
    return async (ctx, next) => {
        const { signature, echostr, timestamp, nonce } = ctx.query
        const { token } = config
        console.log(token)
        let shasum = crypto.createHash('sha1')
        let array = [token, timestamp, nonce].sort()
        let tempStr = array.join('')
        const stryan = shasum.update(tempStr, 'utf8').digest('hex')
        const method = ctx.method
        if (method === 'GET') {
            if (stryan === signature) {
                console.log(stryan)
                console.log(signature)
                ctx.body = echostr
                return
            } else {
                ctx.body = '验证失败'
            }
        } else if (method == 'POST') {
            // 取原始数据
            const xml = await getRawBody(ctx.req, {
                length: ctx.request.length,
                limit: '1mb',
                encoding: ctx.request.charset || 'utf-8'
            })

            // 解析xml
            const result = await parseXml(xml)

            // 将xml解析为json
            const message = formatMessage(result.xml)

            // 关注回复消息
            if (message.MsgType === 'event') {
                if (message.Event === 'subscribe') {
                    ctx.body = `
            <xml>
              <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
              <CreateTime>${new Date().getTime()}</CreateTime>
              <MsgType><![CDATA[text]]></MsgType>
              <Content><![CDATA[Hello，欢迎关注！]]></Content>
            </xml>
          `
                }
            }
        }
    }
}

module.exports = yanzheng