window.loadSocialData = async function() {
    if(window.isGuestMode) return window.showToast("온라인 연결이 필요합니다.");
    window.showToast("데이터 갱신 중...");
    try {
        if(window.db) {
            const myDoc = await window.db.collection("users").doc(window.currentUser.uid).get();
            if(myDoc.exists) {
                window.state.friends = myDoc.data().friends || [];
                window.state.friendRequests = myDoc.data().friendRequests || [];
            }
            const usersSnap = await window.db.collection("users").get();
            let users = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
            users.sort((a,b) => (b.collectionValue || 0) - (a.collectionValue || 0));
            window.state.usersList = users.slice(0, 50);

            const marketSnap = await window.db.collection("market").get();
            let market = marketSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const myFriends = window.state.friends || [];
            
            window.state.marketList = market.filter(m => m.sellerUid === window.currentUser.uid || myFriends.includes(m.sellerUid));
            window.state.marketList.sort((a,b) => b.timestamp - a.timestamp);
        }
        window.render();
    } catch (e) { console.error(e); }
};

window.searchFriend = async function() {
    const input = document.getElementById('friend-search-input').value.trim();
    if(!input) return window.showToast("친구의 이메일을 입력해주세요!");
    if(input === window.currentUser.email) return window.showToast("본인은 검색할 수 없습니다.");
    
    window.showToast("검색 중...");
    try {
        if(window.db) {
            const snap = await window.db.collection("users").where("email", "==", input).get();
            if(snap.empty) { window.showToast("해당 이메일을 가진 유저가 없습니다."); } 
            else {
                const targetUser = snap.docs[0];
                const targetEmail = targetUser.data().email || '알수없음';
                const targetName = targetEmail.split('@')[0];
                window.openCustomPrompt(`${targetName}님을 찾았습니다!\n친구 요청을 보낼까요?`, false, 'ADD_FRIEND', targetUser.id);
            }
        }
    } catch(e) { window.showToast("검색 중 오류가 발생했습니다."); }
};

window.viewUserDex = function(uid, email) {
    const user = window.state.usersList.find(u => u.uid === uid);
    if(user) {
        window.state.viewingUser = { uid: uid, email: email, inventory: user.inventory || [] };
        window.state.socialTab = 'userDex';
        window.render();
    }
};

window.userUnsubscribe = null; 

window.startGuestMode = function(reason) {
    if (window.isGuestMode) return;
    window.isAuthReady = true; window.isGuestMode = true;
    window.currentUser = { uid: "guest", email: "Guest@offline" };
    const savedData = localStorage.getItem('phonicsAppState');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            window.state.coins = data.coins !== undefined ? data.coins : 200;
            window.state.inventory = data.inventory || [];
            window.state.friends = data.friends || [];
            window.state.friendRequests = data.friendRequests || [];
        } catch(e) {}
    }
    window.changeTab('learning');
};

const fallbackTimer = setTimeout(() => {
    if (!window.isAuthReady) {
        window.showToast("네트워크 차단됨: 앱을 바로 엽니다!");
        window.startGuestMode("3초 무응답 타임아웃");
    }
}, 3000); 

try {
    if (typeof firebase === 'undefined') throw new Error("Firebase 차단됨");

    window.auth = firebase.auth();
    window.db = firebase.firestore();

    window.handleAuth = async function(isLogin) {
        const email = document.getElementById('email').value; const password = document.getElementById('password').value;
        if(!email || !password) return window.showToast('이메일과 비밀번호를 모두 입력해주세요.');
        if(password.length < 6) return window.showToast('비밀번호는 6자리 이상이어야 합니다.');
        
        window.showToast("서버와 통신 중...");
        try {
            if (isLogin) await window.auth.signInWithEmailAndPassword(email, password);
            else { await window.auth.createUserWithEmailAndPassword(email, password); window.showToast('가입 환영! 시작합니다. 🪙'); }
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') window.showToast('이미 가입된 이메일입니다.');
            else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') window.showToast('이메일이나 비밀번호가 틀렸습니다.');
            else window.showToast('오류 발생: 다시 시도해주세요.');
        }
    };

    window.logout = async function() { await window.auth.signOut(); window.showToast('로그아웃 되었습니다.'); };

    window.auth.onAuthStateChanged(async (user) => {
        if (window.isGuestMode) return; 
        clearTimeout(fallbackTimer); 
        window.isAuthReady = true;
        
        if (user) {
            window.currentUser = user;
            try {
                if(window.userUnsubscribe) window.userUnsubscribe();
                window.userUnsubscribe = window.db.collection("users").doc(user.uid).onSnapshot((docSnap) => {
                    if (docSnap.exists) {
                        const data = docSnap.data();
                        window.state.coins = data.coins !== undefined ? data.coins : 200;
                        window.state.inventory = data.inventory || [];
                        window.state.friends = data.friends || [];
                        window.state.friendRequests = data.friendRequests || [];
                    } else {
                        window.state.coins = 200; window.state.inventory = []; window.state.friends = []; window.state.friendRequests = [];
                        window.saveData();
                    }
                    if (!window.state.isProcessing && !window.state.isClickingMode && !window.state.packOpening) {
                        window.render();
                    }
                    if (!window.state.initialLoadDone) {
                        window.state.initialLoadDone = true;
                        window.changeTab('learning');
                    }
                }, (error) => {
                    console.error(error);
                    if(error.code === 'permission-denied') window.showToast("Firebase 규칙(Rules)이 닫혀있습니다! 콘솔에서 권한을 허용해주세요.");
                });
                
            } catch(error) {
                window.showToast("오프라인 모드로 실행합니다.");
                window.startGuestMode("Firestore 권한 오류");
            }
        } else {
            window.currentUser = null;
            if(window.userUnsubscribe) { window.userUnsubscribe(); window.userUnsubscribe = null; }
            window.render();
        }
    });

} catch(error) {
    clearTimeout(fallbackTimer);
    window.showToast("보안 환경 감지: 앱을 바로 엽니다!");
    window.startGuestMode("스크립트 차단");
}

if (document.readyState === 'complete' || document.readyState === 'interactive') window.render();
else document.addEventListener('DOMContentLoaded', window.render);
