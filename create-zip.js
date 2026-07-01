import packageInfo from './package.json' with { type: 'json' };
import AdmZip from 'adm-zip'
import fs from 'node:fs'
const zip = new AdmZip();

zip.addLocalFolder('./back/dist', 'back')
zip.addLocalFolder('./front/dist', 'front')

fs.mkdirSync('./dist', { recursive: true });

zip.writeZip(`./dist/cards_against_humanity-${packageInfo.version}.zip`);
