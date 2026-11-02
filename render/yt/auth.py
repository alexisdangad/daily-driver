import os,time,json,urllib.parse,urllib.request
cid=os.environ['YT_CLIENT_ID'];sec=os.environ['YT_CLIENT_SECRET']
def post(u,d):
    r=urllib.request.Request(u,urllib.parse.urlencode(d).encode())
    try: return json.load(urllib.request.urlopen(r))
    except urllib.error.HTTPError as e: return json.load(e)
d=post('https://oauth2.googleapis.com/device/code',{'client_id':cid,'scope':'https://www.googleapis.com/auth/youtube.upload'})
print('\n>>> CODE:',d['user_code'],' URL:',d['verification_url'],'\n',flush=True)
end=time.time()+d['expires_in']
while time.time()<end:
    time.sleep(d.get('interval',5))
    t=post('https://oauth2.googleapis.com/token',{'client_id':cid,'client_secret':sec,'device_code':d['device_code'],'grant_type':'urn:ietf:params:oauth:grant-type:device_code'})
    if 'refresh_token' in t:
        open('veille/.yt-refresh','w').write(t['refresh_token']);print('OK token saved');break
    if t.get('error') not in ('authorization_pending','slow_down'):
        print(t);break
