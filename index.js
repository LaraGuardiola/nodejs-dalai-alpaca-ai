const express = require('express');
const { alpaca } = require('./alpaca.js');
const os = require('os');
const osu = require('node-os-utils');
const { exportToJson } = require('./exportjson.js');
const { app, BrowserWindow } = require('electron');
const path = require('path');

const server = express()
const cpu = osu.cpu

server.use(express.json())

const createWindow = () => {
  const win = new BrowserWindow({
    show: false,
    icon: path.join(__dirname, 'icon', 'png', '128x128.png')
  })

  win.loadFile('./public/index.html')
  win.setMenu(null)
  win.maximize()
  win.show()
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (!BrowserWindow.getAllWindows().length) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
})

server.listen(3000, () => console.log('listening on port 3000'))

server.post('/alpaca', async (req, res) => {
    const result = await alpaca(req.body)
    res.json({ alpaca: result })
})

server.get('/api/stats', async (req, res) => {
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
    res.json(stats)
})

server.post('/api/json', async (req, res) => {
    try {
        await exportToJson(req.body)
        return res.json(req.body)
    } catch (error) {
        console.log(error)
    }
})
