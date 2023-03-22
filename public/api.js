let input = document.querySelector('#input-chat')
let upperChat = document.querySelector('.upper-chat')
let modelInput = document.querySelector('#model')
let tempInput = document.querySelector('#temp')
let threadsInput = document.querySelector('#threads')
let n_predictInput = document.querySelector('#n_predict')

const ALPACA_URL = "http://localhost:3000"

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