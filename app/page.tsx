'use client';

import {useMemo,useState} from "react";

function getId(url:string){
  try{
    const u=new URL(url);
    if(u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if(u.searchParams.get("v")) return u.searchParams.get("v");
    const m=u.pathname.match(/\/shorts\/([^/]+)/);
    return m?.[1]||null;
  }catch{return null}
}

export default function Home(){
  const [url,setUrl]=useState("");
  const [comments,setComments]=useState<string[]>(Array(100).fill(""));
  const [posted,setPosted]=useState<boolean[]>(Array(100).fill(false));
  const id=useMemo(()=>getId(url),[url]);

  const update=(i:number,value:string)=>{
    setComments(c=>{const n=[...c];n[i]=value;return n});
    setPosted(p=>{const n=[...p];n[i]=false;return n});
  };

  const postOne=(i:number)=>{
    if(!id || !comments[i].trim()) return;
    setPosted(p=>{const n=[...p];n[i]=true;return n});
  };

  return <main>
    <div className="card">
      <div className="badge">YOUTUBE COMMENT TOOL</div>
      <h1>100 Comment Boxes</h1>
      <p className="sub">Paste a YouTube video URL, then write separate comments below. Each comment has its own Post button.</p>

      <label>Video URL</label>
      <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />

      {id ? <div className="video"><iframe src={"https://www.youtube.com/embed/"+id} title="YouTube video" allowFullScreen/></div>
           : <div className="hint">Enter a valid YouTube video URL to see the preview.</div>}

      <div className="notice">For safety, comments must be posted individually. This page does not provide one-click bulk posting.</div>

      <div className="comment-list">
        {comments.map((comment,i)=><div className="comment-box" key={i}>
          <div className="comment-head"><strong>Comment {i+1}</strong><span>{comment.length}/5000</span></div>
          <textarea maxLength={5000} value={comment} onChange={e=>update(i,e.target.value)} placeholder={"Write comment "+(i+1)+"..."} />
          <div className="row">
            <span>{posted[i] ? "Posted/ready" : "Not posted"}</span>
            <button disabled={!id||!comment.trim()||posted[i]} onClick={()=>postOne(i)}>
              {posted[i] ? "Posted" : "Post this comment"}
            </button>
          </div>
          {posted[i]&&<div className="success">This comment is prepared. Actual YouTube posting requires the site's authorized YouTube API connection.</div>}
        </div>)}
      </div>

      <a className="yt" href={id?("https://www.youtube.com/watch?v="+id):"https://www.youtube.com"} target="_blank">
        Open on YouTube ↗
      </a>
    </div>
  </main>
}
