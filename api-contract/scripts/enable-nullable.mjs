import { readdir, readFile, writeFile } from 'node:fs/promises'

const root = new URL('../../src/Calendar.Api/Generated/OpenApi/src/Calendar.Api.Generated/', import.meta.url)

async function enableNullable(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = new URL(entry.name, directory)
    if (entry.isDirectory()) {
      await enableNullable(new URL(`${entry.name}/`, directory))
    } else if (entry.name.endsWith('.cs')) {
      const source = await readFile(file, 'utf8')
      const normalized = source.replace(/[ \t]+(?=\r?\n|$)/g, '')
      await writeFile(file, normalized.startsWith('#nullable enable') ? normalized : `#nullable enable\n${normalized}`)
    }
  }
}

await enableNullable(root)
