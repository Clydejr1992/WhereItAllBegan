/* ================================================================
   WHERE IT ALL BEGAN — Community Portal  |  app.js  v8 FIREBASE
   Real-time sync via Firebase Realtime Database
   ================================================================ */
'use strict';

// ──────────────────────────────────────────────────────────────────
// FIREBASE — Real credentials
// ──────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyAGQjhY7mesPTyngzfOG2-UJm1nnOGZrg0",
  authDomain:        "whereitallbegan1-b30e5.firebaseapp.com",
  databaseURL:       "https://whereitallbegan1-b30e5-default-rtdb.firebaseio.com",
  projectId:         "whereitallbegan1-b30e5",
  storageBucket:     "whereitallbegan1-b30e5.firebasestorage.app",
  messagingSenderId: "966598387183",
  appId:             "1:966598387183:web:e44fd18e546356215e821a",
  measurementId:     "G-8M9K4VT04J"
};

// Firebase is loaded via CDN scripts in index.html
// All DB operations go through the Realtime Database

let firebaseApp = null;
let db = null;     // Firebase Realtime Database reference
let fbReady = false;

function initFirebase() {
  try {
    if (typeof firebase === 'undefined') {
      console.warn('[Firebase] SDK not loaded — using localStorage fallback');
      return;
    }
    if (!firebase.apps || firebase.apps.length === 0) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      firebaseApp = firebase.apps[0];
    }
    db = firebase.database();
    fbReady = true;
    console.log('[Firebase] Realtime Database connected ✓');
    seedFirebaseDefaults();
  } catch(e) {
    console.error('[Firebase] Init failed, using localStorage:', e);
    fbReady = false;
  }
}

// ──────────────────────────────────────────────────────────────────
// UNIVERSAL DATA LAYER
// All reads/writes go through these functions.
// When Firebase is ready → uses Realtime Database (real-time sync).
// Fallback → localStorage.
// ──────────────────────────────────────────────────────────────────

// READ once
function dbGet(path) {
  return new Promise((resolve) => {
    if (fbReady && db) {
      db.ref(path).once('value')
        .then(snap => resolve(snap.val()))
        .catch(() => resolve(lsGet(path.split('/').pop(), null)));
    } else {
      resolve(lsGet(path.split('/').pop(), null));
    }
  });
}

// WRITE
function dbSet(path, value) {
  if (fbReady && db) {
    db.ref(path).set(value).catch(e => console.error('[DB SET]', path, e));
  }
  lsSet(path.split('/').pop(), value); // always mirror to localStorage
}

// PUSH (append to list)
function dbPush(path, value) {
  return new Promise((resolve) => {
    if (fbReady && db) {
      const ref = db.ref(path).push();
      value.id = value.id || ref.key;
      ref.set(value).then(() => resolve(value.id)).catch(e => { console.error('[DB PUSH]', e); resolve(null); });
    } else {
      const list = lsGet(path.split('/').pop(), []);
      list.push(value);
      lsSet(path.split('/').pop(), list);
      resolve(value.id);
    }
  });
}

// DELETE
function dbDel(path) {
  if (fbReady && db) {
    db.ref(path).remove().catch(e => console.error('[DB DEL]', path, e));
  }
}

// LISTEN for real-time changes and re-render
const listeners = {};
function dbListen(path, callback) {
  // Remove existing listener first
  if (listeners[path] && fbReady && db) {
    db.ref(path).off('value', listeners[path]);
  }
  if (fbReady && db) {
    const handler = db.ref(path).on('value', snap => {
      callback(snap.val());
      showSyncNotice();
    });
    listeners[path] = handler;
  }
  // Also do an immediate local read
  const localData = lsGet(path.split('/').pop(), null);
  if (localData !== null) callback(localData);
}

function dbUnlisten(path) {
  if (fbReady && db && listeners[path]) {
    db.ref(path).off('value', listeners[path]);
    delete listeners[path];
  }
}

// ──────────────────────────────────────────────────────────────────
// LOCAL STORAGE (always used as mirror / fallback)
// ──────────────────────────────────────────────────────────────────
function lsGet(key, def) {
  try { const v=localStorage.getItem('wiab_'+key); return v?JSON.parse(v):def; } catch(e){return def;}
}
function lsSet(key,val) { try{localStorage.setItem('wiab_'+key,JSON.stringify(val));}catch(e){} }
function lsDel(key)     { try{localStorage.removeItem('wiab_'+key);}catch(e){} }

// ──────────────────────────────────────────────────────────────────
// CHAPTERS
// ──────────────────────────────────────────────────────────────────
const CHAPTERS = [
  { title:'Chapter 1 — Early Childhood & Home Life', questions:[
    "Where were you born, and what's your earliest memory?",
    "Describe the home you grew up in — what did it look, smell, and feel like?",
    "Did you move around a lot, or did you grow up in one place?",
    "What was your bedroom like? Did you share it?",
    "What was a typical morning in your household?",
    "What did dinnertime look like in your family?",
    "Did you have chores? What happened if you didn't do them?",
    "What did weekends look like for your family?",
    "Did your family have any rituals or routines that felt unique to you?"
  ]},
  { title:'Chapter 2 — Family Dynamics', questions:[
    "Tell me about your parents — who were they as people, not just as your parents?",
    "Which parent were you closer to, and why?","How did your parents meet?",
    "Would you describe your household as strict, lenient, or somewhere in between?",
    "How did your parents handle conflict with each other?","How did they discipline you?",
    "Did you ever feel like you had to be the 'good kid' or play a role in the family?",
    "Do you have siblings? Where do you fall in the birth order?",
    "What was your relationship with your siblings like growing up?"
  ]},
  { title:'Chapter 3 — Extended Family & Heritage', questions:[
    "Were there any family secrets you didn't learn until you were older?",
    "Did you feel like your parents truly knew you as a person?",
    "What's something your parents always said that stuck with you?",
    "What's something you wish your parents had done differently?",
    "Were your parents affectionate? Did your family say 'I love you'?",
    "How big of a role did your grandparents play in your life?",
    "What do you know about your family's history or ancestry?",
    "Were there family members considered the 'black sheep'?",
    "Was there a family member who had an outsized influence on who you became?",
    "What family stories were told over and over again?"
  ]},
  { title:'Chapter 4 — Money & Social Class', questions:[
    "How would you describe your family's financial situation growing up?",
    "Did you know you were rich, poor, or middle class — or did you only realize it later?",
    "Were money and finances talked about openly at home?",
    "Did you ever feel embarrassed or proud about what you had or didn't have?",
    "What's the first thing you remember wanting that you couldn't have?",
    "Did financial stress affect the mood or stability of your home?",
    "What's the biggest sacrifice you saw your parents make for the family?"
  ]},
  { title:'Chapter 5 — School Life', questions:[
    "What was your very first day of school like?",
    "Were you a good student? Did you care about grades?",
    "What subjects did you love, and which ones did you dread?",
    "Who was your favorite teacher, and what made them special?",
    "Did you ever get in serious trouble at school?",
    "Were you picked on, or were you the one doing the picking?",
    "Were you involved in any clubs, sports, or extracurriculars?",
    "Was college always assumed, or was it a question?"
  ]},
  { title:'Chapter 6 — Friendships & Social Life', questions:[
    "Who was your very first best friend?",
    "Were you someone who had one or two close friends or a big social circle?",
    "How did you make friends — did it come easily or was it hard?",
    "Did you have a 'ride or die' friend growing up?",
    "Was there a friendship that ended badly? What happened?",
    "Did you ever feel truly lonely as a kid?",
    "Were you ever on the outside of a social group you wanted to be in?",
    "What did a fun Friday night look like when you were 13?"
  ]},
  { title:'Chapter 7 — Early Romance & Identity', questions:[
    "Who was your first crush?","How old were you when you had your first relationship?",
    "What did you learn from your first heartbreak?",
    "How was romance and dating treated in your household?",
    "When did you start to understand your own identity — gender, sexuality, who you were?",
    "Were you ever ashamed of any part of yourself growing up?",
    "Did you feel like you could be your authentic self at home?"
  ]},
  { title:'Chapter 8 — Religion, Values & Beliefs', questions:[
    "Was religion a part of your upbringing?",
    "Did you believe what you were taught, or did you quietly question it?",
    "Was there a moment you felt truly spiritual — or truly doubtful?",
    "What values were drilled into you most strongly?",
    "Were politics talked about at home? What were the leanings?",
    "At what age did you start forming your own opinions separate from your parents?"
  ]},
  { title:'Chapter 9 — Play, Hobbies & Pop Culture', questions:[
    "What did you do for fun as a kid before screens took over?",
    "What TV shows, movies, or music defined your childhood?",
    "Did you have a favorite toy or possession you were obsessed with?",
    "Were you more of an indoor or outdoor kid?",
    "Did you have an imaginary friend or an elaborate inner world?",
    "What games did you play in the neighborhood?",
    "What did you want to be when you grew up at age 5? Age 10? Age 16?"
  ]},
  { title:'Chapter 10 — Hard Times & Formative Pain', questions:[
    "What's the hardest thing that happened to your family while you were growing up?",
    "Did you ever experience loss — a death, a divorce, a move — that shook you?",
    "Was there a period in your childhood you'd describe as dark?",
    "Did you ever feel unsafe at home?","Did you ever have to grow up too fast?",
    "What's something from your childhood you've had to actively heal from as an adult?",
    "Who helped you through the hardest moments?"
  ]},
  { title:'Chapter 11 — Growth, Turning Points & Self-Discovery', questions:[
    "What's a moment from your childhood that you now realize shaped you completely?",
    "When did you first feel truly proud of yourself?",
    "Was there a book, film, or piece of art that cracked you open at a young age?",
    "When did you first feel like an individual, separate from your family?",
    "Was there a moment you realized your parents were just people — flawed and human?",
    "What belief from childhood did you have to completely unlearn?",
    "If you could go back and tell your 10-year-old self one thing, what would it be?",
    "When did childhood feel like it was over?"
  ]}
];

