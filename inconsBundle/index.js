const fs = require('fs')
const svgson = require('svgson')
async function readIcon (file, directory) {
	return await fs.promises.readFile(`${directory}/${file}`)
}

const normalizedFileName = (fileName) => fileName.match(/[^\d+]*[a-z]/)[0]

async function readFiles(dirname) {
	const filenames = await fs.promises.readdir(dirname)
		filenames.forEach(async function(filename) {
			try {
				const stats = await fs.statSync(`${dirname}/${filename}`)
				if (stats.isDirectory()) {
					const directory = `${dirname}/${filename}/svg/production`
					const icons = await fs.promises.readdir(directory)
					icons.reduce((acc, item) => {
						if (acc.findIndex((storedItem) => normalizedFileName(storedItem) === normalizedFileName(item)) === -1) acc.push(item) // удаляем из списка файлов иконки с одинаковым называнием, но с разным разрешением\
						return acc
					}, [])
						.forEach(async (file) => {
						const icon = await readIcon(file, directory)
            const { attributes: {viewBox}, children } = await svgson.parse(icon.toString('ascii'))
						const normalizedFileName = file.match(/(.*)\.svg$/)[1].replace(/[^A-z]/gi, '')
						if (!fs.existsSync(dirname)) {
							fs.mkdirSync(dirname)
						}
						if (!fs.existsSync(`${dirname}/parsedIcons`)) fs.mkdirSync(`${dirname}/parsedIcons`)
						await fs.promises.writeFile(`${dirname}/parsedIcons/${normalizedFileName}.js`, `export const ${normalizedFileName} = { "viewBox": "${viewBox}", "children": ${JSON.stringify(children)} };`.replace(/attributes/gi, 'attribs'))
					})
				}
			} catch (e) {
				console.log(e, filename)
			}
		});
}

// readFiles('mdi')
readFiles('lion')
// readFiles('lion')
