import fs from 'fs/promises';
import os from 'os'
import osu from 'node-os-utils'
import { exec } from "child_process"
import { promisify } from "util"
import { cpuUsage } from 'os-utils';

export const exportToJson = async (queries) => {
    await fs.writeFile('alpaca-queries.json', JSON.stringify(queries), (error) => {
        if (error) throw error
    })
}

export const getStats = async () => {
    const cpu = osu.cpu
    // RAM stats
    const [totalMem, freeMem] = [os.totalmem(), os.freemem()]
    const usedMem = totalMem - freeMem
    const usedMemPercentage = usedMem / totalMem * 100

    //CPU stats
    const [cpuUsage, cpuModel, cpuThreads] = await Promise.all([cpu.usage(), cpu.model(), cpu.count()])

    const stats = {
        memoryUsage: `${usedMemPercentage.toFixed(2)}`,
        totalMemory: `${(totalMem / 1073741824).toFixed(2)}`,
        usedMemory: `${(usedMem / 1073741824).toFixed(2)}`,
        cpuUsage: `${cpuUsage}`,
        cpuModel: `${cpuModel}`,
        cpuThreads: `${cpuThreads}`,
        cpuCores: `${cpuThreads / 2}`,
    }

    return stats
}

function displayCPUUsage() {
    setInterval(() => {
        cpuUsage(v => 
            console.log("CPU Usage (%): " + (v*1000).toFixed(2))
        );
    }, 1000); //Every second.
}

// displayCPUUsage();

export const getModels = async () => {
    const execAsync =  promisify(exec)
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

        models = arrModels.map(model => model.split(' ')[0])
        return models
    } catch (error) {
        console.log(error)
    }
}
