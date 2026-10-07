import {cookies} from "next/headers";import {open} from "../../../../lib/auth";export async function GET(){const s=cookies().get("yt_session")?.value;return Response.json({loggedIn:!!(s&&open(s))})}
