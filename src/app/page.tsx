
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast"
import { WaterDropIcon } from '@/components/icons';
import { Clock, Moon, Sun, Bell, Droplets, Settings, Zap, Menu, Vibrate } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

type DrinkLog = {
  timestamp: number;
};

type Settings = {
  interval: number;
  isReminderActive: boolean;
  respectSleepTime: boolean;
  sleepTime: string;
  wakeTime: string;
  sound: string;
  vibrate: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  interval: 60,
  isReminderActive: false,
  respectSleepTime: true,
  sleepTime: "22:00",
  wakeTime: "08:00",
  sound: "drop",
  vibrate: true,
};

const HydrationChart = ({ data }: { data: DrinkLog[] }) => {
  const chartData = useMemo(() => {
    return data.map((log, index) => ({
      time: new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      count: index + 1,
    }));
  }, [data]);
  
  const chartConfig = {
    drinks: {
      label: "Bebidas",
      color: "hsl(var(--chart-1))",
    },
  };

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/30 rounded-lg border-2 border-dashed border-border h-full">
        <p className="text-lg font-medium text-muted-foreground mt-4">Nenhuma bebida registrada ainda.</p>
        <p className="text-sm text-muted-foreground">Clique em "Já bebi água!" para começar.</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                    dataKey="time" 
                    tickLine={false} 
                    axisLine={false}
                    tickMargin={8}
                    />
                <YAxis 
                    allowDecimals={false} 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={8}
                    domain={[0, 'dataMax + 2']}
                />
                 <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="count" fill="var(--color-drinks)" radius={4} />
            </BarChart>
        </ResponsiveContainer>
    </ChartContainer>
  );
};


const AppSkeleton = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
           <CardFooter>
            <Skeleton className="h-10 w-1/2" />
          </CardFooter>
        </Card>
    </div>
  </div>
);


const SettingsPanel = ({ settings, setSettings, handleQuickSchedule, playSound, toast }: { settings: Settings, setSettings: React.Dispatch<React.SetStateAction<Settings>>, handleQuickSchedule: (interval: number) => void, playSound: (sound: string) => void, toast: any }) => {
    
    const handleSoundChange = (soundName: string) => {
        setSettings(s => ({ ...s, sound: soundName }));
        if (soundName !== 'silencioso') {
            playSound(soundName);
        }
    };
    
    return (
    <div className="space-y-6 p-4">
        <div>
            <h3 className="text-lg font-medium flex items-center gap-2 mb-4"><Settings className="text-accent" /> Configurações</h3>
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="interval" className="flex items-center gap-2"><Clock /> Intervalo de Lembrete</Label>
                    <Select
                        value={String(settings.interval)}
                        onValueChange={value => setSettings(s => ({ ...s, interval: Number(value) }))}
                    >
                        <SelectTrigger id="interval"><SelectValue placeholder="Selecione o intervalo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="15">A cada 15 minutos</SelectItem>
                            <SelectItem value="30">A cada 30 minutos</SelectItem>
                            <SelectItem value="45">A cada 45 minutos</SelectItem>
                            <SelectItem value="60">A cada 1 hora</SelectItem>
                            <SelectItem value="90">A cada 1.5 horas</SelectItem>
                            <SelectItem value="120">A cada 2 horas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Zap/> Agendamentos Rápidos</Label>
                    <div className="flex flex-nowrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleQuickSchedule(30)} className="flex-1">Trabalho</Button>
                        <Button variant="outline" size="sm" onClick={() => handleQuickSchedule(60)} className="flex-1">Fim de Semana</Button>
                        <Button variant="outline" size="sm" onClick={() => handleQuickSchedule(20)} className="flex-1">Exercício</Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sound" className="flex items-center gap-2"><Bell /> Som de Alerta</Label>
                     <Select
                        value={settings.sound}
                        onValueChange={handleSoundChange}
                    >
                        <SelectTrigger id="sound"><SelectValue placeholder="Selecione o som" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="drop">Gota</SelectItem>
                            <SelectItem value="gentle">Suave</SelectItem>
                            <SelectItem value="bell">Sino</SelectItem>
                            <SelectItem value="silencioso">Silencioso</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="vibrate-mode" className="flex items-center gap-2 shrink-0 mr-2"><Vibrate /> Vibrar</Label>
                        <Switch id="vibrate-mode" checked={settings.vibrate} onCheckedChange={checked => setSettings(s => ({...s, vibrate: checked}))}/>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="sleep-mode" className="flex items-center gap-2 shrink-0 mr-2"><Moon /> Respeitar Horário de Sono</Label>
                        <Switch id="sleep-mode" checked={settings.respectSleepTime} onCheckedChange={checked => setSettings(s => ({...s, respectSleepTime: checked}))}/>
                    </div>
                    {settings.respectSleepTime && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="wake-time"><Sun className="inline-block mr-1 h-4 w-4"/> Acordar</Label>
                          <Input id="wake-time" type="time" value={settings.wakeTime} onChange={e => setSettings(s => ({ ...s, wakeTime: e.target.value }))} />
                        </div>
                         <div>
                          <Label htmlFor="sleep-time"><Moon className="inline-block mr-1 h-4 w-4"/> Dormir</Label>
                          <Input id="sleep-time" type="time" value={settings.sleepTime} onChange={e => setSettings(s => ({ ...s, sleepTime: e.target.value }))} />
                        </div>
                      </div>
                    )}
                </div>
            </div>
        </div>
        <Button 
          className="w-full" 
          onClick={() => setSettings(s => ({ ...s, isReminderActive: !s.isReminderActive }))}
          variant={settings.isReminderActive ? "destructive" : "default"}
        >
          {settings.isReminderActive ? "Parar Lembretes" : "Iniciar Lembretes"}
        </Button>
    </div>
)};


