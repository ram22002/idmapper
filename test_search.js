import fs from 'fs';
import path from 'path';

async function test() {
    console.log('Reading file...');
    const localPath = path.join(process.cwd(), 'public', 'master_anime.json');
    const data = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
    console.log(`Loaded ${data.length} entries.`);

    const searchIdKey = 'anilist_id';
    const searchIdValue = 21; // One Piece

    console.log(`Searching for ${searchIdKey}: ${searchIdValue}`);

    const result = data.find(item => {
        const val = item[searchIdKey];
        if (Array.isArray(val)) {
            return val.some(v => v == searchIdValue);
        }
        return val == searchIdValue;
    });

    if (result) {
        console.log('✅ FOUND!');
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.log('❌ NOT FOUND');
    }
}

test();
