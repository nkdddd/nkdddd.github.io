if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = window.speechSynthesis.getVoices;
}

window.speak = function(text, lang = 'en-US') {
    if (!window.speechSynthesis) return; window.speechSynthesis.cancel();
    let speakText = text;
    if (lang === 'en-US' && speakText.length === 1 && /[a-zA-Z]/.test(speakText)) speakText = speakText.toLowerCase() + ".";
    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.lang = lang; utterance.rate = 0.85;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        let targetVoice = voices.find(v => v.lang === lang || v.lang === lang.replace('-', '_'));
        if (!targetVoice) targetVoice = voices.find(v => v.lang.startsWith(lang.substring(0, 2)));
        if (targetVoice) utterance.voice = targetVoice;
    }
    window.speechSynthesis.speak(utterance);
};

window.setLearningSubTab = function(sub) { window.state.subTab = sub; window.render(); };
window.setTrainingMode = function(mode) {
    window.state.trainingMode = mode;
    if (mode === 'alphabet' && !window.state.trainingSubMode) window.state.trainingSubMode = 'match';
    window.state.isAnswering = false; window.state.animatingCorrect = null;
    window.getNewQuiz(); window.render();
};
window.setTrainingSubMode = function(subMode) {
    window.state.trainingSubMode = subMode;
    window.state.isAnswering = false; window.state.animatingCorrect = null;
    window.getNewQuiz(); window.render();
};

window.getNewQuiz = function() {
    const mode = window.state.trainingMode || 'alphabet';
    
    if (mode === 'alphabet') {
        const qType = window.state.trainingSubMode || 'match';
        const target = ALPHABET_DB[Math.floor(Math.random() * ALPHABET_DB.length)];
        let options = [], ans = '';

        if (qType === 'match') {
            const isUpperToLower = Math.random() > 0.5;
            ans = isUpperToLower ? target.l : target.u;
            window.state.currentQuiz = {
                isAlphabet: true, qType: 'match',
                display: isUpperToLower ? target.u : target.l,
                sub: isUpperToLower ? '소문자 짝꿍은?' : '대문자 짝꿍은?',
                ans: ans, speakText: target.l, speakLang: 'en-US'
            };
            options = ALPHABET_DB.map(x => isUpperToLower ? x.l : x.u);
        } else if (qType === 'name') {
            ans = target.u;
            window.state.currentQuiz = {
                isAlphabet: true, qType: 'name', display: `🔈 ${target.n}`, sub: '이름을 가진 알파벳은?',
                ans: ans, speakText: target.l, speakLang: 'en-US'
            };
            options = ALPHABET_DB.map(x => x.u);
        } else if (qType === 'sound') {
            ans = target.l;
            window.state.currentQuiz = {
                isAlphabet: true, qType: 'sound', display: `🔈 ${target.s}`, sub: '소리를 내는 알파벳은?',
                ans: ans, speakText: target.s, speakLang: 'ko-KR'
            };
            options = ALPHABET_DB.map(x => x.l);
        }
        options = options.filter(x => x !== ans).sort(() => 0.5 - Math.random()).slice(0, 4);
        options.push(ans);
        window.state.currentQuiz.options = options.sort(() => 0.5 - Math.random());
    } 
    else {
        let wordObj, targetAns, blankIdx, opts = [];
        if (mode === 'vowel') {
            const vowelWords = WORDS_DB.filter(w => ['a','e','i','o','u'].includes(w.ans) && w.parts.includes(w.ans));
            wordObj = vowelWords[Math.floor(Math.random() * vowelWords.length)];
            targetAns = wordObj.ans; blankIdx = wordObj.parts.indexOf(targetAns);
            opts = ['a', 'e', 'i', 'o', 'u'];
        } else {
            wordObj = WORDS_DB[Math.floor(Math.random() * WORDS_DB.length)];
            blankIdx = Math.floor(Math.random() * wordObj.parts.length);
            targetAns = wordObj.parts[blankIdx];
            opts = [targetAns];
            const isVowel = ['a','e','i','o','u'].includes(targetAns);
            const pool = isVowel ? ['a','e','i','o','u'] : ['b','c','d','f','g','h','j','k','l','m','n','p','r','s','t','v','w','x','y','z'];
            while(opts.length < 5) {
                const rnd = pool[Math.floor(Math.random() * pool.length)];
                if(!opts.includes(rnd)) opts.push(rnd);
            }
        }
        opts.sort(() => 0.5 - Math.random());
        window.state.currentQuiz = { ...wordObj, isAlphabet: false, ans: targetAns, blankIndex: blankIdx, options: opts };
    }
};

