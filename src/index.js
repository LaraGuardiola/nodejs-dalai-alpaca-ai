import express from "express"
import http from 'http'
import morgan from "morgan"
import { WebSocketServer } from 'ws'
import { wssCallLLM, cleanLLMContext } from './localLLM.js'
import { exportToJson, getStats, getModels, TTS, getIp, createZrokPublicDomain } from './utils.js'
import cors from 'cors'

let env = process.argv[2]
let domain

if(env === 'zrok') domain = createZrokPublicDomain()

const app = express()

app.use(cors({
    origin: domain
}))
app.use((req, res, next) => getIp(req, res, next))
app.use(morgan('dev'))
app.use(express.static('public'))
app.use(express.json())

const server = http.createServer(app)
const wss = new WebSocketServer({ server })

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`)
})

app.post('/api/llm', async (_, res) => {
    return res.json({ alpaca: 'shit is working' })
})

app.get('/api/models', async (_, res) => {
    res.json(await getModels())
})

app.post('/api/context', async (_, res) => {
    cleanLLMContext()
    res.json([])
})

app.post('/api/json', async (req, res) => {
    try {
        await exportToJson(req.body)
        return res.json(req.body)
    } catch (error) {
        console.log(error)
    }
})

app.post('/api/tts', async (req, res) => {
    const { msg } = req.body
    try{
        await TTS(msg)
        res.json({ alpaca: 'Successfully converted text to speech' })
    }catch (error) {
        res.status(500).json({ alpaca: 'Something went wrong. Check if you have Bark AI installed' })
    }
})

//WSS

wss.on('connection', async(ws) => {
    console.log('WSS connected.')
    
    ws.on('message', async (msg) => {
        let MSG = msg.toString()
        if(MSG === "STATS") {
            getStats(ws)
        }else {
            wssCallLLM(ws, MSG)
        }
    });
})
