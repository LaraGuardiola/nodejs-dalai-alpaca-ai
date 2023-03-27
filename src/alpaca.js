import Dalai from "dalai";

//Checks if a custom path has been specified in the start script
process.env.dalaiPath = process.argv[2] ?? ''

export const dalai = new Dalai(process.env.dalaiPath)

const dalaiModels = await dalai.installed()

if(!dalaiModels.length){
    await dalai.install("alpaca", "7B")
}

export const alpaca = async (config) => {
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
