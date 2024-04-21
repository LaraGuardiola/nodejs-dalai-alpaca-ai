import hljs from 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/es/highlight.min.js' // from cdn works, locally I'm missing something

let mainspace = document.querySelector('.mainspace')
let chat = document.querySelector('.chat')
let sideMenu = document.querySelector('.side-menu')
let burgerMenu = document.querySelector('.burger-menu')
let input = document.querySelector('#input-chat')
let upperChat = document.querySelector('.upper-chat')
let modelInput = document.querySelector('#model')
let pcModel = document.querySelector('#pc-model')
let threadsCores = document.querySelector('#threads-cores')
let memory = document.querySelector('#memory')
let cpuPercentage = document.querySelector('#cpu-percentage')
let ramPercentage = document.querySelector('#ram-percentage')
let dots = document.querySelectorAll('.dot')
let plane = document.querySelector('.send-icon')
let optPaperclip = document.querySelector('#option-attach')
let optExport = document.querySelector('#option-export')
let optClean = document.querySelector('#option-clean')
let notification = document.querySelector('.notification')
let attachment = document.querySelector('.attachment')

const ALPACA_URL = window.location.href.slice(0, -1)
const viewportWidth = window.screen.width

const notifications = {
    clipboard: "Snippet has been copied",
    json: "Created json on the repository",
    clean: "Successfully cleaned the chat",
    chat_is_empty: "The chat is empty"
}

//MAIN FUNCTIONS

const send = async (event) => {
    console.log(input.textContent)
    if (input.textContent) {
        event.preventDefault()
        createChatbox(input.innerHTML.replaceAll('<br>', '\n'), false)
        let modelOption = document.querySelector('option:checked').value
        let messageContext = JSON.stringify([input.textContent, modelOption, getImages()])
        socket.send(messageContext)
        callLLM()
        cleanInputChat()
    }
}

const sendByEnter = async (event) => {
    if (event.key === 'Enter' && event.shiftKey) {
        return
    }
    if (event.key === 'Enter') {
        send(event)
    }
}

const onImgDragover = (e) => {
    e.preventDefault()
    e.stopPropagation()
    chat.classList.add('dragging-over')
}

const onImgDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    chat.classList.remove('dragging-over')
}

const onImgDrop = (e) => {
    e.preventDefault()
    chat.classList.remove('dragging-over')
    const files = e.dataTransfer.files

    Array.from(files).forEach(file => {
        if (file.type.startsWith("image/")) {
            const reader = new FileReader()
            reader.onloadend = (ev) => {
                const img = document.createElement('img')
                img.src = ev.target.result
                attachment.appendChild(img)
            }
            reader.readAsDataURL(file)
        }
    })
}

// REQUESTS

const getStats = async () => {
    try {
        socket.send("STATS")
    } catch (e) {
        console.error(e)
    }
}

const getModelList = async () => {
    try {
        const response = await fetch(`${ALPACA_URL}/api/models`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        })

        const models = await response.json()

        models.forEach(model => {
            let option = document.createElement('option')
            option.setAttribute('value', model)
            option.innerText = model
            option.classList.add('montserrat')
            modelInput.appendChild(option)
        })
        console.log(models)
    } catch (error) {
        console.log(error)
    }
}

const getAlpacaJson = async () => {
    let convo = getConvo()
    if (convo.length === 0) return showNotification(notifications.chat_is_empty)
    const response = await fetch(`${ALPACA_URL}/api/json`, {
        method: "POST",
        body: JSON.stringify(convo),
        headers: {
            "Content-Type": "application/json"
        }
    })
    const json = await response.json()
    showNotification(notifications.json)
    console.log(json)
}

const callLLM = async () => {
    displayDots()
    try {
        await fetch(`${ALPACA_URL}/api/llm`, {
            method: "POST"
        })
        createChatbox()
    } catch (error) {
        console.error(error)
    }
}

//unused, not happy with the result
const textToTTS = async (msg) => {
    console.log(msg)
    const oneLineMsg = msg.split("\n").join(' ')
    try {
        const response = await fetch(`${ALPACA_URL}/api/tts`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ msg: oneLineMsg })
        })
        const { alpaca } = await response.json()
        let sound = new Audio('./tts/speech2.wav')
        sound.play()
    } catch (error) {
        console.error(error)
    }
}

