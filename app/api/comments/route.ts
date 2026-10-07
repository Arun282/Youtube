import {cookies} from "next/headers";
import {google} from "googleapis";
import {oauthClient,open} from "../../../lib/auth";

export async function POST(req:Request){
  try{
    const c=await cookies();
    const raw=c.get("yt_session")?.value;
    const session=raw?open<{refreshToken:string}>(raw):null;
    if(!session?.refreshToken)return Response.json({error:"Google/YouTube login expired. Please sign in again."},{status:401});

    const body=await req.json();
    const videoId=String(body?.videoId||"").trim();
    const comment=String(body?.comment||"").trim();
    if(!videoId||!comment)return Response.json({error:"Video URL and comment are required."},{status:400});
    if(comment.length>5000)return Response.json({error:"Comment is longer than YouTube's 5000 character limit."},{status:400});

    const client=oauthClient();
    client.setCredentials({refresh_token:session.refreshToken});
    try{ await client.getAccessToken(); }
    catch(e:any){
      const msg=e?.response?.data?.error_description||e?.response?.data?.error||e?.message||"Google authorization expired.";
      return Response.json({error:"Google authorization expired. Please click Reconnect Google and sign in again.",details:String(msg)},{status:401});
    }

    const yt=google.youtube({version:"v3",auth:client});

    const channel=await yt.channels.list({part:["id","snippet"],mine:true});
    if(!channel.data.items?.length)
      return Response.json({error:"The signed-in Google account has no YouTube channel available for commenting."},{status:403});

    const video=await yt.videos.list({part:["snippet"],id:[videoId]});
    if(!video.data.items?.length)return Response.json({error:"YouTube video was not found or is unavailable."},{status:404});

    const result=await yt.commentThreads.insert({
      part:["snippet"],
      requestBody:{
        snippet:{
          videoId,
          topLevelComment:{snippet:{textOriginal:comment}}
        }
      }
    });

    return Response.json({ok:true,id:result.data.id,message:"Comment posted successfully."});
  }catch(e:any){
    const api=e?.response?.data?.error;
    const reason=api?.errors?.[0]?.reason||api?.status||"";
    const message=api?.message||e?.message||"YouTube API error";
    const code=api?.code||e?.response?.status||500;

    if(reason==="commentsDisabled")return Response.json({error:"Comments are disabled for this YouTube video."},{status:400});
    if(reason==="quotaExceeded"||reason==="dailyLimitExceeded")return Response.json({error:"YouTube API quota has been exceeded for this project. Try again after the quota resets."},{status:429});
    if(reason==="forbidden"||code===403)return Response.json({error:"YouTube rejected this comment. Check that comments are enabled on the video and that the signed-in account is allowed to comment.",details:message},{status:403});
    if(code===401)return Response.json({error:"Google/YouTube login expired. Please click Reconnect Google and sign in again."},{status:401});
    return Response.json({error:message,reason},{status:code>=400?code:500});
  }
}
