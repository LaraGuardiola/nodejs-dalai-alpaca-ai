import * as EVENTS from '../events/events.js'
import { hljs } from '../libraries/highlight.js';

export const formatAfterResponse = (alpacaConvo) => {
    formatBlackquotes(alpacaConvo)
    createHeaderTags(alpacaConvo)

    let LLMResponse = [...document.querySelectorAll('.alpaca-convo')].at(-1)
    let LLMResponseP = LLMResponse.querySelector('p')
    let code = [...LLMResponseP.querySelectorAll('pre code')]
    let codeHeaders = [...LLMResponseP.querySelectorAll('.snippet-header')]

    code.forEach(async (snippet, index) => {
        createSnippetHeaders(codeHeaders, snippet, index)
        EVENTS.bindClickSnippetHeaders(LLMResponseP, snippet, index)
    })
}

export const formatLLMResponse = (msg, alpacaConvo) => {
    // converts special characters so it doesn't break HTML snippets
    msg = formatHTMLSnippetSpecialCharacter(msg)
    //checks if the innerHTML of the response includes ``` in order to envelop it with <pre><code>
    formatCodeSnippets(alpacaConvo)
    formatBoldText(alpacaConvo)
    alpacaConvo.innerHTML += msg
}

export const formatHTMLSnippetSpecialCharacter = (msg) => {
    if (msg.includes('<')) {
        let arr = msg.split('')
        let idx = arr.indexOf('<')
        arr[idx] = '&lt;'
        msg = arr.join('')
        return msg
    }
    return msg
}

export const formatCodeSnippets = (alpacaConvo) => {
    //envelops the snippet inside <pre><code>
    let replacedStr = alpacaConvo.innerHTML.replace(/```(.*?)```/gs, '<br><div class="snippet-header"></div><pre><code>$1</code></pre>')
    alpacaConvo.innerHTML = replacedStr
    hljs.highlightAll()
}

export const formatBoldText = (alpacaConvo) => {
    let replacedStr = alpacaConvo.innerHTML.replace(/\*\*(.*?)\*\*/gs, '<b>$1</b>')
    alpacaConvo.innerHTML = replacedStr
}

export const formatBlackquotes = (alpacaConvo) => {
    //envelops the snippet inside <pre><code>
    let replacedStr = alpacaConvo.innerHTML.replace(/`(.*?)`/gs, '<span class="blackquote">$1</span>')
    alpacaConvo.innerHTML = replacedStr
}


export const createSnippetHeaders = (codeHeaders, snippet, index) => {
    let lang
    let lines = snippet?.innerHTML.split('\n')
    lang = lines.shift()
    snippet.innerHTML = lines.join('\n')
    codeHeaders[index].innerHTML = `<p>${lang}</p><i class="fa-solid fa-copy"></i>`
}

export const createHeaderTags = (alpacaConvo) => {
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

//this lovely snippet comes straight from code from deepseek-coder:33b, does the infernal job of formatting the main input when pasting
export const formatInputChatPasteEvent = (e) => {
    // Prevent default paste behavior
    e.preventDefault()

    // Get plain text from clipboard
    let text = (e.originalEvent || e).clipboardData.getData('text/plain')

    // Sanitize input by replacing angle brackets with their escaped counterparts
    text = text.replace(/&gt;/g, '>').replace(/&lt;/g, '<')

    // Insert the sanitized plain text into the contenteditable div using innerHTML
    DOM.input.innerText = DOM.input.innerText + text
}