const cleanLLMContext = async () => {
    try {
        await fetch(`${ALPACA_URL}/api/context`, {
            method: "POST"
        })
    } catch (error) {
        console.error(error)
    }
}

// UTILS

const cleanInputChat = () => input.innerHTML = ''

//this lovely snippet comes straight from code from deepseek-coder:33b, does the infernal job of formatting the main input when pasting
const manageInputChatPasteEvent = (e) => {
    // Prevent default paste behavior
    e.preventDefault()

    // Get plain text from clipboard
    let text = (e.originalEvent || e).clipboardData.getData('text/plain')

    // Sanitize input by replacing angle brackets with their escaped counterparts
    text = text.replace(/&gt;/g, '>').replace(/&lt;/g, '<')

    // Insert the sanitized plain text into the contenteditable div using innerHTML
    input.innerText = input.innerText + text
}

const attachImg = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.multiple = true
    fileInput.accept = 'image/*'
    fileInput.click()

    fileInput.addEventListener('change', () => {
        const { files } = fileInput
        Array.from(files).forEach((file) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onloadend = (ev) => {
                    const img = document.createElement('img')
                    img.src = ev.target.result
                    attachment.appendChild(img)
                }
                reader.readAsDataURL(file)
            }
        })
    })
}

const displayDots = () => {
    plane.style.display = "none"
    input.removeAttribute('contenteditable')
    dots.forEach(dot => dot.style.display = "inline-block")
    input.blur()
}

const displayPlane = () => {
    dots.forEach(dot => dot.style.display = "none")
    plane.style.display = "inline-block"
    input.setAttribute('contenteditable', 'true')
    input.focus()
}

const refreshStats = (computerStats) => {
    pcModel.textContent = `${computerStats.cpuModel}`
    threadsCores.textContent = `${computerStats.cpuThreads}T / ${computerStats.cpuCores}C`
    memory.textContent = `${computerStats.usedMemory} / ${Math.round(computerStats.totalMemory)}GB`
    cpuPercentage.textContent = `${computerStats.cpuUsage}%`
    ramPercentage.textContent = `${computerStats.memoryUsage}%`
}

const getConvo = () => {
    let convo = []
    let userConvo = document.querySelectorAll('.user-convo .flex-column p')
    let alpacaConvo = [...document.querySelectorAll('.alpaca-convo .flex-column p')]
    userConvo.forEach(chat => {
        convo.push({
            prompt: chat.textContent
        })
    })

    for (let [key] in convo) {
        convo[key].alpaca = alpacaConvo[key].textContent
    }
    return convo
}

const getImages = () => {
    let lastUserConvo = document.querySelectorAll('.user-convo')
    let imagesDom = Array.from(lastUserConvo).at(-1).querySelectorAll('.flex-column img')
    let images = []
    imagesDom.forEach(img => {
        images.push(img.src.split(',')[1])
    })
    return images
}

// LAYOUT

const createChatbox = (msg = '', isAlpaca = true) => {
    if (isAlpaca) input.disabled = true
    let img = document.createElement("div")
    let div = document.createElement("div")
    let pSection = document.createElement("section")
    img.classList.add("mini-logo")
    upperChat.append(img)
    upperChat.append(div)
    div.classList.add("chat-box")
    pSection.classList.add("flex-column")

    if (isAlpaca) {
        div.style.backgroundColor = "#444654"
        div.classList.add('alpaca-convo')
    }
    if (!isAlpaca) {
        img.style.backgroundImage = "url(\"./assets/img/snoop.jpeg\")"
        div.classList.add('user-convo')
    }

    let p = document.createElement('p')

    div.append(img)
    div.append(pSection)
    pSection.append(p)

    //attach img to chatbox
    if (attachment.children.length > 0) {
        Array.from(attachment.children).forEach(img => {
            pSection.appendChild(img)
        })
    }

    //Sets a different padding for the chat boxes based on the window.screen.width
    let chatBoxes = document.querySelectorAll('.chat-box')
    if (mainspace.offsetWidth <= viewportWidth / 2) {
        resizeChatboxPadding(chatBoxes, "2em 3em 2em 3em")
    } else {
        resizeChatboxPadding(chatBoxes, "2em 10em 2em 10em")
    }

    p.innerHTML = msg

    if (pSection.children.length > 1) {
        p.innerHTML = p.innerHTML + "<br><br>"
    }
}

