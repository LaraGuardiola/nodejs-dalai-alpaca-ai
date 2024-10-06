import * as API from '../api/requests.js'
import { LAYOUT, FORMAT } from '../layout/index.js'

// WSS
export const PANDORA_URL = window.location.href.slice(0, -1)
export const setWebsocketConnection = () => {
    if (window.location.href.includes('https://')) {
        return new WebSocket(`wss://${PANDORA_URL.replace('https://', '')}`)
    } else {
        return new WebSocket(`ws://${PANDORA_URL.replace('http://', '')}`)
    }
}

export const socket = setWebsocketConnection()

export const setWebsocketEvents = () => {
    socket.addEventListener('open', async () => {
        await API.getStats()
        console.log('WebSocket connection established')
    })
    
    socket.addEventListener('message', (event) => {
        let alpacaConvo = [...document.querySelectorAll('.alpaca-convo > .flex-column p')].at(-1)
        if (event.data.includes(`error:`)) {
            LAYOUT.showNotification(event.data.replace('error: ', ''))
            LAYOUT.displayPlane()
        }
        if (event.data.includes(`{"stats":`)) {
            let { stats } = JSON.parse(event.data)
            LAYOUT.refreshStats(stats)
            return
        }
        if (!event.data.startsWith("{done: true}")) {
            FORMAT.formatLLMResponse(event.data, alpacaConvo)
        } else {
            let time = event.data.split((','))[1]
            let tokens = event.data.split((','))[2]
            FORMAT.formatAfterResponse(alpacaConvo)
            LAYOUT.removeStopResponseIcon()
            LAYOUT.createTimeSpentSpan(tokens, time)
            LAYOUT.displayPlane()
            // textToTTS(alpacaConvo.innerText)
        }
    
        LAYOUT.hasChatOverflow()
    })
}