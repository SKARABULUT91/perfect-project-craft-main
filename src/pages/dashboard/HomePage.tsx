import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogOut, User, CheckCircle2, AlertTriangle, Shield, Wifi, WifiOff } from 'lucide-react';

export default function HomePage() {
  const { stats, resetStats, logs, addLog, clearLogs, twitterCredentials, loginTwitter, logoutTwitter, settings } = useStore();
  const [logFilter, setLogFilter] = useState<'all' | 'error'>('all');

  const statItems = [
    { label: 'BEĞENİ', value: stats.likes, emoji: '❤️' },
    { label: 'RETWEET', value: stats.rts, emoji: '🔁' },
    { label: 'TAKİP', value: stats.follows, emoji: '👤' },
    { label: 'T. BIRAKMA', value: stats.unfollows, emoji: '👋' },
  ];

  const handleReset = () => {
    resetStats();
    addLog('İstatistikler başarıyla sıfırlandı.', 'success');
  };

  const handleManualLogin = () => {
    const username = prompt('Twitter kullanıcı adınızı girin (@olmadan):');
    if (username && username.trim()) {
      loginTwitter(username.trim(), '');
      addLog(`✅ @${username.trim()} hesabı bağlandı.`, 'success');
    }
  };

  const handleDisconnect = () => {
    const username = twitterCredentials.username;
    logoutTwitter();
    addLog(`@${username} bağlantısı kesildi.`, 'info');
  };

  const filteredLogs = logFilter === 'error' ? logs.filter((l) => l.type === 'error') : logs;
  const errorCount = logs.filter((l) => l.type === 'error').length;

  return (
    <div>
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Twitter Bağlantısı
        </div>
        {twitterCredentials.isLoggedIn ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold text-sm">@{twitterCredentials.username}</span>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-xs text-green-500">Bağlantı aktif — Otomasyon hazır</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={handleDisconnect}>
              <LogOut className="w-4 h-4 mr-1.5" /> Bağlantıyı Kes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-yellow-500 text-sm">
              <WifiOff className="w-4 h-4" />
              <span>Bağlantı yok</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Twitter kullanıcı adınızı girerek oturumu başlatın.
            </p>
            <Button className="w-full" onClick={handleManualLogin}>
              <Wifi className="w-4 h-4 mr-1.5" /> Hesabı Bağla
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">⏱️ Saatlik Oran Limiti</div>
          <span className="text-xs text-muted-foreground">{stats.likes + stats.rts + stats.follows} / {settings.rateLimitPerHour}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              ((stats.likes + stats.rts + stats.follows) / settings.rateLimitPerHour) > 0.8 ? 'bg-destructive' : 'bg-primary'
            )}
            style={{ width: `${Math.min(100, ((stats.likes + stats.rts + stats.follows) / settings.rateLimitPerHour) * 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {statItems.map((item) => (
          <div key={item.label} className="bg-card border border-border rounded-lg p-4 lg:p-5">
            <div className="text-[10px] lg:text-xs text-muted-foreground font-medium mb-1.5">{item.emoji} {item.label}</div>
            <div className="text-2xl lg:text-3xl font-bold text-foreground">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" className="border-destructive/20 text-destructive bg-destructive/10 hover:bg-destructive/20" onClick={handleReset}>
          İstatistikleri Sıfırla
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">📜 Son İşlemler (Loglar)</div>
          <div className="flex items-center gap-2">
            <Button variant={logFilter === 'all' ? 'secondary' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setLogFilter('all')}>Tümü</Button>
            <Button variant={logFilter === 'error' ? 'secondary' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setLogFilter('error')}>
              <AlertTriangle className="w-3 h-3 mr-1 text-destructive" />
              Hatalar {errorCount > 0 && `(${errorCount})`}
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={clearLogs}>Temizle</Button>
          </div>
        </div>
        <div className="bg-background border border-border rounded-lg h-[300px] lg:h-[350px] overflow-y-auto p-3 font-mono text-[11px] lg:text-xs">
          {filteredLogs.length === 0 ? (
            <div className="text-muted-foreground/50 text-center py-8">{logFilter === 'error' ? 'Hata kaydı yok.' : 'Log kaydı yok.'}</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex gap-2 py-1 border-b border-card">
                <span className="text-muted-foreground/50 min-w-[50px] flex-shrink-0">{log.time}</span>
                <span className={cn(
                  log.type === 'info' && 'text-primary',
                  log.type === 'success' && 'text-green-500',
                  log.type === 'error' && 'text-destructive',
                  log.type === 'default' && 'text-muted-foreground',
                )}>
                  {log.type === 'error' && '⚠️ '}{log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
