var ArrayBufferStack = require('./ArrayBufferStack.js');

var ArrayBufferParser = function(option) {

    option = option || {}
    const headBytes = option.headLen || 11 //定义head长度

    let bodyBytes, version, sequence, commandId, commandType, content;

    const bufferSize = option.bufferSize || 1024 //定义bufferStack长度
    const bufferStack = new ArrayBufferStack(bufferSize, headBytes);

    //解包
    this.buffer2Json = function(buf, successCb, errorCb) { //buf 接收到的数据流,大端
        bufferStack.putBuffer(buf,
            function(buffer) { //buffer 缓冲池中拼接出来的一个完整数据包buffer

                var headView = new DataView(buffer, 0, headBytes);

                bodyBytes = headView.getUint32() - headBytes; //数据body长度
                version = String.fromCharCode(headView.getUint8(4)); //版本,字符串类型
                sequence = headView.getUint32(5); //序列号
                commandType = String.fromCharCode(headView.getUint8(9)); //命令类型
                commandId = headView.getUint8(10); //命令id

                var body = new DataView(buffer, headBytes, bodyBytes)
                var bodyStr = '';
                for (var i = 0, len = bodyBytes / 2; i < len; i++) {
                    bodyStr += String.fromCharCode(body.getUint16(i*2));
                }
                try {
                    content = JSON.parse(bodyStr);
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
    this.json2Buffer = function(json, successCb, errorCb) {
        option = option || {};
        var jsonStr = JSON.stringify(json);
        var bodyBytes = jsonStr.length * 2;

        var buffer = new ArrayBuffer(bodyBytes + headBytes);
        var headDataView = new DataView(buffer, 0, headBytes);
        var bodyDataView = new DataView(buffer, headBytes, bodyBytes);
        //设置头部
        headDataView.setUint32(0, bodyBytes + headBytes);
        headDataView.setUint8(4, option.version || 0);
        headDataView.setUint32(5, option.sequence || 0);
        headDataView.setUint8(9, option.commandId || 0);
        headDataView.setUint8(10, option.commandType || 0);

        //设置body
        var view = new Uint8Array(buffer, 11);
        for (var i = 0; i < jsonStr.length; i++) {
            bodyDataView.setUint16(i * 2, jsonStr.charCodeAt(i), );
        }

        successCb && successCb(buffer);
    }
}