import Dalai from "dalai";

const dalai = new Dalai()

export const alpaca = async (prompt) => {
    let result = ""
    try {
        await dalai.request({
            model: "alpaca.13B",
            prompt: prompt,
            temp: "0.9",
            n_predict: 100
        }, (token) => {
            process.stdout.write(token)
            result += token
        })
        return result
    } catch (error) {
        console.error(error)
    }
}