const fs = require('fs')

async function readIcon (file, directory) {
	return await fs.promises.readFile(`${directory}/${file}`)
}
function getIcon (icon) {
	const name = icon.match(/\w*\s/)[0].trim()
	const attribs = icon.match(/\w*=".[^"]*"/g).reduce((attrs, item) => {
		const [key, value] = item.split('=')
		attrs[key] = key === 'fill' && value.indexOf('#') > -1 ? 'currentColor' : value.replace(/"/g, '')
		return attrs
	}, {})
	return { name, attribs, children: []}
}
function parseIconEntity (tagChildrens, file) {
	const slicedChildrens = tagChildrens.match(/<\w*[^<]*/g)
	const { item } = slicedChildrens.reduce((acc, child, index) => {
		if (child.indexOf('</') === 0) {

			acc.path.pop()
			return acc
		}
		const parsedIcon = getIcon(child)
		if (acc.path.length > 0) {
			acc.path.reduce((path, i) => {
				path = path[i].children
				return path
			}, acc.item).push(parsedIcon)
		} else {
			acc.item.push(parsedIcon)
		}
		if (!(child.indexOf('/>') > 0)) {
			acc.path.push(index)
		}
		return acc
	}, { item: [], path: []})
	return item
}

const normalizedFileName = (fileName) => fileName.match(/[^\d+]*[a-z]/)[0]

function parseIcon (icon, file) {

	const stringifyIcon = icon.toString('ascii')
	const endOfSvgTag = stringifyIcon.indexOf(`>`)
	const endOfIcon = stringifyIcon.indexOf('</svg>')
	const startOfViewBox = icon.indexOf(`viewBox`)
	const children = parseIconEntity(stringifyIcon.slice(endOfSvgTag + 1, endOfIcon), file)
	const viewBox = icon.slice(startOfViewBox, endOfSvgTag).toString('ascii').match(/".*"/)[0]
	return { children, viewBox }
}

async function readFiles(dirname) {
	const filenames = await fs.promises.readdir(dirname)
		filenames.forEach(async function(filename) {
			try {
				const stats = await fs.statSync(`${dirname}/${filename}`)
				if (stats.isDirectory()) {
					const directory = `${dirname}/${filename}/svg/production`
					const icons = await fs.promises.readdir(directory)
					icons.reduce((acc, item) => {
						if (acc.findIndex((storedItem) => normalizedFileName(storedItem) === normalizedFileName(item)) === -1) acc.push(item)
						return acc
					}, [])
						.forEach(async (file) => {
						const icon = await readIcon(file, directory)
						const { children, viewBox } = parseIcon(icon, file)
						const normalizedFileName = file.match(/[^\d+]*[a-z]/)[0]
						if (!fs.existsSync('icons')) {
							fs.mkdirSync('icons')
						}

						await fs.promises.writeFile(`icons/${normalizedFileName}.js`, `export const ${normalizedFileName} = { "viewBox": ${viewBox}, "children": ${JSON.stringify(children)} };`)
					})
					// icons.forEach(async (file) => {
					// 	const readedIcon = await fs.promises.readFile(`${dirname}/${filename}/svg/production/${file}`)
					// 	const startOfViewBox = readedIcon.indexOf(`viewBox`)
					// 	const endOfSvgTag = readedIcon.indexOf(`>`)
					// 	const endOfIcon = readedIcon.indexOf('</svg>')
					// 	const children = readedIcon.slice(endOfSvgTag + 1, endOfIcon)
					// 		.toString('ascii')
					// 		.split('/>')
					// 		.reduce((acc, tag) => {
					// 			if (tag.length === 0) return acc
					// 			const name = tag.match(/\w*\s/)[0].trim()
					// 			const attribs = tag.match(/\w*=".[^"]*"/g).reduce((attrs, item) => {
					// 				const [key, value] = item.split('=')
					// 				attrs[key] = key === 'fill' && key.indexOf('#') > -1 ? 'currentColor' : value.replace(/"/g, '')
					// 				return attrs
					// 			}, {})
					// 			acc.push({ name, attribs })
					// 			return acc
					// 		}, [])
					// 	const viewBox = readedIcon.slice(startOfViewBox, endOfSvgTag).toString('ascii').match(/".*"/)[0]
					// })
				}
			} catch (e) {
				console.log(e, filename)
			}
		});
}

readFiles('mdi')
