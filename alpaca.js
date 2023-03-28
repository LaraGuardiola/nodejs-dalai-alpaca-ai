const Dalai = require('dalai');

//Checks if a custom path has been specified in the start script
process.env.dalaiPath = process.argv[2] ?? ''

const dalai = new Dalai()


let dalaiModels
(async() => {
    dalaiModels = await dalai.installed();
})

(async() => {
    if(!dalaiModels.length){
        await dalai.install("alpaca", "7B")
    }
})

const alpaca = async (config) => {
    let result = ""
    try {
        await dalai.request(config, (token) => {
            process.stdout.write(token)
            result += token
        })
        return result
    } catch (error) {
        console.error(error)
    }
}

module.exports = { dalai, alpaca };