let input = document.querySelector('#input-chat')
let upperChat = document.querySelector('.upper-chat')
const ALPACA_URL = "http://localhost:3000"

const write = async (event) => {
    if(event.key === 'Enter'){
        event.preventDefault()
        createParagraph(input.value)
        console.log({ prompt: input.value })
        callAlpaca({ prompt: input.value })
        input.value = ''
    }
}

const callAlpaca = async (msg) => {
    const response = await fetch(`${ALPACA_URL}/alpaca`,{
        method: "POST",
        body: JSON.stringify(msg),
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