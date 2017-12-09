const BufferParser = require('./BufferParser.js')
var PortProbe = require('./PortProbe.js')
const net = require('net')

var TcpServer = function(option) {

    let sockets = [];
    let map = {}; //id到socket的映射
    let server = net.createServer();
    let bufferParser = new BufferParser();

    let timeout = option.timeout || 20000; //定义多久未传数据则断掉
    let disconnectFn = option.disconnectFn || undefined;
    let errorFn = option.errorFn || undefined;
    let closeFn = option.closeFn || undefined;
    let successFn = option.successFn || undefined;

    server.on('connection', function(socket) {
        // console.log("connected");
        sockets.push(socket); //放入连接池

        var timer = setTimeout(function() { //规定时间内没收到消息关闭socket
            socket.end(); //实际断掉与客户端的连接
            clearTimeout(timer);
            return;
        }, timeout);


        socket.on('data', function(buffer) {
            //收到消息则表示某用户连接中，更新定时器
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(function() { //规定时间内没收到消息关闭socket
                socket.end(); //实际断掉与客户端的连接
                clearTimeout(timer);
                return;
            }, timeout)

            //将buffer写入缓存池,且解包
            bufferParser.buffer2Json(buffer,
                function(json) {
                    //存储映射
                    let id = json.content.studentId;
                    if (!map[id]) {
                        map[id] = socket;
                    }

                    //回调
                    successFn && successFn(json)
                },
                function(err) {
                    //do nothing
                })

        })

        socket.on('end', function() { //哪个用户关闭，就把它从地址池中删除。  
            // console.log("connection isclosed");
            var id, index = sockets.indexOf(socket);
            if (index != -1) {
                sockets.splice(index, 1); //从sockets中移除
            }

            for (let key in map) { //移除映射
                if (map[key] == socket) {
                    delete map[key];
                    id = key;
                }
            }

            disconnectFn && disconnectFn(id); //回调
        })

    })

    //服务器报错回调
    server.on('error', function(err) {
        errorFn && errorFn(err.message);
    });

    //服务器关闭回掉
    server.on('close', function() {
        closeFn && closeFn();
    });

    //判断合适端口并监听
    this.listen = function(ports, callback) { //监听端口
        //获取合适的端口
        (new PortProbe()).getFixPort(ports, function(port) {
            if (port > 0) {
                server.listen(port); //监听端口
            }
            callback && callback(port)
        })
        return this;
    }

    //群发消息
    this.sendAll = function(json) {
        //封包后群发
        bufferParser.json2Buffer(json,{},
            function(buffer) {
                for (var i = 0; i < sockets.length; i++) {
                    (sockets[i]).write(buffer);
                }
            })
    }

    //根据id给某个学生发消息
    this.sendOne = function(id, json) {
        if (!map || !map[id])
            return;
        bufferParser.json2Buffer(json,
            function(buffer) {
                map[id] && (map[id]).write(buffer)
            })
    }


}

module.exports = TcpServer;