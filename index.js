//入口

const TcpServer = require('./tcp/TcpServer.js')

/**
 *  ports 端口数组
 *  option 对象属性包括（可选）：
 *      timeout : 心跳检测断开时间
 *      disconnect :终端断开连接时回调
 *      errorFn ：server error事件回调
 *      closeFn : 服务器 close事件回调
 *      successFn: 解析完数据包回调，参数为解析好的json对象
 **/

const Factory = function() {
  let setver;

  //生产tcp服务器
  this.createTCPServer = function(ports, option) {
    server = new TcpServer(option);

    server.listen(ports, function(port) {
      if (port < 0) {
        console.log('移动端接口已全被占用，请更换其他为被占用的接口');
        return;
      }
      console.log('mobile server is listening on port:' + port);
    });
    return server;
  }

  //生产http服务器
  this.createHTTPServer = function(ports, option) {
    //do nothing
  }

  //生产https服务器
  this.createHTTPSServer = function(ports, option) {
    //do nothing
  }


  //生产tls服务器
  this.createTLSServer = function(ports, option) {
    //do nothing
  }

}

module.exports = new Factory();