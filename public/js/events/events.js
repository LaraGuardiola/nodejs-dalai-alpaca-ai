import * as WSS from '../websockets/websockets.js'
import * as API from '../api/requests.js'
import * as UTILS from '../utils/utils.js'
import { DOM, LAYOUT } from '../layout/index.js'

export const init = async () => {
    WSS.setWebsocketConnection()
    WSS.setWebsocketEvents()
    await API.getModelList()
}

export const bindClickSnippetHeaders = (response, snippet, index) => {
    //binding to the clipboard onSnippetClipboardClick
    let clipboards = [...response.querySelectorAll('div .fa-copy')]
    clipboards[index].addEventListener('click', async () => {
        await onSnippetClipboardClick(snippet.innerText)
    })
}

const onSnippetClipboardClick = async (codeSnippet) => {
    console.log('Copied to clipboard')
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

export const onImgDragover = (e) => {
    e.preventDefault()
    e.stopPropagation()
    DOM.chat.classList.add('dragging-over')
}

export const onImgDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    DOM.chat.classList.remove('dragging-over')
}

export const onImgDrop = (e) => {
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

export const onAttachImg = () => {
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

export const onModelInputChange = () => {
    if(/(iPhone|iPad|iPod|Android|Windows Phone|BlackBerry)/i.test(navigator.userAgent) && window.matchMedia("(orientation: portrait)").matches
        || (window.innerWidth < 468)) {
        DOM.placeholder.textContent = `Write to ...`
    }else {
        DOM.placeholder.textContent = `Write to ${DOM.modelInput.value}`
    }
}

export const onUpperChatScroll = () => {
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

export const send = async (event) => {
    console.log(DOM.input.textContent)
    if (DOM.input.textContent) {
        event.preventDefault()
        LAYOUT.createChatbox(DOM.input.innerHTML.replaceAll('<br>', '\n'), false)
        let modelOption = document.querySelector('option:checked').value
        let messageContext = JSON.stringify([DOM.input.textContent, modelOption, UTILS.getImages()])
        API.callLLM(messageContext)
        LAYOUT.cleanInputChat()
    }
}

export const onSendMsgFromKeyboard = async (event) => {
    if (event.key === 'Enter' && event.shiftKey) {
        return
    }else if(event.key === 'Enter') {
        send(event)
    }
}
