"use strict";
var ArrayBufferStack = function(bufferLength = 1024, headLen = 4) {

    let _dataHeadLen = headLen; //数据包头长度
    let _dataLen = 0; //已经接收数据的长度

    let _dataWritePosition = 0; //数据存储起始位置
    let _dataReadPosition = 0; //数据存储结束位置

    let _bufferLength = bufferLength || 10 * 1024; //buffer默认长度
    let _buffer = new ArrayBuffer(bufferLength || _bufferLength); //申请内存
    let _view = new Uint8Array(_buffer); //采用类型化数组方便读写复制，解析时应该创建dataview视图


    // 往buffer填入字节流
    this.putBuffer = function(buffer, successCb, errorCb) {
        // console.log('收到数据');
        if (buffer === undefined) {
            return;
        }
        //创建数据buffer视图
        var dataView = new Uint8Array(buffer);
        //要拷贝数据的起始位置
        let dataSatrt = 0;
        // 要拷贝数据的结束位置
        let dataLength = buffer.byteLength;
        // 缓存剩余可用空间
        let availableLen = getAvailableLen();

        // buffer剩余空间不足够存储本次数据
        if (availableLen < dataLength) {
            // 以1024字节为基数扩展Buffer空间
            let exLength = Math.ceil((_dataLen + dataLength) / _bufferLength) * _bufferLength;
            let tempBuffer = new ArrayBuffer(exLength);
            let tempView = new Uint8Array(tempBuffer);

            //_buffer.copy(tempBuffer);
            _bufferLength = exLength;

            // 数据存储进行了循环利用空间，需要进行重新打包旧数据   
            if (_dataWritePosition < _dataReadPosition) { // 数据存储在buffer的尾部+头部的顺序
                let dataTailLen = _bufferLength - _dataReadPosition;

                for (var i = 0; i < dataTailLen; i++) {
                    tempView[_dataLen + i] = _view[_dataReadPosition + i];
                }
                for (var i = 0; i < _dataWritePosition; i++) {
                    tempView[dataTailLen + i] = _view[i];
                }
            } else { // 数据是按照顺序进行的完整存储
                for (var i = 0, len = _dataWritePosition - _dataReadPosition; i < len; i++) {
                    tempView[i] = _view[_dataReadPosition + i];
                }
            }
            _buffer = tempBuffer;
            _view = tempView;
            tempBuffer = null;
            tempView = null;
            _dataReadPosition = 0;
            _dataWritePosition = _dataLen;

            //复制新数据
            for (var i = 0; i < dataLength; i++) {
                _view[_dataWritePosition + i] = dataView[dataSatrt + i];
            }
            _dataLen += dataLength;
            _dataWritePosition += dataLength;
        }
        // 空间够用情况下，数据会冲破buffer尾部
        else if (_dataWritePosition + dataLength > _bufferLength) {
            /*   分两次存储到buffer：
             *   1、存储在原数据尾部 
             *   2、存储在原数据头部
             */
            // buffer尾部剩余空间的长度
            let bufferTailLength = _bufferLength - _dataWritePosition;
            if (bufferTailLength < 0) {
                console.log('程序有漏洞，bufferTailLength < 0 ');
            }
            // 数据尾部位置
            let dataEndPosition = dataSatrt + bufferTailLength;
            for (var i = 0; i < bufferTailLength; i++) {
                _view[_dataWritePosition + i] = dataView[dataSatrt + i];
            }

            _dataWritePosition = 0;
            dataSatrt = dataEndPosition;

            // data剩余未拷贝进缓存的长度
            let unDataCopyLen = dataLength - bufferTailLength;
            for (var i = 0; i < unDataCopyLen; i++) {
                _view[_dataWritePosition + i] = dataView[dataSatrt + i];
            }
            // 记录数据长度
            _dataLen = _dataLen + dataLength;
            // 记录buffer可写位置
            _dataWritePosition = _dataWritePosition + unDataCopyLen
        }
        // 剩余空间足够存储数据 
        else {

            // 拷贝数据到buffer
            for (var i = 0; i < dataLength; i++) {
                _view[_dataWritePosition + i] = dataView[dataSatrt + i];
            }

            if (_dataWritePosition > _bufferLength) {
                console.log('程序有漏洞');
            }
            // 记录数据长度
            _dataLen = _dataLen + dataLength;
            // 记录buffer可写位置
            _dataWritePosition = _dataWritePosition + dataLength;
        }

        // 读取数据
        getBuffer(successCb, errorCb);
    }

    // 获取数据
    function getBuffer(successCb, errorCb) {
        while (true) {
            // 没有数据可读,不够解析出包头
            if (getDataLen() <= _dataHeadLen) {
                console.log('数据长度小于包头规定长度，不能解析。等待数据......')
                break;
            }
            // 解析包头长度
            // 尾部最后剩余可读字节长度
            let buffLastCanReadLen = _bufferLength - _dataReadPosition;
            let dataLen = 0;
            let headBuffer = new ArrayBuffer(_dataHeadLen);
            let headDataView = new DataView(headBuffer);
            let headTempView = new Uint8Array(headBuffer);
            // 数据包为分段存储，不能直接解析出包头
            if (buffLastCanReadLen < _dataHeadLen) {
                // 取出第一部分头部字节
                for (var i = 0, len = buffLastCanReadLen - _dataReadPosition; i < len; i++) {
                    headTempView[i] = _view[_dataReadPosition + i];
                }
                // 取出第二部分头部字节
                for (var i = 0, len = _dataHeadLen - buffLastCanReadLen; i < len; i++) {
                    headTempView[buffLastCanReadLen + i] = _view[i];
                }
                // 默认大端接收数据
                dataLen = headDataView.getUint32();
            } else {
                for (var i = 0; i < _dataHeadLen; i++) {
                    headTempView[i] = _view[_dataReadPosition + i];
                }

                dataLen = headDataView.getUint32();
            }

            // 数据长度不够读取，直接返回
            if (getDataLen() < dataLen) {
                console.log("已有body数据长度小于包头定于body的长度，等待数据......")
                break;
            } else { // 数据够读，读取数据包 

                let readData = new ArrayBuffer(dataLen);
                let readDataView = new Uint8Array(readData);
                // 数据是分段存储，需要分两次读取
                if (_bufferLength - _dataReadPosition < dataLen) {

                    let firstPartLen = _bufferLength - _dataReadPosition;
                    // 读取第一部分，直接到字符尾部的数据
                    for (var i = 0; i < firstPartLen; i++) {
                        readDataView[i] = _view[_dataReadPosition + i];
                    }
                    // 读取第二部分，存储在开头的数据
                    let secondPartLen = dataLen - firstPartLen;
                    for (var i = 0; i < secondPartLen; i++) {
                        readDataView[firstPartLen + i] = _view[i];
                    }
                    _dataReadPosition = secondPartLen; //更新可读起点
                }
                // 直接读取数据
                else {
                    for (var i = 0; i < dataLen; i++) {
                        readDataView[i] = _view[_dataReadPosition + i];
                    }
                    _dataReadPosition += dataLen; //更新可读起点
                }

                try {

                    _dataLen -= dataLen; //更新数据长度

                    successCb && successCb(readData) //成功回调

                    // 已经读取完所有数据
                    if (_dataReadPosition === _dataWritePosition) {
                        break;
                    }
                } catch (e) {
                    errorCb && errorCb(e); //错误回调
                }
            }
        }
    }

    // 获取缓存数据长度
    function getDataLen() {
        let dataLen = 0;
        // 缓存全满
        if (_dataLen === _bufferLength && _dataWritePosition >= _dataReadPosition) {
            dataLen = _bufferLength;
        }
        // 缓存全部数据读空
        else if (_dataWritePosition >= _dataReadPosition) {
            dataLen = _dataWritePosition - _dataReadPosition;
        } else {
            dataLen = _bufferLength - _dataReadPosition + _dataWritePosition;
        }

        if (dataLen !== _dataLen) {
            console.log('程序有漏洞,dataLen长度不合法');
        }
        return dataLen;
    }

    // 获取buffer可用的空间长度
    function getAvailableLen() {
        return _bufferLength - _dataLen;
    }
}


module.exports = exports = ArrayBufferStack;