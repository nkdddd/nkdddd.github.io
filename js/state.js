window.state = {
    tab: 'learning', subTab: 'alphabet',
    trainingMode: 'alphabet', trainingSubMode: 'match',
    coins: 200, inventory: [], altarSelection: [], collectionValue: 0,
    friends: [], friendRequests: [], 
    toastMsg: null, currentQuiz: null, isAnswering: false, packOpening: false, revealedCard: null, animatingCorrect: null,
    altarResult: null, isFailing: false, isFailingProtected: false, isProcessing: false,
    isClickingMode: false, clickCount: 0, clickTimeLeft: 3, clickTimer: null,
    socialTab: 'ranking', usersList: [], marketList: [], viewingUser: null, actionCard: null,
    customPrompt: null, initialLoadDone: false
};

window.calcCollectionValue = function() {
    let val = 0;
    const vals = { 'NORMAL': 10, 'RARE': 50, 'SUPER': 200, 'LEGEND': 1000, 'MYTHIC': 5000 };
    (window.state.inventory || []).forEach(c => val += (vals[c.grade] || 0));
    return val;
};

window.saveData = function() {
    window.state.collectionValue = window.calcCollectionValue();
    if (!window.currentUser || window.isGuestMode) {
        localStorage.setItem('phonicsAppState', JSON.stringify({
            coins: window.state.coins, inventory: window.state.inventory, 
            friends: window.state.friends, friendRequests: window.state.friendRequests
        }));
        return;
    }
    if(window.db) {
        window.db.collection("users").doc(window.currentUser.uid).set({
            email: window.currentUser.email, coins: window.state.coins, 
            inventory: window.state.inventory, collectionValue: window.state.collectionValue,
            friends: window.state.friends, friendRequests: window.state.friendRequests,
            lastActive: Date.now()
        }, {merge: true}).catch(e => {
            console.error("저장 실패:", e);
        });
    }
};


4. js/ui.js (화면 렌더링 및 UI 헬퍼)

 window.showToast = function(msg) {
    window.state.toastMsg = msg; window.render();
    setTimeout(() => { window.state.toastMsg = null; window.render(); }, 2000);
};

window.openCustomPrompt = function(message, hasInput, actionType, payload) {
    window.state.customPrompt = { message, hasInput, actionType, payload };
    window.render();
};

window.closeCustomPrompt = function() {
    window.state.customPrompt = null;
    window.render();
};

window.confirmCustomPrompt = async function() {
    const p = window.state.customPrompt;
    let inputValue = null;

    if (p.hasInput) {
        const inputEl = document.getElementById('prompt-input');
        inputValue = parseInt(inputEl.value);
        if (isNaN(inputValue) || inputValue <= 0) return window.showToast("올바른 금액을 입력하세요.");
    }

    try {
        if (p.actionType === 'SYSTEM_SELL') {
            const card = window.state.inventory.find(c => c.id === p.payload);
            if(!card) return;
            const prices = { 'NORMAL': 10, 'RARE': 50, 'SUPER': 200, 'LEGEND': 1000, 'MYTHIC': 5000 };
            const price = Math.floor((prices[card.grade] || 10) / 2); // 시스템 판매는 반값
            window.state.inventory = window.state.inventory.filter(c => c.id !== card.id);
            window.state.coins += price;
            window.saveData();
            window.showToast(`상점에 팔아 ${price}코인을 얻었습니다! 🪙`);
        } 
        else if (p.actionType === 'MARKET_SELL') {
            const card = window.state.inventory.find(c => c.id === p.payload);
            if(!card) return;
            window.state.inventory = window.state.inventory.filter(c => c.id !== card.id);
            window.saveData();
            
            if(window.db) {
                await window.db.collection("market").add({
                    sellerUid: window.currentUser.uid, sellerEmail: window.currentUser.email,
                    card: card, price: inputValue, timestamp: Date.now()
                });
                window.showToast("친구 거래소에 등록 완료!");
                window.loadSocialData();
            }
        } 
        else if (p.actionType === 'BUY_MARKET') {
            const item = window.state.marketList.find(m => m.id === p.payload);
            if(!item) return;
            window.state.coins -= item.price;
            const boughtCard = { ...item.card, id: Date.now().toString() };
            window.state.inventory.push(boughtCard);
            window.saveData();

            if(window.db) {
                window.db.collection("users").doc(item.sellerUid).update({
                    coins: firebase.firestore.FieldValue.increment(item.price)
                }).catch(e => console.log(e));
                await window.db.collection("market").doc(item.id).delete();
                window.showToast("구매 성공! 도감에 추가되었습니다.");
                window.loadSocialData();
            }
        } 
        else if (p.actionType === 'ADD_FRIEND') {
            const targetUid = p.payload;
            if(window.db) {
                await window.db.collection("users").doc(targetUid).update({
                    friendRequests: firebase.firestore.FieldValue.arrayUnion({
                        uid: window.currentUser.uid, email: window.currentUser.email
                    })
                });
                window.showToast("친구 요청을 성공적으로 보냈습니다!");
            }
        } 
        else if (p.actionType === 'ACCEPT_FRIEND') {
            const requesterUid = p.payload;
            window.state.friends.push(requesterUid);
            window.state.friendRequests = window.state.friendRequests.filter(req => req.uid !== requesterUid);
            window.saveData();

            if(window.db) {
                await window.db.collection("users").doc(requesterUid).update({
                    friends: firebase.firestore.FieldValue.arrayUnion(window.currentUser.uid)
                });
                window.showToast("친구가 되었습니다!");
                window.loadSocialData();
            }
        } 
        else if (p.actionType === 'REJECT_FRIEND') {
            const requesterUid = p.payload;
            window.state.friendRequests = window.state.friendRequests.filter(req => req.uid !== requesterUid);
            window.saveData();
            window.showToast("친구 요청을 거절했습니다.");
        }
    } catch(e) { console.error(e); window.showToast("오류가 발생했습니다."); }

    window.closeCustomPrompt();
};

window.getCardGradeStyle = function(grade) { 
    if(grade === 'MYTHIC') return 'grade-mythic'; if(grade === 'LEGEND') return 'grade-legend';
    if(grade === 'SUPER') return 'grade-super'; if(grade === 'RARE') return 'grade-rare'; return 'grade-normal'; 
};
window.getCardGradeText = function(grade) {
    if (grade === 'MYTHIC') return '<span class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">🌌 SSS급 신</span>';
    if (grade === 'LEGEND') return '<span class="bg-gradient-to-r from-red-500 to-rose-400 text-white px-3 py-1 rounded-full text-xs font-black shadow-md">💎 SS급 최종진화</span>';
    if (grade === 'SUPER') return '<span class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-sm">👑 S급 중간진화</span>';
    if (grade === 'RARE') return '<span class="bg-gradient-to-r from-slate-300 to-slate-400 text-slate-700 px-3 py-1 rounded-full text-xs font-black shadow-sm">✨ A급 아기알파몬</span>';
    return '<span class="bg-gray-200 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">NORMAL (일반 단어)</span>';
};
window.getSmallBadge = function(grade) {
    if (grade === 'MYTHIC') return '<div class="absolute top-0 right-0 bg-purple-500 text-white text-[8px] px-2 py-0.5 rounded-bl-lg font-black z-20">SSS급</div>';
    if (grade === 'LEGEND') return '<div class="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-2 py-0.5 rounded-bl-lg font-black z-20">SS급</div>';
    if (grade === 'SUPER') return '<div class="absolute top-0 right-0 bg-yellow-400 text-white text-[8px] px-2 py-0.5 rounded-bl-lg font-black z-20">S급</div>';
    if (grade === 'RARE') return '<div class="absolute top-0 right-0 bg-slate-400 text-white text-[8px] px-2 py-0.5 rounded-bl-lg font-black z-20">A급</div>';
    return '';
};