// ──────────────────────────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────────────────────────
function esc(s){ if(!s)return''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function getEl(id){ return document.getElementById(id); }
function getMsgKey(a,b){ return [a,b].sort().join('__'); }
function nowDT() {
  const n=new Date();
  const date=n.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const time=n.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
  return {date,time,dateTime:date+' · '+time};
}

// ──────────────────────────────────────────────────────────────────
// SEED DEFAULT DATA (Firebase + localStorage)
// ──────────────────────────────────────────────────────────────────
async function seedFirebaseDefaults() {
  if (!fbReady) return;
  try {
    const snap = await db.ref('seeded').once('value');
    if (snap.val()) return; // already seeded
    // Seed director
    await db.ref('users/director').set({id:'director',fname:'Director',lname:'',email:'director@wiab.com',phone:'',dob:'',loc:'',password:'Director123!',role:'director',status:'active',joined:'January 1, 2025'});
    // Seed posts
    const posts = {
      ann: [
        {id:1,title:'Welcome to the Where It All Began Portal!',category:'General',body:'We are thrilled to launch our official community portal. Everyone has a beginning — and this is yours.',author:'Director',date:'April 14, 2025',dateTime:'April 14, 2025 · 9:00 AM'},
        {id:2,title:'Season 2 Submissions Now Open',category:'Important',body:'We are actively seeking guests for Season 2. Submit your answers or request a live interview.',author:'Director',date:'April 12, 2025',dateTime:'April 12, 2025 · 10:30 AM'},
        {id:3,title:'New Episode Every Thursday',category:'Reminder',body:'New episodes drop every Thursday on all major platforms.',author:'Administration',date:'April 8, 2025',dateTime:'April 8, 2025 · 8:00 AM'}
      ],
      news: [
        {id:10,title:'Season 1 Wrap — A Note from the Director',category:'Update',body:'Season 1 has wrapped. Thank you to every guest who trusted us with their story.',author:'Director',date:'April 10, 2025',dateTime:'April 10, 2025 · 11:00 AM'},
        {id:11,title:'We Hit 10,000 Listeners!',category:'Milestone',body:'Ten thousand listeners. More is coming.',author:'Director',date:'April 5, 2025',dateTime:'April 5, 2025 · 3:00 PM'}
      ],
      events: [
        {id:20,title:'Live Taping — Nashville, TN',category:'Event',body:'Join us for a live taping in Nashville on May 24th. Doors at 6 PM.',author:'Events Team',date:'April 2, 2025',dateTime:'April 2, 2025 · 1:00 PM'},
        {id:21,title:'Virtual Story Circle — Online',category:'Event',body:'Our first-ever virtual Story Circle. Details coming soon.',author:'Events Team',date:'March 28, 2025',dateTime:'March 28, 2025 · 2:00 PM'}
      ],
      resources: [
        {id:30,title:'Interview Prep Guide',category:'Document',body:'Our prep guide covers what to expect, how to structure your story, and tips for speaking on camera.',author:'Production',date:'January 15, 2025',dateTime:'January 15, 2025 · 9:00 AM'},
        {id:31,title:'Community Guidelines',category:'Important',body:'Our community is built on respect, vulnerability, and authenticity.',author:'Administration',date:'April 1, 2025',dateTime:'April 1, 2025 · 8:00 AM'}
      ],
      stories: [
        {id:1001,title:'The Summer My Dad Taught Me to Drive',body:`It was the summer of 1987, and my father had this old Ford pickup truck that rattled every time you hit a bump. He pulled it out of the driveway one Saturday morning, handed me the keys, and said, "Go ahead." I was fourteen.\n\nI didn't know what I was doing, but that wasn't the point. The point was that he trusted me before I trusted myself.\n\nWe drove down every back road in the county that summer. He never once grabbed the wheel, even when I deserved it. By the end of August, I wasn't just a better driver — I was a different person.`,author:'Director',email:'director@wiab.com',date:'April 10, 2025',dateTime:'April 10, 2025 · 9:30 AM',likes:{}},
        {id:1002,title:"Grandma's Kitchen Was the Whole World",body:`My grandmother's kitchen smelled like garlic and old wood and something sweet I could never identify. She kept a small radio on the windowsill always playing — church music on Sunday, old country during the week.\n\nShe passed away three years ago. Last month I finally made her biscuit recipe from the card she wrote in 1962. When I pulled them out of the oven and they smelled right — exactly right — I sat down on the kitchen floor and cried.`,author:'Director',email:'director@wiab.com',date:'April 12, 2025',dateTime:'April 12, 2025 · 2:15 PM',likes:{}}
      ]
    };
    for (const [key, list] of Object.entries(posts)) {
      for (const item of list) {
        await db.ref(key + '/' + item.id).set(item);
      }
    }
    await db.ref('seeded').set(true);
    console.log('[Firebase] Default data seeded ✓');
  } catch(e) { console.error('[Firebase] Seed error:', e); }
}

function seedLocalDefaults() {
  if (lsGet('seeded_local', false)) return;
  const users = lsGet('users', []);
  if (!users.find(u=>u.email==='director@wiab.com')) {
    users.push({id:'director',fname:'Director',lname:'',email:'director@wiab.com',phone:'',dob:'',loc:'',password:'Director123!',role:'director',status:'active',joined:'January 1, 2025'});
    lsSet('users',users);
  }
  if (!lsGet('ann',null)) lsSet('ann',[
    {id:1,title:'Welcome to the Where It All Began Portal!',category:'General',body:'We are thrilled to launch our official community portal. Everyone has a beginning — and this is yours.',author:'Director',date:'April 14, 2025',dateTime:'April 14, 2025 · 9:00 AM'},
    {id:2,title:'Season 2 Submissions Now Open',category:'Important',body:'We are actively seeking guests for Season 2.',author:'Director',date:'April 12, 2025',dateTime:'April 12, 2025 · 10:30 AM'},
    {id:3,title:'New Episode Every Thursday',category:'Reminder',body:'New episodes drop every Thursday on all major platforms.',author:'Administration',date:'April 8, 2025',dateTime:'April 8, 2025 · 8:00 AM'}
  ]);
  if (!lsGet('news',null)) lsSet('news',[{id:10,title:'Season 1 Wrap',category:'Update',body:'Season 1 has wrapped. Thank you to every guest.',author:'Director',date:'April 10, 2025',dateTime:'April 10, 2025 · 11:00 AM'},{id:11,title:'We Hit 10,000 Listeners!',category:'Milestone',body:'Ten thousand listeners. More is coming.',author:'Director',date:'April 5, 2025',dateTime:'April 5, 2025 · 3:00 PM'}]);
  if (!lsGet('events',null)) lsSet('events',[{id:20,title:'Live Taping — Nashville, TN',category:'Event',body:'Join us in Nashville on May 24th.',author:'Events Team',date:'April 2, 2025',dateTime:'April 2, 2025 · 1:00 PM'},{id:21,title:'Virtual Story Circle',category:'Event',body:'Our first-ever virtual Story Circle. Details coming soon.',author:'Events Team',date:'March 28, 2025',dateTime:'March 28, 2025 · 2:00 PM'}]);
  if (!lsGet('resources',null)) lsSet('resources',[{id:30,title:'Interview Prep Guide',category:'Document',body:'Our prep guide covers what to expect and tips for speaking on camera.',author:'Production',date:'January 15, 2025',dateTime:'January 15, 2025 · 9:00 AM'},{id:31,title:'Community Guidelines',category:'Important',body:'Our community is built on respect, vulnerability, and authenticity.',author:'Administration',date:'April 1, 2025',dateTime:'April 1, 2025 · 8:00 AM'}]);
  if (!lsGet('stories',null)) lsSet('stories',[
    {id:1001,title:'The Summer My Dad Taught Me to Drive',body:"It was the summer of 1987, and my father had this old Ford pickup truck that rattled every time you hit a bump. He handed me the keys and said, \"Go ahead.\" I was fourteen.\n\nI didn't know what I was doing, but that wasn't the point. The point was that he trusted me before I trusted myself.\n\nWe drove down every back road in the county that summer. By the end of August, I wasn't just a better driver — I was a different person.",author:'Director',email:'director@wiab.com',date:'April 10, 2025',dateTime:'April 10, 2025 · 9:30 AM',likes:[]},
    {id:1002,title:"Grandma's Kitchen Was the Whole World",body:"My grandmother's kitchen smelled like garlic and old wood and something sweet I could never identify. She kept a small radio on the windowsill — church music on Sunday, old country during the week.\n\nShe passed away three years ago. Last month I finally made her biscuit recipe from the card she wrote in 1962. When they came out of the oven and smelled right — exactly right — I sat down on the kitchen floor and cried.",author:'Director',email:'director@wiab.com',date:'April 12, 2025',dateTime:'April 12, 2025 · 2:15 PM',likes:[]}
  ]);
  if (!lsGet('questions',null)) lsSet('questions',[]);
  if (!lsGet('messages',null)) lsSet('messages',{});
  lsSet('seeded_local',true);
}

// ──────────────────────────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────────────────────────
let currentUser   = null;
let currentConvo  = null;
let currentTab    = 'announcements';
let respondingTo  = null;
let deletingEmail = null;
let addTabKey     = 'ann';
let submitGuard   = false;
let msgGuard      = false;
let replyGuard    = false;
let pollTimer     = null;

// ──────────────────────────────────────────────────────────────────
// SYNC INDICATOR
// ──────────────────────────────────────────────────────────────────
function showSyncNotice(){
  const el=getEl('sync-notice'); if(!el)return;
  el.style.opacity='1';
  clearTimeout(el._t);
  el._t=setTimeout(()=>{ el.style.opacity='0'; },2500);
}

// BroadcastChannel for same-browser multi-tab sync
let bc=null;
function initBroadcast(){
  if(!('BroadcastChannel' in window))return;
  bc=new BroadcastChannel('wiab_sync');
  bc.onmessage=(e)=>{
    if(!currentUser)return;
    const t=e.data.type;
    if(['ann','news','events','resources'].includes(t))renderAllContent();
    if(t==='stories')renderStories();
    if(t==='questions'||t==='users')renderDirectorPanel();
    if(t==='messages'&&currentTab==='messages'){renderContacts();if(currentConvo)renderThread(currentConvo);}
    showSyncNotice();
  };
}
function broadcast(type){ if(bc)bc.postMessage({type,ts:Date.now()}); }

// ──────────────────────────────────────────────────────────────────
// REAL-TIME FIREBASE LISTENERS
// ──────────────────────────────────────────────────────────────────
function attachFirebaseListeners() {
  if (!fbReady || !db) return;
  const tabs = ['ann','news','events','resources','stories','users','questions'];
  tabs.forEach(key => {
    db.ref(key).on('value', snap => {
      if (!currentUser) return;
      const val = snap.val();
      // Mirror to localStorage
      if (val !== null) {
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        lsSet(key, arr);
      }
      // Re-render
      if (['ann','news','events','resources'].includes(key)) renderAllContent();
      if (key === 'stories') renderStories();
      if (key === 'users' || key === 'questions') renderDirectorPanel();
      showSyncNotice();
    });
  });
  // Messages listener
  db.ref('messages').on('value', snap => {
    if (!currentUser) return;
    const val = snap.val() || {};
    lsSet('messages', val);
    if (currentTab === 'messages') {
      renderContacts();
      if (currentConvo) renderThread(currentConvo);
    }
    showSyncNotice();
  });
}

function detachFirebaseListeners() {
  if (!fbReady || !db) return;
  ['ann','news','events','resources','stories','users','questions','messages'].forEach(key => {
    db.ref(key).off();
  });
}

// Polling (fallback for when Firebase not connected)
function startPolling(){
  stopPolling();
  if (fbReady) return; // Firebase handles sync, no polling needed
  pollTimer=setInterval(()=>{
    if(!currentUser)return;
    if(['announcements','news','events','resources'].includes(currentTab))renderAllContent();
    if(currentTab==='stories')renderStories();
    if(currentTab==='director')renderDirectorPanel();
    if(currentTab==='messages'){renderContacts();if(currentConvo)renderThread(currentConvo);}
  },8000);
}
function stopPolling(){if(pollTimer){clearInterval(pollTimer);pollTimer=null;}}

// ──────────────────────────────────────────────────────────────────
// WRITE HELPERS — write to both Firebase and localStorage
// ──────────────────────────────────────────────────────────────────
function saveList(key, list) {
  lsSet(key, list);
  if (fbReady && db) {
    // Convert array to object keyed by id for Firebase
    const obj = {};
    list.forEach(item => { if (item.id !== undefined) obj[item.id] = item; });
    db.ref(key).set(obj).catch(e=>console.error('[FB saveList]',key,e));
  }
  broadcast(key);
}

function saveMessages(msgs) {
  lsSet('messages', msgs);
  if (fbReady && db) {
    db.ref('messages').set(msgs).catch(e=>console.error('[FB saveMessages]',e));
  }
  broadcast('messages');
}

// ──────────────────────────────────────────────────────────────────
// SESSION
// ──────────────────────────────────────────────────────────────────
function saveSession(email){ lsSet('session',{email,ts:Date.now()}); }
function clearSession(){ lsDel('session'); }
function restoreSession(){
  const s=lsGet('session',null); if(!s)return null;
  if(Date.now()-s.ts>7*24*60*60*1000){clearSession();return null;}
  const users=lsGet('users',[]);
  const u=users.find(u=>u.email===s.email);
  if(u&&u.status==='active')return u;
  clearSession();return null;
}

// ──────────────────────────────────────────────────────────────────
// EMAIL
// ──────────────────────────────────────────────────────────────────
function getEmailCfg(){ return lsGet('emailcfg',{}); }
function saveEmailCfg(cfg){ lsSet('emailcfg',cfg); }
function initEmailJS(){
  const cfg=getEmailCfg();
  if(cfg.publicKey&&typeof emailjs!=='undefined')emailjs.init({publicKey:cfg.publicKey});
}
function showToast(to,subj,ok){
  const t=getEl('email-toast'),s=getEl('et-subject'),b=getEl('et-body');
  if(!t)return;
  if(s)s.textContent=ok?'✉ Email Sent':'⚠ Email logged (configure EmailJS)';
  if(b)b.textContent='To: '+to+' — '+subj;
  t.classList.add('show');setTimeout(()=>t.classList.remove('show'),6000);
}
async function sendEmail(to,toName,subj,body){
  const log=lsGet('emails',[]); log.push({to,subj,body,time:new Date().toLocaleString()}); lsSet('emails',log);
  const cfg=getEmailCfg();
  if(!(typeof emailjs!=='undefined'&&cfg.serviceId&&cfg.templateId&&cfg.publicKey)){showToast(to,subj,false);return;}
  try{
    await emailjs.send(cfg.serviceId,cfg.templateId,{to_email:to,to_name:toName||to,subject:subj,message:body,from_name:'Where It All Began',reply_to:'whereitallbegan1@yahoo.com'});
    showToast(to,subj,true);
  }catch(e){showToast(to,subj,false);console.error('[EMAIL]',e);}
}
function fireEmail(to,subj,body,toName){sendEmail(to,toName||to,subj,body);}

// ──────────────────────────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────────────────────────
function showAuthTab(t){
  getEl('login-form').style.display=t==='login'?'block':'none';
  getEl('register-form').style.display=t==='register'?'block':'none';
  document.querySelectorAll('.auth-tab').forEach((b,i)=>
    b.classList.toggle('active',(i===0&&t==='login')||(i===1&&t==='register')));
}
function tp(id,btn){
  const el=getEl(id);el.type=el.type==='password'?'text':'password';
  btn.textContent=el.type==='password'?'Show':'Hide';
}
function setAlert(id,msg,type){
  const el=getEl(id);if(!el)return;
  el.textContent=msg;el.className='alert '+type+' show';
}

function doLogin(){
  const em=getEl('login-email').value.trim(),pw=getEl('login-pass').value;
  let ok=true;
  if(!em||!/\S+@\S+\.\S+/.test(em)){getEl('le-err').classList.add('show');ok=false;}else getEl('le-err').classList.remove('show');
  if(!pw){getEl('lp-err').classList.add('show');ok=false;}else getEl('lp-err').classList.remove('show');
  if(!ok)return;
  const users=lsGet('users',[]);
  const u=users.find(u=>u.email.toLowerCase()===em.toLowerCase()&&u.password===pw);
  if(!u){setAlert('login-alert','Incorrect email or password.','danger');return;}
  if(u.status==='pending'){getEl('pending-notice')?.classList.add('show');setAlert('login-alert','Your account is awaiting director approval.','danger');return;}
  if(u.status==='inactive'){setAlert('login-alert','Your account has been deactivated. Contact the director.','danger');return;}
  currentUser=u;saveSession(u.email);startApp();
}

function doRegister(){
  const fn=getEl('rf').value.trim(),ln=getEl('rl').value.trim(),em=getEl('re').value.trim();
  const ph=getEl('rph').value.trim(),dob=getEl('rdob').value,loc=getEl('rloc').value.trim();
  const pw=getEl('rp').value,pw2=getEl('rp2').value,terms=getEl('rterms').checked;
  let ok=true;
  const v=(eid,test)=>{if(!test){getEl(eid).classList.add('show');ok=false;}else getEl(eid).classList.remove('show');};
  v('rfe',fn);v('rle',ln);v('ree',em&&/\S+@\S+\.\S+/.test(em));v('rpe',pw&&pw.length>=8);v('rp2e',pw===pw2);
  if(!ok)return;
  if(!terms){setAlert('reg-alert','Please agree to the Terms of Service.','danger');return;}
  const users=lsGet('users',[]);
  if(users.find(u=>u.email.toLowerCase()===em.toLowerCase())){setAlert('reg-alert','An account with this email already exists.','danger');return;}
  const {date}=nowDT();
  const uid='u'+Date.now();
  const newUser={id:uid,fname:fn,lname:ln,email:em,phone:ph,dob,loc,password:pw,role:'member',status:'pending',joined:date};
  users.push(newUser);
  lsSet('users',users);
  // Also write to Firebase
  if(fbReady&&db){ db.ref('users/'+uid).set(newUser).catch(e=>console.error('[FB reg]',e)); }
  broadcast('users');
  fireEmail(em,'Where It All Began — Registration Received! 🎙',`Hi ${fn},\n\nThank you for registering with the Where It All Began Community Portal!\n\nYour profile is pending director review. You will receive an email once activated.\n\nEveryone has a beginning — we can't wait to hear yours.\n\nThe Where It All Began Team\nwhereitallbegan1@yahoo.com`,fn+' '+ln);
  const dir=users.find(u=>u.role==='director');
  if(dir)fireEmail(dir.email,`New Member Registration — ${fn} ${ln}`,`New member awaiting activation.\n\nName: ${fn} ${ln}\nEmail: ${em}\nLocation: ${loc||'Not provided'}\nJoined: ${date}\n\nLog in to the Director Panel to activate.`,'Director');
  setAlert('reg-alert','Account created! You will receive an email when the director activates your profile.','success');
}

function doLogout(){
  currentUser=null;currentConvo=null;clearSession();stopPolling();detachFirebaseListeners();
  getEl('page-app').style.display='none';
  getEl('page-auth').style.display='flex';
  getEl('login-email').value='';getEl('login-pass').value='';
  getEl('login-alert').className='alert';
  getEl('pending-notice')?.classList.remove('show');
  showAuthTab('login');
}

// ──────────────────────────────────────────────────────────────────
// APP START
// ──────────────────────────────────────────────────────────────────
function startApp(){
  initEmailJS();
  getEl('page-auth').style.display='none';
  getEl('page-app').style.display='block';
  const u=currentUser,name=u.fname+(u.lname?' '+u.lname:'');
  getEl('tname').textContent=name;
  getEl('trole').textContent=u.role==='director'?'Director':'Member';
  getEl('pf-av').textContent=(u.fname[0]+(u.lname?u.lname[0]:'')).toUpperCase();
  getEl('pf-name').textContent=name;
  getEl('pf-role').textContent=u.role==='director'?'Director / Administrator':'Community Member';
  getEl('pf-email').textContent=u.email;
  getEl('pf-phone').textContent=u.phone||'Not provided';
  getEl('pf-dob').textContent=u.dob||'Not provided';
  getEl('pf-loc').textContent=u.loc||'Not provided';
  getEl('pf-since').textContent=u.joined;
  const isDir=u.role==='director';
  getEl('dir-tab-btn').style.display=isDir?'inline-block':'none';
  getEl('add-story-btn').style.display=isDir?'inline-block':'none';
  ['add-ann-btn','add-news-btn','add-events-btn','add-resources-btn'].forEach(id=>{
    const el=getEl(id);if(el)el.style.display=isDir?'inline-block':'none';
  });
  renderAllContent();
  buildChapters();
  switchTab('announcements',document.querySelector('.tab-link'));
  if(isDir)renderDirectorPanel();
  attachFirebaseListeners();
  startPolling();
}

function switchTab(id,btn){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-link').forEach(b=>b.classList.remove('active'));
  getEl('tab-'+id)?.classList.add('active');
  if(btn)btn.classList.add('active');
  currentTab=id;
  if(id==='director')renderDirectorPanel();
  if(id==='messages')initMessagesTab();
  if(id==='stories')renderStories();
}

// ──────────────────────────────────────────────────────────────────
// CONTENT CARDS (Announcements, News, Events, Resources)
// ──────────────────────────────────────────────────────────────────
const CAT_BADGE={General:'badge-orange',Important:'badge-red',Event:'badge-orange',Update:'badge-blue',Reminder:'badge-orange',Milestone:'badge-blue',Document:'badge-blue'};

function renderContentList(items,containerId,tabKey){
  const el=getEl(containerId);if(!el)return;el.innerHTML='';
  if(!items||!items.length){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--muted);">No posts yet.</div>';return;}
  // Sort newest first
  const sorted=[...items].sort((a,b)=>b.id-a.id);
  sorted.forEach(a=>{
    const div=document.createElement('div');div.className='ann-card';
    const bc=CAT_BADGE[a.category]||'badge-orange';
    const ini=a.author?a.author[0].toUpperCase():'A';
    let dp=a.date||'',tp='';
    if(a.dateTime&&a.dateTime.includes('·'))[dp,tp]=a.dateTime.split('·').map(s=>s.trim());
    const isDir=currentUser?.role==='director';
    const delBtn=isDir?`<button class="btn-sm btn-sm-red" onclick="deletePost('${tabKey}',${a.id})" style="margin-left:auto;">✕ Remove</button>`:'';
    div.innerHTML=`
      <div class="ann-header-row">
        <div><div class="ann-title">${esc(a.title)}</div><div class="ann-meta">${esc(a.category)}</div></div>
        <span class="badge ${bc}">${esc(a.category)}</span>
      </div>
      <div class="ann-body">${esc(a.body)}</div>
      <div class="ann-footer">
        <div class="ann-avatar">${ini}</div>
        <div>
          <div class="ann-author-name">${esc(a.author)}</div>
          <div class="ann-timestamp">⏱ ${esc(dp)}${tp?' · '+esc(tp):''}</div>
        </div>
        ${delBtn}
      </div>`;
    el.appendChild(div);
  });
}

function renderAllContent(){
  renderContentList(lsGet('ann',[]),'ann-list','ann');
  renderContentList(lsGet('news',[]),'news-list','news');
  renderContentList(lsGet('events',[]),'events-list','events');
  renderContentList(lsGet('resources',[]),'resources-list','resources');
  const badge=getEl('ann-count-badge');
  if(badge)badge.textContent=lsGet('ann',[]).length+' active';
}

function deletePost(tabKey,id){
  if(!confirm('Remove this post permanently?'))return;
  const list=lsGet(tabKey,[]).filter(a=>a.id!==id);
  saveList(tabKey,list);
  renderAllContent();
  if(currentUser?.role==='director')renderDirectorPanel();
}

// Post modal
function openAddAnn()  {addTabKey='ann';      getEl('modal-add-title').textContent='Post Announcement';openModal('modal-add-ann');}
function openAddNews() {addTabKey='news';     getEl('modal-add-title').textContent='Post News';        openModal('modal-add-ann');}
function openAddEvent(){addTabKey='events';   getEl('modal-add-title').textContent='Post Event';       openModal('modal-add-ann');}
function openAddRes()  {addTabKey='resources';getEl('modal-add-title').textContent='Post Resource';    openModal('modal-add-ann');}

function postContent(){
  const title=getEl('m-title').value.trim(),cat=getEl('m-cat').value,body=getEl('m-body').value.trim();
  if(!title||!body){alert('Please fill in the title and content.');return;}
  const {date,dateTime}=nowDT();
  const name=currentUser.fname+(currentUser.lname?' '+currentUser.lname:'');
  const id=Date.now();
  const item={id,title,category:cat,body,author:name,date,dateTime};
  const list=lsGet(addTabKey,[]);
  list.unshift(item);
  saveList(addTabKey,list);
  renderAllContent();
  closeModal('modal-add-ann');
  getEl('m-title').value='';getEl('m-body').value='';
  if(currentUser.role==='director')renderDirectorPanel();
}

// ──────────────────────────────────────────────────────────────────
// STORIES — Director posts, all members can like
// ──────────────────────────────────────────────────────────────────
function renderStories(){
  const el=getEl('stories-list');if(!el)return;
  const isDir=currentUser?.role==='director';
  // Show/hide post button based on role
  const addBtn=getEl('add-story-btn');
  if(addBtn)addBtn.style.display=isDir?'inline-block':'none';

  const rawStories=lsGet('stories',[]);
  const stories=[...rawStories].reverse();

  if(!stories.length){
    el.innerHTML=`<div class="stories-empty"><div class="empty-icon">📖</div><p>No stories posted yet. Check back soon.</p></div>`;
    return;
  }
  el.innerHTML='';
  stories.forEach(s=>{
    const card=document.createElement('div');card.className='story-card';
    // Likes: support both array format and object format from Firebase
    let likesArr=[];
    if(Array.isArray(s.likes))likesArr=s.likes;
    else if(s.likes&&typeof s.likes==='object')likesArr=Object.values(s.likes);
    const hasLiked=likesArr.some(l=>l&&l.email===currentUser.email);
    const likeCount=likesArr.length;
    let dp=s.date||'',tp='';
    if(s.dateTime&&s.dateTime.includes('·'))[dp,tp]=s.dateTime.split('·').map(x=>x.trim());
    const likerNames=isDir&&likeCount>0?likesArr.filter(l=>l&&l.name).map(l=>esc(l.name)).join(', '):'';
    card.innerHTML=`
      <div class="story-header">
        <div style="flex:1;">
          <div class="story-title">${esc(s.title)}</div>
          <div class="story-meta"><span>${esc(dp)}</span>${tp?`<span class="s-time">⏱ ${esc(tp)}</span>`:''}</div>
        </div>
        ${isDir?`<div class="story-dir-actions"><button class="btn-sm btn-sm-red" onclick="deleteStory(${s.id})">✕ Remove</button></div>`:''}
      </div>
      <div class="story-body">${esc(s.body)}</div>
      <div class="story-footer">
        <div class="story-author">
          <div class="story-avatar">D</div>
          <div><div class="story-author-name">${esc(s.author)}</div><div style="font-size:.72rem;color:var(--muted);">Where It All Began</div></div>
        </div>
        <div>
          <div class="story-like-area">
            <button class="like-btn${hasLiked?' liked':''}" onclick="toggleLike(${s.id},this)">
              <span class="heart">${hasLiked?'❤️':'🤍'}</span>
              <span class="like-count" id="lc-${s.id}">${likeCount}</span>
              <span class="like-label">${likeCount===1?'Like':'Likes'}</span>
            </button>
            ${isDir&&likeCount>0?`<button class="view-likers-btn" onclick="toggleLikers(${s.id})">See who liked ▾</button>`:''}
          </div>
          ${isDir&&likeCount>0?`<div class="likers-list" id="likers-${s.id}" style="display:none;"><div class="likers-title">❤️ Liked by (${likeCount}):</div><div class="likers-names">${likerNames}</div></div>`:''}
        </div>
      </div>`;
    el.appendChild(card);
  });
}

function toggleLike(storyId,btn){
  const stories=lsGet('stories',[]);
  const s=stories.find(x=>x.id===storyId);if(!s)return;
  if(!s.likes||!Array.isArray(s.likes))s.likes=[];
  const myEmail=currentUser.email,myName=currentUser.fname+(currentUser.lname?' '+currentUser.lname:'');
  const idx=s.likes.findIndex(l=>l&&l.email===myEmail);
  if(idx===-1)s.likes.push({email:myEmail,name:myName});else s.likes.splice(idx,1);
  saveList('stories',stories);
  renderStories();
}
function toggleLikers(sid){const el=getEl('likers-'+sid);if(el)el.style.display=el.style.display==='none'?'block':'none';}
function deleteStory(sid){
  if(!confirm('Remove this story permanently?'))return;
  const list=lsGet('stories',[]).filter(s=>s.id!==sid);
  saveList('stories',list);
  renderStories();
}
// FIXED: openAddStory opens the story modal — identical flow to other tabs
function openAddStory(){openModal('modal-add-story');}

function postStory(){
  if(currentUser.role!=='director'){alert('Only the director can post stories.');return;}
  const title=getEl('s-title').value.trim();
  const body=getEl('s-body').value.trim();
  if(!title){alert('Please add a story title.');return;}
  if(!body){alert('Please write the story content.');return;}
  const {date,dateTime}=nowDT();
  const name=currentUser.fname+(currentUser.lname?' '+currentUser.lname:'');
  const id=Date.now();
  const newStory={id,title,body,author:name,email:currentUser.email,date,dateTime,likes:[]};
  const stories=lsGet('stories',[]);
  stories.push(newStory);
  saveList('stories',stories);
  getEl('s-title').value='';getEl('s-body').value='';
  closeModal('modal-add-story');
  renderStories();
}

// ──────────────────────────────────────────────────────────────────
// Q&A SUBMISSION
// ──────────────────────────────────────────────────────────────────
function buildChapters(){
  const c=getEl('chapters-container');if(!c)return;c.innerHTML='';
  CHAPTERS.forEach((ch,ci)=>{
    const block=document.createElement('div');block.className='chapter-block';
    block.innerHTML=`<div class="chapter-title">${ch.title}</div>`;
    ch.questions.forEach((q,qi)=>{
      const item=document.createElement('div');item.className='question-item';item.id=`qi-${ci}-${qi}`;
      item.innerHTML=`
        <div class="question-header" onclick="toggleQ(${ci},${qi})">
          <span class="question-text">${q}</span><span class="question-toggle">+</span>
        </div>
        <div class="question-answer">
          <textarea id="qa-${ci}-${qi}" placeholder="Write your answer here..." rows="3"></textarea>
          <div class="q-answered" id="qa-done-${ci}-${qi}" style="display:none;">✓ Included</div>
        </div>`;
      block.appendChild(item);
    });
    c.appendChild(block);
  });
}
function toggleQ(ci,qi){getEl(`qi-${ci}-${qi}`)?.classList.toggle('open');}
function submitQuestions(){
  if(submitGuard)return;
  const pref=getEl('qa-pref').value,anon=getEl('qa-anon').checked;
  const answers=[];
  CHAPTERS.forEach((ch,ci)=>ch.questions.forEach((q,qi)=>{
    const ta=getEl(`qa-${ci}-${qi}`);
    if(ta&&ta.value.trim())answers.push({chapter:ch.title,question:q,answer:ta.value.trim()});
  }));
  if(!answers.length){setAlert('qa-alert','Please answer at least one question.','danger');return;}
  submitGuard=true;
  const {date,dateTime}=nowDT();
  const id=Date.now();
  const qEntry={id,from:currentUser.fname+(currentUser.lname?' '+currentUser.lname:''),email:currentUser.email,pref,anon,answers,date,dateTime,status:'pending',response:''};
  const qs=lsGet('questions',[]);qs.push(qEntry);
  saveList('questions',qs);
  CHAPTERS.forEach((ch,ci)=>ch.questions.forEach((q,qi)=>{
    const ta=getEl(`qa-${ci}-${qi}`),done=getEl(`qa-done-${ci}-${qi}`);
    if(ta&&ta.value.trim()&&done){done.style.display='block';ta.value='';ta.disabled=true;}
  }));
  const dir=lsGet('users',[]).find(u=>u.role==='director');
  if(dir){const dName=anon?'Anonymous':currentUser.fname+' '+(currentUser.lname||'');fireEmail(dir.email,`New Story Submission — ${dName}`,`${dName} submitted ${answers.length} answer(s).\nPreference: ${pref==='live'?'Live Interview':'Written'}.\nSubmitted: ${dateTime}`,'Director');}
  setAlert('qa-alert',`✓ ${answers.length} answer(s) sent to the director!`,'success');
  setTimeout(()=>{submitGuard=false;},3000);
}

// ──────────────────────────────────────────────────────────────────
// MESSAGES
// ──────────────────────────────────────────────────────────────────
function initMessagesTab(){
  renderContacts();
  if(currentUser.role!=='director'){
    const dir=lsGet('users',[]).find(u=>u.role==='director');
    if(dir)openConvo(getMsgKey(currentUser.email,dir.email),'Director');
  }
}
function renderContacts(){
  const c=getEl('msg-contacts');if(!c)return;c.innerHTML='';
  const users=lsGet('users',[]);
  const contacts=currentUser.role==='director'?users.filter(u=>u.role!=='director'):[users.find(u=>u.role==='director')].filter(Boolean);
  if(!contacts.length){c.innerHTML='<div style="padding:16px;color:var(--muted);font-size:.85rem;">No contacts yet.</div>';return;}
  const allMsgs=lsGet('messages',{});
  contacts.forEach(u=>{
    const key=getMsgKey(currentUser.email,u.email);
    const msgs=allMsgs[key]||[];
    const last=msgs.length?msgs[msgs.length-1]:null;
    const unread=msgs.filter(m=>m.from!==currentUser.email&&!m.read).length;
    const label=u.role==='director'?'Director':(u.fname+(u.lname?' '+u.lname:''));
    const inits=(u.fname[0]+(u.lname?u.lname[0]:'')).toUpperCase();
    const div=document.createElement('div');
    div.className='msg-contact'+(currentConvo===key?' active':'');
    div.dataset.key=key;div.onclick=()=>openConvo(key,label);
    div.innerHTML=`
      <div class="msg-contact-av">${inits}</div>
      <div style="flex:1;min-width:0;">
        <div class="msg-contact-name">${esc(label)}</div>
        <div class="msg-contact-preview">${last?esc(last.text.substring(0,32))+'…':'No messages yet'}</div>
      </div>
      ${unread?'<span class="unread-dot"></span>':''}`;
    c.appendChild(div);
  });
}
function openConvo(key,label){
  currentConvo=key;
  const allMsgs=lsGet('messages',{});
  if(!allMsgs[key])allMsgs[key]=[];
  let changed=false;
  allMsgs[key].forEach(m=>{if(m.from!==currentUser.email&&!m.read){m.read=true;changed=true;}});
  if(changed)saveMessages(allMsgs);
  getEl('msg-empty-state').style.display='none';
  const tv=getEl('msg-thread-view');
  tv.style.display='flex';tv.style.flexDirection='column';tv.style.flex='1';
  getEl('msg-thread-title').textContent='💬 '+label;
  document.querySelectorAll('.msg-contact').forEach(el=>el.classList.toggle('active',el.dataset.key===key));
  const dot=document.querySelector(`.msg-contact[data-key="${key}"] .unread-dot`);if(dot)dot.remove();
  renderThread(key);
}
function renderThread(key){
  const list=getEl('msg-messages-list');if(!list)return;list.innerHTML='';
  const msgs=lsGet('messages',{})[key]||[];
  msgs.forEach(m=>{
    const sent=m.from===currentUser.email;
    const div=document.createElement('div');div.className='msg-bubble '+(sent?'sent':'recv');
    div.innerHTML=(!sent?`<div class="msg-bubble-name">${esc(m.fromName)}</div>`:'')+esc(m.text)+`<div class="msg-bubble-time">${esc(m.time)}</div>`;
    list.appendChild(div);
  });
  list.scrollTop=list.scrollHeight;
}
function sendMessage(){
  if(msgGuard||!currentConvo)return;
  const inp=getEl('msg-input'),text=inp.value.trim();if(!text)return;
  msgGuard=true;inp.value='';
  const allMsgs=lsGet('messages',{});
  if(!allMsgs[currentConvo])allMsgs[currentConvo]=[];
  const {time}=nowDT();
  allMsgs[currentConvo].push({from:currentUser.email,fromName:currentUser.fname+(currentUser.lname?' '+currentUser.lname:''),text,time,read:false});
  saveMessages(allMsgs);
  renderThread(currentConvo);
  const prev=document.querySelector(`.msg-contact[data-key="${currentConvo}"] .msg-contact-preview`);
  if(prev)prev.textContent=text.substring(0,32)+(text.length>32?'…':'');
  msgGuard=false;
}
function msgKeydown(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}

// ──────────────────────────────────────────────────────────────────
// DIRECTOR PANEL
// ──────────────────────────────────────────────────────────────────
function renderDirectorPanel(){
  const users=lsGet('users',[]),members=users.filter(u=>u.role!=='director');
  const stM=getEl('st-members'),stQ=getEl('st-questions'),stA=getEl('st-ann');
  if(stM)stM.textContent=members.length;
  if(stQ)stQ.textContent=lsGet('questions',[]).length;
  if(stA)stA.textContent=lsGet('ann',[]).length;
  renderEmailSettings();
  // Members table
  const mt=getEl('dir-members');
  if(mt){
    mt.innerHTML='';
    if(!users.length){mt.innerHTML='<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--muted);">No members yet.</td></tr>';}
    else users.forEach(u=>{
      const isD=u.role==='director';
      const sc=u.status==='active'?'status-active':u.status==='inactive'?'status-inactive':'status-pending-approval';
      const sl=u.status==='active'?'Active':u.status==='inactive'?'Inactive':'Pending';
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td><div class="user-flex"><div class="user-av">${u.fname[0]}${u.lname?u.lname[0]:''}</div>
          <div><div class="user-name-sm">${esc(u.fname)} ${esc(u.lname)}</div><div class="user-email-sm">${esc(u.email)}</div></div></div></td>
        <td>${esc(u.phone)||'—'}</td><td>${esc(u.dob)||'—'}</td><td>${esc(u.loc)||'—'}</td><td>${esc(u.joined)||'—'}</td>
        <td><span class="badge ${isD?'badge-red':'badge-blue'}">${isD?'Director':'Member'}</span></td>
        <td><span class="${sc}">${sl}</span></td>
        <td style="white-space:nowrap;">${isD?'—':`
          ${u.status!=='active'?`<button class="btn-sm btn-sm-green" onclick="setStatus('${u.email}','active')" style="margin-right:4px;margin-bottom:2px;">Activate</button>`:''}
          ${u.status==='active'?`<button class="btn-sm btn-sm-red" onclick="setStatus('${u.email}','inactive')">Deactivate</button>`:''}
          ${u.status==='inactive'?`<button class="btn-sm btn-sm-outline" onclick="setStatus('${u.email}','pending')" style="display:block;margin-top:4px;">Reset</button>`:''}
        `}</td>
        <td>${isD?'—':`<button class="btn-sm-delete" onclick="openDeleteProfile('${u.email}')">🗑 Delete</button>`}</td>`;
      mt.appendChild(tr);
    });
  }
  // Questions table
  const qt=getEl('dir-questions');
  if(qt){
    qt.innerHTML='';
    const qs=lsGet('questions',[]);
    if(!qs.length){qt.innerHTML='<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted);">No story submissions yet.</td></tr>';}
    else qs.forEach(q=>{
      const name=q.anon?'Anonymous':q.from;
      const aHtml=(q.answers||[]).map(a=>`<div class="answer-row"><div class="a-chapter">${esc(a.chapter)}</div><div class="a-q">${esc(a.question)}</div><div class="a-ans">${esc(a.answer)}</div></div>`).join('');
      let dp=q.date||'',tp='';
      if(q.dateTime&&q.dateTime.includes('·'))[dp,tp]=q.dateTime.split('·').map(s=>s.trim());
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td><div class="user-flex"><div class="user-av">${name[0].toUpperCase()}</div>
          <div><div class="user-name-sm">${esc(name)}</div><div class="user-email-sm">${q.anon?'Hidden':esc(q.email)}</div></div></div></td>
        <td><span class="badge ${q.pref==='live'?'badge-orange':'badge-blue'}">${q.pref==='live'?'Live':'Written'}</span></td>
        <td>
          <div style="font-size:.76rem;color:var(--muted);margin-bottom:4px;">${q.answers?q.answers.length+' answer(s)':'—'}</div>
          <button class="answers-toggle" onclick="toggleAnswers(${q.id})">▼ View Answers</button>
          <div class="answers-list" id="ans-list-${q.id}">${aHtml}</div>
        </td>
        <td style="white-space:nowrap;"><div style="font-size:.8rem;color:var(--cream);">${esc(dp)}</div>${tp?`<div style="font-size:.74rem;color:var(--orange);">⏱ ${esc(tp)}</div>`:''}</td>
        <td>${q.status==='responded'?'<span class="status-responded">Responded</span>':'<span class="status-pending">Pending</span>'}</td>
        <td><button class="btn-sm btn-sm-orange" onclick="openRespond(${q.id})">Reply</button></td>`;
      qt.appendChild(tr);
    });
  }
}

function toggleAnswers(qid){getEl('ans-list-'+qid)?.classList.toggle('open');}

function setStatus(email,status){
  const users=lsGet('users',[]);
  const u=users.find(u=>u.email===email);if(!u)return;
  const prev=u.status;u.status=status;
  lsSet('users',users);
  if(fbReady&&db){db.ref('users/'+u.id).update({status}).catch(e=>console.error('[FB setStatus]',e));}
  broadcast('users');renderDirectorPanel();
  const full=u.fname+(u.lname?' '+u.lname:'');
  if(status==='active'&&prev!=='active')
    fireEmail(u.email,'Where It All Began — Your Account Is Active! 🎉',`Hi ${u.fname},\n\nYour account has been activated! You can now sign in at any time.\n\nWe can't wait to hear your story!\n\nThe Where It All Began Team\nwhereitallbegan1@yahoo.com`,full);
  else if(status==='inactive')
    fireEmail(u.email,'Where It All Began — Account Status Update',`Hi ${u.fname},\n\nYour account has been temporarily deactivated. Contact whereitallbegan1@yahoo.com with questions.\n\nThe Where It All Began Team`,full);
}

function openDeleteProfile(email){
  const u=lsGet('users',[]).find(u=>u.email===email);if(!u)return;
  deletingEmail=email;
  const prev=getEl('delete-profile-preview');
  if(prev)prev.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <div class="user-av">${u.fname[0]}${u.lname?u.lname[0]:''}</div>
      <div><div style="font-weight:700;color:var(--gold);">${esc(u.fname)} ${esc(u.lname)}</div><div style="font-size:.78rem;color:var(--muted);">${esc(u.email)}</div></div>
    </div>
    <div style="font-size:.82rem;">Joined: ${esc(u.joined)} · Status: ${esc(u.status)}</div>`;
  openModal('modal-delete-profile');
}
function confirmDeleteProfile(){
  if(!deletingEmail)return;
  const u=lsGet('users',[]).find(u=>u.email===deletingEmail);
  const name=u?u.fname+' '+(u.lname||''):deletingEmail;
  const uid=u?u.id:null;
  lsSet('users',lsGet('users',[]).filter(u=>u.email!==deletingEmail));
  lsSet('questions',lsGet('questions',[]).filter(q=>q.email!==deletingEmail));
  lsSet('stories',lsGet('stories',[]).filter(s=>s.email!==deletingEmail));
  const msgs=lsGet('messages',{});
  Object.keys(msgs).forEach(k=>{if(k.includes(deletingEmail))delete msgs[k];});
  lsSet('messages',msgs);
  if(fbReady&&db&&uid){
    db.ref('users/'+uid).remove();
    db.ref('messages').once('value').then(snap=>{
      const all=snap.val()||{};
      Object.keys(all).forEach(k=>{if(k.includes(deletingEmail))db.ref('messages/'+k).remove();});
    });
  }
  broadcast('users');broadcast('questions');broadcast('stories');broadcast('messages');
  closeModal('modal-delete-profile');deletingEmail=null;renderDirectorPanel();
  if(currentTab==='stories')renderStories();
  if(u)fireEmail(u.email,'Where It All Began — Account Deleted',`Hi ${u.fname},\n\nYour account has been permanently deleted. Contact whereitallbegan1@yahoo.com with questions.\n\nThe Where It All Began Team`,name);
}

function openRespond(id){
  respondingTo=id;
  const q=lsGet('questions',[]).find(x=>x.id===id);if(!q){alert('Submission not found.');return;}
  const name=q.anon?'Anonymous':q.from;
  const prefBadge=q.pref==='live'?'<span class="badge badge-orange" style="margin-left:8px;">Live Interview</span>':'<span class="badge badge-blue" style="margin-left:8px;">Written Story</span>';
  const aHtml=(q.answers||[]).map(a=>`<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border);"><div style="font-size:.7rem;color:var(--orange);text-transform:uppercase;font-weight:700;margin-bottom:3px;">${esc(a.chapter)}</div><div style="font-size:.8rem;color:var(--muted);font-style:italic;margin-bottom:5px;">${esc(a.question)}</div><div style="font-size:.88rem;color:var(--cream);line-height:1.6;">${esc(a.answer)}</div></div>`).join('');
  const prev=getEl('respond-preview');
  prev.innerHTML=`<div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:10px;"><strong style="color:var(--gold);">${esc(name)}</strong>${prefBadge}</div><div style="font-size:.75rem;color:var(--muted);margin-bottom:12px;">📅 ${esc(q.dateTime||q.date)}</div>${aHtml||'<div style="color:var(--muted);">No answers provided.</div>'}${q.response?`<div style="margin-top:10px;padding:9px;background:rgba(39,174,96,.08);border:1px solid rgba(39,174,96,.2);border-radius:6px;font-size:.84rem;color:var(--cream);"><strong style="font-size:.7rem;color:var(--green-lt);display:block;margin-bottom:3px;">PREVIOUS REPLY:</strong>${esc(q.response)}</div>`:''}`;
  const ta=getEl('respond-text');ta.value='';ta.placeholder='Write your reply to '+name+'...';
  const note=getEl('respond-msg-note');if(note)note.style.display='block';
  prev.scrollTop=0;openModal('modal-respond');
}
function sendResponse(){
  if(replyGuard)return;
  const text=getEl('respond-text').value.trim();
  if(!text){alert('Please write a reply before sending.');return;}
  const qs=lsGet('questions',[]),q=qs.find(x=>x.id===respondingTo);if(!q)return;
  replyGuard=true;
  q.response=text;q.status='responded';
  saveList('questions',qs);
  const users=lsGet('users',[]);
  const dir=users.find(u=>u.role==='director');
  const member=users.find(u=>u.email===q.email);
  if(dir&&member){
    const allMsgs=lsGet('messages',{});
    const key=getMsgKey(dir.email,member.email);
    if(!allMsgs[key])allMsgs[key]=[];
    const {time}=nowDT();
    allMsgs[key].push({from:dir.email,fromName:'Director',text:'📖 Story Submission Reply: '+text,time,read:false});
    saveMessages(allMsgs);
  }
  const dName=q.anon?'Community Member':q.from;
  fireEmail(q.email,'Where It All Began — The Director Replied',`Hi ${dName},\n\nThe director replied to your story submission. Check your Messages tab.\n\nReply: "${text}"\n\nThe Where It All Began Team\nwhereitallbegan1@yahoo.com`,dName);
  closeModal('modal-respond');renderDirectorPanel();
  if(currentTab==='messages'&&dir&&member){const key=getMsgKey(dir.email,member.email);if(currentConvo===key)renderThread(key);renderContacts();}
  replyGuard=false;
}

