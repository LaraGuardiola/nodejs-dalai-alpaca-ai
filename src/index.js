import express from "express";
import { alpaca } from './alpaca.js'
import morgan from "morgan"
import os from 'os'
import osu from 'node-os-utils'

const app = express()
const cpu = osu.cpu

app.use(morgan('dev'))
app.use(express.static('public'))
app.use(express.json())

app.listen(3000, () => console.log('listening on port 3000'))

app.post('/alpaca', async (req, res) => {
    console.log(req.body)
    const result = await alpaca(req.body)
    res.json({ alpaca: result })
})

app.get('/api/stats', async (req, res) => {
    // RAM stats
    const [totalMem, freeMem] = [os.totalmem(), os.freemem()]
    const usedMem = totalMem - freeMem
    const usedMemPercentage = Math.round(usedMem / totalMem * 100)

    //CPU stats
    const [cpuUsage, cpuModel, cpuThreads] = await Promise.all([cpu.usage(), cpu.model(), cpu.count()])

    const stats = {
        memoryUsage: `${usedMemPercentage}%`,
        totalMemory: `${(totalMem / 1073741824).toFixed(2)} GB`,
        freeMemory: `${(freeMem / 1073741824).toFixed(2)} GB`,
        usedMemory: `${(usedMem / 1073741824).toFixed(2)} GB`,
        cpuUsage: `${cpuUsage}%`,
        cpuModel: `${cpuModel}`,
        cpuThreads: `${cpuThreads} threads`,
        cpuCores: `${cpuThreads / 2} cores`,

    }
    res.json(stats)
})
