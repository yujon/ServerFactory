var TcpServerCreator = require('../index.js')

var pcServer = TcpServerCreator.createPCServer({
	successFn: successFn,
	disconnectFn: disconnectFn
})

var mobileServer = TcpServerCreator.createMobileServer({
	successFn: successFn,
	disconnectFn: disconnectFn
})

function successFn(data) {
	console.log(data)
	
	pcServer.sendAll({
		from: 'pc',
		goal: 'test'
	})
}

function disconnectFn(socket) {
	console.log('connection is closed')
	console.log(socket)
}