const CLOUD_URL = "[https://storage.googleapis.com/alpamon/alphabetmon_images/](https://storage.googleapis.com/alpamon/alphabetmon_images/)";
const WORD_URL = "[https://storage.googleapis.com/alpamon/](https://storage.googleapis.com/alpamon/)"; 

const ALPAMON_DB = {
    BABY: [ 
        { w: 'Bravy', kr: '브라비', id: 'B_1_baby_브라비.png', emoji: '✨' },
        { w: 'Coby', kr: '코비', id: 'C_1_baby_코비.png', emoji: '✨' },
        { w: 'Dravy', kr: '드레비', id: 'D_1_baby_드레비.png', emoji: '✨' },
        { w: 'Flavy', kr: '플레비', id: 'F_1_baby_플레비.png', emoji: '✨' },
        { w: 'Gamby', kr: '감비', id: 'G_1_baby_감비.png', emoji: '✨' },
        { w: 'Huriby', kr: '허리비', id: 'H_1_baby_허리비.png', emoji: '✨' },
        { w: 'Jungby', kr: '정비', id: 'J_1_baby_정비.png', emoji: '✨' },
        { w: 'Kaiby', kr: '카이비', id: 'K_1_baby_카이비.png', emoji: '✨' },
        { w: 'Lunaby', kr: '루나비', id: 'L_1_baby_루나비.png', emoji: '✨' },
        { w: 'Metalby', kr: '메탈비', id: 'M_1_baby_메탈비.png', emoji: '✨' },
        { w: 'Kniby', kr: '나이비', id: 'N_1_baby_나이비.png', emoji: '✨' },
        { w: 'Phonixby', kr: '피닉비', id: 'P_1_baby_피닉비.png', emoji: '✨' },
        { w: 'Quaby', kr: '퀘이비', id: 'Q_1_baby_퀘이비.png', emoji: '✨' },
        { w: 'Rayby', kr: '레이비', id: 'R_1_baby_레이비.png', emoji: '✨' },
        { w: 'Stormby', kr: '스톰비', id: 'S_1_baby_스톰비.png', emoji: '✨' },
        { w: 'Taiby', kr: '타이비', id: 'T_1_baby_타이비.png', emoji: '✨' },
        { w: 'Voltby', kr: '볼트비', id: 'V_1_baby_볼트비.png', emoji: '✨' },
        { w: 'Wavy', kr: '웨이비', id: 'W_1_baby_웨이비.png', emoji: '✨' },
        { w: 'Exiby', kr: '엑시비', id: 'X_1_baby_엑시비.png', emoji: '✨' },
        { w: 'Yotaby', kr: '요타비', id: 'Y_1_baby_요타비.png', emoji: '✨' },
        { w: 'Zetaby', kr: '제타비', id: 'Z_1_baby_제타비.png', emoji: '✨' }
    ],
    MID: [ 
        { w: 'Bravo', kr: '브라보', id: 'B_2_mid_브라보.png', emoji: '✨' },
        { w: 'Coral', kr: '코랄', id: 'C_2_mid_코랄.png', emoji: '✨' },
        { w: 'Drake', kr: '드레이크', id: 'D_2_mid_드레이크.png', emoji: '✨' },
        { w: 'Flare', kr: '플레어', id: 'F_2_mid_플레어.png', emoji: '✨' },
        { w: 'Gamma', kr: '감마', id: 'G_2_mid_감마.png', emoji: '✨' },
        { w: 'Hurricane', kr: '허리케인', id: 'H_2_mid_허리케인.png', emoji: '✨' },
        { w: 'Jungle', kr: '정글', id: 'J_2_mid_정글.png', emoji: '✨' },
        { w: 'Kaiser', kr: '카이저', id: 'K_2_mid_카이저.png', emoji: '✨' },
        { w: 'Luna', kr: '루나', id: 'L_2_mid_루나.png', emoji: '✨' },
        { w: 'Metal', kr: '메탈', id: 'M_2_mid_메탈.png', emoji: '✨' },
        { w: 'Knight', kr: '나이트', id: 'N_2_mid_나이트.png', emoji: '✨' },
        { w: 'Phoenix', kr: '피닉스', id: 'P_2_mid_피닉스.png', emoji: '✨' },
        { w: 'Quasar', kr: '퀘이사', id: 'Q_2_mid_퀘이사.png', emoji: '✨' },
        { w: 'Ray', kr: '레이', id: 'R_2_mid_레이.png', emoji: '✨' },
        { w: 'Storm', kr: '스톰', id: 'S_2_mid_스톰.png', emoji: '✨' },
        { w: 'Titan', kr: '타이탄', id: 'T_2_mid_타이탄.png', emoji: '✨' },
        { w: 'Volt', kr: '볼트', id: 'V_2_mid_볼트.png', emoji: '✨' },
        { w: 'Wave', kr: '웨이브', id: 'W_2_mid_웨이브.png', emoji: '✨' },
        { w: 'Exo', kr: '엑소', id: 'X_2_mid_엑소.png', emoji: '✨' },
        { w: 'Yota', kr: '요타', id: 'Y_2_mid_요타.png', emoji: '✨' },
        { w: 'Zeta', kr: '제타', id: 'Z_2_mid_제타.png', emoji: '✨' }
    ],
    FINAL: [ 
        { w: 'Bravogon', kr: '브라보곤', id: 'B_3_final_브라보곤.png', emoji: '✨' },
        { w: 'Coralgon', kr: '코랄곤', id: 'C_3_final_코랄곤.png', emoji: '✨' },
        { w: 'Drakegon', kr: '드레이크곤', id: 'D_3_final_드레이크곤.png', emoji: '✨' },
        { w: 'Flaregon', kr: '플레어곤', id: 'F_3_final_플레어곤.png', emoji: '✨' },
        { w: 'Gammagon', kr: '감마곤', id: 'G_3_final_감마곤.png', emoji: '✨' },
        { w: 'Huricagon', kr: '허리케곤', id: 'H_3_final_허리케곤.png', emoji: '✨' },
        { w: 'Junglegon', kr: '정글곤', id: 'J_3_final_정글곤.png', emoji: '✨' },
        { w: 'Kaisergon', kr: '카이저곤', id: 'K_3_final_카이저곤.png', emoji: '✨' },
        { w: 'Lunagon', kr: '루나곤', id: 'L_3_final_루나곤.png', emoji: '✨' },
        { w: 'Metalgon', kr: '메탈곤', id: 'M_3_final_메탈곤.png', emoji: '✨' },
        { w: 'Knightgon', kr: '나이트곤', id: 'N_3_final_나이트곤.png', emoji: '✨' },
        { w: 'Phoenixgon', kr: '피닉곤', id: 'P_3_final_피닉곤.png', emoji: '✨' },
        { w: 'Quasargon', kr: '퀘이사곤', id: 'Q_3_final_퀘이사곤.png', emoji: '✨' },
        { w: 'Raygon', kr: '레이곤', id: 'R_3_final_레이곤.png', emoji: '✨' },
        { w: 'Stormgon', kr: '스톰곤', id: 'S_3_final_스톰곤.png', emoji: '✨' },
        { w: 'Titangon', kr: '타이탄곤', id: 'T_3_final_타이탄곤.png', emoji: '✨' },
        { w: 'Voltgon', kr: '볼트곤', id: 'V_3_final_볼트곤.png', emoji: '✨' },
        { w: 'Wavegon', kr: '웨이브곤', id: 'W_3_final_웨이브곤.png', emoji: '✨' },
        { w: 'Exion', kr: '엑시온', id: 'X_3_final_엑시온.png', emoji: '✨' },
        { w: 'Yotagon', kr: '요타곤', id: 'Y_3_final_요타곤.png', emoji: '✨' },
        { w: 'Zetagon', kr: '제타곤', id: 'Z_3_final_제타곤.png', emoji: '✨' }
    ],
    GOD: [ 
        { w: 'Alphamon', kr: '알파몬', id: '00_god_A_알파몬.png', emoji: '✨' },
        { w: 'Echomon', kr: '에코몬', id: '00_god_E_에코몬.png', emoji: '✨' },
        { w: 'Irismon', kr: '아이리스몬', id: '00_god_I_아이리스몬.png', emoji: '✨' },
        { w: 'Orbismon', kr: '오르비스몬', id: '00_god_O_오르비스몬.png', emoji: '✨' },
        { w: 'Unicornmon', kr: '유니콘몬', id: '00_god_U_유니콘몬.png', emoji: '✨' },
        { w: 'Omegamon', kr: '알파벳몬오메가', id: '99_OMEGA_알파벳몬오메가.png', emoji: '✨' }
    ]
};

