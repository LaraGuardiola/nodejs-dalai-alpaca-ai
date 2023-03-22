import express from "express";
import { alpaca } from './alpaca.js'
import morgan from "morgan"
const app = express()

app.use(morgan('dev'))
app.use(express.static('public'))
app.use(express.json())

app.listen(3000, () => console.log('listening on port 3000'))

app.post('/alpaca', async (req, res) => {
    console.log(req.body)
    const result = await alpaca(req.body)
    res.json({ alpaca: result })
})
