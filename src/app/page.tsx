
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useToast } from "@/hooks/use-toast"
import { WaterDropIcon } from '@/components/icons';
import { Clock, Moon, Sun, Bell, Droplets, Settings, Zap, Menu } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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
};

const DEFAULT_SETTINGS: Settings = {
  interval: 60,
  isReminderActive: false,
  respectSleepTime: true,
  sleepTime: "22:00",
  wakeTime: "08:00",
  sound: "drop.mp3"
};

const chartConfig = {
  drinks: {
    label: "Drinks",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

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


const SettingsPanel = ({ settings, setSettings, handleQuickSchedule, toast }: { settings: Settings, setSettings: React.Dispatch<React.SetStateAction<Settings>>, handleQuickSchedule: (interval: number) => void, toast: any }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleSoundChange = (soundFile: string) => {
        setSettings(s => ({ ...s, sound: soundFile }));
        
        if (audioRef.current) {
            audioRef.current.src = `/${soundFile}`;
            audioRef.current.load();
            audioRef.current.oncanplaythrough = () => {
                audioRef.current?.play().catch(e => console.error("Audio playback failed:", e));
            };
        }

        toast({
            title: "Som de Alerta Atualizado!",
            description: `O som foi alterado para "${soundFile.split('.')[0]}".`,
            duration: 3000,
        });
    };
    
    return (
    <div className="space-y-6 p-4">
        <audio ref={audioRef} preload="auto" />
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
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => handleQuickSchedule(30)}>Trabalho</Button>
                        <Button variant="outline" size="sm" onClick={() => handleQuickSchedule(60)}>Fim de Semana</Button>
                        <Button variant="outline" size="sm" onClick={() => handleQuickSchedule(20)}>Exercício</Button>
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
                            <SelectItem value="drop.mp3">Gota</SelectItem>
                            <SelectItem value="gentle.mp3">Suave</SelectItem>
                            <SelectItem value="bell.mp3">Sino</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4">
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedSettings = localStorage.getItem('waterful_settings');
    const savedLogs = localStorage.getItem('waterful_logs');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    if (savedLogs) {
      setDrinkLogs(JSON.parse(savedLogs));
    }
    setIsMounted(true);
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
    setDrinkLogs(prev => [...prev, { timestamp: Date.now() }]);
    toast({
      title: "Hidratação Registrada!",
      description: "Excelente! Continue assim para um dia mais saudável.",
      duration: 3000,
    });
    if (settings.isReminderActive) {
      setNextReminder(Date.now() + settings.interval * 60 * 1000);
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

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let nextReminderTimeout: NodeJS.Timeout | null = null;

    if (settings.isReminderActive) {
      requestNotificationPermission();

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
                if (currentMinutes >= sleepMinutes || currentMinutes < wakeMinutes) {
                    isSleepTime = true;
                }
            } else { // Same day sleep
                if (currentMinutes >= sleepMinutes && currentMinutes < wakeMinutes) {
                    isSleepTime = true;
                }
            }

            if (isSleepTime) {
              const nextWakeTime = new Date();
              nextWakeTime.setHours(wakeH, wakeM, 0, 0);
              if(now.getTime() > nextWakeTime.getTime()){
                 nextWakeTime.setDate(nextWakeTime.getDate() + 1);
              }
               setNextReminder(nextWakeTime.getTime());
               return; // It's sleep time
            }
          }

          if (Notification.permission === 'granted') {
            const audio = new Audio(`/${settings.sound}`);
            audio.play().catch(e => console.error("Audio playback failed:", e));
            new Notification('Waterful: Hora de beber água! 💧', {
              body: 'Um gole agora para um dia melhor. Mantenha-se hidratado!',
              icon: '/icon.png',
              silent: true, // we play our own sound
            });
          }
          const nextReminderTime = Date.now() + settings.interval * 60 * 1000;
          setNextReminder(nextReminderTime);
      };
      
      const lastDrinkTime = drinkLogs.length > 0 ? drinkLogs[drinkLogs.length - 1].timestamp : Date.now();
      const timeSinceLastDrink = Date.now() - lastDrinkTime;
      const initialDelay = Math.max(0, (settings.interval * 60 * 1000) - timeSinceLastDrink);

      setNextReminder(Date.now() + initialDelay);

      nextReminderTimeout = setTimeout(() => {
        scheduleNextReminder(); // First reminder
        intervalId = setInterval(scheduleNextReminder, settings.interval * 60 * 1000); // Subsequent reminders
      }, initialDelay);


    } else {
      setNextReminder(null);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (nextReminderTimeout) clearTimeout(nextReminderTimeout);
    };
  }, [settings, requestNotificationPermission, drinkLogs]);
  
  const chartData = useMemo(() => {
    const todayLogs = drinkLogs.filter(log => new Date(log.timestamp).toDateString() === new Date().toDateString());
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const wakeHour = parseInt(settings.wakeTime.split(':')[0], 10);
    
    return hours.map(hour => ({
      name: `${hour.toString().padStart(2, '0')}:00`,
      drinks: todayLogs.filter(log => new Date(log.timestamp).getHours() === hour).length
    })).filter(item => {
      const itemHour = parseInt(item.name.split(':')[0], 10);
      const currentHour = new Date().getHours();
      // Mostra a barra se houve consumo ou se a hora já passou (e é depois do horário de acordar)
      return item.drinks > 0 || (currentHour >= itemHour && itemHour >= wakeHour);
    });
  }, [drinkLogs, settings.wakeTime]);


  const handleQuickSchedule = (interval: number) => {
    setSettings(s => ({ ...s, interval, isReminderActive: true }));
    toast({ title: "Agendamento rápido ativado!", description: `Lembretes a cada ${interval} minutos.` });
    setIsSheetOpen(false); // Fecha a sheet no mobile
  };

  const getNextReminderMessage = () => {
    if (!settings.isReminderActive) {
      return "Os lembretes estão pausados.";
    }
    if (nextReminder) {
      const now = new Date();
      if (settings.respectSleepTime) {
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
      const diff = Math.round((nextReminder - Date.now()) / 60000);
      return `Próximo lembrete em ${Math.max(0, diff)} minuto${diff !== 1 ? 's' : ''}.`;
    }
    return "Calculando próximo lembrete...";
  }
  
  if (!isMounted) {
    return <AppSkeleton />;
  }

  return (
    <div className="flex h-screen font-body bg-background">
      {/* Sidebar para desktop */}
      <aside className="hidden lg:block w-80 border-r border-border overflow-y-auto">
        <SettingsPanel settings={settings} setSettings={setSettings} handleQuickSchedule={handleQuickSchedule} toast={toast} />
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col items-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          
          <header className="flex items-center justify-between w-full mt-2">
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
                      <SettingsPanel settings={settings} setSettings={setSettings} handleQuickSchedule={handleQuickSchedule} toast={toast} />
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
              <CardContent className="flex items-center justify-center">
                  {chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="w-full min-h-[250px] aspect-auto">
                      <BarChart data={chartData} accessibilityLayer margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent labelFormatter={(value) => `Bebidas às ${value}`} indicator="dot" />}
                        />
                        <Bar dataKey="drinks" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                       <WaterDropIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">Nenhum gole hoje.</p>
                      <p className="text-sm text-muted-foreground">Clique no botão abaixo para registrar sua primeira hidratação do dia!</p>
                    </div>
                  )}
              </CardContent>
              <CardFooter className="justify-center">
                <Button size="lg" className="w-full md:w-auto transform hover:scale-105 transition-transform" onClick={handleLogDrink}>
                  <WaterDropIcon className="mr-2 h-5 w-5" /> Já bebi água!
                </Button>
              </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}

    