export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [drinkLogs, setDrinkLogs] = useState<DrinkLog[]>([]);
  const [nextReminder, setNextReminder] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((soundName: string) => {
    if (soundName === 'silencioso' || typeof window === 'undefined') return;
    
    if (!audioRef.current) {
        console.error("Audio element not ready.");
        toast({
            title: "Erro de áudio",
            description: "O player de áudio não foi inicializado.",
            variant: "destructive",
        });
        return;
    }

    const audio = audioRef.current;
    
    // Set the source and load it
    if (audio.src !== `/${soundName}.mp3`) {
        audio.src = `/${soundName}.mp3`;
        audio.load(); // Pre-loads the audio
    }

    // Play after user interaction
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error("Audio playback failed:", error);
            // This error often happens if the user hasn't interacted with the page first.
            toast({
                title: "Erro ao tocar o som",
                description: "A reprodução pode ter sido bloqueada pelo navegador. Interaja com a página e tente novamente.",
                variant: "destructive",
                duration: 7000
            });
        });
    }
  }, [toast]);
  
  const playNotificationSound = useCallback(() => {
    playSound(settings.sound);
  }, [settings.sound, playSound]);

  useEffect(() => {
    setIsMounted(true);
    // Ensure the audio element is created on the client
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio();
    }
    const savedSettings = localStorage.getItem('waterful_settings');
    const savedLogs = localStorage.getItem('waterful_logs');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    if (savedLogs) {
      setDrinkLogs(JSON.parse(savedLogs));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('waterful_settings', JSON.stringify(settings));
    }
  }, [settings, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('waterful_logs', JSON.stringify(drinkLogs));
    }
  }, [drinkLogs, isMounted]);
  
  const handleLogDrink = useCallback(() => {
    const now = Date.now();
    setDrinkLogs(prev => [...prev, { timestamp: now }]);
    toast({
      title: "Hidratação Registrada!",
      description: "Excelente! O cronômetro foi reiniciado.",
      duration: 3000,
    });
    if (settings.isReminderActive) {
        const nextReminderTime = now + settings.interval * 60 * 1000;
        setNextReminder(nextReminderTime);
        setTimeRemaining(settings.interval * 60 * 1000);
    }
  }, [settings.isReminderActive, settings.interval, toast]);

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast({ title: "Notificações ativadas!", description: "Você será lembrado de beber água." });
        } else {
          toast({ title: "Notificações bloqueadas", description: "Não poderemos enviar lembretes.", variant: "destructive" });
        }
      });
    }
  }, [toast]);

  const handleQuickSchedule = useCallback((interval: number) => {
    setSettings(s => ({ ...s, interval }));
    toast({
      title: "Intervalo atualizado!",
      description: `Lembretes definidos para cada ${interval} minutos.`,
    });
  }, [toast]);
    
  useEffect(() => {
    let reminderInterval: NodeJS.Timeout | null = null;

    const scheduleNextReminder = () => {
        const now = new Date();
        
        if (settings.respectSleepTime) {
          const [sleepH, sleepM] = settings.sleepTime.split(':').map(Number);
          const [wakeH, wakeM] = settings.wakeTime.split(':').map(Number);
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const sleepMinutes = sleepH * 60 + sleepM;
          const wakeMinutes = wakeH * 60 + wakeM;

          let isSleepTime = false;
          if (sleepMinutes > wakeMinutes) { // Overnight sleep
              if (currentMinutes >= sleepMinutes || currentMinutes < wakeMinutes) isSleepTime = true;
          } else { // Same day sleep
              if (currentMinutes >= sleepMinutes && currentMinutes < wakeMinutes) isSleepTime = true;
          }

          if (isSleepTime) {
            const nextWakeTime = new Date();
            nextWakeTime.setHours(wakeH, wakeM, 0, 0);
            if(now.getTime() > nextWakeTime.getTime()){
               nextWakeTime.setDate(nextWakeTime.getDate() + 1);
            }
             setNextReminder(nextWakeTime.getTime());
             return; 
          }
        }

        // Play sound and show notification
        if (Notification.permission === 'granted') {
          playNotificationSound();
          
          const notificationOptions: NotificationOptions = {
            body: 'Um gole agora para um dia melhor. Mantenha-se hidratado!',
            icon: '/icon.png',
            silent: settings.sound === 'silencioso',
          };
          if (settings.vibrate && 'vibrate' in navigator) {
              notificationOptions.vibrate = [200, 100, 200];
          }
          new Notification('Waterful: Hora de beber água! 💧', notificationOptions);
        }

        // Set next reminder time
        const nextReminderTime = Date.now() + settings.interval * 60 * 1000;
        setNextReminder(nextReminderTime);
    };

    if (settings.isReminderActive) {
      requestNotificationPermission();

      const lastDrinkTime = drinkLogs.length > 0 ? drinkLogs[drinkLogs.length - 1].timestamp : Date.now();
      const timeSinceLastDrink = Date.now() - lastDrinkTime;
      const initialDelay = Math.max(0, (settings.interval * 60 * 1000) - timeSinceLastDrink);
      
      const timeoutId = setTimeout(() => {
        scheduleNextReminder();
        reminderInterval = setInterval(scheduleNextReminder, settings.interval * 60 * 1000);
      }, initialDelay);
      
      setNextReminder(Date.now() + initialDelay);

      return () => {
        clearTimeout(timeoutId);
        if (reminderInterval) clearInterval(reminderInterval);
      };
    } else {
      setNextReminder(null);
      setTimeRemaining(null);
    }

    return () => {
      if (reminderInterval) clearInterval(reminderInterval);
    };
  }, [settings, requestNotificationPermission, drinkLogs, playNotificationSound]);

   useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    if (nextReminder && settings.isReminderActive) {
      timerId = setInterval(() => {
        const remaining = Math.max(0, nextReminder - Date.now());
        setTimeRemaining(remaining);
        if (remaining === 0) {
           if(timerId) clearInterval(timerId);
        }
      }, 1000);
    } else {
      setTimeRemaining(null);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [nextReminder, settings.isReminderActive]);
  
  const formatTimeRemaining = (ms: number | null) => {
    if (ms === null || ms <= 0) {
      return "00:00";
    }
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getNextReminderMessage = () => {
    if (!settings.isReminderActive) {
      return "Os lembretes estão pausados.";
    }

    if (settings.respectSleepTime) {
      const now = new Date();
      const [sleepH, sleepM] = settings.sleepTime.split(':').map(Number);
      const [wakeH, wakeM] = settings.wakeTime.split(':').map(Number);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const sleepMinutes = sleepH * 60 + sleepM;
      const wakeMinutes = wakeH * 60 + wakeM;

      let isSleepTime = false;
      if (sleepMinutes > wakeMinutes) { // Overnight
          if (currentMinutes >= sleepMinutes || currentMinutes < wakeMinutes) isSleepTime = true;
      } else { // Same day
          if (currentMinutes >= sleepMinutes && currentMinutes < wakeMinutes) isSleepTime = true;
      }
      if(isSleepTime) return `Hora de dormir! Lembretes voltam às ${settings.wakeTime}.`;
    }

    const formattedTime = formatTimeRemaining(timeRemaining);
    if (formattedTime !== "00:00") {
      return `Próximo lembrete em: ${formattedTime}`;
    }

    return "Clique em 'Já bebi água!' para reiniciar.";
  }
  
  if (!isMounted) {
    return <AppSkeleton />;
  }

  return (
    <div className="flex h-screen font-body bg-background">
      {/* Sidebar para desktop */}
      <aside className="hidden lg:block w-80 border-r border-border overflow-y-auto">
        <SettingsPanel settings={settings} setSettings={setSettings} handleQuickSchedule={handleQuickSchedule} playSound={playSound} toast={toast} />
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col items-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          
          <header className="flex items-center justify-between w-full mt-4">
            <div className="flex items-center gap-4">
              <WaterDropIcon className="w-12 h-12 text-primary" />
              <div>
                <h1 className="text-4xl font-bold font-headline text-slate-800 dark:text-slate-100">Waterful</h1>
                <p className="text-muted-foreground text-md">Seu companheiro de hidratação.</p>
              </div>
            </div>
            {/* Gatilho da Sheet para mobile */}
            <div className="lg:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                          <Menu className="h-6 w-6" />
                      </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 p-0">
                      <SettingsPanel settings={settings} setSettings={setSettings} handleQuickSchedule={handleQuickSchedule} playSound={playSound} toast={toast} />
                  </SheetContent>
              </Sheet>
            </div>
          </header>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Droplets className="text-accent" /> Painel de Hidratação</CardTitle>
                  <CardDescription>
                    {getNextReminderMessage()}
                  </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full aspect-video min-h-0">
                  <HydrationChart data={drinkLogs} />
                </div>
              </CardContent>
              <CardFooter className="justify-center">
                <Button size="lg" className="w-full md:w-auto transform hover:scale-105 transition-transform" onClick={handleLogDrink}>
                  <WaterDropIcon className="mr-2 h-5 w-5" /> Já bebi água!
                </Button>
              </CardFooter>
          </Card>
        </div>
      </main>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
