var net = require('net');

var retryInterval = 3000;
var retriedTimes = 0;
var maxRetries = 10;
var quiting = false;

process.stdin.resume();

(function connect() { //保证在连接终止时，重新连接。  
  function reconnect() {
    if (retriedTimes >= maxRetries) {
      throw new Error('Max retries have been exceeded,i give up');
    }
    retriedTimes += 1;
    setTimeout(connect, retryInterval);
  }
  var conn = net.createConnection(1000, function() {
    console.log('Connect to server');
  });

  conn.on('data', function(buffer) {
    console.log(buffer);
  })

  conn.on('error', function(err) {
    console.log(err.message);
  });
  conn.on('close', function() {
    if (!quiting) {
      console.log("connect got closed,will try to reconnect");
      reconnect();
    }
  });

  //将服务器发送给进程的标准输出流打印出来  
  conn.pipe(process.stdout, {
    end: false
  });

  //向服务器发送输入的数据  
  //process.stdin.pipe(conn);  
  process.stdin.on('data', function(data) {
    if (data.toString().trim().toLowerCase() === 'quit') {
      quiting = true;
      console.log('quiting....');
      conn.end('bye bye'); //这里也可以使用conn???  
      process.stdin.pause();
    } else if (data.toString().trim().toLowerCase() === '1') { //发送包头
      var head = new Buffer(11);
      head.writeUInt32BE(30, 0);
      head.write("1.2", 4, 1)
      head.writeInt32BE(100, 5);
      head.write('2', 9, 1)
      head.writeUInt8(101, 10)

      conn.write(head)
    } else if (data.toString().trim().toLowerCase() === '2') { //发送body第一段
      var buf1 = new Buffer.from('{"studentId":1,');
      conn.write(buf1)
    } else if (data.toString().trim().toLowerCase() === '3') { //发送body第二段
      var buf2 = new Buffer.from('"name":"yujon"}');
      conn.write(buf2)
    } else {
      // conn.write(data); //向服务器发送数据  
    }
  });


}());