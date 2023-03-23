let input = document.querySelector('#input-chat')
let upperChat = document.querySelector('.upper-chat')
let modelInput = document.querySelector('#model')
let tempInput = document.querySelector('#temp')
let threadsInput = document.querySelector('#threads')
let n_predictInput = document.querySelector('#n_predict')
let totalMemory = document.querySelector('#total-memory')
let memoryUsage = document.querySelector('#memory-usage')
let usedMemory = document.querySelector('#used-memory')
let freeMemory = document.querySelector('#free-memory')
let cpuUsage = document.querySelector('#cpu-usage')

const ALPACA_URL = "http://localhost:3000"
let computerStats = {}

const write = async (event) => {
    if(event.key === 'Enter'){
        event.preventDefault()
        createChatbox(input.value, false)
        console.log({ prompt: input.value })
        callAlpaca(getConfig())
        input.value = ''
    }
}

//Dalai library does this weird thing of splitting the word by . (Since I can only run Alpaca I left it as placeholder)
const getConfig = () => {
    return {
        model: `alpaca.${modelInput.value}`,
        prompt: input.value,
        temp: tempInput.value,
        n_predict: n_predictInput.value,
        threads: threadsInput.value
    }
}

const callAlpaca = async (config) => {
    console.log(config)
    console.log(config.model)
    const response = await fetch(`${ALPACA_URL}/alpaca`,{
        method: "POST",
        body: JSON.stringify(config),
        headers: {
          "Content-Type": "application/json"
        }
    })
    const { alpaca } = await response.json()
    createChatbox(alpaca)
}

const createChatbox = (msg, isAlpaca = true) => {
    //div creation
    let div = document.createElement("div")
    upperChat.append(div)
    div.classList.add("chat-box")
    if(isAlpaca) div.style.backgroundColor = "#444654"

    let p = document.createElement('p')
    p.textContent = msg
    div.append(p)

    // upperChat.append(p)
}

const getStats = async () => {
    try {
        const stats = await fetch(`${ALPACA_URL}/api/stats`)
        const ram = await stats.json()
        computerStats = {...ram}
        console.log(computerStats)
        refreshMemoryUsage(computerStats)    
    } catch (error) {
        console.error(error)
    }
}

const refreshMemoryUsage = (computerStats) => {
    totalMemory.textContent = `Total memory: ${computerStats.totalMemory}`
    memoryUsage.textContent = `Memory usage: ${computerStats.memoryUsage}`
    usedMemory.textContent = `Used memory: ${computerStats.usedMemory}`
    freeMemory.textContent = `Free memory: ${computerStats.freeMemory}`
    cpuUsage.textContent = `Cpu usage: ${computerStats.cpuUsage}`
}

input.addEventListener('keypress', write)

getStats()

setInterval(async () => {
    getStats(computerStats)
}, 5000);

