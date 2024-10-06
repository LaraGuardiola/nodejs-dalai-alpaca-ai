import * as WSS from "../websockets/websockets.js"
import * as UTILS from "../utils/utils.js"
import { LAYOUT, DOM, FORMAT } from "../layout/index.js"

// REQUESTS
export const getStats = async () => {
    try {
        WSS.socket.send("STATS")
    } catch (e) {
        console.error(e)
    }
}

export const getModelList = async () => {
    try {
        const response = await fetch(`${WSS.PANDORA_URL}/api/models`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        })

        const models = await response.json()

        models.forEach(model => {
            let option = document.createElement('option')
            option.setAttribute('value', model)
            option.innerText = model
            option.classList.add('montserrat')
            DOM.modelInput.appendChild(option)
        })
        LAYOUT.onModelInputChange()
    } catch (error) {
        console.log(error)
    }
}

export const getAbortResponse = async () => {
    try {
        const response = await fetch(`${WSS.PANDORA_URL}/api/llm/abort`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', "Content-Type": "application/json" }
        })

        const data = await response.json()
        LAYOUT.createResponseCancelledSpan()
        LAYOUT.removeStopResponseIcon()
        LAYOUT.displayPlane()
    } catch (error) {
        console.log(error)
    }
}   

export const getAlpacaJson = async () => {
    let convo = UTILS.getConvo()
    if (convo.length === 0) return LAYOUT.showNotification(UTILS.notifications.chat_is_empty)
    const response = await fetch(`${WSS.PANDORA_URL}/api/json`, {
        method: "POST",
        body: JSON.stringify(convo),
        headers: {
            "Content-Type": "application/json"
        }
    })
    const json = await response.json()
    LAYOUT.showNotification(UTILS.notifications.json)
    console.log(json)
}

export const callLLM = async (messageContext) => {
    LAYOUT.displayDots()
    LAYOUT.createStopResponseIcon()
    if(DOM.commInput.checked) {
        WSS.socket.send(messageContext)
        LAYOUT.createChatbox()
    }else {
        try {
            const response = await fetch(`${WSS.PANDORA_URL}/api/llm`, {
                method: "POST",
                body: messageContext,
                headers: {
                    "Content-Type": "application/json"
                }
            })
            const { alpaca } = await response.json()
            
            LAYOUT.createChatbox(alpaca)
            LAYOUT.displayPlane()
            LAYOUT.removeStopResponseIcon()    
            let alpacaConvo = [...document.querySelectorAll('.alpaca-convo > .flex-column p')].at(-1)
            FORMAT.formatLLMRestResponse(alpaca, alpacaConvo)
            FORMAT.formatAfterResponse(alpacaConvo)
        } catch (error) {
            console.error(error)
        }
    }
}

//unused, not happy with the result
export const textToTTS = async (msg) => {
    const oneLineMsg = msg.split("\n").join(' ').toUpperCase()
    try {
        const response = await fetch(`${WSS.PANDORA_URL}/api/tts`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ msg: oneLineMsg })
        })
        await response.json()
        let sound = new Audio('./tts/speech2.wav')
        sound.play()
    } catch (error) {
        console.error(error)
    }
}

export const cleanLLMContext = async () => {
    try {
        await fetch(`${WSS.PANDORA_URL}/api/context`, {
            method: "POST"
        })
    } catch (error) {
        console.error(error)
    }
}
