/**
 * 
 * 按定义的交互协议进行数据解析和封装
 **/
const BufferStack = require('./BufferStack.js');

var BufferParser = function(option) {

    option = option || {}
    const headBytes = option.headLen || 11 //定义head长度
    const dataLenBytes = option.dataLenBytes || 4 //数据长度数值占据的字节数
    const versionBytes = option.version || 1
    const sequenceBytes = option.sequence || 4
    const commandIdBytes = option.commandId || 1
    const commandTypeBytes = option.commandType || 1

    let dataLen, version, sequence, commandId, commandType, content;

    const bufferSize = option.bufferSize || 1024 //定义bufferStack长度
    const bigEndian = option.bigEndian || true //默认大端
    const type = option.type || 32
    const bufferStack = bigEndian ? new BufferStack(bufferSize, headBytes).setReadIntBE(type) : new BufferStack(bufferSize, headBytes).setReadIntLE(type);

    //解包
    this.buffer2Json = function(buf, successCb, errorCb) { //buf 接收到的数据流
        bufferStack.putBuffer(buf,
            function(buffer) { //buffer 缓冲池中拼接出来的一个完整数据包buffer

                var head = new Buffer(headBytes)
                buffer.copy(head, 0, 0, headBytes)

                dataLen = head.readUInt32BE() //数据长度
                version = String.fromCharCode(head.readUInt8(4)); //版本,字符串类型
                sequence = head.readUInt32BE(5); //序列号
                commandType = String.fromCharCode(head.readUInt8(9)); //命令类型
                commandId = head.readUInt8(10); //命令id

                const body = new Buffer(dataLen);
                buffer.copy(body, 0, headBytes, headBytes + dataLen)

                try {
                    content = JSON.parse(body);
                } catch (e) {
                    console.log('head指定body长度有问题')
                }

                let json = {
                        version: version,
                        sequence: sequence,
                        commandId: commandId,
                        commandType: commandType,
                        content: content
                    }
                    // console.log(json)
                successCb && successCb(json)

            },
            function(err) {
                errorCb && errorCb(err)
            }
        )
    }

    //封包
    this.json2Buffer = function(json, option,successCb,errorCb) {
        option = option || {};
        var head = new Buffer(11);
        var jsonStr = JSON.stringify(json);
        var body = new Buffer(jsonStr);

        head.writeInt32BE(body.byteLength);
        head.writeUInt8(option.version || 0, 4);
        head.writeInt32BE(option.sequence || 0, 5);
        head.writeUInt8(option.commandId || 0, 9);
        head.writeUInt8(option.commandType || 0, 10);

        var buffer = Buffer.concat([head, body]);

        successCb && successCb(buffer);
    }
}

module.exports = BufferParser;