window.changeTab = function(tab) {
    window.state.tab = tab;
    if(tab === 'training' && !window.state.currentQuiz) window.getNewQuiz();
    if(tab !== 'altar') window.state.altarSelection = [];
    window.render();
};

window.renderLearning = function() {
    const sub = window.state.subTab;
    return `
        <div class="p-4 max-w-md mx-auto w-full flex flex-col min-h-full">
            <div class="flex bg-gray-200 rounded-full p-1 mb-6 shadow-inner text-[10px]">
                <button onclick="window.setLearningSubTab('alphabet')" class="flex-1 py-2.5 rounded-full font-bold transition-all ${sub === 'alphabet' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}">ABC 알파벳</button>
                <button onclick="window.setLearningSubTab('vowel')" class="flex-1 py-2.5 rounded-full font-bold transition-all ${sub === 'vowel' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}">A E I O U 모음</button>
                <button onclick="window.setLearningSubTab('consonant')" class="flex-1 py-2.5 rounded-full font-bold transition-all ${sub === 'consonant' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}">나머지 자음</button>
            </div>
            <div class="flex-1">
                ${sub === 'alphabet' ? window.renderAlphabetLearning() : sub === 'vowel' ? window.renderVowels() : window.renderConsonants()}
            </div>
        </div>
    `;
};