const ALPHABET_DB = [
    {u:'A', l:'a', n:'에이', s:'애'}, {u:'B', l:'b', n:'비', s:'브'}, {u:'C', l:'c', n:'씨', s:'크'},
    {u:'D', l:'d', n:'디', s:'드'}, {u:'E', l:'e', n:'이', s:'에'}, {u:'F', l:'f', n:'에프', s:'프'},
    {u:'G', l:'g', n:'쥐', s:'그'}, {u:'H', l:'h', n:'에이치', s:'흐'}, {u:'I', l:'i', n:'아이', s:'이'},
    {u:'J', l:'j', n:'제이', s:'즈'}, {u:'K', l:'k', n:'케이', s:'크'}, {u:'L', l:'l', n:'엘', s:'을'},
    {u:'M', l:'m', n:'엠', s:'음'}, {u:'N', l:'n', n:'엔', s:'은'}, {u:'O', l:'o', n:'오우', s:'아'},
    {u:'P', l:'p', n:'피', s:'프'}, {u:'Q', l:'q', n:'큐', s:'쿠'}, {u:'R', l:'r', n:'알', s:'르'},
    {u:'S', l:'s', n:'에스', s:'스'}, {u:'T', l:'t', n:'티', s:'트'}, {u:'U', l:'u', n:'유', s:'어'},
    {u:'V', l:'v', n:'브이', s:'브'}, {u:'W', l:'w', n:'더블유', s:'우'}, {u:'X', l:'x', n:'엑스', s:'크스'},
    {u:'Y', l:'y', n:'와이', s:'여'}, {u:'Z', l:'z', n:'지', s:'즈'}
];

