import { hljs } from './highlight.js'
import * as DOM from './dom.js'

const PANDORA_URL = window.location.href.slice(0, -1)
const viewportWidth = window.screen.width

const setWebsocketConnection = () => {
    if (window.location.href.includes('https://')) {
        return new WebSocket(`wss://${PANDORA_URL.replace('https://', '')}`)
    } else {
        return new WebSocket(`ws://${PANDORA_URL.replace('http://', '')}`)
    }
}

const socket = setWebsocketConnection()


const setWebsocketEvents = () => {
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

setWebsocketEvents()

const notifications = {
    clipboard: "Snippet has been copied",
    json: "Created json on the repository",
    clean: "Successfully cleaned the chat",
    chat_is_empty: "The chat is empty"
}

//MAIN FUNCTIONS

const send = async (event) => {
    console.log(DOM.input.textContent)
    if (DOM.input.textContent) {
        event.preventDefault()
        createChatbox(DOM.input.innerHTML.replaceAll('<br>', '\n'), false)
        let modelOption = document.querySelector('option:checked').value
        let messageContext = JSON.stringify([DOM.input.textContent, modelOption, getImages()])
        callLLM(messageContext)
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
    DOM.chat.classList.add('dragging-over')
}

const onImgDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    DOM.chat.classList.remove('dragging-over')
}

const onImgDrop = (e) => {
    e.preventDefault()
    DOM.chat.classList.remove('dragging-over')
    const files = e.dataTransfer.files

    Array.from(files).forEach(file => {
        if (file.type.startsWith("image/")) {
            const reader = new FileReader()
            reader.onloadend = (ev) => {
                const img = document.createElement('img')
                img.src = ev.target.result
                DOM.attachment.appendChild(img)
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
        const response = await fetch(`${PANDORA_URL}/api/models`, {
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
        onModelInputChange()
    } catch (error) {
        console.log(error)
    }
}

const getAbortResponse = async () => {
    try {
        const response = await fetch(`${PANDORA_URL}/api/llm/abort`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', "Content-Type": "application/json" }
        })

        const data = await response.json()
        createResponseCancelledSpan()
        removeStopResponseIcon()
        displayPlane()
    } catch (error) {
        console.log(error)
    }
}

const getAlpacaJson = async () => {
    let convo = getConvo()
    if (convo.length === 0) return showNotification(notifications.chat_is_empty)
    const response = await fetch(`${PANDORA_URL}/api/json`, {
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

const callLLM = async (messageContext) => {
    socket.send(messageContext)
    displayDots()
    try {
        await fetch(`${PANDORA_URL}/api/llm`, {
            method: "POST",
            body: messageContext,
            headers: {
                "Content-Type": "application/json"
            }
        })
        createChatbox()
    } catch (error) {
        console.error(error)
    }
}

//unused, not happy with the result
const textToTTS = async (msg) => {
    const oneLineMsg = msg.split("\n").join(' ').toUpperCase()
    try {
        const response = await fetch(`${PANDORA_URL}/api/tts`, {
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
        await fetch(`${PANDORA_URL}/api/context`, {
            method: "POST"
        })
    } catch (error) {
        console.error(error)
    }
}

// UTILS

const cleanInputChat = () => DOM.input.innerHTML = ''

//this lovely snippet comes straight from code from deepseek-coder:33b, does the infernal job of formatting the main input when pasting
const manageInputChatPasteEvent = (e) => {
    // Prevent default paste behavior
    e.preventDefault()

    // Get plain text from clipboard
    let text = (e.originalEvent || e).clipboardData.getData('text/plain')

    // Sanitize input by replacing angle brackets with their escaped counterparts
    text = text.replace(/&gt;/g, '>').replace(/&lt;/g, '<')

    // Insert the sanitized plain text into the contenteditable div using innerHTML
    DOM.input.innerText = DOM.input.innerText + text
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
                    DOM.attachment.appendChild(img)
                }
                reader.readAsDataURL(file)
            }
        })
    })
}

const displayDots = () => {
    DOM.plane.style.display = "none"
    DOM.input.removeAttribute('contenteditable')
    DOM.dots.forEach(dot => dot.style.display = "inline-block")
    DOM.input.blur()
}

const displayPlane = () => {
    DOM.dots.forEach(dot => dot.style.display = "none")
    DOM.plane.style.display = "inline-block"
    DOM.input.setAttribute('contenteditable', 'true')
    if (!/(iPhone|iPad|iPod|Android|Windows Phone|BlackBerry)/i.test(navigator.userAgent)) {
        DOM.input.focus()
    }
}

const refreshStats = (computerStats) => {
    DOM.pcModel.textContent = `${computerStats.cpuModel}`
    DOM.threadsCores.textContent = `${computerStats.cpuThreads}T / ${computerStats.cpuCores}C`
    DOM.memory.textContent = `${computerStats.usedMemory} / ${Math.round(computerStats.totalMemory)}GB`
    DOM.cpuPercentage.textContent = `${computerStats.cpuUsage}%`
    DOM.ramPercentage.textContent = `${computerStats.memoryUsage}%`
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
    if (isAlpaca) DOM.input.disabled = true
    let img = document.createElement("div")
    let div = document.createElement("div")
    let pSection = document.createElement("section")
    img.classList.add("mini-logo")
    DOM.upperChat.append(img)
    DOM.upperChat.append(div)
    div.classList.add("chat-box")
    pSection.classList.add("flex-column")

    if (isAlpaca) {
        div.style.backgroundColor = "#444654"
        div.classList.add('alpaca-convo')
        createStopResponseIcon()
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
    if (DOM.attachment.children.length > 0) {
        Array.from(DOM.attachment.children).forEach(img => {
            pSection.appendChild(img)
        })
    }

    //Sets a different padding for the chat boxes based on the window.screen.width
    let chatBoxes = document.querySelectorAll('.chat-box')
    if (DOM.mainspace.offsetWidth <= viewportWidth / 2) {
        resizeChatboxPadding(chatBoxes, "2em 3em 2em 3em")
    } else {
        resizeChatboxPadding(chatBoxes, "2em 10em 2em 10em")
    }

    p.innerHTML = msg

    if (pSection.children.length > 1) {
        p.innerHTML = p.innerHTML + "<br><br>"
    }
}

const createTimeSpentSpan = (tokens, time) => {
    let alpacas = [...document.querySelectorAll('.alpaca-convo')]
    const span = document.createElement("span")
    span.classList.add('time-spent')
    span.textContent = `${DOM.modelInput.value} - token/s: ${tokens} - Time spent: ${time}s`
    alpacas.at(-1).appendChild(span)
}

const createResponseCancelledSpan = () => {
    let alpacas = [...document.querySelectorAll('.alpaca-convo')]
    const span = document.createElement("span")
    span.classList.add('response-cancelled')
    span.textContent = `${DOM.modelInput.value} - Response cancelled`
    alpacas.at(-1).appendChild(span)
}

const createStopResponseIcon = () => {
    const i = document.createElement("i")
    const span = document.createElement("span")
    i.classList.add("fa-regular","fa-circle-stop")
    span.classList.add("options")
    span.appendChild(i)
    DOM.optMenu.appendChild(span)
    i.addEventListener("click", getAbortResponse)
}

const removeStopResponseIcon = () => {
    let options = [...document.querySelectorAll(".options")]
    if(options.length === 4) options[3].remove()
}

const hasChatOverflow = () => {
    let chatBoxes = document.querySelectorAll('.chat-box')
    let totalChatHeight = 0
    chatBoxes.forEach(chat => {
        totalChatHeight += chat.offsetHeight
    })

    if (totalChatHeight > DOM.upperChat.offsetHeight) {
        DOM.upperChat.scrollTo({
            top: DOM.upperChat.scrollHeight,
            behavior: 'instant'
        })
    }
}

const cleanChat = async () => {
    let chatBoxes = document.querySelectorAll('.chat-box')
    chatBoxes.forEach(chat => DOM.upperChat.removeChild(chat))
    await cleanLLMContext()
    showNotification(notifications.clean)
}

const onSnippetClipboardClick = async (codeSnippet) => {
    console.log('at least this shit is working')
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(codeSnippet)
        }
        
        // If you are using local network, this will work
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            const textarea = document.createElement('textarea')
            textarea.value = codeSnippet
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
            showNotification(notifications.clipboard)
        } else {
            showNotification(notifications.clipboard)
        }
    } catch (error) {
        showNotification(error)
    }
}

const showNotification = (msg) => {
    DOM.notification.style.display = "flex"
    DOM.notification.innerHTML = `<i class="fa-solid fa-bell"></i> ${msg}`
    DOM.notification.style.animation = 'fadeAndMove 0.5s forwards ease-in'
    setTimeout(() => {
        DOM.notification.style.animation = 'fadeOut 0.5s forwards ease-in'
    }, 3000)
    setTimeout(() => DOM.notification.style.display = "none", 6000)
}

const hideSidebar = () => DOM.sideMenu.style.display = "none"
const showSidebar = () => DOM.sideMenu.style.display = "flex"

const hideChat = () => DOM.chat.style.display = "none"
const showChat = () => DOM.chat.style.display = "flex"

const showX = () => DOM.burgerMenu.innerHTML = `<i class="fa-solid fa-x"></i>`
const showBurger = () => DOM.burgerMenu.innerHTML = `<i class="fa-solid fa-bars"></i>`

const resizeChatboxPadding = (chatBoxes, padding) => {
    if (chatBoxes.length > 0) chatBoxes.forEach(chatbox => chatbox.style.padding = padding)
}

const handleSidebar = () => {
    if (DOM.burgerMenu.firstChild.className.includes("fa-x")) {
        hideSidebar()
        showBurger()
        if (screen.orientation.type === "portrait-primary") {
            showChat()
        }
    } else {
        showSidebar()
        showX()
        if (screen.orientation.type === "portrait-primary") {
            hideChat()
        }
    }
}

const resizeLayout = () => {
    //always closing sidebar to avoid headaches with the layout tbh
    let chatBoxes = document.querySelectorAll('.chat-box')
    if (viewportWidth > 468) {
        hideSidebar()
        resizeChatboxPadding(chatBoxes, "2em 3em 2em 3em")
        showBurger()
        showChat()
    } else {
        hideSidebar()
        resizeChatboxPadding(chatBoxes, "2em 10em 2em 10em")
        showBurger()
    }
    onModelInputChange()
}

const onModelInputChange = () => {
    if(/(iPhone|iPad|iPod|Android|Windows Phone|BlackBerry)/i.test(navigator.userAgent) && window.matchMedia("(orientation: portrait)").matches
        || (window.innerWidth < 468)) {
        DOM.placeholder.textContent = `Write to ...`
    }else {
        DOM.placeholder.textContent = `Write to ${DOM.modelInput.value}`
    }
}

const hidePlaceholder = () => {  
    DOM.placeholder.remove()
    DOM.input.textContent = DOM.input.textContent.trimEnd()
}

const showPlaceholder = () => {
    if(DOM.input.textContent.length === 0) 
        DOM.input.append(DOM.placeholder)
}

const onUpperChatScroll = () => {
    const chatBoxes = DOM.upperChat.querySelectorAll('.chat-box')
    let totalChatHeight = Array.from(chatBoxes).reduce((total, chat) => total + chat.offsetHeight, 0)

    const scrollPosition = DOM.upperChat.scrollTop + DOM.upperChat.clientHeight
    const isAtBottom = Math.abs(scrollPosition - totalChatHeight) <= 1

    if (isAtBottom) {
        DOM.upperChat.classList.remove("masked");
    } else {
        DOM.upperChat.classList.add("masked");
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
    setWebsocketConnection()
    await getModelList()
}

window.addEventListener('DOMContentLoaded', init)
window.addEventListener('resize', resizeLayout)
document.body.addEventListener('keypress', sendByEnter)
DOM.burgerMenu.addEventListener('click', handleSidebar)
DOM.chat.addEventListener('dragover', (e) => onImgDragover(e))
DOM.chat.addEventListener('dragleave', (e) => onImgDragLeave(e))
DOM.chat.addEventListener('drop', (e) => onImgDrop(e))
DOM.upperChat.addEventListener('scroll', onUpperChatScroll)
DOM.modelInput.addEventListener('change', onModelInputChange)
DOM.plane.addEventListener('click', send)
DOM.optPaperclip.addEventListener('click', attachImg)
DOM.optClean.addEventListener('click', cleanChat)
DOM.optExport.addEventListener('click', getAlpacaJson)
DOM.input.addEventListener('paste', (e) => manageInputChatPasteEvent(e))
DOM.input.addEventListener('focus', hidePlaceholder)
DOM.input.addEventListener('blur', showPlaceholder)

// WSS






