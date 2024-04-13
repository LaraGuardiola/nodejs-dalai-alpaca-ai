import fs from 'fs/promises'
import os from 'os'
import osu from 'node-os-utils'
import { exec } from "child_process"
import { spawn } from 'child_process'
import { promisify } from "util"
import { cpuUsage } from 'os-utils'
import requestIp from 'request-ip'
import path from 'path'
import { fileURLToPath } from 'url'

//this joke of variable is due to ES6 imports still being a lil shit
const __dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const execAsync =  promisify(exec)
let zrokDomain = ''

export const exportToJson = async (queries) => {
    
    let date = getDate()
    console.log(date)
    await fs.writeFile(`./record/${date}.json`, JSON.stringify(queries), (error) => {
        if (error) throw error
    })
}

const getDate = () => {
    let now = new Date()  // Get the current date and time

    // Get day, month and year in separate variables
    let day = String(now.getDate()).padStart(2, '0')
    let month = String(now.getMonth() + 1).padStart(2, '0') // Note: getMonth() is zero-based
    let year = now.getFullYear()
    
    // Get hour and minute in separate variables
    let hours = String(now.getHours()).padStart(2, '0')
    let minutes = String(now.getMinutes()).padStart(2, '0')
    
    // Combine the parts into a single string
    let dateTimeString = `${day}-${month}-${year} - ${hours}-${minutes}`
    return dateTimeString
}

export const getStats = async (ws) => {
    setInterval(() => {
        cpuUsage(async (v) => {
            const cpu = osu.cpu
            // RAM stats
            const [totalMem, freeMem] = [os.totalmem(), os.freemem()]
            const usedMem = totalMem - freeMem
            const usedMemPercentage = usedMem / totalMem * 100

            //CPU stats
            const [cpuUsage, cpuModel, cpuThreads] = await Promise.all([cpu.usage(), cpu.model(), cpu.count()])
            let CPU = (v*1000).toFixed(2)

            const stats = {
                memoryUsage: `${usedMemPercentage.toFixed(2)}`,
                totalMemory: `${(totalMem / 1073741824).toFixed(2)}`,
                usedMemory: `${(usedMem / 1073741824).toFixed(2)}`,
                cpuUsage: `${CPU}`,
                cpuModel: `${cpuModel}`,
                cpuThreads: `${cpuThreads}`,
                cpuCores: `${cpuThreads / 2}`,
            }
            // console.log(stats)
            ws.send(JSON.stringify({ 'stats': stats }))
            // return stats
        })
    },1000)
}

export const getModels = async () => {
    let models = []
    const ollamaModelListCommand = `ollama list`

    try {
        const { stdout, stderr } = await execAsync(ollamaModelListCommand)

        if (stderr) {
            console.error(`Some error occurred while retrieving information: ${stderr}`)
        }

        //cleaning out console output so I return a decent array with the models
        let arrModels = stdout.split('\n')
        arrModels.splice(0,1)
        arrModels.splice(-1,1)

        models = arrModels
            .map(model => model.split(' ')[0])
            .map(model => {
                console.log(model)
                if (model.includes(':latest')){
                    return model.split(':latest')[0]
                }
                return model
            })
        return models
    } catch (error) {
        console.log(error)
    }
}

//unused - not happy with the result. Sometimes is extremely creepy
export const TTS = async (response) => {
    const ttsCommand = `tts --text "${response}" --out_path ./public/tts/speech2.wav`

    try {
        const { stdout, stderr } = await execAsync(ttsCommand)

        if (stderr) {
            console.error(`Something went wrong: ${stderr}`)
        }

        console.log(stdout)
        return true

    } catch (error) {
        console.log(error)
        return false
    }
}

//useless because of the tunnel zrok sets but I wanted to see how it looks
export const getIp = (req, res, next) => {
    let clientIp = requestIp.getClientIp(req)
    console.log(clientIp)
    next()
}

export const createZrokPublicDomain = () => {
    const zrokPath = path.join(__dirname, 'zrok.exe')
    const zrokProcess = spawn(zrokPath, ['share', 'public', 'http://localhost:3000'], {
        stdio: 'pipe' // Use pipe to capture output
    })

    let output = ''

    // Listen for data events on stdout
    zrokProcess.stdout.on('data', (data) => {
        output += data.toString() // Append data to output string
        zrokDomain = extractAndLogUrls(output) // Extract and log URL
        return zrokDomain
    })

    zrokProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`)
    })

    zrokProcess.on('close', (code) => {
        console.log(`zrok process exited with code ${code}`)
    })
}

// Function to extract and log URL from text
const extractAndLogUrls = (text) => {
    const urlRegex = /│(https?:\/\/\S+?)│/g
    let match
    while ((match = urlRegex.exec(text)) !== null) {
        console.log(match[1])
        zrokDomain = match[1]
    }
    return zrokDomain
}