const RAW_WORDS = "cat:고양이:🐱:a,dog:개:🐶:o,pig:돼지:🐷:i,sun:태양:☀️:u,bed:침대:🛏️:e,bat:박쥐:🦇:a,hat:모자:🧢:a,map:지도:🗺️:a,cap:모자:🧢:a,fan:선풍기:🌬️:a,man:남자:👨:a,pan:팬:🍳:a,net:그물:🥅:e,red:빨강:🔴:e,leg:다리:🦵:e,pen:펜:🖊️:e,hen:암탉:🐔:e,sit:앉다:🪑:i,hit:치다:🏏:i,lip:입술:👄:i,six:육:6️⃣:i,box:상자:📦:o,fox:여우:🦊:o,top:팽이:🌀:o,hop:뛰다:🦘:o,mop:걸레:🧹:o,bug:벌레:🐛:u,rug:깔개:🔲:u,mug:머그컵:☕:u,nut:견과:🥜:u,cup:컵:🥤:u,bus:버스:🚌:u,tub:욕조:🛁:u,mud:진흙:🟤:u,web:거미줄:🕸️:e,wet:젖은:💧:e,vet:수의사:👩‍⚕️:e,zip:지퍼:🤐:i,win:이기다:🏆:i,fin:지느러미:🦈:i,bin:쓰레기통:🗑️:i,pin:핀:📍:i,mix:섞다:🥣:i,sad:슬픈:😢:a,mad:화난:😡:a,bad:나쁜:😈:a,bag:가방:👜:a,tag:태그:🏷️:a,wag:흔들다:🐕:a,jam:잼:🍓:a,ham:햄:🍖:a,ram:숫양:🐏:a,can:캔:🥫:a,van:승합차:🚐:a,run:달리다:🏃:u,fun:재미:🎉:u,gum:껌:🍬:u,hot:뜨거운:🔥:o,pot:냄비:🥘:o,dot:점:⏺️:o,log:통나무:🪵:o,jog:조깅:🏃‍♂️:o,cop:경찰:👮:o,pop:터지다:💥:o,sob:흐느끼다:😭:o,rob:도둑질:🦹:o,nod:끄덕이다:😌:o,rod:막대:🦯:o";
const CONS_WORDS = "bear:곰:🐻:b,tiger:호랑이:🐯:t,lion:사자:🦁:l,zebra:얼룩말:🦓:z,fish:물고기:🐟:f,mouse:생쥐:🐭:m,nest:둥지:🪹:n,rabbit:토끼:🐰:r,house:집:🏠:h,juice:주스:🧃:j,kite:연:🪁:k,grapes:포도:🍇:g,queen:여왕:👑:q,water:물:💧:w";
const WORDS_DB = [...RAW_WORDS.split(','), ...CONS_WORDS.split(',')].map(item => {
    const [w, kr, emoji, ans] = item.split(':');
    return { w, kr, emoji, ans, parts: w.split(''), imgUrl: `${WORD_URL}${w}.png` };
});

