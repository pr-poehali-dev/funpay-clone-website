import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna'
];

interface User {
  id: number;
  username: string;
  email: string;
  avatar_id: number;
  balance?: number;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('tickpay_user');
    const savedToken = localStorage.getItem('tickpay_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    const token = localStorage.getItem('tickpay_token');
    const savedUser = localStorage.getItem('tickpay_user');
    if (!token || !savedUser) return;

    const user = JSON.parse(savedUser);
    try {
      const response = await fetch('https://functions.poehali.dev/8329b011-9af6-4665-9eb1-dbfdd09029df', {
        method: 'GET',
        headers: {
          'X-User-Token': token,
          'X-User-Id': user.id.toString()
        }
      });

      const data = await response.json();
      if (response.ok) {
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Введите корректную сумму');
      return;
    }

    const token = localStorage.getItem('tickpay_token');
    const savedUser = localStorage.getItem('tickpay_user');
    if (!token || !savedUser) return;

    const user = JSON.parse(savedUser);
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/8329b011-9af6-4665-9eb1-dbfdd09029df', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token,
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Ошибка пополнения');
        return;
      }

      setBalance(data.balance);
      setShowBalanceDialog(false);
      setDepositAmount('');
      toast.success(`Баланс пополнен на ₽${amount}`);
    } catch (error) {
      toast.error('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/0c03e394-967b-4944-8dcd-20502e60f6e6', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          email,
          password,
          username: authMode === 'register' ? username : undefined,
          avatar_id: authMode === 'register' ? selectedAvatar + 1 : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Ошибка при входе');
        return;
      }

      localStorage.setItem('tickpay_user', JSON.stringify(data.user));
      localStorage.setItem('tickpay_token', data.session_token);
      setUser(data.user);
      setShowAuthDialog(false);
      toast.success(authMode === 'login' ? 'Добро пожаловать!' : 'Аккаунт создан!');
      
      setEmail('');
      setPassword('');
      setUsername('');
      setSelectedAvatar(0);
    } catch (error) {
      toast.error('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tickpay_user');
    localStorage.removeItem('tickpay_token');
    setUser(null);
    toast.success('Вы вышли из аккаунта');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-[10vh] bg-[#1a1a1f] border-b-4 border-primary/60 glow-blue relative">
        <div className="container mx-auto h-full flex items-center justify-between px-6">
          <h1 className="text-3xl font-bold text-white text-glow-blue">TickPay</h1>
          
          <div>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 hover:bg-secondary">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={AVATARS[user.avatar_id - 1]} />
                      <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-white font-medium">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <div className="px-2 py-3 border-b border-border">
                    <p className="text-sm text-muted-foreground">Баланс</p>
                    <p className="text-xl font-bold text-primary">₽{balance.toFixed(2)}</p>
                  </div>
                  <DropdownMenuItem 
                    onClick={() => setShowBalanceDialog(true)}
                    className="cursor-pointer text-foreground hover:bg-secondary"
                  >
                    <Icon name="Wallet" className="mr-2 h-4 w-4" />
                    Пополнить баланс
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-foreground hover:bg-secondary">
                    <Icon name="ShoppingBag" className="mr-2 h-4 w-4" />
                    Покупки
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => window.open('https://t.me/BNESkvi', '_blank')}
                    className="cursor-pointer text-foreground hover:bg-secondary"
                  >
                    <Icon name="Headphones" className="mr-2 h-4 w-4" />
                    Поддержка
                    <span className="ml-auto text-xs text-muted-foreground">@BNESkvi</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive hover:bg-destructive/10"
                  >
                    <Icon name="LogOut" className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthDialog(true);
                }}
                className="bg-primary hover:bg-primary/90 text-white font-medium px-6 glow-blue-strong"
              >
                Вход
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Добро пожаловать в TickPay
          </h2>
          <p className="text-muted-foreground text-lg mb-12">
            Маркетплейс цифровых товаров и услуг
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border hover:border-primary/50 transition-all hover:glow-blue cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0088cc] p-3 rounded-lg">
                    <Icon name="Send" className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">Telegram</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['Звёзды', 'Аккаунты', 'Премиум'].map((item) => (
                    <button
                      key={item}
                      className="px-4 py-2 bg-secondary hover:bg-primary/20 text-foreground text-sm rounded-md transition-colors border border-border hover:border-primary"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-all hover:glow-blue cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#1b2838] to-[#2a475e] p-3 rounded-lg">
                    <Icon name="Gamepad2" className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">Steam</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['Пополнение Steam', 'Аккаунты', 'Подарочные карты'].map((item) => (
                    <button
                      key={item}
                      className="px-4 py-2 bg-secondary hover:bg-primary/20 text-foreground text-sm rounded-md transition-colors border border-border hover:border-primary"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-glow-blue">
              TickID
            </DialogTitle>
          </DialogHeader>

          <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary">
                Вход
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-primary">
                Регистрация
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-foreground">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-foreground">Пароль</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <Button 
                onClick={handleAuth} 
                className="w-full bg-primary hover:bg-primary/90 glow-blue-strong"
                disabled={loading}
              >
                {loading ? 'Вход...' : 'Войти'}
              </Button>
              <p className="text-center text-sm">
                <button
                  onClick={() => setAuthMode('register')}
                  className="text-primary hover:underline font-medium"
                >
                  Нет аккаунта? Зарегистрироваться!!!
                </button>
              </p>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Выберите аватар</Label>
                <div className="flex gap-4 justify-center">
                  {AVATARS.map((avatar, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAvatar(index)}
                      className={`rounded-full border-2 transition-all ${
                        selectedAvatar === index 
                          ? 'border-primary glow-blue-strong scale-110' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={avatar} />
                      </Avatar>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-username" className="text-foreground">Никнейм</Label>
                <Input
                  id="register-username"
                  placeholder="Ваш никнейм"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-foreground">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-foreground">Пароль</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <Button 
                onClick={handleAuth} 
                className="w-full bg-primary hover:bg-primary/90 glow-blue-strong"
                disabled={loading}
              >
                {loading ? 'Создание...' : 'Создать аккаунт'}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-glow-blue">
              Пополнение баланса
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Текущий баланс</p>
              <p className="text-3xl font-bold text-primary">₽{balance.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit-amount" className="text-foreground">Сумма пополнения</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="1000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="bg-input border-border text-foreground"
                min="1"
                step="0.01"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[100, 500, 1000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => setDepositAmount(amount.toString())}
                  className="border-border hover:border-primary hover:bg-primary/10"
                >
                  ₽{amount}
                </Button>
              ))}
            </div>

            <Button 
              onClick={handleDeposit} 
              className="w-full bg-primary hover:bg-primary/90 glow-blue-strong"
              disabled={loading}
            >
              {loading ? 'Пополнение...' : 'Пополнить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}