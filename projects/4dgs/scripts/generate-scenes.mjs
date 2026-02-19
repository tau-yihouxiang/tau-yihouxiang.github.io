import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd(), 'projects/4dgs');
const publicRoot = path.join(projectRoot, 'public');
const outputPath = path.join(projectRoot, 'api', 'scenes.json');

function sortByNumericName(a, b) {
  const nameA = a.name || '';
  const nameB = b.name || '';
  const numA = Number.parseInt(nameA.match(/(\d+)/)?.[1] ?? '', 10);
  const numB = Number.parseInt(nameB.match(/(\d+)/)?.[1] ?? '', 10);

  const hasNumA = Number.isFinite(numA);
  const hasNumB = Number.isFinite(numB);
  if (hasNumA && hasNumB && numA !== numB) return numA - numB;
  return nameA.localeCompare(nameB, 'zh-Hans-CN', { numeric: true });
}

async function main() {
  const entries = await fs.readdir(publicRoot, { withFileTypes: true });
  const scenes = {};

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const sceneName = entry.name;
    const sceneDir = path.join(publicRoot, sceneName);
    const files = await fs.readdir(sceneDir, { withFileTypes: true });

    const sogFiles = files
      .filter(file => file.isFile() && file.name.toLowerCase().endsWith('.sog'))
      .sort(sortByNumericName)
      .map(file => `public/${sceneName}/${file.name}`);

    scenes[sceneName] = sogFiles;
  }

  const payload = {
    scenes,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Generated ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});