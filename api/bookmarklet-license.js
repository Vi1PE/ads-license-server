const VERIFY='https://ads-license-server.vercel.app/api/verify';
module.exports=async(req,res)=>{
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'");
  if(req.method==='GET'){
    const device=String(req.query?.device_id||'').replace(/[<>&"']/g,'');
    return res.status(200).send(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>NEOVOLT License</title><style>body{font:15px Arial;background:#101318;color:#fff;padding:28px}main{max-width:390px;margin:auto;background:#171b21;padding:22px;border-radius:16px}input,button{width:100%;box-sizing:border-box;padding:12px;margin-top:10px;border-radius:9px}input{background:#0f1216;color:#fff;border:1px solid #444}button{border:0;cursor:pointer}small{color:#888}</style><main><h2>NEOVOLT License</h2><input id="k" placeholder="License key"><button id="b">Verify</button><p id="s"></p><small>Device binding is enabled.</small></main><script>const d=${JSON.stringify(device)};const b=document.getElementById('b'),k=document.getElementById('k'),s=document.getElementById('s');b.onclick=async()=>{const serial=k.value.trim();if(!serial){s.textContent='Enter a license key';return}b.disabled=true;s.textContent='Checking...';try{const r=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({serial,device_id:d})});const j=await r.json();s.textContent=j.message||'';if(window.opener)window.opener.postMessage({type:'NEOVOLT_LICENSE_RESULT',...j},'https://www.facebook.com');if(window.opener&&j.active)setTimeout(()=>window.close(),500)}catch(e){s.textContent='Connection error';}finally{b.disabled=false}};<\/script>`);
  }
  return res.status(405).send('Method not allowed');
};
