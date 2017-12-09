var factory = require('../index.js')

var pcServer = factory.createTCPServer([1000, 331, 136, 222], {
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