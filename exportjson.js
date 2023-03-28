const fs = require('fs').promises;

const exportToJson = async (queries) => {
    await fs.writeFile('alpaca-queries.json', JSON.stringify(queries), (error) => {
        if (error) throw error
    })
}

module.exports = { exportToJson };