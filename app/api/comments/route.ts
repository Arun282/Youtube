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

    // Force an access-token refresh/check before attempting the write.
    await client.getAccessToken();

    const yt=google.youtube({version:"v3",auth:client});

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

    if(reason==="commentsDisabled")return Response.json({error:"Comments are disabled for this YouTube video."},{status:400});
    if(reason==="forbidden"||api?.code===403)return Response.json({error:"YouTube did not allow this account to post the comment. Check that the Google account is authorized and has permission to comment on this video."},{status:403});
    if(api?.code===401)return Response.json({error:"Google/YouTube login expired. Please sign in again."},{status:401});

    return Response.json({error:message,reason},{status:api?.code&&api.code>=400?api.code:500});
  }
}