const VOWEL_DB = {
    'a': { sound: '애', fam: [{n:'-at', w:['cat','hat','bat','mat']}, {n:'-an', w:['can','fan','man','pan']}, {n:'-ap', w:['cap','map','tap']}], magic: ['cake','game','name','lake'], var: [{rule:'ar (아)', w:['car','park','star']}] },
    'e': { sound: '에', fam: [{n:'-en', w:['pen','hen','ten']}, {n:'-et', w:['net','wet','pet']}, {n:'-ell', w:['bell','well','fell']}], magic: ['here'], var: [{rule:'단어 끝 e (이)', w:['he','me','we']}, {rule:'ee/ea (이~)', w:['see','sea','leaf']}] },
    'i': { sound: '이', fam: [{n:'-it', w:['sit','hit','bit']}, {n:'-in', w:['win','pin','bin']}, {n:'-ig', w:['pig','big','dig']}], magic: ['kite','bike','five','nine'], var: [{rule:'ir (어)', w:['bird','girl','shirt']}] },
    'o': { sound: '아', fam: [{n:'-ot', w:['hot','pot','dot']}, {n:'-op', w:['mop','top','hop']}, {n:'-og', w:['dog','log','fog']}], magic: ['hope','nose','rose','bone'], var: [{rule:'or (오)', w:['corn','horn','fork']}] },
    'u': { sound: '어', fam: [{n:'-ug', w:['bug','rug','mug']}, {n:'-ub', w:['tub','rub','cub']}, {n:'-ut', w:['nut','cut','hut']}], magic: ['cute','tube','cube','mule'], var: [{rule:'ur (어)', w:['nurse','purple','turtle']}] }
};
const CONSONANT_DB = {
    locations: [
        { id: 'lips', title: '💋 입술 소리', tags: '(p, b, m, w)', items: [{id: 'p', kr: '프', w: 'pig'}, {id: 'b', kr: '브', w: 'bear'}, {id: 'm', kr: '음', w: 'mouse'}, {id: 'w', kr: '우/워', w: 'water'}]},
        { id: 'teeth', title: '🦷 혀끝 소리', tags: '(t, d, n, l)', items: [{id: 't', kr: '트', w: 'tiger'}, {id: 'd', kr: '드', w: 'dog'}, {id: 'n', kr: '은', w: 'nest'}, {id: 'l', kr: '을', w: 'lion'}]},
        { id: 'throat', title: '🗣️ 목 안쪽 소리', tags: '(k, g, c, q)', items: [{id: 'k', kr: '크', w: 'kite'}, {id: 'g', kr: '그', w: 'grapes'}, {id: 'c', kr: '크', w: 'cat'}, {id: 'q', kr: '쿠', w: 'queen'}]},
        { id: 'wind', title: '🌬️ 이·바람 소리', tags: '(s, z, f, v)', items: [{id: 's', kr: '스', w: 'sun'}, {id: 'z', kr: '즈', w: 'zebra'}, {id: 'f', kr: '프', w: 'fish'}, {id: 'v', kr: '브', w: 'van'}]},
        { id: 'etc', title: '기타 소리', tags: '(h, j, r, y, x)', items: [{id: 'h', kr: '흐', w: 'house'}, {id: 'j', kr: '즈', w: 'juice'}, {id: 'r', kr: '르', w: 'rabbit'}, {id: 'y', kr: '여', w: 'yo-yo'}, {id: 'x', kr: '크스', w: 'xylophone'}]}
    ],
    vs: [
        { p1: {id: 'p', kr: '바람만(프)', sound: '프', w: 'pig'}, p2: {id: 'b', kr: '목 떨림!(브)', sound: '브', w: 'bear'} },
        { p1: {id: 't', kr: '바람만(트)', sound: '트', w: 'tiger'}, p2: {id: 'd', kr: '목 떨림!(드)', sound: '드', w: 'dog'} },
        { p1: {id: 'k', kr: '바람만(크)', sound: '크', w: 'kite'}, p2: {id: 'g', kr: '목 떨림!(그)', sound: '그', w: 'grapes'} },
        { p1: {id: 's', kr: '바람만(스)', sound: '스', w: 'sun'}, p2: {id: 'z', kr: '목 떨림!(즈)', sound: '즈', w: 'zebra'} },
        { p1: {id: 'f', kr: '바람만(프)', sound: '프', w: 'fish'}, p2: {id: 'v', kr: '목 떨림!(브)', sound: '브', w: 'van'} }
    ]
};