window.renderAlphabetLearning = function() {
    return `
        <div class="grid grid-cols-2 gap-3 pb-4">
            ${ALPHABET_DB.map(a => `
                <div class="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <div class="text-3xl font-black text-slate-800 mb-2 cursor-pointer active:scale-95 transition-transform" onclick="window.speak('${a.l}', 'en-US')">
                        ${a.u} <span class="text-2xl text-slate-500">${a.l}</span>
                    </div>
                    <div class="flex w-full gap-1">
                        <button onclick="window.speak('${a.l}', 'en-US')" class="flex-1 bg-blue-50 text-blue-600 rounded-lg py-1.5 text-[10px] font-bold active:bg-blue-100 transition-colors">이름(${a.n})</button>
                        <button onclick="window.speak('${a.s}', 'ko-KR')" class="flex-1 bg-red-50 text-red-600 rounded-lg py-1.5 text-[10px] font-bold active:bg-red-100 transition-colors">소리(${a.s})</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

window.renderVowels = function() {
    return `
        <div class="flex justify-between gap-2 mb-6">
            ${Object.entries(VOWEL_DB).map(([v, data]) => `
                <button onclick="window.speak('${v}'); window.showToast('${v} - ${data.sound}')" class="flex-1 aspect-[3/4] bg-white rounded-2xl shadow-sm border-b-4 border-blue-100 flex flex-col items-center justify-center active:translate-y-1 active:border-b-0 transition-all">
                    <span class="text-3xl font-black text-blue-500 uppercase">${v}</span>
                    <span class="text-sm font-bold text-gray-400 mt-1">${data.sound}</span>
                </button>
            `).join('')}
        </div>
        <details class="mb-4 bg-sky-50 rounded-2xl border border-sky-100 overflow-hidden group">
            <summary class="p-4 font-bold text-sky-800 flex justify-between items-center cursor-pointer">
                <span>📚 CVC 단어 섞어 읽기 연습</span>
                <i class="fa-solid fa-chevron-down text-sky-300 group-open:rotate-180 transition-transform"></i>
            </summary>
            <div class="p-4 pt-0 grid grid-cols-5 gap-2 text-center">
                ${['cat','pet','pig','dog','cup', 'map','hen','sit','hot','run', 'bag','net','lip','box','gum', 'fan','red','win','mop','bus'].map(w => `
                    <button onclick="window.speak('${w}')" class="bg-white py-2 rounded-lg shadow-sm text-xs font-black text-slate-700 active:scale-95 transition-transform border border-sky-100 flex items-center justify-center">
                        ${w}
                    </button>
                `).join('')}
            </div>
        </details>
        <details class="mb-4 bg-indigo-50 rounded-2xl border border-indigo-100 overflow-hidden group">
            <summary class="p-4 font-bold text-indigo-800 flex justify-between items-center cursor-pointer">
                <span>👥 단어 가족 모여라!</span>
                <i class="fa-solid fa-chevron-down text-indigo-300 group-open:rotate-180 transition-transform"></i>
            </summary>
            <div class="p-4 pt-0 flex flex-col gap-3">
                ${['a','e','i','o','u'].map(v => VOWEL_DB[v].fam.map(f => `
                    <div class="bg-indigo-100/50 p-3 rounded-xl">
                        <div class="text-xs font-bold text-indigo-600 mb-2">🏠 ${f.n} 가족</div>
                        <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                            ${f.w.map(word => `
                                <button onclick="window.speak('${word}')" class="bg-white px-3 py-1.5 rounded-lg shadow-sm font-bold text-slate-700 shrink-0 text-sm border border-indigo-50 flex items-center gap-1 active:scale-95 transition-transform">
                                    ${word.replace(f.n.replace('-',''), `<span class="text-indigo-500">${f.n.replace('-','')}</span>`)}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `).join('')).join('')}
            </div>
        </details>
        <details class="mb-4 bg-purple-50 rounded-2xl border border-purple-100 overflow-hidden group">
            <summary class="p-4 font-bold text-purple-800 flex justify-between items-center cursor-pointer">
                <span>⚡ 매직 E가 붙으면? (긴 소리)</span>
                <i class="fa-solid fa-chevron-down text-purple-300 group-open:rotate-180 transition-transform"></i>
            </summary>
            <div class="p-4 pt-0 grid grid-cols-2 gap-2">
                ${['a','e','i','o','u'].flatMap(v => VOWEL_DB[v].magic).map(word => `
                    <button onclick="window.speak('${word}')" class="bg-white p-3 rounded-xl shadow-sm font-bold text-slate-700 text-center border border-purple-50 flex items-center justify-center gap-1 active:scale-95 transition-transform">
                        ${word.slice(0,-1)}<span class="text-purple-500">e</span>
                    </button>
                `).join('')}
            </div>
        </details>
    `;
};

window.renderConsonants = function() {
    return `
        <div class="flex flex-col gap-4 pb-4">
            ${CONSONANT_DB.locations.map(loc => `
                <details class="bg-emerald-50 rounded-2xl border border-emerald-100 overflow-hidden group">
                    <summary class="p-4 font-bold text-emerald-800 flex justify-between items-center cursor-pointer">
                        <span>${loc.title} <span class="text-xs bg-emerald-200/50 px-2 py-0.5 rounded-full ml-1">${loc.tags}</span></span>
                        <i class="fa-solid fa-chevron-down text-emerald-300 group-open:rotate-180 transition-transform"></i>
                    </summary>
                    <div class="p-4 pt-0 grid grid-cols-2 gap-3">
                        ${loc.items.map(item => `
                            <div class="bg-white p-2 rounded-xl shadow-sm border border-emerald-100 flex flex-col items-center">
                                <button onclick="window.speak('${item.kr}', 'ko-KR')" class="w-full flex flex-col items-center p-2 active:bg-emerald-50 rounded-lg transition-colors">
                                    <span class="text-3xl font-black text-slate-700">${item.id}</span>
                                    <span class="text-[10px] text-emerald-600 font-bold mt-1">${item.kr}</span>
                                </button>
                                <button onclick="window.speak('${item.w}')" class="mt-1 w-full bg-slate-50 py-1.5 rounded-lg text-xs font-bold text-slate-600 active:bg-slate-200 transition-colors flex items-center justify-center gap-1 shadow-inner">
                                    ${item.w}
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </details>
            `).join('')}
        </div>
    `;
};

window.renderTraining = function() {
    if(!window.state.currentQuiz) window.getNewQuiz();
    const mode = window.state.trainingMode;
    const q = window.state.currentQuiz;
    
    let abcSubMenuHtml = '';
    if (mode === 'alphabet') {
        const sub = window.state.trainingSubMode;
        abcSubMenuHtml = `
            <div class="flex bg-blue-100/50 rounded-full p-1 mt-3 shadow-inner w-full max-w-[250px] mx-auto border border-blue-100">
                <button onclick="window.setTrainingSubMode('match')" class="flex-1 py-1.5 rounded-full font-bold text-[10px] transition-all ${sub === 'match' ? 'bg-blue-500 text-white shadow' : 'text-blue-600'}">대소문자</button>
                <button onclick="window.setTrainingSubMode('name')" class="flex-1 py-1.5 rounded-full font-bold text-[10px] transition-all ${sub === 'name' ? 'bg-blue-500 text-white shadow' : 'text-blue-600'}">이름</button>
                <button onclick="window.setTrainingSubMode('sound')" class="flex-1 py-1.5 rounded-full font-bold text-[10px] transition-all ${sub === 'sound' ? 'bg-blue-500 text-white shadow' : 'text-blue-600'}">발음</button>
            </div>
        `;
    }

    let quizAreaHtml = '';
    if (q.isAlphabet) {
        quizAreaHtml = `
            <div class="bg-white rounded-[2rem] p-8 shadow-xl w-full max-w-sm flex flex-col items-center border-2 border-slate-100 relative z-10 mt-6">
                <div class="text-[10px] font-black text-blue-500 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-4">${q.sub}</div>
                <div class="text-5xl sm:text-6xl mb-2 drop-shadow-md font-black text-indigo-600 cursor-pointer active:scale-95 transition-transform group relative flex items-center justify-center gap-2 whitespace-nowrap" 
                     onclick="window.speak('${q.speakText}', '${q.speakLang}')">
                    ${q.display}
                </div>
            </div>
        `;
    } else {
        const displayHtml = q.parts.map((p, idx) => {
            if(idx === q.blankIndex) return window.state.animatingCorrect ? `<span class="text-blue-500 animate-pop inline-block">${p}</span>` : `<span class="text-blue-200 border-b-4 border-blue-200 px-2 inline-block w-8 text-center pb-1">?</span>`;
            return `<span class="text-slate-700 inline-block px-1">${p}</span>`;
        }).join('');

        quizAreaHtml = `
            <div class="bg-white rounded-[2rem] p-8 shadow-xl w-full max-w-sm flex flex-col items-center border-2 border-slate-100 relative z-10 mt-6">
                <div class="text-7xl mb-4 drop-shadow-sm cursor-pointer active:scale-95 transition-transform group relative" onclick="window.speak('${q.w}')">
                    ${q.emoji}
                    <div class="absolute -top-2 -right-8 bg-yellow-300 text-yellow-800 text-[10px] font-black px-2 py-1 rounded-full animate-bounce shadow-md whitespace-nowrap">힌트 듣기!</div>
                </div>
                <div class="bg-slate-100 text-slate-500 font-bold px-4 py-1.5 rounded-full mb-8">${q.kr}</div>
                <div class="text-5xl font-black tracking-widest uppercase flex items-center h-16">${displayHtml}</div>
            </div>
        `;
    }

    return `
        <div class="flex flex-col h-full w-full">
            <div class="flex-1 flex flex-col items-center justify-center p-6">
                <div class="flex flex-col w-full">
                    <div class="flex bg-gray-200 rounded-full p-1 shadow-inner w-full max-w-sm mx-auto">
                        <button onclick="window.setTrainingMode('alphabet')" class="flex-1 py-2.5 rounded-full font-bold text-[11px] transition-all ${mode === 'alphabet' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}">ABC 기초</button>
                        <button onclick="window.setTrainingMode('vowel')" class="flex-1 py-2.5 rounded-full font-bold text-[11px] transition-all ${mode === 'vowel' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}">모음 훈련</button>
                        <button onclick="window.setTrainingMode('all')" class="flex-1 py-2.5 rounded-full font-bold text-[11px] transition-all ${mode === 'all' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}">종합 훈련</button>
                    </div>
                    ${abcSubMenuHtml}
                </div>

                ${quizAreaHtml}
                
                <div class="flex flex-wrap justify-center gap-3 mt-10 w-full relative z-20">
                    ${q.options.map(opt => `
                        <button id="opt-${opt}" onclick="window.checkAnswer('${opt}')" 
                            class="w-14 h-14 bg-blue-500 text-white rounded-2xl text-2xl font-black shadow-[0_5px_0_#1d4ed8] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center relative overflow-hidden ${q.isAlphabet ? '' : 'uppercase'}">
                            <span class="${window.state.animatingCorrect === opt ? 'opacity-0' : 'opacity-100'}">${opt}</span>
                            ${window.state.animatingCorrect === opt ? `<span class="absolute inset-0 flex items-center justify-center animate-fly text-3xl font-black text-yellow-300 z-50">${opt}</span>` : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
};

window.renderShop = function() {
    return `
        <div class="p-6 flex flex-col items-center h-full">
            <div class="flex-1 flex flex-col items-center justify-center w-full">
                <div class="text-6xl mb-6 drop-shadow-lg">🏪</div>
                <h2 class="text-2xl font-black text-slate-800 mb-2">단어 상점</h2>
                <p class="text-slate-500 font-bold mb-10 text-center">코인을 모아 카드를 뽑고<br>알파몬 도감을 채우세요!</p>
                
                <button onclick="window.openPack()" class="bg-gradient-to-b from-yellow-300 to-yellow-500 p-6 rounded-3xl shadow-[0_8px_0_#b45309] active:translate-y-2 active:shadow-none transition-all w-full max-w-xs group relative overflow-hidden">
                    ${window.state.isProcessing ? '<div class="absolute inset-0 bg-black/20 flex items-center justify-center"><i class="fa-solid fa-spinner fa-spin text-white text-3xl"></i></div>' : ''}
                    <div class="text-5xl mb-2 group-active:scale-95 transition-transform">🎁</div>
                    <div class="text-white font-black text-xl drop-shadow-md">카드 팩 뜯기</div>
                    <div class="mt-2 bg-yellow-600/30 text-yellow-900 font-bold py-1 px-4 rounded-full inline-block text-sm shadow-inner">50 코인</div>
                </button>

                <div class="mt-8 text-xs font-bold text-gray-400 bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1 w-full max-w-xs">
                    <div class="text-center mb-1 text-gray-500">🏆 상점 뽑기 확률</div>
                    <div class="flex justify-between"><span class="font-black text-yellow-600">👑 S급 (Mid 알파몬)</span> <span class="text-yellow-500">3%</span></div>
                    <div class="flex justify-between"><span class="font-black text-slate-500">✨ A급 (Baby 알파몬)</span> <span class="text-slate-500">17%</span></div>
                    <div class="flex justify-between"><span>⬜ 일반 영단어</span> <span class="text-gray-400">80%</span></div>
                    <div class="text-center text-[9px] mt-2 text-purple-400 font-bold">🔥 SS급, SSS급은 제단 진화를 통해서만 획득 가능합니다.</div>
                </div>
            </div>
        </div>
    `;
};

window.renderAltar = function() {
    if (window.state.isClickingMode) {
        const targetClicks = 11;
        const remaining = Math.max(targetClicks - window.state.clickCount, 0);
        const isProtected = remaining === 0;

        const cardId = window.state.altarSelection[0];
        const baseCard = window.state.inventory.find(c => c.id === cardId);
        let baseRate = 0.60;
        if (baseCard.grade === 'SUPER') baseRate = 0.40;
        if (baseCard.grade === 'LEGEND') baseRate = 0.30;
        let currentRate = Math.min(baseRate + (window.state.clickCount * 0.015), 1.0);
        const percentRate = Math.floor(currentRate * 100);

        return `
            <div class="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-md" onclick="window.doClick()">
                <div class="text-[60px] mb-2 animate-bounce">⚡️</div>
                <div class="text-white text-xl font-black mb-2 text-center leading-tight">알파몬 합성 에너지를 모아라!</div>
                <div id="click-time-text" class="text-6xl font-black text-yellow-400 mb-4 font-mono">${window.state.clickTimeLeft}초</div>
                <div id="click-remain-text" class="bg-gray-800 text-white px-4 py-2 rounded-xl mb-6 text-center border-2 ${isProtected ? 'border-green-400' : 'border-red-400'} shadow-lg w-full max-w-[250px]">
                    <div class="text-yellow-300 font-black text-lg mb-1">현재 성공률: <span class="text-2xl">${percentRate}%</span></div>
                    ${isProtected ? `<div class="text-green-400 font-black text-sm animate-pulse">🛡️ 파괴 방지 100% 활성화!</div>` : `<div class="text-red-400 font-bold text-xs">보호까지 남은 터치: <span class="text-xl">${remaining}</span>번!</div>`}
                </div>
                <div id="click-btn" class="w-40 h-40 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex flex-col items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.6)] cursor-pointer select-none border-4 border-white transition-transform">
                    <div class="text-4xl mb-1">👇</div><div id="click-count-text" class="text-white font-black text-4xl drop-shadow-md">${window.state.clickCount}</div>
                </div>
            </div>
        `;
    }

    if (window.state.isFailingProtected) {
        return `
            <div class="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-md">
                <div class="text-[120px] mb-4 animate-bounce">🛡️</div>
                <h2 class="text-4xl font-black text-blue-400 mb-4 animate-pulse">합성 실패... 지만!</h2>
                <p class="text-white font-bold text-lg text-center leading-relaxed">터치 에너지 방어막 덕분에<br>알파몬이 파괴되지 않았습니다! 🎉</p>
            </div>
        `;
    }

    if (window.state.isFailing) {
        return `
            <div class="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-md animate-shake">
                <div class="text-[120px] mb-4">💥</div>
                <h2 class="text-4xl font-black text-red-500 mb-4 animate-flash">진화 실패!</h2>
                <p class="text-white font-bold text-lg text-center leading-relaxed">아앗... 제물의 카드가<br>모두 재가 되어 사라졌습니다...</p>
            </div>
        `;
    }

    const validCards = (window.state.inventory || []).filter(c => ['RARE', 'SUPER', 'LEGEND'].includes(c.grade)); 
    const selectedCards = window.state.altarSelection.map(id => window.state.inventory.find(c => c.id === id));
    let altarStatusMsg = "같은 등급의 알파몬 2장을 골라주세요!<br><span class='text-blue-500'>(등급에 따라 전설, 신 등장! 실패 시 소멸 💥)</span>";
    if (selectedCards.length > 0) {
        const grade = selectedCards[0].grade;
        if(grade === 'RARE') altarStatusMsg = "기본 성공률: 60% <br><b class='text-yellow-600'>(광클 시 ⬆ & 11번 터치 시 파괴 방지!)</b>";
        if(grade === 'SUPER') altarStatusMsg = "기본 성공률: 40% <br><b class='text-red-500'>(광클 시 ⬆ & 11번 터치 시 파괴 방지!)</b>";
        if(grade === 'LEGEND') altarStatusMsg = "기본 성공률: 30% <br><b class='text-purple-500'>(광클 시 ⬆ & 11번 터치 시 파괴 방지!)</b>";
    }

    return `
        <div class="p-6 flex flex-col h-full w-full relative">
            <div class="text-center mb-6 shrink-0">
                <div class="text-5xl mb-2 animate-pulse">⚡</div>
                <h2 class="text-2xl font-black text-slate-800">진화의 제단</h2>
                <p class="text-[11px] text-slate-500 font-bold mt-2 leading-tight">${altarStatusMsg}</p>
            </div>
            <div class="flex justify-center gap-4 mb-6 shrink-0">
                ${[0, 1].map(i => `
                    <div class="w-24 h-32 rounded-2xl border-4 border-dashed flex items-center justify-center bg-white shadow-inner overflow-hidden ${selectedCards[i] ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}">
                        ${selectedCards[i] ? (selectedCards[i].imgUrl ? `<img src="${selectedCards[i].imgUrl}" class="w-16 h-16 object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" /><div class="text-4xl" style="display:none;">${selectedCards[i].emoji}</div>` : `<div class="text-4xl">${selectedCards[i].emoji}</div>`) : `<span class="text-gray-300 font-bold">카드 ${i+1}</span>`}
                    </div>
                `).join('')}
            </div>
            ${window.state.altarSelection.length === 2 ? `
                <button onclick="window.startClickEvent()" class="relative overflow-hidden w-full bg-yellow-400 text-yellow-900 font-black text-xl py-4 rounded-2xl mb-4 shadow-[0_5px_0_#ca8a04] active:translate-y-1 active:shadow-none animate-bounce shrink-0">
                    ${window.state.isProcessing ? '<div class="absolute inset-0 bg-black/20 flex items-center justify-center"><i class="fa-solid fa-spinner fa-spin text-white"></i></div>' : ''}
                    알파몬 진화 시작!
                </button>
            ` : ''}
            <div class="flex-1 bg-white rounded-3xl p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-y-auto min-h-[150px] w-full hide-scrollbar">
                <h3 class="font-bold text-gray-700 mb-3 text-sm">합성 가능한 알파몬 (A급 이상)</h3>
                <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.5rem;">
                    ${validCards.map(item => {
                        const isSel = window.state.altarSelection.includes(item.id);
                        let ringColor = item.grade === 'LEGEND' ? 'border-red-400 bg-red-50' : (item.grade === 'SUPER' ? 'border-yellow-400 bg-yellow-50' : 'border-slate-300 bg-slate-50');
                        if (isSel) ringColor = 'border-blue-500 bg-blue-100 ring-2 ring-blue-300';
                        return `
                        <button onclick="window.selectForAltar('${item.id}')" class="relative ${ringColor} border-2 rounded-xl p-2 flex flex-col items-center transition-all overflow-hidden">
                            <div class="h-8 flex items-center justify-center mt-1">
                                ${item.imgUrl ? `<img src="${item.imgUrl}" style="width: 2rem; height: 2rem; object-fit: contain; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" /><div class="text-2xl" style="display:none;">${item.emoji}</div>` : `<div class="text-2xl">${item.emoji}</div>`}
                            </div>
                            <div class="text-[9px] font-black mt-1 w-full text-center text-slate-700 truncate capitalize">${item.w}</div>
                            ${isSel ? '<div class="absolute -top-2 -right-2 bg-blue-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">✓</div>' : ''}
                        </button>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
};

window.renderDex = function() {
    if(!window.state.inventory || window.state.inventory.length === 0) {
        return `
            <div class="p-4 flex flex-col h-full w-full">
                <div class="flex-1 flex flex-col items-center justify-center text-slate-400 font-bold gap-4">
                    <i class="fa-solid fa-book-open text-5xl"></i>
                    <p>수집한 카드가 없어요.</p>
                </div>
            </div>
        `;
    } 
    
    return `
        <div class="p-4 flex flex-col h-full w-full">
            <div class="flex-1 overflow-y-auto w-full pb-4 hide-scrollbar">
                <h2 class="text-xl font-black text-slate-800 mb-4 px-2">나의 도감 <span class="text-blue-500">${window.state.inventory.length}</span></h2>
                <div class="text-[11px] text-blue-600 font-bold px-2 mb-4 text-center bg-blue-50 py-2 rounded-lg border border-blue-100">
                    💡 카드를 터치하면 거래소에 팔거나 발음을 들을 수 있어요!
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem;">
                    ${window.state.inventory.slice().reverse().map(item => `
                        <div class="${window.getCardGradeStyle(item.grade)} rounded-2xl p-2 cursor-pointer shadow-sm active:scale-95 transition-transform" 
                             style="aspect-ratio: 3/4; display: flex; flex-direction: column; align-items: center; justify-content: space-between; position: relative; overflow: hidden;"
                             onclick="window.openCardAction('${item.id}')">
                            ${window.getSmallBadge(item.grade)}
                            <div style="flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; margin-top: 0.75rem;">
                                ${item.imgUrl ? `<img src="${item.imgUrl}" style="width: 3rem; height: 3rem; object-fit: contain; filter: drop-shadow(0 4px 3px rgba(0,0,0,0.1));" onerror="this.style.display='none';this.nextElementSibling.style.display='block';"/> <div style="font-size: 1.875rem; line-height: 2.25rem; z-index: 10; display: none;">${item.emoji}</div>` : `<div style="font-size: 1.875rem; line-height: 2.25rem; z-index: 10;">${item.emoji}</div>`}
                            </div>
                            <div style="font-size: 0.625rem; font-weight: 900; color: #1e293b; width: 100%; text-align: center; z-index: 10; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-transform: capitalize; margin-bottom: 0.25rem;">${item.w}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
};

window.renderSocial = function() {
    const sub = window.state.socialTab || 'ranking';
    if (sub === 'userDex') return window.renderUserDex();

    return `
        <div class="p-4 w-full h-full flex flex-col">
            <div class="flex bg-gray-200 rounded-full p-1 mb-4 shadow-inner text-[11px] shrink-0">
                <button onclick="window.state.socialTab='ranking'; window.render()" class="flex-1 py-2.5 rounded-full font-bold transition-all ${sub === 'ranking' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}">🏆 랭킹</button>
                <button onclick="window.state.socialTab='friends'; window.render()" class="flex-1 py-2.5 rounded-full font-bold transition-all ${sub === 'friends' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}">👥 친구</button>
                <button onclick="window.state.socialTab='market'; window.render()" class="flex-1 py-2.5 rounded-full font-bold transition-all ${sub === 'market' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}">🤝 거래소</button>
                <button onclick="window.loadSocialData()" class="px-3 bg-blue-100 text-blue-600 rounded-full ml-1 active:bg-blue-200"><i class="fa-solid fa-rotate-right"></i></button>
            </div>
            <div class="flex-1 overflow-y-auto w-full hide-scrollbar">
                ${sub === 'ranking' ? window.renderRanking() : sub === 'friends' ? window.renderFriends() : window.renderMarket()}
            </div>
        </div>
    `;
};

window.renderRanking = function() {
    if(window.state.usersList.length === 0) return `<div class="text-center mt-10 text-gray-400 font-bold">오른쪽 위 새로고침 버튼을 누르세요.</div>`;
    return window.state.usersList.map((u, i) => {
        const userName = u.email ? u.email.split('@')[0] : '유저';
        return `
        <div class="bg-white p-3 rounded-2xl shadow-sm mb-3 flex items-center justify-between border border-gray-100 cursor-pointer active:scale-95 transition-transform"
             onclick="window.viewUserDex('${u.uid}', '${u.email || ''}')">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full ${i===0 ? 'bg-yellow-400 text-white' : i===1 ? 'bg-gray-300 text-white' : i===2 ? 'bg-orange-300 text-white' : 'bg-blue-50 text-blue-500'} font-black flex items-center justify-center text-lg shadow-inner">${i+1}</div>
                <div>
                    <div class="font-black text-sm text-gray-800">${userName}</div>
                    <div class="text-[10px] text-blue-500 font-bold mt-0.5">도감 가치: ${u.collectionValue || 0}점</div>
                </div>
            </div>
            <div class="flex flex-col items-center">
                <span class="text-[10px] text-gray-400 font-bold mb-1">도감 구경</span>
                <i class="fa-solid fa-chevron-right text-gray-300"></i>
            </div>
        </div>
    `}).join('');
};

window.renderFriends = function() {
    const reqs = window.state.friendRequests || [];
    const myFriendsData = window.state.usersList.filter(u => (window.state.friends || []).includes(u.uid));
    
    return `
        <div class="flex flex-col gap-4">
            <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <h3 class="font-black text-gray-800 mb-2"><i class="fa-solid fa-magnifying-glass text-blue-500"></i> 이메일로 친구 찾기</h3>
                <div class="flex gap-2">
                    <input type="email" id="friend-search-input" placeholder="친구 이메일 입력..." class="flex-1 bg-gray-100 px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <button onclick="window.searchFriend()" class="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm active:bg-blue-600">검색</button>
                </div>
            </div>

            ${reqs.length > 0 ? `
                <div class="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <h3 class="font-black text-indigo-800 mb-3"><i class="fa-solid fa-bell text-indigo-500"></i> 친구 요청 (${reqs.length})</h3>
                    ${reqs.map(req => {
                        const reqName = req.email ? req.email.split('@')[0] : '유저';
                        return `
                        <div class="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm mb-2">
                            <span class="font-bold text-sm text-gray-800">${reqName}님</span>
                            <div class="flex gap-2">
                                <button onclick="window.openCustomPrompt('${reqName}님의 친구 요청을 수락하시겠습니까?', false, 'ACCEPT_FRIEND', '${req.uid}')" class="bg-blue-500 text-white px-3 py-1 rounded-lg font-bold text-xs active:bg-blue-600">수락</button>
                                <button onclick="window.openCustomPrompt('요청을 거절하시겠습니까?', false, 'REJECT_FRIEND', '${req.uid}')" class="bg-gray-200 text-gray-600 px-3 py-1 rounded-lg font-bold text-xs active:bg-gray-300">거절</button>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            ` : ''}
            
            <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <h3 class="font-black text-gray-800 mb-3"><i class="fa-solid fa-user-group text-blue-500"></i> 내 친구 목록 (${myFriendsData.length})</h3>
                ${myFriendsData.length === 0 ? '<p class="text-xs text-gray-400 font-bold text-center py-4">아직 친구가 없습니다.<br>위에서 검색하거나 랭킹에서 추가해보세요!</p>' : ''}
                ${myFriendsData.map(u => {
                    const userName = u.email ? u.email.split('@')[0] : '유저';
                    return `
                    <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl mb-2 cursor-pointer active:bg-slate-100 transition-colors" onclick="window.viewUserDex('${u.uid}', '${u.email || ''}')">
                        <span class="font-bold text-sm text-gray-800">${userName}</span>
                        <span class="text-[10px] text-gray-400 font-bold"><i class="fa-solid fa-chevron-right"></i> 도감 보기</span>
                    </div>
                `}).join('')}
            </div>
        </div>
    `;
};

window.renderMarket = function() {
    if(window.state.marketList.length === 0) return `<div class="text-center mt-10 text-gray-400 font-bold">등록된 카드가 없습니다.<br>도감에서 카드를 자유롭게 올려보세요!</div>`;
    return `
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; padding-bottom: 1rem;">
            ${window.state.marketList.map(m => {
                const sellerName = m.sellerEmail ? m.sellerEmail.split('@')[0] : '유저';
                return `
                <div class="${window.getCardGradeStyle(m.card.grade)} rounded-2xl p-3 flex flex-col items-center relative overflow-hidden shadow-sm justify-between" style="aspect-ratio: 3/4;">
                    ${window.getSmallBadge(m.card.grade)}
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; margin-top: 0.5rem;">
                        ${m.card.imgUrl ? `<img src="${m.card.imgUrl}" style="width: 3.5rem; height: 3.5rem; object-fit: contain; filter: drop-shadow(0 4px 3px rgba(0,0,0,0.1));" onerror="this.style.display='none';this.nextElementSibling.style.display='block';"/><div style="font-size: 2.25rem; line-height: 2.5rem; z-index: 10; display:none;">${m.card.emoji}</div>` : `<div style="font-size: 2.25rem; line-height: 2.5rem; z-index: 10;">${m.card.emoji}</div>`}
                    </div>
                    <div style="width: 100%; display: flex; flex-direction: column; align-items: center; margin-bottom: 0.25rem;">
                        <div style="font-size: 0.75rem; font-weight: 900; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-transform: capitalize; width: 100%; text-align: center;">${m.card.w}</div>
                        <div style="font-size: 0.5625rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; text-align: center;">${sellerName}님 판매</div>
                    </div>
                    <button onclick="window.openCustomPrompt('${sellerName}님의 카드를 ${m.price}코인에 구매할까요?', false, 'BUY_MARKET', '${m.id}')" class="w-full bg-blue-500 text-white font-black text-[12px] py-2 rounded-xl active:bg-blue-600 shadow-[0_3px_0_#1d4ed8] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1 shrink-0">
                        <i class="fa-solid fa-coins text-[10px]"></i> ${m.price}
                    </button>
                </div>
            `}).join('')}
        </div>
    `;
};

window.renderUserDex = function() {
    const u = window.state.viewingUser;
    const isMe = window.currentUser && u.uid === window.currentUser.uid;
    const isFriend = (window.state.friends || []).includes(u.uid);
    const userName = u.email ? u.email.split('@')[0] : '유저';
    
    let friendBtn = '';
    if (!isMe && !isFriend) {
        friendBtn = `<button onclick="window.openCustomPrompt('${userName}님에게 친구 요청을 보낼까요?', false, 'ADD_FRIEND', '${u.uid}')" class="bg-blue-500 text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-sm active:scale-95 transition-transform"><i class="fa-solid fa-user-plus"></i> 친구 신청</button>`;
    }

    return `
        <div class="flex items-center justify-between mb-4 sticky top-0 bg-slate-50 z-20 pb-2 border-b border-gray-200">
            <button onclick="window.state.socialTab='ranking'; window.render()" class="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-gray-600 font-bold shadow-sm active:bg-gray-50"><i class="fa-solid fa-arrow-left"></i></button>
            <h2 class="text-sm font-black text-slate-800 truncate px-2">${userName}님의 도감</h2>
            <div>${friendBtn}</div>
        </div>
        ${!u.inventory || u.inventory.length === 0 ? '<div class="text-center text-gray-400 mt-5 font-bold">수집한 카드가 없습니다.</div>' : `
        <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; padding-bottom: 1rem;">
            ${u.inventory.slice().reverse().map(item => `
                <div class="${window.getCardGradeStyle(item.grade)} aspect-[3/4] rounded-2xl p-2 flex flex-col items-center justify-between relative overflow-hidden shadow-sm" onclick="window.speak('${item.w}')">
                    ${window.getSmallBadge(item.grade)}
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; margin-top: 0.75rem;">
                        ${item.imgUrl ? `<img src="${item.imgUrl}" style="width: 2.5rem; height: 2.5rem; object-fit: contain; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));" onerror="this.style.display='none';this.nextElementSibling.style.display='block';"/><div style="font-size: 1.5rem; line-height: 2rem; z-index: 10; display:none;">${item.emoji}</div>` : `<div style="font-size: 1.5rem; line-height: 2rem; z-index: 10;">${item.emoji}</div>`}
                    </div>
                    <div style="font-size: 0.625rem; font-weight: 900; color: #1e293b; width: 100%; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-transform: capitalize; margin-bottom: 0.25rem;">${item.w}</div>
                </div>
            `).join('')}
        </div>
        `}
    `;
};

window.navButton = function(id, icon, text, customAction) {
    const isActive = window.state.tab === id;
    const action = customAction || `window.changeTab('${id}')`;
    return `
        <button onclick="${action}" class="flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all ${isActive ? 'text-blue-600 scale-110' : 'text-gray-400'}">
            <div class="${isActive ? 'bg-blue-100' : ''} w-8 h-8 rounded-xl flex items-center justify-center text-[15px]">
                <i class="fa-solid ${icon}"></i>
            </div>
            <span class="text-[8px] font-bold whitespace-nowrap">${text}</span>
        </button>
    `;
};

window.render = function() {
    const app = document.getElementById('app');
    if (!window.isAuthReady) return;

    if (!window.currentUser && !window.isGuestMode) {
        app.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center p-8 w-full bg-gradient-to-b from-blue-50 to-blue-100 h-full overflow-y-auto">
                ${window.state.toastMsg ? `<div class="absolute top-10 bg-gray-800 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl animate-pop text-center z-[100] max-w-[90%]">${window.state.toastMsg}</div>` : ''}
                <div class="text-6xl mb-6 animate-bounce">👻</div>
                <h1 class="text-4xl font-black text-blue-800 mb-2 tracking-tight text-center">Phonics<br>Monster</h1>
                <p class="text-gray-500 font-bold mb-8 text-center text-sm">클라우드 저장소에 연결합니다.</p>
                <div class="w-full bg-white p-6 rounded-3xl shadow-xl flex flex-col gap-4 max-w-[300px]">
                    <input type="email" id="email" placeholder="이메일 주소" class="w-full bg-gray-100 px-4 py-3 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-400">
                    <input type="password" id="password" placeholder="비밀번호 (6자 이상)" class="w-full bg-gray-100 px-4 py-3 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 mb-2">
                    <button onclick="window.handleAuth(true)" class="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-[0_4px_0_#1d4ed8] active:translate-y-1 active:shadow-none transition-all">로그인</button>
                    <button onclick="window.handleAuth(false)" class="w-full bg-white text-blue-600 border-2 border-blue-200 font-black py-4 rounded-xl active:bg-blue-50 transition-all mt-2">새 계정 만들기</button>
                </div>
            </div>
        `;
        return;
    }

    const toastHtml = window.state.toastMsg ? `<div class="absolute top-20 left-1/2 -translate-x-1/2 z-[500] bg-gray-800 text-white px-6 py-3 rounded-full font-bold text-sm shadow-2xl animate-pop whitespace-nowrap">${window.state.toastMsg}</div>` : '';

    const customPromptHtml = window.state.customPrompt ? `
        <div class="absolute inset-0 z-[400] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-pop">
                <div class="text-[15px] font-black text-gray-800 text-center leading-relaxed whitespace-pre-line">${window.state.customPrompt.message}</div>
                ${window.state.customPrompt.hasInput ? `<input type="number" id="prompt-input" class="w-full bg-gray-100 p-4 rounded-xl font-black text-center text-lg outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" placeholder="가격(코인) 입력">` : ''}
                <div class="flex gap-2 mt-2">
                    <button onclick="window.closeCustomPrompt()" class="flex-1 bg-gray-100 text-gray-500 font-black py-3.5 rounded-xl active:bg-gray-200 transition-colors">취소</button>
                    <button onclick="window.confirmCustomPrompt()" class="flex-1 bg-blue-500 text-white font-black py-3.5 rounded-xl active:bg-blue-600 shadow-[0_3px_0_#1d4ed8] transition-all">확인</button>
                </div>
            </div>
        </div>
    ` : '';

    const actionModalHtml = window.state.actionCard ? `
        <div class="absolute inset-0 z-[300] bg-black/60 flex flex-col items-center justify-end p-4 backdrop-blur-sm" onclick="window.closeCardAction()">
            <div class="bg-white w-full max-w-sm rounded-3xl p-6 flex flex-col gap-3 shadow-2xl animate-pop pb-safe" onclick="event.stopPropagation()">
                <div class="flex items-center gap-4 mb-2 pb-4 border-b border-gray-100">
                    <div class="w-16 h-16 ${window.getCardGradeStyle(window.state.actionCard.grade)} rounded-xl flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                        ${window.getSmallBadge(window.state.actionCard.grade)}
                        ${window.state.actionCard.imgUrl ? `<img src="${window.state.actionCard.imgUrl}" class="w-12 h-12 object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" /><div class="text-3xl" style="display:none;">${window.state.actionCard.emoji}</div>` : `<div class="text-3xl">${window.state.actionCard.emoji}</div>`}
                    </div>
                    <div class="flex flex-col flex-1 overflow-hidden">
                        <div class="text-xs font-bold text-gray-400 truncate">${window.state.actionCard.kr}</div>
                        <div class="text-xl font-black text-gray-800 capitalize truncate">${window.state.actionCard.w}</div>
                    </div>
                </div>
                <button onclick="window.speak('${window.state.actionCard.w}'); window.closeCardAction();" class="w-full bg-blue-50 text-blue-600 font-bold py-3.5 rounded-xl active:bg-blue-100 flex items-center justify-center gap-2">
                    <i class="fa-solid fa-volume-high"></i> 영어 발음 듣기
                </button>
                <button onclick="window.actionMarketSell()" class="w-full bg-purple-50 text-purple-600 font-bold py-3.5 rounded-xl active:bg-purple-100 flex items-center justify-center gap-2">
                    <i class="fa-solid fa-users"></i> 친구 거래소에 올리기
                </button>
                <button onclick="window.actionSystemSell()" class="w-full bg-gray-50 text-gray-600 font-bold py-3.5 rounded-xl active:bg-gray-100 flex items-center justify-center gap-2">
                    <i class="fa-solid fa-coins"></i> 상점에 즉시 팔기 (반값)
                </button>
                <button onclick="window.closeCardAction()" class="w-full mt-2 bg-gray-800 text-white font-black py-4 rounded-xl active:scale-95 transition-transform">
                    닫기
                </button>
            </div>
        </div>
    ` : '';

    const packOverlayHtml = window.state.packOpening ? `
        <div class="absolute inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
            ${window.state.revealedCard ? `
                <div class="${window.getCardGradeStyle(window.state.revealedCard.grade)} rounded-3xl p-8 w-full max-w-[280px] animate-pop flex flex-col items-center text-center relative overflow-hidden">
                    ${window.state.revealedCard.grade !== 'NORMAL' ? '<div class="absolute inset-0 bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=\')] opacity-50 mix-blend-overlay"></div>' : ''}
                    <div class="relative z-10 w-full flex flex-col items-center">
                        <div class="mb-6">${window.getCardGradeText(window.state.revealedCard.grade)}</div>
                        ${window.state.revealedCard.imgUrl 
                            ? `<img src="${window.state.revealedCard.imgUrl}" class="w-32 h-32 object-contain drop-shadow-xl animate-bounce mb-4" onerror="this.style.display='none';this.nextElementSibling.style.display='block';"/><div class="text-8xl mb-4 drop-shadow-md" style="display:none;">${window.state.revealedCard.emoji}</div>`
                            : `<div class="text-8xl mb-4 drop-shadow-md">${window.state.revealedCard.emoji}</div>`
                        }
                        <div class="text-gray-500 font-black mb-1 bg-white/50 px-3 py-1 rounded-full text-sm">${window.state.revealedCard.kr}</div>
                        <div class="text-4xl font-black mb-8 text-gray-800 tracking-wider capitalize">${window.state.revealedCard.w}</div>
                        <div class="w-full flex gap-2 flex-col">
                            <button onclick="window.keepCard()" class="w-full py-3.5 bg-blue-500 text-white rounded-xl font-black text-lg shadow-[0_4px_0_#1d4ed8] active:translate-y-1 active:shadow-none transition-all">도감에 넣기</button>
                            <button onclick="window.discardCard()" class="w-full py-3 bg-red-50 text-red-500 border border-red-200 rounded-xl font-bold text-sm active:bg-red-100 transition-colors">버리기 (+10 코인)</button>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="booster-pack animate-pack-open mb-8">
                    <div class="booster-pack-top"></div>
                    <div class="text-white font-black text-3xl italic drop-shadow-md transform -rotate-12 mt-4">MONSTER</div>
                    <div class="text-yellow-200 font-bold text-lg tracking-widest mt-1">PACK</div>
                    <div class="booster-circle"><div class="booster-circle-top"></div><div class="booster-circle-mid"></div><div class="booster-circle-btn"></div></div>
                    <div class="booster-pack-bottom"></div>
                </div>
                <div class="text-white font-bold text-2xl animate-pulse">팩 뜯는 중...</div>
            `}
        </div>
    ` : '';

    let contentHtml = '';
    if(window.state.tab === 'learning') contentHtml = window.renderLearning();
    if(window.state.tab === 'training') contentHtml = window.renderTraining();
    if(window.state.tab === 'shop') contentHtml = window.renderShop();
    if(window.state.tab === 'altar') contentHtml = window.renderAltar();
    if(window.state.tab === 'dex') contentHtml = window.renderDex();
    if(window.state.tab === 'social') contentHtml = window.renderSocial(); 

    const userEmailPrefix = window.currentUser && window.currentUser.email ? window.currentUser.email.split('@')[0] : 'Guest';
    const statusLabel = window.isGuestMode ? '<span class="text-[9px] text-red-400 font-black">(오프라인 모드)</span>' : '<span class="text-[9px] text-gray-400">로그아웃</span>';

    app.innerHTML = `
        <header class="pt-safe bg-white border-b shrink-0 z-50 shadow-sm relative">
            <div class="h-14 flex items-center justify-between px-5">
                <button onclick="window.logout()" class="flex items-center gap-2 font-bold text-gray-800 bg-gray-50 px-2 py-1 rounded-lg active:scale-95 transition-transform border border-gray-100">
                    <div class="w-8 h-8 ${window.isGuestMode ? 'bg-red-100' : 'bg-blue-100'} rounded-full flex items-center justify-center text-lg">👦</div>
                    <div class="flex flex-col items-start">
                        <span class="text-xs ${window.isGuestMode ? 'text-red-600' : 'text-blue-600'}">${userEmailPrefix}</span>
                        ${statusLabel}
                    </div>
                </button>
                <div class="bg-yellow-50 px-4 py-1.5 rounded-full border border-yellow-200 font-black text-yellow-600 shadow-inner flex items-center gap-1">
                    <i class="fa-solid fa-coins"></i> ${window.state.coins}
                </div>
            </div>
        </header>

        ${toastHtml}
        ${packOverlayHtml}
        ${actionModalHtml}
        ${customPromptHtml}

        <main class="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-50 w-full hide-scrollbar flex flex-col" id="main-content">
            ${contentHtml}
        </main>

        <!-- 🟢 플로팅 유튜브 배너 -->
        <a href="[https://youtube.com/channel/UCYTmPgr--s2x3hJW14wDx_g?si=DeqwKVK4kXz2nHYi](https://youtube.com/channel/UCYTmPgr--s2x3hJW14wDx_g?si=DeqwKVK4kXz2nHYi)" target="_blank"
           class="fixed bottom-20 right-4 bg-white/95 backdrop-blur-md border border-red-100 shadow-[0_10px_20px_rgba(239,68,68,0.2)] rounded-full px-3 py-2 flex items-center gap-2 z-[100] animate-bounce active:scale-95 transition-transform no-underline">
            <div class="text-red-600 text-[24px] flex items-center justify-center w-8 h-8"><i class="fa-brands fa-youtube"></i></div>
            <div class="flex flex-col pr-1">
                <span class="text-[11px] font-black text-slate-800 leading-tight">파닉스 AI영어</span>
                <span class="text-[9px] font-bold text-red-500 leading-tight">유튜브 보러가기 ▶</span>
            </div>
        </a>

        <nav class="pb-safe bg-white border-t shrink-0 z-50 relative">
            <div class="h-16 flex items-center justify-around px-1 gap-1">
                ${window.navButton('learning', 'fa-book-open', '학습장')}
                ${window.navButton('training', 'fa-dumbbell', '훈련소')}
                ${window.navButton('shop', 'fa-store', '상점')}
                ${window.navButton('altar', 'fa-bolt', '제단')}
                ${window.navButton('dex', 'fa-address-book', '도감')}
                ${window.navButton('social', 'fa-globe', '소셜', 'window.changeTab(\'social\'); window.loadSocialData();')}
            </div>
        </nav>
    `;
};
