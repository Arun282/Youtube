'use client';
import {useEffect,useMemo,useState} from "react";
function getId(url:string){try{const u=new URL(url);if(u.hostname.includes("youtu.be"))return u.pathname.slice(1);if(u.searchParams.get("v"))return u.searchParams.get("v");const m=u.pathname.match(/\/shorts\/([^/]+)/);return m?.[1]||null}catch{return null}}
export default function Home(){
const [url,setUrl]=useState(""),[comments,setComments]=useState<string[]>(Array(100).fill("❤️")),[status,setStatus]=useState<string[]>(Array(100).fill("Not posted")),[selected,setSelected]=useState(0),[logged,setLogged]=useState(false),[posting,setPosting]=useState(false),id=useMemo(()=>getId(url),[url]);
useEffect(()=>{fetch("/api/auth/status").then(r=>r.json()).then(d=>setLogged(!!d.loggedIn)).catch(()=>{});},[]);
const update=(i:number,v:string)=>{setSelected(i);setComments(c=>{const n=[...c];n[i]=v;return n})};
const postSelected=async()=>{
if(!id||!logged||posting||!comments[selected].trim())return;
setPosting(true);setStatus(s=>{const n=[...s];n[selected]="Posting…";return n});
try{const r=await fetch("/api/comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({videoId:id,comment:comments[selected]})});const d=await r.json();if(r.ok){setStatus(s=>{const n=[...s];n[selected]="Posted on YouTube";return n});}else{setStatus(s=>{const n=[...s];n[selected]=d.error||"Post failed";return n});if(r.status===401)setLogged(false)}}catch{setStatus(s=>{const n=[...s];n[selected]="Post failed";return n})}finally{setPosting(false)}
};
const login=()=>{window.location.href="/api/auth/login"};
return <main><div className="card"><div className="badge">YOUTUBE COMMENT TOOL</div><h1>100 Comment Boxes</h1><p className="sub">Sign in with the Google/YouTube account you want to use. Select a comment box, then use the button below to post that one comment.</p>
<div className="auth"><span>{logged?"✓ YouTube account connected":"YouTube account not connected"}</span><button onClick={login}>{logged?"Reconnect Google":"Sign in with Google"}</button></div>
<label>Video URL</label><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..."/>{id?<div className="video"><iframe src={"https://www.youtube.com/embed/"+id} title="YouTube video" allowFullScreen/> </div>:<div className="hint">Enter a valid YouTube video URL to see the preview.</div>}
<div className="notice">Each box starts with ❤️. Select a box and click Post Comment to post that one comment.</div>
<div className="comment-list">{comments.map((comment,i)=><div className={"comment-box"+(selected===i?" selected":"")} key={i} onClick={()=>setSelected(i)}><div className="comment-head"><strong>Comment {i+1}</strong><span>{comment.length}/5000</span></div><textarea maxLength={5000} value={comment} onFocus={()=>setSelected(i)} onChange={e=>update(i,e.target.value)} placeholder={"Write comment "+(i+1)+"..."}/><div className="row"><span>{status[i]}</span><span>{selected===i?"Selected":"Tap to select"}</span></div></div>)}</div>
<button className="post-all" disabled={!id||!logged||!comments[selected].trim()||posting} onClick={postSelected}>{posting?"Processing…":"Post Comment"}</button>
<a className="yt" href={id?("https://www.youtube.com/watch?v="+id):"https://www.youtube.com"} target="_blank">Open on YouTube ↗</a><div className="footer-links"><a href="/privacy">Privacy Policy</a><span> · </span><a href="/terms">Terms of Service</a></div></div>

</main>}
