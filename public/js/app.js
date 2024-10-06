import { DOM, FORMAT, LAYOUT } from './layout/index.js'
import * as API from './api/requests.js'
import * as EVENTS from './events/events.js'

// EVENTS - lifecycle
window.addEventListener('DOMContentLoaded', EVENTS.init)
window.addEventListener('resize', LAYOUT.resizeLayout)
document.body.addEventListener('keypress', EVENTS.onSendMsgFromKeyboard)
DOM.burgerMenu.addEventListener('click', LAYOUT.handleSidebar)
DOM.chat.addEventListener('dragover', (e) => EVENTS.onImgDragover(e))
DOM.chat.addEventListener('dragleave', (e) => EVENTS.onImgDragLeave(e))
DOM.chat.addEventListener('drop', (e) => EVENTS.onImgDrop(e))
DOM.upperChat.addEventListener('scroll', EVENTS.onUpperChatScroll)
DOM.modelInput.addEventListener('change', EVENTS.onModelInputChange)
DOM.plane.addEventListener('click', EVENTS.send)
DOM.optPaperclip.addEventListener('click', EVENTS.onAttachImg)
DOM.optClean.addEventListener('click', LAYOUT.cleanChat)
DOM.optExport.addEventListener('click', API.getAlpacaJson)
DOM.input.addEventListener('paste', (e) => FORMAT.formatInputChatPasteEvent(e))
DOM.input.addEventListener('focus', LAYOUT.hidePlaceholder)
DOM.input.addEventListener('blur', LAYOUT.showPlaceholder)
