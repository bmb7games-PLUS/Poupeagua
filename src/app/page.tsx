
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useToast } from "@/hooks/use-toast"
import { WaterDropIcon } from '@/components/icons';
import { Clock, Moon, Sun, Bell, Droplets, Settings, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

const AppSkeleton = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
           <CardFooter>
            <Skeleton className="h-10 w-1/2" />
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
);


export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [drinkLogs, setDrinkLogs] = useState<DrinkLog[]>([]);
  const [nextReminder, setNextReminder] = useState<number | null>(null);
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
      title: "Parabéns!",
      description: "Você se hidratou. Continue assim!",
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

            if (sleepMinutes > wakeMinutes) { // Overnight
                if (currentMinutes >= sleepMinutes || currentMinutes < wakeMinutes) {
                    return; // It's sleep time
                }
            } else { // Same day
                if (currentMinutes >= sleepMinutes && currentMinutes < wakeMinutes) {
                    return; // It's sleep time
                }
            }
          }

          if (Notification.permission === 'granted') {
            new Notification('Waterful: Hora de beber água! 💧', {
              body: 'Um gole agora para um dia melhor. Mantenha-se hidratado!',
              icon: '/icon.png',
              silent: false,
            });
          }
          setNextReminder(Date.now() + settings.interval * 60 * 1000);
      };
      
      setNextReminder(Date.now() + settings.interval * 60 * 1000);
      
      intervalId = setInterval(scheduleNextReminder, settings.interval * 60 * 1000);

    } else {
      setNextReminder(null);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [settings, requestNotificationPermission]);
  
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
      return item.drinks > 0 || (currentHour >= itemHour && itemHour >= wakeHour);
    });
  }, [drinkLogs, settings.wakeTime]);


  const handleQuickSchedule = (interval: number) => {
    setSettings(s => ({ ...s, interval, isReminderActive: true }));
    toast({ title: "Agendamento rápido ativado!", description: `Lembretes a cada ${interval} minutos.` });
  };
  
  if (!isMounted) {
    return <AppSkeleton />;
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 font-body">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col items-center text-center">
            <WaterDropIcon className="w-16 h-16 text-primary" />
            <h1 className="text-5xl font-bold mt-2 font-headline text-slate-800 dark:text-slate-100">Waterful</h1>
            <p className="text-muted-foreground mt-2 text-lg">Seu lembrete diário para se manter hidratado.</p>
        </header>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings className="text-accent" /> Configurações</CardTitle>
                    <CardDescription>Personalize seus lembretes de hidratação.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleQuickSchedule(30)}>Trabalho</Button>
                            <Button variant="outline" size="sm" onClick={() => handleQuickSchedule(60)}>Fim de Semana</Button>
                            <Button variant="outline" size="sm" onClick={() => handleQuickSchedule(20)}>Exercício</Button>
                        </div>
                    </div>

                     <div className="space-y-2">
                        <Label htmlFor="sound" className="flex items-center gap-2"><Bell /> Som de Alerta</Label>
                        <Select
                            value={settings.sound}
                            onValueChange={value => setSettings(s => ({ ...s, sound: value }))}
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
                            <Label htmlFor="sleep-mode" className="flex items-center gap-2"><Moon /> Respeitar Horário de Sono</Label>
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
                </CardContent>
                <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setSettings(s => ({ ...s, isReminderActive: !s.isReminderActive }))}
                      variant={settings.isReminderActive ? "destructive" : "default"}
                    >
                      {settings.isReminderActive ? "Parar Lembretes" : "Iniciar Lembretes"}
                    </Button>
                </CardFooter>
            </Card>

            <Card className="md:col-span-1 lg:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Droplets className="text-accent" /> Painel de Hidratação</CardTitle>
                    {settings.isReminderActive && nextReminder && (
                      <CardDescription>
                        Próximo lembrete em {Math.round((nextReminder - Date.now()) / 60000)} minutos.
                      </CardDescription>
                    )}
                     {!settings.isReminderActive && (
                      <CardDescription>
                        Os lembretes estão pausados.
                      </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent labelFormatter={(value) => `Bebidas às ${value}`} />}
                          />
                          <Bar dataKey="drinks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[250px] text-center bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">Nenhum registro de hidratação hoje.</p>
                        <p className="text-sm text-muted-foreground">Clique em "Já bebi água!" para começar.</p>
                      </div>
                    )}
                </CardContent>
                <CardFooter>
                  <Button className="w-full md:w-auto" onClick={handleLogDrink}>
                    <WaterDropIcon className="mr-2 h-4 w-4" /> Já bebi água!
                  </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </main>
  );
}
