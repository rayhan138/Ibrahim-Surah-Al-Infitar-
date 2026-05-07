const fs = require('fs');
const https = require('https');

// Helper to remove harakat and normalize arabic letters
function normalizeArabic(text) {
    return text
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06DF\u06E0]/g, '') // remove harakat
        .replace(/[إأآٱ]/g, 'ا') // normalize alef
        .replace(/ة/g, 'ه')
        .replace(/ي/g, 'ى')
        .replace(/ /g, '');
}

async function fetchVerseWords(chapter) {
    return new Promise((resolve) => {
        https.get(`https://api.quran.com/api/v4/verses/by_chapter/${chapter}?words=true&word_fields=code_v2,text_qpc_hafs&per_page=50`, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                resolve(json.verses);
            });
        });
    });
}

function extractOldData() {
    const html = fs.readFileSync('old_index.html', 'utf16le');
    const start = html.indexOf('const surahData = {');
    const end = html.indexOf('const subtitle = document.getElementById');
    const dataStr = html.substring(start + 18, end).trim().replace(/;$/, '');
    return eval(`(${dataStr})`); // Yes it's dirty but it's local scratch script
}

async function fix() {
    console.log("Extracting old data...");
    const oldData = extractOldData();
    
    console.log("Fetching Takweer...");
    const takweerVerses = await fetchVerseWords(81);
    console.log("Fetching Infitar...");
    const infitarVerses = await fetchVerseWords(82);
    
    const apiData = {
        takweer: takweerVerses,
        infitar: infitarVerses
    };

    // We will build a new surahData object where the verse Arabic is the code_v2,
    // and the word list uses the correct code_v2 by matching the old Arabic text.
    
    for (const surahKey of ['takweer', 'infitar']) {
        for (let i = 0; i < oldData[surahKey].verses.length; i++) {
            const v = oldData[surahKey].verses[i];
            
            // Verse arabic string (join all code_v2)
            // Wait, v.number could be an array like [8, 9]
            let verseCodeV2 = [];
            let allApiWords = [];
            
            const verseNumbers = Array.isArray(v.number) ? v.number : [v.number];
            
            for (const num of verseNumbers) {
                const apiV = apiData[surahKey][num - 1];
                if (apiV) {
                    verseCodeV2.push(apiV.words.map(w => w.code_v2).join(' '));
                    allApiWords.push(...apiV.words);
                }
            }
            
            v.arabic = verseCodeV2.join(' '); // full verse text
            
            // Fix word by word
            if (v.words) {
                for (const w of v.words) {
                    const originalAr = w.arabic;
                    const normOriginal = normalizeArabic(originalAr);
                    
                    // Find matching API word
                    let bestMatch = null;
                    for (const aw of allApiWords) {
                        if (aw.char_type_name === 'end') continue;
                        
                        const normApi = normalizeArabic(aw.text_qpc_hafs || aw.text_uthmani || '');
                        if (normOriginal.includes(normApi) || normApi.includes(normOriginal) || normApi === normOriginal) {
                            bestMatch = aw.code_v2;
                            // Blank it out so we don't match it again
                            aw.text_qpc_hafs = "MATCHED"; 
                            break;
                        }
                    }
                    
                    if (bestMatch) {
                        w.arabic = bestMatch;
                    } else {
                        // fallback if no match (shouldn't happen)
                        console.log(`Failed to match: ${originalAr} in verse ${v.number}`);
                        // Just keep original as a fallback
                    }
                }
            }
        }
    }
    
    const newDataStr = `const surahData = ${JSON.stringify(oldData, null, 4)};`;
    fs.writeFileSync('data/surahData.js', newDataStr);
    console.log("Fixed surahData.js");
}

fix();
