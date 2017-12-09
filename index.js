//入口，暴露俩个服务器创建方法

var TcpServer = require('./core/TcpServer.js')

const portsForPc = [1000,1001,1002,1003]
const portsForMobile = [2000,2001,2002,2003]

/**
*创建PC服务器（服务于PC终端）
* option 对象属性包括（可选）：
* timeout : 心跳检测断开时间
* disconnect :终端断开连接时回调
* errorFn ：server error事件回调
* closeFn : 服务器 close事件回调
* successFn: 解析完数据包回调，参数为解析好的json对象
**/
exports.createPCServer = function(option){

   var PcServer =  new TcpServer(option);

   PcServer.listen(portsForPc,function(port){
     if(port < 0){
       console.log('PC端接口已全被占用，请更换其他为被占用的接口');
       return;
     }
     console.log('pc server is listening on port:' + port);
   });

   return PcServer;
};

/**
*创建移动服务器（服务于移动终端）
* 同上
**/
exports.createMobileServer = function(option){
   var MobileServer =  new TcpServer(option);

   MobileServer.listen(portsForMobile,function(port){
      if(port < 0){
       console.log('移动端接口已全被占用，请更换其他为被占用的接口');
       return;
     }
     console.log('mobile server is listening on port:' + port);
   });

   return MobileServer;
};

