const fs = require('fs');

const transcriptPath = 'C:\\Users\\GHOST-PC\\.gemini\\antigravity\\brain\\48826f63-46bb-4fdc-b5e8-a36ed82e4a1b\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

let fullLog = '';
for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.type === 'USER_INPUT' && obj.content && obj.content.includes('DEPARTMENT OF TRAUMATOLOGY')) {
            fullLog = obj.content;
            break;
        }
    } catch(e) {}
}

if (!fullLog) {
    console.log('Log not found in transcript');
    process.exit(1);
}

// Extract just the text from the <USER_REQUEST> wrapper
const match = fullLog.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
const text = match ? match[1] : fullLog;

// Parser Logic
const parseDocumentTests = (text) => {
    const tests = [];
    
    // 1. Aggressively break options stuck together (PDF-to-Word artifacts like "deficiency:A. Hyper" or "flexionB. Knee")
    // Looks for: (lowercase/number/punctuation) + (optional space) + (A-E or 1-9 marker) + (optional space) + (Uppercase or Number)
    let processedText = text.replace(/([a-zа-я0-9\?\!\%\:\;\,\.\>\]\)])\s*([A-Ea-eА-Еа-еСс]\s*[\.\)]\s*[A-ZА-Я0-9])/g, '$1\n$2');
    processedText = processedText.replace(/([a-zа-я0-9\?\!\%\:\;\,\.\>\]\)])\s*([1-9]\s*[\.\)]\s*[A-ZА-Я0-9])/g, '$1\n$2');
    
    // 2. Also keep the whitespace-based breaker for options separated by tabs or 2+ spaces
    processedText = processedText.replace(/(?:\t|\s{2,})([a-zA-Zа-яА-Я\d]\s*[\.\)\-\:\/\]]\s)/g, '\n$1');
    
    const parseLines = processedText.split('\n').map(l => l.trim());
    
    let ct = { question: "", options: [], correctAnswerIndex: -1, complexAnswerStr: null, inlineCorrectNumbers: [], allInlineNumbers: [] };
    let pushed = false;
    
    const flushTest = () => {
        if (ct.inlineCorrectNumbers.length > 0) {
            const uniqueCorrectNumbers = [...new Set(ct.inlineCorrectNumbers)].sort((a,b) => parseInt(a)-parseInt(b));
            const correctCombo = uniqueCorrectNumbers.join(", ");
            const distractors = new Set();
            distractors.add(correctCombo);
            let attempts = 0;
            while(distractors.size < 4 && attempts < 100) {
                const shuffledNumbers = [...new Set(ct.allInlineNumbers)].sort(() => 0.5 - Math.random());
                const randomCombo = shuffledNumbers.slice(0, uniqueCorrectNumbers.length).sort((a,b) => parseInt(a)-parseInt(b)).join(", ");
                distractors.add(randomCombo);
                attempts++;
            }
            while(distractors.size < 4) { distractors.add(correctCombo + " (" + distractors.size + ")"); }
            const optionsArray = Array.from(distractors).sort(() => 0.5 - Math.random());
            tests.push({ question: ct.question, options: optionsArray, answer: optionsArray.indexOf(correctCombo), topic: "Tayyor Test Baza" });
            pushed = true;
        } else if (ct.complexAnswerStr) {
            const distractors = new Set();
            distractors.add(ct.complexAnswerStr);
            let attempts = 0;
            while(distractors.size < 4 && attempts < 100) {
                let shuf = ct.complexAnswerStr;
                if (ct.complexAnswerStr.match(/\d+[а-яa-z]/i)) {
                    const letters = ct.complexAnswerStr.match(/[а-яa-z]/gi) || [];
                    if (letters.length > 1) {
                        const shuffledLetters = [...letters].sort(() => 0.5 - Math.random());
                        let j = 0;
                        shuf = ct.complexAnswerStr.replace(/[а-яa-z]/gi, () => shuffledLetters[j++]);
                    }
                } else {
                    const digits = ct.complexAnswerStr.match(/\d/g) || [];
                    if (digits.length > 1) {
                        const shuffledDigits = [...digits].sort(() => 0.5 - Math.random());
                        let j = 0;
                        shuf = ct.complexAnswerStr.replace(/\d/g, () => shuffledDigits[j++]);
                    }
                }
                if (shuf !== ct.complexAnswerStr) distractors.add(shuf);
                attempts++;
            }
            while(distractors.size < 4) { distractors.add(ct.complexAnswerStr + " (" + distractors.size + ")"); }
            const optionsArray = Array.from(distractors).sort(() => 0.5 - Math.random());
            tests.push({ question: ct.question, options: optionsArray, answer: optionsArray.indexOf(ct.complexAnswerStr), topic: "Tayyor Test Baza" });
            pushed = true;
        } else if (ct.options.length >= 2) {
            if (ct.correctAnswerIndex === -1) ct.correctAnswerIndex = 0;
            const correctOptionText = ct.options[ct.correctAnswerIndex];
            const shuffledOptions = [...ct.options].sort(() => 0.5 - Math.random());
            tests.push({ question: ct.question, options: shuffledOptions, answer: shuffledOptions.indexOf(correctOptionText), topic: "Tayyor Test Baza" });
            pushed = true;
        }
        
        if (pushed) {
            ct = { question: "", options: [], correctAnswerIndex: -1, complexAnswerStr: null, inlineCorrectNumbers: [], allInlineNumbers: [] };
            pushed = false;
        }
    };
    
    for (let i = 0; i < parseLines.length; i++) {
        let line = parseLines[i];
        
        if (line === "") {
            if (ct.options.length >= 2 || ct.allInlineNumbers.length >= 2) {
                flushTest();
            }
            continue;
        }
        
        const ansLineMatch = line.match(/^(?:javob|otvet|answer|жавоб|тўғри жавоб)[^\wа-я]*(.*)$/i);
        if (ansLineMatch) {
            let ansContent = ansLineMatch[1].trim().replace(/[\.;]+$/, '').trim();
            if (ansContent.length === 1 && ansContent.match(/^[A-Ea-eА-Еа-еСс]$/)) {
                let idx = -1;
                const c = ansContent.toLowerCase();
                if (c === 'a' || c === 'а') idx = 0;
                else if (c === 'b' || c === 'б' || c === 'в') idx = 1;
                else if (c === 'c' || c === 'с') idx = 2;
                else if (c === 'd' || c === 'д') idx = 3;
                else if (c === 'e' || c === 'е') idx = 4;
                
                if (idx !== -1) ct.correctAnswerIndex = idx;
            } else if (ansContent.match(/^[\d\s,;]+$/) && (ansContent.includes(',') || ansContent.includes(';'))) {
                const numbers = ansContent.match(/\d+/g);
                if (numbers) ct.inlineCorrectNumbers.push(...numbers);
            } else {
                ct.complexAnswerStr = ansContent;
            }
            flushTest();
            continue;
        }
        
        const optMatch = line.match(/^([\+\*]?)\s*(?:[a-zA-Zа-яА-Я])\s*[\.\)\-\:\/\]]\s*(.*)$/);
        const pmOptMatch = line.match(/^([\+\-])\s*(.*)$/);
        const numOptMatch = line.match(/^([\+\*]?)\s*(\d+)\s*[\.\)\-\:\/\]]\s*(.*)$/);
        
        let isOption = !!(optMatch || pmOptMatch || numOptMatch);

        let isNewQuestion = false;
        const isQuestionMarker = line.match(/^\s*(?:\d+\s*[\.\)\-\:\/\]]|#)\s*/);
        
        if (isQuestionMarker) {
            if (ct.options.length > 0) {
                isNewQuestion = true;
            } else if (ct.allInlineNumbers.length > 0) {
                if (line.match(/^\s*#\s*/)) {
                    isNewQuestion = true;
                } else {
                    const numMatch = line.match(/^\s*(\d+)\s*[\.\)\-\:\/\]]/);
                    if (numMatch) {
                        const num = parseInt(numMatch[1]);
                        const expectedNextOption = parseInt(ct.allInlineNumbers[ct.allInlineNumbers.length - 1]) + 1;
                        if (num !== expectedNextOption) {
                            isNewQuestion = true;
                        } else {
                            let isNextLineOption1 = false;
                            for (let j = i + 1; j < Math.min(i + 4, parseLines.length); j++) {
                                if (parseLines[j].trim() === "") continue;
                                if (parseLines[j].match(/^([\+\*]?)\s*1\s*[\.\)\-\:\/\]]\s*/)) {
                                    isNextLineOption1 = true;
                                }
                                break;
                            }
                            if (isNextLineOption1) {
                                isNewQuestion = true;
                            }
                        }
                    }
                }
            }
        } else if (ct.options.length >= 2 || ct.allInlineNumbers.length >= 2) {
            if (isOption) {
                if (optMatch) {
                    const letterMatch = line.match(/^[^\wа-яА-Я]*([a-zA-Zа-яА-Я])/);
                    if (letterMatch) {
                        const letterStr = letterMatch[1].toUpperCase();
                        if (letterStr === 'A' || letterStr === 'А') isNewQuestion = true;
                    }
                } else if (numOptMatch) {
                    const numMatchStart = line.match(/^[^\d]*(\d+)/);
                    if (numMatchStart) {
                        const num = parseInt(numMatchStart[1]);
                        if (num === 1) isNewQuestion = true;
                    }
                }
            }
        }
        
        if (isNewQuestion) {
            flushTest();
        }
        
        if (ct.question === "" && ct.options.length === 0 && ct.allInlineNumbers.length === 0 && !isOption) {
             ct.question = line.replace(/^\s*(?:\d+[\.\)]|#)\s*/, '');
             continue;
        }
        
        if (optMatch) {
            const isCorrect = optMatch[1] === '+' || optMatch[1] === '*';
            ct.options.push(optMatch[2]);
            if (isCorrect) ct.correctAnswerIndex = ct.options.length - 1;
        } else if (pmOptMatch) {
            const isCorrect = pmOptMatch[1] === '+';
            ct.options.push(pmOptMatch[2]);
            if (isCorrect) ct.correctAnswerIndex = ct.options.length - 1;
        } else if (numOptMatch) {
            ct.question += "\n" + line.replace(/[\+\*]/g, '').trim();
            const optNum = numOptMatch[2];
            ct.allInlineNumbers.push(optNum);
            if (numOptMatch[1] === '*' || numOptMatch[1] === '+' || line.includes('*') || (line.includes('+') && !line.includes(',+'))) {
                ct.inlineCorrectNumbers.push(optNum);
            }
        } else {
            if (ct.options.length === 0 && ct.allInlineNumbers.length === 0) {
                ct.question += "\n" + line;
            } else if (ct.options.length > 0) {
                ct.options[ct.options.length - 1] += "\n" + line;
            } else {
                ct.question += "\n" + line;
            }
        }
    }
    
    flushTest();
    return tests;
};

const parsed = parseDocumentTests(text);
console.log('Total parsed tests:', parsed.length);
if (parsed.length < 400) {
    fs.writeFileSync('parsed_dump.json', JSON.stringify(parsed, null, 2));
    console.log('Dumped parsed tests to parsed_dump.json');
}
