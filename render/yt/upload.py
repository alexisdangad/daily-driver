import os,sys,json,urllib.parse,urllib.request
# usage: upload.py video.mp4 "titre" "description"
cid=os.environ['YT_CLIENT_ID'];sec=os.environ['YT_CLIENT_SECRET'];rt=open('veille/.yt-refresh').read().strip()
r=urllib.request.Request('https://oauth2.googleapis.com/token',urllib.parse.urlencode({'client_id':cid,'client_secret':sec,'refresh_token':rt,'grant_type':'refresh_token'}).encode())
at=json.load(urllib.request.urlopen(r))['access_token']
f,title,desc=sys.argv[1:4];data=open(f,'rb').read()
meta={'snippet':{'title':title[:95],'description':desc,'categoryId':'2'},'status':{'privacyStatus':'public','selfDeclaredMadeForKids':False,'containsSyntheticMedia':True}}
i=urllib.request.Request('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',json.dumps(meta).encode(),{'Authorization':'Bearer '+at,'Content-Type':'application/json','X-Upload-Content-Type':'video/mp4'})
u=urllib.request.urlopen(i).headers['Location']
p=urllib.request.Request(u,data,{'Content-Type':'video/mp4'},method='PUT')
print(urllib.request.urlopen(p).read().decode())
