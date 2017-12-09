//找出未占用端口
let PortProbe = function() {
  let unfinishedTask;;
  let ip = '127.0.0.1';
  let hasFinished;

  this.getFixPort = function(ports, callback) {  //获取未被占用的端口
    unfinishedTask = ports.length;
    hasFinished = false;
    for (index = 0; index < unfinishedTask; index++) {
      probe(ip, ports[index], callback);
    }
  };

  //检测端口是否被占用
  function probe(ip, port, callback) {
    let net = require('net')
      // 创建服务并监听该端口
    let server = net.createServer().listen(port)

    server.on('listening', function() { // 执行这块代码说明端口未被占用
      server.close() // 关闭服务

      if (hasFinished) {
        return;
      }

      unfinishedTask--;  
      hasFinished = true;  
      callback && callback(port);
    })

    server.on('error', function(err) {
      if (err.code === 'EADDRINUSE') { // 端口已经被使用

        if (hasFinished)
          return;

        unfinishedTask--;

        if (unfinishedTask == 0) { //没有找到可用端口
          callback && callback(-1);
        }
      }
    })
  };
}

module.exports = PortProbe;