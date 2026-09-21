// Vercel Serverless Function: api/license-ui.js
// Opens as a standalone page, so Facebook's page CSP does not govern this page.
// It verifies against the existing /api/verify endpoint and sends the result
// back to the opener with postMessage.

module.exports = async (req, res) => {
  const q = req.query || {};
  const deviceId = String(q.device_id || "").trim();

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ADS FUNDING TOOL — License</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#09070d;color:#fff;font:14px Arial}
.box{width:min(400px,90vw);padding:28px;border:1px solid #00d2ff;border-radius:18px;background:#160b24;box-shadow:0 0 50px #00d2ff33}
h2{margin:0 0 8px;text-align:center;color:#00d2ff}
p{text-align:center;color:#bbb;font-size:12px}
input,button{width:100%;box-sizing:border-box;padding:12px;border-radius:8px;margin-top:10px}
input{background:#050509;color:#fff;border:1px solid #00d2ff66}
button{border:0;color:#fff;font-weight:700;background:linear-gradient(135deg,#00d2ff,#7928ca);cursor:pointer}
#status{text-align:center;min-height:20px;margin-top:12px;font-size:12px}
.ok{color:#35d07f}.err{color:#ff6666}
</style>
</head>
<body>
<div class="box">
<h2>ADS FUNDING TOOL</h2>
<p>SECURE LICENSE AUTHENTICATION</p>
<input id="key" autocomplete="off" placeholder="Enter License Key">
<button id="verify">VERIFY & CONTINUE</button>
<div id="status"></div>
</div>
<script>
const DEVICE_ID = ${JSON.stringify(deviceId)};
const API = "/api/verify";
const statusEl = document.getElementById("status");
const keyEl = document.getElementById("key");
const btn = document.getElementById("verify");

function send(result){
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({
      type:"APX_LICENSE_RESULT",
      active:result.active === true,
      result:result
    }, "*");
  }
}

async function verify(){
  const serial = keyEl.value.trim();
  if(!serial){ statusEl.textContent="Enter your license key."; statusEl.className="err"; return; }
  if(!DEVICE_ID){ statusEl.textContent="Missing device ID."; statusEl.className="err"; return; }

  btn.disabled=true;
  btn.textContent="VERIFYING...";
  statusEl.textContent="Connecting...";
  statusEl.className="";

  try{
    const r = await fetch(API,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({serial,device_id:DEVICE_ID})
    });
    const result = await r.json().catch(()=>({active:false,message:"Invalid server response."}));
    if(result.active === true){
      statusEl.textContent="License verified successfully.";
      statusEl.className="ok";
      send(result);
      setTimeout(()=>window.close(),300);
    }else{
      statusEl.textContent=result.message || "License verification failed.";
      statusEl.className="err";
      btn.disabled=false;
      btn.textContent="VERIFY & CONTINUE";
      send(result);
    }
  }catch(e){
    statusEl.textContent="Could not connect to license server.";
    statusEl.className="err";
    btn.disabled=false;
    btn.textContent="VERIFY & CONTINUE";
  }
}
btn.onclick=verify;
keyEl.addEventListener("keydown",e=>{if(e.key==="Enter")verify();});
</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(html);
};
