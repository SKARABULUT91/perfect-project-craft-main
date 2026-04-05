import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Shield, Wifi, User, Eye } from 'lucide-react'; // Eye ikonu eklendi
import type { TwitterAccount } from '@/lib/types';

export default function AccountsPage() {
  const { accounts, addAccount, removeAccount, setActiveAccount, addLog } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  
  // State yönetimi (API Key kısımları zaten yok, sadece mail/şifre odaklı)
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [new2FA, setNew2FA] = useState('');
  const [newProxy, setNewProxy] = useState('');

  const handleAdd = () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      addLog("Kullanıcı adı ve şifre boş bırakılamaz.", "error");
      return;
    }

    const account: TwitterAccount = {
      id: crypto.randomUUID(),
      username: newUsername.trim().replace('@', ''), // @ işaretini temizler
      password: newPassword,
      twoFASecret: new2FA,
      proxy: newProxy,
      isActive: accounts.length === 0,
      status: 'idle',
    };

    addAccount(account);
    addLog(`@${account.username} sisteme eklendi. Arka planda login denenecek.`, 'success');
    
    // Formu temizle
    setNewUsername('');
    setNewPassword('');
    setNew2FA('');
    setNewProxy('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <User className="w-5 h-5" /> Hesap Yönetimi
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Görüntülenme artırmak için kullanılacak hesapları buradan yönetin.</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm" className="bg-primary/90 hover:bg-primary">
          <Plus className="w-4 h-4 mr-1.5" /> Yeni Hesap
        </Button>
      </div>

      {showAdd && (
        <div className="bg-card border border-primary/20 rounded-lg p-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Otomasyon İçin Giriş Bilgileri
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-xs">E-posta veya Kullanıcı Adı</Label>
              <Input 
                placeholder="Örn: kodcum_ajans" 
                value={newUsername} 
                onChange={(e) => setNewUsername(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Şifre</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">2FA Secret (Otomatik Giriş İçin)</Label>
              <Input 
                placeholder="JBSW Y3DP..." 
                value={new2FA} 
                onChange={(e) => setNew2FA(e.target.value)} 
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Proxy (Tavsiye Edilir)</Label>
              <Input 
                placeholder="http://kullanici:sifre@ip:port" 
                value={newProxy} 
                onChange={(e) => setNewProxy(e.target.value)} 
                className="bg-background/50"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end border-t border-border pt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>İptal</Button>
            <Button size="sm" onClick={handleAdd}>Hesabı Kaydet</Button>
          </div>
        </div>
      )}

      {/* Hesap listeleme kısmı mevcut mantıkla devam ediyor */}
      {/* ... (Daha önce gönderdiğin listeleme kodları buraya gelecek) */}

      <div className="bg-card border border-border rounded-lg p-5 border-l-4 border-l-primary">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4" /> Görüntülenme Stratejisi
        </div>
        <ul className="text-xs text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Giriş yaptıktan sonra <b>cookies.json</b> dosyası oluşturulur, böylece sürekli şifre girilmez.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Proxy kullanımı, yerel IP adresinizin X tarafından kara listeye alınmasını engeller.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Görüntülenme botu çalışırken tarayıcıyı "gizli modda" taklit ederek parmak izini gizler.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
