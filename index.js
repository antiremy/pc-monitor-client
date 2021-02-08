const cote = require('cote')
const express = require('express')
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:23465",
        methods: ["GET", "POST"]
    }
});

app.use('/', express.static('build'))

const monitor = new cote.Monitor({
    name: 'hardware monitor',
}, { disableScreen: true });

var sockend

io.on('connection', socket => {
    console.log(socket.id)
})



function processNodes(nodes) {
    for (let id in nodes) {
        var node = nodes[id]
        if (typeof sockend === 'undefined' && node.advertisement.name === 'hardware monitor' && node.isMaster) {
            console.log('Found master node', node)
            sockend = new cote.Sockend(io, {
                name: 'hardware monitor',
                key: node.advertisement.key.replace('$$', '')
            });
            clearInterval(discover)
        }
    }
}

http.listen(23465, () => {
    console.log('listening on *:23465');
  });

var discover = setInterval(() => {
    processNodes(monitor.discovery.nodes)
},
    5000)