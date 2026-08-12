const {loadKey}=require('./lib/keyLoader');
const fs=require('fs');
const raw=fs.readFileSync('C:/Users/Administrator/hermes-web/.env','utf8');
const urlLine=raw.split(/\r?\n/).find(l=>l.startsWith('SUPABASE_URL='));
const SUPABASE_URL=urlLine.split('=')[1];
const KEY=loadKey();
(async()=>{
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/businesses?select=*&limit=1`,{
      headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}
    });
    console.log('status',res.status);
    if(res.status!==200){
      const txt=await res.text();
      console.log('body',txt);
    }
  }catch(e){
    console.error('error',e);
  }
})();
