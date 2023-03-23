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

const ALPACA_URL = "http://localhost:3000"
let ramUsage = {}

const write = async (event) => {
    if(event.key === 'Enter'){
        event.preventDefault()
        createParagraph(input.value)
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
    createParagraph(alpaca)
}

const createParagraph = (msg) => {
    let p = document.createElement('p')
    p.textContent = msg
    upperChat.append(p)
}

input.addEventListener('keypress', write)

setInterval(async () => {
    const stats = await fetch(`${ALPACA_URL}/api/stats`)
    const ram = await stats.json()
    ramUsage = {...ram}
    console.log(ramUsage)
    refreshMemoryUsage(ramUsage)
}, 15000);

const refreshMemoryUsage = (ramUsage) => {
    totalMemory.textContent = `Total memory: ${ramUsage.totalMemory}`
    memoryUsage.textContent = `Memory usage: ${ramUsage.memoryUsage}`
    usedMemory.textContent = `Used memory: ${ramUsage.usedMemory}`
    freeMemory.textContent = `Free memory: ${ramUsage.freeMemory}`
}