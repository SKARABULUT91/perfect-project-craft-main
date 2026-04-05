from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from twikit import Client
import asyncio
import os

app = FastAPI()

# CORS Ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# React'ten gelecek veri yapısı
class AccountData(BaseModel):
    username: str
    password: str
    email: str # X bazen onay için mail de isteyebilir
    two_fa: str = None
    proxy: str = None

# Global bir client sözlüğü (Çoklu hesap yönetimi için)
clients = {}

@app.get("/")
def read_root():
    return {"status": "KODCUM Görüntülenme Motoru Aktif"}

@app.post("/login-account")
async def login_account(data: AccountData):
    client = Client('en-US')
    
    # Eğer proxy varsa ayarla
    if data.proxy:
        client.set_proxy(data.proxy)

    try:
        # Giriş işlemi (API Key gerektirmez)
        await client.login(
            auth_info_1=data.username,
            auth_info_2=data.email,
            password=data.password,
            totp_secret=data.two_fa # 2FA kodunu otomatik üretir
        )
        
        # Oturumu kaydet (Her seferinde login olmamak için)
        cookie_path = f"cookies_{data.username}.json"
        client.save_cookies(cookie_path)
        clients[data.username] = client
        
        return {"message": f"@{data.username} başarıyla bağlandı!", "status": "success"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/increase-views")
print(f"Gelen tweet_id: {tweet_id}, Kullanıcı: {username}")
async def increase_views(tweet_id: str, username: str):
    """
    Belirtilen tweetin görüntülenmesini tetikler.
    """
    if username not in clients:
        # Eğer hafızada yoksa dosyadan yüklemeyi dene
        cookie_path = f"cookies_{username}.json"
        if os.path.exists(cookie_path):
            client = Client('en-US')
            client.load_cookies(cookie_path)
            clients[username] = client
        else:
            return {"error": "Hesap aktif değil, önce login olun."}

    try:
        client = clients[username]
        # Tweet detayına gitmek görüntülenme tetikler
        tweet = await client.get_tweet_by_id(tweet_id)
        
        # Simülasyon: Tweeti "okunmuş" saydırmak için küçük bir bekleme
        await asyncio.sleep(2) 
        
        return {"message": "Görüntülenme işlemi tamamlandı.", "new_count": tweet.view_count}
    except Exception as e:
        return {"error": str(e)}
