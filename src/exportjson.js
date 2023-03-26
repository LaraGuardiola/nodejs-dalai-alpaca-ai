import fs from 'fs/promises';

export const exportToJson = async (queries) => {
    await fs.writeFile('alpaca-queries.json', JSON.stringify(queries), (error) => {
        if (error) throw error
    })
}
