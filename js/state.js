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