window.checkAnswer = function(selected) {
    if(window.state.isAnswering) return;
    window.state.isAnswering = true;
    const q = window.state.currentQuiz;
    const isCorrect = selected === q.ans;
    const mainContent = document.getElementById('main-content'); 

    if(isCorrect) {
        window.state.coins += 20; window.saveData(); 
        if(q.isAlphabet) window.speak(q.ans.toLowerCase(), 'en-US'); else window.speak(q.w, 'en-US');
        window.state.animatingCorrect = selected; window.render();
        setTimeout(() => {
            window.showToast("🎉 정답! +20 코인"); window.state.animatingCorrect = null;
            window.state.isAnswering = false; window.getNewQuiz(); window.render();
        }, 700);
    } else {
        window.state.coins = Math.max(0, window.state.coins - 10); window.saveData(); 
        if (q.isAlphabet) window.speak(selected.toLowerCase(), 'en-US');
        else {
            let soundKr = selected;
            if (VOWEL_DB[selected]) soundKr = VOWEL_DB[selected].sound;
            else { const found = CONSONANT_DB.locations.flatMap(l=>l.items).find(c => c.id === selected); if(found) soundKr = found.kr; }
            window.speak(soundKr, 'ko-KR');
        }

        if(mainContent) mainContent.classList.add('animate-shake', 'animate-flash');
        const btn = document.getElementById(`opt-${selected}`);
        if(btn) btn.classList.replace('bg-blue-500', 'bg-red-500');
        window.showToast("앗! -10 코인");

        setTimeout(() => {
            if(mainContent) mainContent.classList.remove('animate-shake', 'animate-flash');
            if(btn) btn.classList.replace('bg-red-500', 'bg-blue-500');
            window.state.isAnswering = false; window.render();
        }, 500);
    }
};

window.openPack = async function() {
    if(window.state.coins < 50) return window.showToast("코인이 부족해요! (50 필요)");
    if(window.state.packOpening || window.state.isProcessing) return;
    window.state.isProcessing = true; window.state.coins -= 50; window.saveData(); 
    window.state.packOpening = true; window.state.revealedCard = null; window.render();
    
    try {
        const rand = Math.random(); 
        let grade = 'NORMAL'; let drawnCard = {};

        if (rand < 0.03) {
            grade = 'SUPER';
            const target = ALPAMON_DB.MID[Math.floor(Math.random() * ALPAMON_DB.MID.length)];
            drawnCard = { w: target.w, kr: target.kr, emoji: target.emoji, imgUrl: CLOUD_URL + target.id };
        } else if (rand < 0.20) {
            grade = 'RARE';
            const target = ALPAMON_DB.BABY[Math.floor(Math.random() * ALPAMON_DB.BABY.length)];
            drawnCard = { w: target.w, kr: target.kr, emoji: target.emoji, imgUrl: CLOUD_URL + target.id };
        } else {
            grade = 'NORMAL';
            drawnCard = WORDS_DB[Math.floor(Math.random() * WORDS_DB.length)]; 
        }

        setTimeout(() => {
            window.state.revealedCard = { id: Date.now().toString(), ...drawnCard, grade: grade };
            window.state.isProcessing = false; window.render(); window.speak(drawnCard.w);
        }, 1500);
    } catch (e) {
        console.error(e);
        window.state.packOpening = false; window.state.isProcessing = false; window.render();
    }
};

window.keepCard = function() {
    window.state.inventory.push(window.state.revealedCard);
    window.state.packOpening = false; window.state.revealedCard = null; window.saveData(); window.showToast("도감에 보관했어요! 🎒"); window.render();
};
window.discardCard = function() {
    window.state.coins += 10; window.state.packOpening = false; window.state.revealedCard = null;
    window.saveData(); window.showToast("카드를 버리고 10 코인을 얻었어요! 🪙"); window.render();
};

window.openCardAction = function(id) { window.state.actionCard = window.state.inventory.find(c => c.id === id); window.render(); };
window.closeCardAction = function() { window.state.actionCard = null; window.render(); };

window.actionSystemSell = function() {
    const cardId = window.state.actionCard.id; window.state.actionCard = null;
    window.openCustomPrompt(`이 카드를 상점에 판매하시겠습니까? (시스템 즉시 매입)`, false, 'SYSTEM_SELL', cardId);
};
window.actionMarketSell = function() {
    if(window.isGuestMode) return window.showToast("온라인 로그인 후 거래가 가능합니다.");
    const cardId = window.state.actionCard.id; window.state.actionCard = null;
    window.openCustomPrompt(`이 카드를 친구들에게 얼마에 팔까요?\n원하는 가격(코인)을 숫자로 적어주세요.`, true, 'MARKET_SELL', cardId);
};

window.selectForAltar = function(id) {
    if(window.state.altarSelection.includes(id)) { window.state.altarSelection = window.state.altarSelection.filter(x => x !== id); } 
    else {
        if(window.state.altarSelection.length >= 2) return window.showToast("2개까지만 선택 가능해요!");
        const card = window.state.inventory.find(c => c.id === id);
        if(window.state.altarSelection.length === 1) {
            const firstCard = window.state.inventory.find(c => c.id === window.state.altarSelection[0]);
            if(firstCard.grade !== card.grade) return window.showToast("같은 등급의 카드만 합성할 수 있어요!");
        }
        window.state.altarSelection.push(id);
    }
    window.render();
};

