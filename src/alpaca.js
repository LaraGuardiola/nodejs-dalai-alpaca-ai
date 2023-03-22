import Dalai from "dalai";

const dalai = new Dalai()

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