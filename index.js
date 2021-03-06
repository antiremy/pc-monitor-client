const cote = require('cote')
const express = require('express')
const app = express();
const http = require('http').createServer(app);
const axios = require('axios')
const config = require('./config.json')
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use('/', express.static(__dirname + '/build'))

var nicehashData = {}

const monitor = new cote.Monitor({
    name: 'hardware monitor',
}, { disableScreen: true });

var sockend

io.on('connection', socket => {
    console.log(socket.id)
    socket.emit('nicehash', nicehashData)
})

if (config.walletAddress){getNicehash(); setInterval(getNicehash, 30000)}

async function getNicehash() {
    try {
        var response = await axios(`https://api2.nicehash.com/main/api/v2/mining/external/${config.walletAddress}/rigs2`)
        var {data: prices} = await axios(`https://api2.nicehash.com/exchange/api/v2/info/prices`)
        nicehashData = {...response.data, prices, ts: new Date()}
        io.emit('nicehash', nicehashData)
    }
    catch(e) {
        console.log('Error getting Nicehash data', e.toString())
    }

}

function processNodes(nodes) {
    for (let id in nodes) {
        var node = nodes[id]
        if (typeof sockend === 'undefined' && node.advertisement.type === 'service' && node.advertisement.name === 'hardware monitor' && (node.isMaster || node.isMasterEligible)) {
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