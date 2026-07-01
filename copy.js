import { configDotenv } from 'dotenv';
import { cp } from 'node:fs/promises';
import path from 'node:path';
configDotenv()

const gamesModulesPath = process.env.GAMES_MODULES_PATH

async function copyFolder(source, destination) {
    try {
        await cp(source, destination, { recursive: true });
        console.log('Folder copied successfully!');
    } catch (err) {
        console.error('Error copying folder:', err);
    }
}

if (!gamesModulesPath) {
    console.log('\x1b[31m%s\x1b[0m', 'Set GAMES_MODULES_PATH variable')
} else {

    const cahFolderName = 'cards_against_humanity'

    if (process.argv.includes('-back')) {
        copyFolder('./back/dist', path.join(gamesModulesPath, cahFolderName, 'back'))
    }
    if (process.argv.includes('-front')) {
        copyFolder('./front/dist', path.join(gamesModulesPath, cahFolderName, 'front'))
    }
}