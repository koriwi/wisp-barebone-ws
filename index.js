const WebSocket = require('ws')
const http = require('http')

const server = new http.createServer();
const pingServer = new http.createServer();
const port = process.env.PORT || 8080
server.listen(port)
pingServer.listen(port + 1)
const wss = new WebSocket.Server({ server });

console.log('listening on port: ' + port);
let clients = []

wss.on('connection', (connection, newCLient) => {
	console.log('new client')
	console.log(newCLient.headers['sec-websocket-key'])

	clients.push({ id: newCLient.headers['sec-websocket-key'], connection })
	//tell everyone about the new guy
	clients/*.filter(con => con != connection)*/.forEach(client => {
		connection.send(JSON.stringify({
			type: 'newClient',
			payload: client.id
		}))
		if (client.connection.readyState === WebSocket.OPEN)
			client.connection.send(JSON.stringify({
				type: 'newClient',
				payload: newCLient.headers['sec-websocket-key']
			}))
	})

	//broadcast
	connection.on('message', (audio) => {
		clients/*.filter(con => con != connection)*/.forEach(client => {
			if (client.connection.readyState === WebSocket.OPEN)
				client.connection.send(JSON.stringify({
					type: 'audio',
					id: newCLient.headers['sec-websocket-key'],
					payload: audio
				}))
		})
	});
	connection.on('close', () =>  {
		clients = clients.filter(con => {
			return con.connection.readyState !== 3
		})
	})
});
