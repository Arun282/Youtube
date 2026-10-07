import crypto from "crypto";
const key=()=>crypto.createHash("sha256").update(process.env.SESSION_SECRET||"").digest();
export function seal(data:unknown){const iv=crypto.randomBytes(12);const c=crypto.createCipheriv("aes-256-gcm",key(),iv);const enc=Buffer.concat([c.update(JSON.stringify(data),"utf8"),c.final()]);return Buffer.concat([iv,c.getAuthTag(),enc]).toString("base64url")}
export function open<T>(value:string):T|null{try{const b=Buffer.from(value,"base64url"),iv=b.subarray(0,12),tag=b.subarray(12,28),enc=b.subarray(28);const d=crypto.createDecipheriv("aes-256-gcm",key(),iv);d.setAuthTag(tag);return JSON.parse(Buffer.concat([d.update(enc),d.final()]).toString("utf8"))}catch{return null}}
export function oauthClient(){const {google}=require("googleapis");return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,process.env.GOOGLE_REDIRECT_URI)}