const hasChatOverflow = () => {
    let chatBoxes = document.querySelectorAll('.chat-box')
    let totalChatHeight = 0
    chatBoxes.forEach(chat => {
        totalChatHeight += chat.offsetHeight
    })

    if (totalChatHeight > upperChat.offsetHeight) {
        upperChat.scrollTo({
            top: upperChat.scrollHeight,
            behavior: 'instant'
        })
    }
}

const cleanChat = async () => {
    let chatBoxes = document.querySelectorAll('.chat-box')
    chatBoxes.forEach(chat => upperChat.removeChild(chat))
    await cleanLLMContext()
    showNotification(notifications.clean)
}

const onSnippetClipboardClick = async (codeSnippet) => {
    console.log('at least this shit is working')
    try {
        await navigator.clipboard.writeText(codeSnippet)
        showNotification(notifications.clipboard)
    } catch (error) {
        showNotification(error)
    }
}

const showNotification = (msg) => {
    notification.style.display = "flex"
    notification.innerHTML = `<i class="fa-solid fa-bell"></i> ${msg}`
    notification.style.animation = 'fadeAndMove 0.5s forwards ease-in'
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.5s forwards ease-in'
    }, 3000)
    setTimeout(() => notification.style.display = "none", 6000)
}

const hideSidebar = () => sideMenu.style.display = "none"
const showSidebar = () => sideMenu.style.display = "flex"

const showX = () => burgerMenu.innerHTML = `<i class="fa-solid fa-x"></i>`
const showBurger = () => burgerMenu.innerHTML = `<i class="fa-solid fa-bars"></i>`

const resizeChatboxPadding = (chatBoxes, padding) => {
    if (chatBoxes.length > 0) chatBoxes.forEach(chatbox => chatbox.style.padding = padding)
}

const handleSidebar = () => {
    if (burgerMenu.firstChild.className.includes("fa-x")) {
        hideSidebar()
        showBurger()
        if (screen.orientation.type === "portrait-primary") {
            chat.style.display = "flex"
        }
    } else {
        showSidebar()
        showX()
        if (screen.orientation.type === "portrait-primary") {
            chat.style.display = "none"
        }
    }
}

const resizeLayout = () => {
    //always closing sidebar to avoid headaches with the layout tbh
    let chatBoxes = document.querySelectorAll('.chat-box')
    const pageWidth = mainspace.offsetWidth
    if (viewportWidth > 468) {
        hideSidebar()
        resizeChatboxPadding(chatBoxes, "2em 3em 2em 3em")
        showBurger()
    } else {
        hideSidebar()
        resizeChatboxPadding(chatBoxes, "2em 10em 2em 10em")
        showBurger()
    }
}

// FORMATS

const formatLLMResponse = (msg, alpacaConvo) => {
    // converts special characters so it doesn't break HTML snippets
    msg = formatHTMLSnippetSpecialCharacter(msg)
    //checks if the innerHTML of the response includes ``` in order to envelop it with <pre><code>
    formatCodeSnippets(alpacaConvo)
    formatBoldText(alpacaConvo)
    alpacaConvo.innerHTML += msg
}

const formatHTMLSnippetSpecialCharacter = (msg) => {
    if (msg.includes('<')) {
        let arr = msg.split('')
        let idx = arr.indexOf('<')
        arr[idx] = '&lt;'
        msg = arr.join('')
        return msg
    }
    return msg
}

const formatCodeSnippets = (alpacaConvo) => {
    //envelops the snippet inside <pre><code>
    let replacedStr = alpacaConvo.innerHTML.replace(/```(.*?)```/gs, '<br><div class="snippet-header"></div><pre><code>$1</code></pre>')
    alpacaConvo.innerHTML = replacedStr
    hljs.highlightAll()
}

