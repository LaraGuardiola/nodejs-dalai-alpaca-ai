import * as DOM from './dom.js'
import * as API from '../api/requests.js'
import * as UTILS from '../utils/utils.js'

// LAYOUT
const viewportWidth = window.screen.width
export const cleanInputChat = () => DOM.input.innerHTML = ''

//this lovely snippet comes straight from code from deepseek-coder:33b, does the infernal job of formatting the main input when pasting
export const manageInputChatPasteEvent = (e) => {
    // Prevent default paste behavior
    e.preventDefault()

    // Get plain text from clipboard
    let text = (e.originalEvent || e).clipboardData.getData('text/plain')

    // Sanitize input by replacing angle brackets with their escaped counterparts
    text = text.replace(/&gt;/g, '>').replace(/&lt;/g, '<')

    // Insert the sanitized plain text into the contenteditable div using innerHTML
    DOM.input.innerText = DOM.input.innerText + text
}

export const displayDots = () => {
    DOM.plane.style.display = "none"
    DOM.input.removeAttribute('contenteditable')
    DOM.dots.forEach(dot => dot.style.display = "inline-block")
    DOM.input.blur()
}

export const displayPlane = () => {
    DOM.dots.forEach(dot => dot.style.display = "none")
    DOM.plane.style.display = "inline-block"
    DOM.input.setAttribute('contenteditable', 'true')
    if (!/(iPhone|iPad|iPod|Android|Windows Phone|BlackBerry)/i.test(navigator.userAgent)) {
        DOM.input.focus()
    }
}

export const createChatbox = (msg = '', isAlpaca = true) => {
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

export const createTimeSpentSpan = (tokens, time) => {
    let alpacas = [...document.querySelectorAll('.alpaca-convo')]
    const span = document.createElement("span")
    span.classList.add('time-spent')
    span.textContent = `${DOM.modelInput.value} - token/s: ${tokens} - Time spent: ${time}s`
    alpacas.at(-1).appendChild(span)
}

export const createResponseCancelledSpan = () => {
    let alpacas = [...document.querySelectorAll('.alpaca-convo')]
    const span = document.createElement("span")
    span.classList.add('response-cancelled')
    span.textContent = `${DOM.modelInput.value} - Response cancelled`
    alpacas.at(-1).appendChild(span)
}

export const createStopResponseIcon = () => {
    const i = document.createElement("i")
    const span = document.createElement("span")
    i.classList.add("fa-regular","fa-circle-stop")
    span.classList.add("options")
    span.appendChild(i)
    DOM.optMenu.appendChild(span)
    i.addEventListener("click", API.getAbortResponse)
}

export const removeStopResponseIcon = () => {
    let options = [...document.querySelectorAll(".options")]
    if(options.length === 4) options[3].remove()
}

export const hasChatOverflow = () => {
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

export const cleanChat = async () => {
    let chatBoxes = document.querySelectorAll('.chat-box')
    chatBoxes.forEach(chat => DOM.upperChat.removeChild(chat))
    await API.cleanLLMContext()
    showNotification(UTILS.notifications.clean)
}

export const onSnippetClipboardClick = async (codeSnippet) => {
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
            showNotification(UTILS.notifications.clipboard)
        } else {
            showNotification(UTILS.notifications.clipboard)
        }
    } catch (error) {
        showNotification(error)
    }
}

export const showNotification = (msg) => {
    DOM.notification.style.display = "flex"
    DOM.notification.innerHTML = `<i class="fa-solid fa-bell"></i> ${msg}`
    DOM.notification.style.animation = 'fadeAndMove 0.5s forwards ease-in'
    setTimeout(() => {
        DOM.notification.style.animation = 'fadeOut 0.5s forwards ease-in'
    }, 3000)
    setTimeout(() => DOM.notification.style.display = "none", 6000)
}

export const hideSidebar = () => DOM.sideMenu.style.display = "none"
export const showSidebar = () => DOM.sideMenu.style.display = "flex"

export const hideChat = () => DOM.chat.style.display = "none"
export const showChat = () => DOM.chat.style.display = "flex"

export const showX = () => DOM.burgerMenu.innerHTML = `<i class="fa-solid fa-x"></i>`
export const showBurger = () => DOM.burgerMenu.innerHTML = `<i class="fa-solid fa-bars"></i>`

export const resizeChatboxPadding = (chatBoxes, padding) => {
    if (chatBoxes.length > 0) chatBoxes.forEach(chatbox => chatbox.style.padding = padding)
}

export const handleSidebar = () => {
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

export const resizeLayout = () => {
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

export const onModelInputChange = () => {
    if(/(iPhone|iPad|iPod|Android|Windows Phone|BlackBerry)/i.test(navigator.userAgent) && window.matchMedia("(orientation: portrait)").matches
        || (window.innerWidth < 468)) {
        DOM.placeholder.textContent = `Write to ...`
    }else {
        DOM.placeholder.textContent = `Write to ${DOM.modelInput.value}`
    }
}

export const hidePlaceholder = () => {  
    DOM.placeholder.remove()
    DOM.input.textContent = DOM.input.textContent.trimEnd()
}

export const showPlaceholder = () => {
    if(DOM.input.textContent.length === 0) 
        DOM.input.append(DOM.placeholder)
}
