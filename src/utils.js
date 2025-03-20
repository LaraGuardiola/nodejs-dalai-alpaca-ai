import fs from 'fs/promises'
import { exec } from "child_process"
import { spawn } from 'child_process'
import { promisify } from "util"
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
    let now = new Date()

    let day = String(now.getDate()).padStart(2, '0')
    let month = String(now.getMonth() + 1).padStart(2, '0')
    let year = now.getFullYear()

    let hours = String(now.getHours()).padStart(2, '0')
    let minutes = String(now.getMinutes()).padStart(2, '0')

    let dateTimeString = `${day}-${month}-${year} - ${hours}-${minutes}`
    return dateTimeString
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