const formatBoldText = (alpacaConvo) => {
    let replacedStr = alpacaConvo.innerHTML.replace(/\*\*(.*?)\*\*/gs, '<b>$1</b>')
    alpacaConvo.innerHTML = replacedStr
}

const formatBlackquotes = (alpacaConvo) => {
    //envelops the snippet inside <pre><code>
    let replacedStr = alpacaConvo.innerHTML.replace(/`(.*?)`/gs, '<span class="blackquote">$1</span>')
    alpacaConvo.innerHTML = replacedStr
}


const createSnippetHeaders = (codeHeaders, snippet, index) => {
    let lang
    let lines = snippet?.innerHTML.split('\n')
    lang = lines.shift()
    snippet.innerHTML = lines.join('\n')
    codeHeaders[index].innerHTML = `<p>${lang}</p><i class="fa-solid fa-copy"></i>`
}

const createHeaderTags = (alpacaConvo) => {
    let lines = alpacaConvo.innerHTML.split('\n')
    lines.forEach((line, i) => {
        if (line.startsWith('#')) {
            lines[i] = `<h1 class="tag-header">${line.slice(2)}</h1>`
        }
        if (line.startsWith('##')) {
            lines[i] = `<h2 class="tag-header">${line.slice(3)}</h2>`
        }
        if (line.startsWith('###')) {
            lines[i] = `<h3 class="tag-header">${line.slice(4)}</h3>`
        }
        if (line.startsWith('####')) {
            lines[i] = `<h4>${line.slice(5)}</h4>`
        }
    })
    alpacaConvo.innerHTML = lines.join('\n')
}

const bindClickSnippetHeaders = (response, snippet, index) => {
    //binding to the clipboard onSnippetClipboardClick
    let clipboards = [...response.querySelectorAll('div .fa-copy')]
    clipboards[index].addEventListener('click', async () => {
        // showNotification(notifications.clipboard)
        await onSnippetClipboardClick(snippet.innerText)
    })
}

const formatAfterResponse = (alpacaConvo) => {
    formatBlackquotes(alpacaConvo)
    createHeaderTags(alpacaConvo)

    let LLMResponse = [...document.querySelectorAll('.alpaca-convo')].at(-1)
    let LLMResponseP = LLMResponse.querySelector('p')
    let code = [...LLMResponseP.querySelectorAll('pre code')]
    let codeHeaders = [...LLMResponseP.querySelectorAll('.snippet-header')]

    code.forEach(async (snippet, index) => {
        createSnippetHeaders(codeHeaders, snippet, index)
        bindClickSnippetHeaders(LLMResponseP, snippet, index)
    })
}


// EVENTS - lifecycle

const init = async () => {
    await getModelList()
}

window.addEventListener('DOMContentLoaded', init)
window.addEventListener('resize', resizeLayout)
burgerMenu.addEventListener('click', handleSidebar)
document.body.addEventListener('keypress', sendByEnter)
chat.addEventListener('dragover', (e) => onImgDragover(e))
chat.addEventListener('dragleave', (e) => onImgDragLeave(e))
chat.addEventListener('drop', (e) => onImgDrop(e))
plane.addEventListener('click', send)
optPaperclip.addEventListener('click', attachImg)
optClean.addEventListener('click', cleanChat)
optExport.addEventListener('click', getAlpacaJson)
input.addEventListener('paste', (e) => manageInputChatPasteEvent(e))

// WSS

let socket
if (window.location.href.includes('https://')) {
    socket = new WebSocket(`wss://${ALPACA_URL.replace('https://', '')}`)
} else {
    socket = new WebSocket(`ws://${ALPACA_URL.replace('http://', '')}`)
}


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
    if (event.data !== "{done: true}") {
        formatLLMResponse(event.data, alpacaConvo)
    } else {
        formatAfterResponse(alpacaConvo)
        displayPlane()
        // textToTTS(alpacaConvo.innerText)
    }

    hasChatOverflow()
})