// ──────────────────────────────────────────────────────────────────
// EMAIL SETTINGS
// ──────────────────────────────────────────────────────────────────
function renderEmailSettings(){
  const el=getEl('email-settings-panel');if(!el)return;
  const cfg=getEmailCfg();const configured=!!(cfg.serviceId&&cfg.templateId&&cfg.publicKey);
  el.innerHTML=`
    <div style="margin-bottom:14px;">
      <div style="font-size:.9rem;color:var(--cream);margin-bottom:6px;">📤 Sending from: <strong style="color:#ffcc44;">whereitallbegan1@yahoo.com</strong></div>
      <div style="font-size:.82rem;margin-bottom:10px;">${configured?'<span class="status-active">✓ EmailJS Connected</span>':'<span class="status-pending-approval">⚠ Not connected yet</span>'}</div>
      ${!configured?`<div style="background:rgba(224,123,26,.1);border:1px solid rgba(224,123,26,.3);border-radius:9px;padding:12px 14px;font-size:.82rem;color:#f0d090;line-height:1.75;margin-bottom:12px;">
        1. Go to <a href="https://login.yahoo.com" target="_blank" style="color:#ffcc44;">Yahoo Account Security</a> → Generate App Password<br>
        2. Go to <a href="https://www.emailjs.com" target="_blank" style="color:#ffcc44;">emailjs.com</a> → Add Yahoo service → Create template → Copy keys<br>
        3. Paste below and click Save
      </div>`:''}
      <button class="btn-sm btn-sm-orange" onclick="toggleEmailSetup()">${configured?'⚙ Edit Settings':'🔧 Enter Keys'}</button>
    </div>
    <div id="email-setup-form" style="display:${configured?'none':'block'};background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:16px;margin-top:4px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        ${[['Public Key','cfg-pub',cfg.publicKey||''],['Service ID','cfg-svc',cfg.serviceId||''],['Template ID','cfg-tpl',cfg.templateId||''],['Reply-To','cfg-reply',cfg.replyTo||'whereitallbegan1@yahoo.com']].map(([label,id,val])=>`
          <div><label style="display:block;font-size:.74rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;">${label}</label>
          <input type="text" id="${id}" value="${esc(val)}" style="width:100%;padding:9px 12px;background:var(--panel2);border:2px solid var(--border2);border-radius:7px;font-size:.88rem;color:#fff;font-family:'Barlow',sans-serif;outline:none;" onfocus="this.style.borderColor='#e07b1a'" onblur="this.style.borderColor='var(--border2)'"/></div>`).join('')}
      </div>
      <div style="background:rgba(41,128,185,.1);border:1px solid rgba(41,128,185,.25);border-radius:8px;padding:10px 12px;font-size:.78rem;color:var(--blue-lt);line-height:1.7;margin-bottom:12px;">
        Template needs: <code style="color:#ffcc44;">{{to_email}}</code> <code style="color:#ffcc44;">{{to_name}}</code> <code style="color:#ffcc44;">{{subject}}</code> <code style="color:#ffcc44;">{{message}}</code> <code style="color:#ffcc44;">{{from_name}}</code> <code style="color:#ffcc44;">{{reply_to}}</code>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn-sm btn-sm-orange" onclick="saveEmailSettings()" style="padding:8px 16px;">💾 Save</button>
        <button class="btn-sm btn-sm-outline" onclick="testEmail()" style="padding:8px 16px;">📨 Test</button>
        ${configured?`<button class="btn-sm btn-sm-red" onclick="clearEmailSettings()" style="padding:8px 16px;">🗑 Clear</button>`:''}
      </div>
      <div id="email-cfg-msg" style="margin-top:10px;font-size:.82rem;min-height:20px;"></div>
    </div>`;
}
function toggleEmailSetup(){const f=getEl('email-setup-form');if(f)f.style.display=f.style.display==='none'?'block':'none';}
function saveEmailSettings(){
  const pub=(getEl('cfg-pub')?.value||'').trim(),svc=(getEl('cfg-svc')?.value||'').trim();
  const tpl=(getEl('cfg-tpl')?.value||'').trim(),reply=(getEl('cfg-reply')?.value||'whereitallbegan1@yahoo.com').trim();
  if(!pub||!svc||!tpl){getEl('email-cfg-msg').innerHTML='<span style="color:#ff9a8a;">Please fill in all three keys.</span>';return;}
  saveEmailCfg({publicKey:pub,serviceId:svc,templateId:tpl,replyTo:reply});initEmailJS();
  getEl('email-cfg-msg').innerHTML='<span style="color:var(--green-lt);">✓ Saved!</span>';
  setTimeout(()=>renderEmailSettings(),1200);
}
function clearEmailSettings(){if(!confirm('Remove EmailJS settings?'))return;lsDel('emailcfg');renderEmailSettings();}
async function testEmail(){
  const msg=getEl('email-cfg-msg');if(msg)msg.innerHTML='<span style="color:var(--gold);">Sending…</span>';
  await sendEmail(currentUser.email,'Director','Where It All Began — Test Email ✓','This is a test. If you received this, EmailJS is working correctly!');
  if(msg)msg.innerHTML=`<span style="color:var(--green-lt);">✓ Test sent to ${esc(currentUser.email)}</span>`;
}

// ──────────────────────────────────────────────────────────────────
// MODALS
// ──────────────────────────────────────────────────────────────────
function openModal(id){getEl(id)?.classList.add('open');}
function closeModal(id){getEl(id)?.classList.remove('open');}

// ──────────────────────────────────────────────────────────────────
// DOM READY
// ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.modal-overlay').forEach(o=>{
    o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');});
  });

  // Init Firebase
  initFirebase();
  // Init local data
  seedLocalDefaults();
  // Init broadcast channel for same-browser tab sync
  initBroadcast();

  // Restore session — stays logged in on page refresh
  const saved=restoreSession();
  if(saved){
    // Re-sync user from localStorage in case it was updated
    const freshUsers=lsGet('users',[]);
    currentUser=freshUsers.find(u=>u.email===saved.email)||saved;
    startApp();
  }else{
    getEl('page-auth').style.display='flex';
    getEl('page-app').style.display='none';
    showAuthTab('login');
  }
});
