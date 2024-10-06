// UTILS
export const notifications = {
    clipboard: "Snippet has been copied",
    json: "Created json on the repository",
    clean: "Successfully cleaned the chat",
    chat_is_empty: "The chat is empty"
}

export const getConvo = () => {
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

export const getImages = () => {
    let lastUserConvo = document.querySelectorAll('.user-convo')
    let imagesDom = Array.from(lastUserConvo).at(-1).querySelectorAll('.flex-column img')
    let images = []
    imagesDom.forEach(img => {
        images.push(img.src.split(',')[1])
    })
    return images
}
