import express from "express"
import http from 'http'
import morgan from "morgan"
import { WebSocketServer } from 'ws'
import { wssCallLLM } from './localLLM.js'
import { exportToJson, getStats, getModels } from './utils.js'

const app = express()

app.use(morgan('dev'))
app.use(express.static('public'))
app.use(express.json())

const server = http.createServer(app)

const wss = new WebSocketServer({ server })

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`)
})

app.post('/api/llm', async (req, res) => {
    // const response = await callLLM(req.body)
    
    // const ttsCommand = `tts --text "${response}" --out_path ./public/tts/speech2.wav`

    // try {
    //     const { stdout, stderr } = await execAsync(ttsCommand)

    //     if (stderr) {
    //         console.error(`Error al obtener información: ${stderr}`)
    //     }

    //     console.log(stdout)

    // } catch (error) {
    //     console.log(error)
    // }
 
    return res.json({ alpaca: 'shit is working' })
   
})

app.get('/api/stats', async (req, res) => {
    res.json(await getStats())
})

app.get('/api/models', async (req, res) => {
    res.json(await getModels())
})

app.post('/api/json', async (req, res) => {
    try {
        await exportToJson(req.body)
        return res.json(req.body)
    } catch (error) {
        console.log(error)
    }
})

//WSS

wss.on('connection', async(ws) => {
    console.log('WSS connected.')
    
    ws.on('message', async (msg) => {
        wssCallLLM(ws, msg)
    });
})
