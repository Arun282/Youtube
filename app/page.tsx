'use client';
import {useEffect,useMemo,useState} from "react";
function getId(url:string){try{const u=new URL(url);if(u.hostname.includes("youtu.be"))return u.pathname.slice(1);if(u.searchParams.get("v"))return u.searchParams.get("v");const m=u.pathname.match(/\/shorts\/([^/]+)/);return m?.[1]||null}catch{return null}}
export default function Home(){
const [url,setUrl]=useState(""),[comments,setComments]=useState<string[]>(Array(100).fill("❤️")),[status,setStatus]=useState<string[]>(Array(100).fill("Not posted")),[selected,setSelected]=useState(0),[logged,setLogged]=useState(false),[posting,setPosting]=useState(false),id=useMemo(()=>getId(url),[url]);
useEffect(()=>{fetch("/api/auth/status").then(r=>r.json()).then(d=>setLogged(!!d.loggedIn)).catch(()=>{});},[]);
const update=(i:number,v:string)=>{setSelected(i);setComments(c=>{const n=[...c];n[i]=v;return n})};
const postComment=async(i:number)=>{
if(!id||!logged||posting||!comments[i].trim())return false;
setStatus(s=>{const n=[...s];n[i]="Posting…";return n});
try{const r=await fetch("/api/comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({videoId:id,comment:comments[i]})});const d=await r.json();if(r.ok){setStatus(s=>{const n=[...s];n[i]="Posted on YouTube";return n});return true}else{setStatus(s=>{const n=[...s];n[i]=d.error||"Post failed";return n});if(r.status===401)setLogged(false);return false}}catch{setStatus(s=>{const n=[...s];n[i]="Post failed";return n});return false}
};
const submitAllWithReview=async()=>{
if(!id||!logged||posting)return;
const pending=comments.map((x,i)=>({x:x.trim(),i})).filter(v=>v.x);
if(!pending.length)return;
setPosting(true);
for(const item of pending){
if(!window.confirm(`Comment ${item.i+1} will be posted to YouTube:\n\n${item.x}\n\nOK = Post this comment\nCancel = Skip this comment`))continue;
const ok=await postComment(item.i);
if(!ok&&status[item.i]?.includes("expired"))break;
}
setPosting(false);
};
const login=()=>{window.location.href="/api/auth/login"};
return <main><div className="card"><div className="badge">YOUTUBE COMMENT TOOL</div><h1>100 Comment Boxes</h1><p className="sub">Sign in with the Google/YouTube account you want to use. Review your comments and use the button below. Each comment requires your confirmation before it is posted.</p>
<div className="auth"><span>{logged?"✓ YouTube account connected":"YouTube account not connected"}</span><button onClick={login}>{logged?"Reconnect Google":"Sign in with Google"}</button></div>
<label>Video URL</label><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..."/>{id?<div className="video"><iframe src={"https://www.youtube.com/embed/"+id} title="YouTube video" allowFullScreen/> </div>:<div className="hint">Enter a valid YouTube video URL to see the preview.</div>}
<div className="notice">Each box starts with ❤️. Empty comments are skipped. Click Comment Submit to review each non-empty comment one by one.</div>
<div className="comment-list">{comments.map((comment,i)=><div className={"comment-box"+(selected===i?" selected":"")} key={i} onClick={()=>setSelected(i)}><div className="comment-head"><strong>Comment {i+1}</strong><span>{comment.length}/5000</span></div><textarea maxLength={5000} value={comment} onFocus={()=>setSelected(i)} onChange={e=>update(i,e.target.value)} placeholder={"Write comment "+(i+1)+"..."}/><div className="row"><span>{status[i]}</span><span>{selected===i?"Selected":"Tap to select"}</span></div></div>)}</div>
<button className="post-all" disabled={!id||!logged||posting||!comments.some(c=>c.trim())} onClick={submitAllWithReview}>{posting?"Reviewing…":`Comment Submit (${comments.filter(c=>c.trim()).length})`}</button>
<a className="yt" href={id?("https://www.youtube.com/watch?v="+id):"https://www.youtube.com"} target="_blank">Open on YouTube ↗</a><div className="footer-links"><a href="/privacy">Privacy Policy</a><span> · </span><a href="/terms">Terms of Service</a></div></div>

</main>}