window.startClickEvent = function() {
    if(window.state.altarSelection.length !== 2 || window.state.isProcessing) return;
    window.state.isClickingMode = true; window.state.clickCount = 0; window.state.clickTimeLeft = 3; 
    window.render();
    
    window.state.clickTimer = setInterval(() => {
        window.state.clickTimeLeft -= 1;
        const timeEl = document.getElementById('click-time-text');
        if (timeEl) timeEl.innerText = window.state.clickTimeLeft + '초';

        if(window.state.clickTimeLeft <= 0) {
            clearInterval(window.state.clickTimer); window.state.isClickingMode = false; window.tryEvolve();
        }
    }, 1000);
};

window.doClick = function() {
    if(!window.state.isClickingMode) return;
    window.state.clickCount += 1;
    
    const countEl = document.getElementById('click-count-text');
    if (countEl) countEl.innerText = window.state.clickCount;
    
    const targetClicks = 11;
    const remaining = Math.max(targetClicks - window.state.clickCount, 0);
    const remainEl = document.getElementById('click-remain-text');
    if (remainEl) {
        if (remaining === 0) remainEl.innerHTML = `<div class="text-green-400 font-black text-sm animate-pulse">🛡️ 카드 파괴 방지 100% 활성화!</div>`;
        else remainEl.innerHTML = `<div class="text-red-400 font-bold text-xs">보호까지 남은 터치: <span class="text-xl">${remaining}</span>번!</div>`;
    }

    const btn = document.getElementById('click-btn');
    if(btn) { btn.style.transform = 'scale(0.9)'; setTimeout(()=>btn.style.transform='scale(1)', 50); }
};

window.tryEvolve = async function() {
    window.state.isProcessing = true; window.render();
    const cardId = window.state.altarSelection[0];
    const baseCard = window.state.inventory.find(c => c.id === cardId);
    const grade = baseCard.grade;

    let baseRate = 0.60; let nextGrade = 'SUPER'; let dbTarget = ALPAMON_DB.MID;
    if (grade === 'SUPER') { baseRate = 0.40; nextGrade = 'LEGEND'; dbTarget = ALPAMON_DB.FINAL; }
    if (grade === 'LEGEND') { baseRate = 0.30; nextGrade = 'MYTHIC'; dbTarget = ALPAMON_DB.GOD; }

    const targetClicks = 11;
    const isProtected = window.state.clickCount >= targetClicks;
    const addedRate = window.state.clickCount * 0.015;
    const finalRate = Math.min(baseRate + addedRate, 1.0);

    try {
        if(Math.random() < finalRate) { 
            window.state.inventory = window.state.inventory.filter(c => !window.state.altarSelection.includes(c.id));
            window.state.altarSelection = [];

            const targetData = dbTarget[Math.floor(Math.random() * dbTarget.length)];
            const newCard = { 
                id: Date.now().toString(), grade: nextGrade, 
                w: targetData.w, kr: targetData.kr, emoji: targetData.emoji, imgUrl: CLOUD_URL + targetData.id 
            };
            
            window.state.revealedCard = newCard;
            window.state.packOpening = true; 
            window.showToast(`✨ 합성 대성공! (확률 ${Math.floor(finalRate*100)}% 적용)`);
            window.speak(targetData.w);
            window.state.isProcessing = false; window.state.clickCount = 0; 
            window.saveData(); window.render();
        } else {
            if (isProtected) {
                window.state.altarSelection = [];
                window.state.isFailingProtected = true; window.render();
                setTimeout(() => {
                    window.state.isFailingProtected = false; window.showToast("휴~ 🛡️ 터치 보호막 덕분에 카드를 지켰어요!");
                    window.state.isProcessing = false; window.state.clickCount = 0;
                    window.saveData(); window.render();
                }, 2500);
            } else {
                window.state.inventory = window.state.inventory.filter(c => !window.state.altarSelection.includes(c.id));
                window.state.altarSelection = [];
                window.state.isFailing = true; window.render();
                setTimeout(() => {
                    window.state.isFailing = false; window.showToast("💥 합성 실패... 카드가 모두 사라졌습니다.");
                    window.state.isProcessing = false; window.state.clickCount = 0;
                    window.saveData(); window.render();
                }, 2000);
            }
        }
    } catch(e) { window.state.isProcessing = false; window.render(); }
};

window.buyFromMarket = async function(marketId) {
    if(window.isGuestMode) return;
    const item = window.state.marketList.find(m => m.id === marketId);
    if(!item) return;
    if(item.sellerUid === window.currentUser.uid) return window.showToast("본인이 올린 카드입니다.");
    if(window.state.coins < item.price) return window.showToast("코인이 부족합니다.");
    
    const sellerName = item.sellerEmail ? item.sellerEmail.split('@')[0] : '유저';
    window.openCustomPrompt(`${sellerName}님의 ${item.card.kr} 카드를 ${item.price}코인에 구매하시겠습니까?`, false, 'BUY_MARKET', marketId);
};
