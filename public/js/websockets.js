// WSS
const PANDORA_URL = window.location.href.slice(0, -1)
const setWebsocketConnection = () => {
    if (window.location.href.includes('https://')) {
        return new WebSocket(`wss://${PANDORA_URL.replace('https://', '')}`)
    } else {
        return new WebSocket(`ws://${PANDORA_URL.replace('http://', '')}`)
    }
}

const socket = setWebsocketConnection(() => console.log('Connected bro'))

export const setWebsocketEvents = () => {
    socket.addEventListener('open', async () => {
        await getStats()
        console.log('WebSocket connection established')
    })
    
    socket.addEventListener('message', (event) => {
        let alpacaConvo = [...document.querySelectorAll('.alpaca-convo > .flex-column p')].at(-1)
        if (event.data.includes(`error:`)) {
            showNotification(event.data.replace('error: ', ''))
            displayPlane()
        }
        if (event.data.includes(`{"stats":`)) {
            let { stats } = JSON.parse(event.data)
            refreshStats(stats)
            return
        }
        if (!event.data.startsWith("{done: true}")) {
            formatLLMResponse(event.data, alpacaConvo)
        } else {
            let time = event.data.split((','))[1]
            let tokens = event.data.split((','))[2]
            formatAfterResponse(alpacaConvo)
            removeStopResponseIcon()
            createTimeSpentSpan(tokens, time)
            displayPlane()
            // textToTTS(alpacaConvo.innerText)
        }
    
        hasChatOverflow()
    })
}