let input = document.querySelector('#input-chat')
let upperChat = document.querySelector('.upper-chat')
let modelInput = document.querySelector('#model')
let tempInput = document.querySelector('#temp')
let threadsInput = document.querySelector('#threads')
let n_predictInput = document.querySelector('#n_predict')
let pcModel = document.querySelector('#pc-model')
let threadsCores = document.querySelector('#threads-cores')
let memory = document.querySelector('#memory')
let cpuPercentage = document.querySelector('#cpu-percentage')
let ramPercentage = document.querySelector('#ram-percentage')
let dots = document.querySelectorAll('.dot')
let plane = document.querySelector('.send-icon')

const ALPACA_URL = "http://localhost:3000"
let computerStats = {}

const send = async (event) => {
    event.preventDefault()
    createChatbox(input.value, false)
    callAlpaca(getConfig())
    input.value = ''
}

const sendByEnter = async (event) => {
    if(event.key === 'Enter'){
        send(event)
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
    plane.style.display = "none"
    dots.forEach(dot => dot.style.display = "inline-block")
    console.log(config)
    const response = await fetch(`${ALPACA_URL}/alpaca`,{
        method: "POST",
        body: JSON.stringify(config),
        headers: {
          "Content-Type": "application/json"
        }
    })
    const { alpaca } = await response.json()
    dots.forEach(dot => dot.style.display = "none")
    plane.style.display = "inline-block"
        
    createChatbox(alpaca)
}

const createChatbox = (msg, isAlpaca = true) => {
    let img = document.createElement("div")
    let div = document.createElement("div")
    img.classList.add("mini-logo")
    upperChat.append(img)
    upperChat.append(div)
    div.classList.add("chat-box")

    if(isAlpaca) div.style.backgroundColor = "#444654"
    if(!isAlpaca) img.style.backgroundImage = "url(\"./assets/snoop.jpeg\")"

    let p = document.createElement('p')
    
    div.append(img)
    div.append(p)

    washText(msg, p, isAlpaca)
}

const getStats = async () => {
    try {
        const stats = await fetch(`${ALPACA_URL}/api/stats`)
        const ram = await stats.json()
        computerStats = {...ram}
        refreshStats(computerStats)    
    } catch (error) {
        console.error(error)
    }
}

const refreshStats = (computerStats) => {
    pcModel.textContent = `${computerStats.cpuModel}`
    threadsCores.textContent = `${computerStats.cpuThreads}T / ${computerStats.cpuCores}C`
    memory.textContent = `${computerStats.usedMemory} / ${Math.round(computerStats.totalMemory)}GB`
    cpuPercentage.textContent = `${computerStats.cpuUsage}%`
    ramPercentage.textContent = `${computerStats.memoryUsage}%`
}

const washText = (alpaca, p, isAlpaca) => {
    if(isAlpaca){
        let ps = [...document.querySelectorAll(".chat-box > p")]
 
        p.textContent = alpaca
            .replace(ps.at(-2).textContent,"")
            .replace("[end of text]", "")
            .replace("<end>", "")
            .replaceAll("[29;200H", "")
            .replaceAll("ÔÇÖ", ",")
            .replaceAll("ÔÇ£", "\"")
            .replaceAll("ÔÇØ", "")
            .replaceAll("ÔÇö", "-")
            .replaceAll("ÔÇô", ":")
            .replaceAll("ÔÇª", "...")
    }else p.textContent = alpaca
}

document.body.addEventListener('keypress', sendByEnter)
plane.addEventListener('click', send)

getStats()

setInterval(async () => {
    getStats(computerStats)
}, 3000);

