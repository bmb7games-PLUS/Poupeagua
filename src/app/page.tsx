

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
import { Clock, Moon, Sun, Bell, Droplets, Settings, Zap, Menu, Vibrate, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Legend, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { initializeApp } from "firebase/app";

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

const HydrationChart = ({ data, settings }: { data: DrinkLog[]; settings: Settings }) => {
  const chartConfig = {
    drinks: {
      label: "Bebidas",
      color: "hsl(var(--chart-1))",
    },
    goal: {
      label: "Meta",
      color: "hsl(var(--chart-2))",
    }
  };

  const hourlyGoal = useMemo(() => {
    if (settings.interval <= 0) return 1;
    return Math.floor(60 / settings.interval);
  }, [settings.interval]);

  const chartData = useMemo(() => {
    const drinksByHour: { [key: string]: number } = {};
    data.forEach(log => {
      const date = new Date(log.timestamp);
      const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`;
      drinksByHour[hourKey] = (drinksByHour[hourKey] || 0) + 1;
    });

    const [wakeH] = settings.wakeTime.split(':').map(Number);
    const [sleepH] = settings.sleepTime.split(':').map(Number);

    const allHoursData = [];

    const addHourData = (h: number) => {
        const hourKey = `${h.toString().padStart(2, '0')}:00`;
        allHoursData.push({
            time: hourKey,
            count: drinksByHour[hourKey] || 0,
            goal: hourlyGoal,
        });
    }
    
    if (sleepH < wakeH) { // Overnight sleep
        for (let h = wakeH; h < 24; h++) {
            addHourData(h);
        }
        for (let h = 0; h < sleepH; h++) {
            addHourData(h);
        }
    } else { // Same day sleep
        for (let h = wakeH; h < sleepH; h++) {
            addHourData(h);
        }
    }
    
    if (allHoursData.length === 0) {
      // Create a dummy entry to show the chart axis
      const startHour = `${wakeH.toString().padStart(2, '0')}:00`;
      return [{ time: startHour, count: 0, goal: hourlyGoal }];
    }

    return allHoursData;
  }, [data, hourlyGoal, settings.wakeTime, settings.sleepTime]);

  const hasData = useMemo(() => data.length > 0, [data]);

  if (!hasData) {
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
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
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
                <Legend />
                <Line type="monotone" dataKey="count" name="Bebidas" stroke="var(--color-drinks)" strokeWidth={2} dot={{r: 4, fill: "var(--color-drinks)"}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="goal" name="Meta por Hora" stroke="var(--color-goal)" strokeWidth={2} strokeDasharray="3 3" dot={false} activeDot={false} />
            </LineChart>
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


const SettingsPanel = ({ settings, setSettings, handleQuickSchedule, playSound, isSidebarVisible }: { settings: Settings, setSettings: React.Dispatch<React.SetStateAction<Settings>>, handleQuickSchedule: (interval: number) => void, playSound: (sound: string) => void, isSidebarVisible: boolean }) => {
    
    const handleSoundChange = (soundName: string) => {
        setSettings(s => ({ ...s, sound: soundName }));
        if (soundName !== 'silencioso') {
            playSound(soundName);
        }
    };
    
    const renderLabel = (icon: React.ReactNode, text: string, tooltipText: string) => (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Label className={cn("flex items-center gap-2", !isSidebarVisible && "justify-center")}>
              {icon}
              <span className={cn(isSidebarVisible ? "inline" : "hidden")}>{text}</span>
            </Label>
          </TooltipTrigger>
          {!isSidebarVisible && (
            <TooltipContent side="right">
              <p>{tooltipText}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );

    return (
    <div className="space-y-6 p-4">
        <div>
            <h3 className={cn("text-lg font-medium flex items-center gap-2 mb-4", !isSidebarVisible && "justify-center")}>
              <TooltipProvider delayDuration={100}>
                  <Tooltip>
                      <TooltipTrigger><Settings className="text-accent" /></TooltipTrigger>
                      {!isSidebarVisible && <TooltipContent side="right"><p>Configurações</p></TooltipContent>}
                  </Tooltip>
              </TooltipProvider>
              <span className={cn(isSidebarVisible ? 'inline' : 'hidden')}>Configurações</span>
            </h3>
            <div className="space-y-6">
                <div className="space-y-2">
                    {renderLabel(<Clock />, "Intervalo de Lembrete", "Intervalo de Lembrete")}
                    <div className={cn(!isSidebarVisible && "hidden")}>
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
                </div>

                <div className="space-y-2">
                    {renderLabel(<Zap/>, "Agendamentos Rápidos", "Agendamentos Rápidos")}
                     <div className={cn("flex flex-nowrap gap-2", !isSidebarVisible && "hidden")}>
                        <Button variant="outline" size="sm" onClick={() => handleQuickSchedule(30)} className="flex-1">Trabalho</Button>
                        <Button variant="outline" size="sm" onClick={() => handleQuickSchedule(60)} className="flex-1">Fim de Semana</Button>
                        <Button variant="outline" size="sm" onClick={() => handleQuickSchedule(20)} className="flex-1">Exercício</Button>
                    </div>
                </div>

                <div className="space-y-2">
                    {renderLabel(<Bell />, "Som de Alerta", "Som de Alerta")}
                     <div className={cn(!isSidebarVisible && "hidden")}>
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
                </div>

                <div className="space-y-4">
                    <div className={cn("flex items-center justify-between", !isSidebarVisible && "justify-center")}>
                        {renderLabel(<Vibrate />, "Vibrar", "Vibrar")}
                        <Switch id="vibrate-mode" checked={settings.vibrate} onCheckedChange={checked => setSettings(s => ({...s, vibrate: checked}))}/>
                    </div>
                    <div className={cn("flex items-center justify-between", !isSidebarVisible && "justify-center")}>
                        {renderLabel(<Moon />, "Respeitar Horário de Sono", "Respeitar Horário de Sono")}
                        <Switch id="sleep-mode" checked={settings.respectSleepTime} onCheckedChange={checked => setSettings(s => ({...s, respectSleepTime: checked}))}/>
                    </div>
                    {settings.respectSleepTime && (
                      <div className={cn("grid grid-cols-2 gap-4", !isSidebarVisible && "hidden")}>
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
    </div>
    );
};


export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [drinkLogs, setDrinkLogs] = useState<DrinkLog[]>([]);
  const [nextReminder, setNextReminder] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((soundName: string) => {
    if (soundName === 'silencioso') return;

    if (!audioRef.current) {
        audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    const newSrc = `/${soundName}.mp3`;

    if (!audio.src.endsWith(newSrc)) {
        audio.src = newSrc;
        audio.load();
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error("Audio playback failed:", error);
            if (error.name === "NotAllowedError") {
                toast({
                    title: "Reprodução de áudio bloqueada",
                    description: "A interação do usuário é necessária para tocar o som.",
                    variant: "destructive",
                });
            }
        });
    }
  }, [toast]);
  
  const playNotificationSound = useCallback(() => {
    playSound(settings.sound);
  }, [settings.sound, playSound]);

  useEffect(() => {
    setIsMounted(true);
    
    try {
      const savedSettings = localStorage.getItem('waterful_settings');
      let savedLogs = localStorage.getItem('waterful_logs');

      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      if (savedLogs) {
        let logs: DrinkLog[] = JSON.parse(savedLogs);
        
        // Clean up logs older than 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const allRecentLogs = logs.filter(log => log.timestamp >= sevenDaysAgo);
        
        // Filter for today's logs to display on the chart
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaysLogs = allRecentLogs.filter(log => log.timestamp >= today.getTime());
        setDrinkLogs(todaysLogs);

        // If logs were cleaned, update localStorage
        if (logs.length !== allRecentLogs.length) {
          localStorage.setItem('waterful_logs', JSON.stringify(allRecentLogs));
        }
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      // Save all logs (not just today's) back to localStorage
      try {
        const savedLogs = localStorage.getItem('waterful_logs');
        const allLogs = savedLogs ? JSON.parse(savedLogs) : [];
        
        // Create a map of existing logs to avoid duplicates
        const logMap = new Map(allLogs.map((l: DrinkLog) => [l.timestamp, l]));
        
        // Add new logs from the current session
        drinkLogs.forEach(log => {
          if (!logMap.has(log.timestamp)) {
            logMap.set(log.timestamp, log);
          }
        });

        const updatedLogs = Array.from(logMap.values());
        localStorage.setItem('waterful_logs', JSON.stringify(updatedLogs));

      } catch (error) {
        console.error("Failed to save logs to localStorage", error);
      }
    }
  }, [drinkLogs, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('waterful_settings', JSON.stringify(settings));
    }
  }, [settings, isMounted]);
  
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
    }
  }, [settings.isReminderActive, settings.interval, toast]);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
        return;
    }
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({ title: "Notificações ativadas!", description: "Você será lembrado de beber água." });
      } else {
        toast({ title: "Notificações bloqueadas", description: "Não poderemos enviar lembretes.", variant: "destructive" });
      }
    }
  }, [toast]);
  
  const handleToggleReminders = useCallback(() => {
    const willBeActive = !settings.isReminderActive;
    if (willBeActive) {
      requestNotificationPermission();
    }
    setSettings(s => ({ ...s, isReminderActive: willBeActive }));
  }, [settings.isReminderActive, requestNotificationPermission]);
  
  const handleQuickSchedule = useCallback((interval: number) => {
    setSettings(s => ({ ...s, interval }));
    toast({
      title: "Intervalo atualizado!",
      description: `Lembretes definidos para cada ${interval} minutos.`,
    });
  }, [toast]);
    
  const showReminder = useCallback(() => {
    // Check for sleep time before showing reminder
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

    // Play sound, vibrate, and show notification
    if (settings.vibrate && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
    }

    if (Notification.permission === 'granted') {
      playNotificationSound();
      
      const notificationOptions: NotificationOptions = {
        body: 'Um gole agora para um dia melhor. Mantenha-se hidratado!',
        icon: '/icon.png',
        silent: settings.sound === 'silencioso',
      };
      
      new Notification('Waterful: Hora de beber água! 💧', notificationOptions);
    }
    
    // Stop the timer, wait for user intervention
    setNextReminder(null); 
    setTimeRemaining(null);

  }, [settings.respectSleepTime, settings.sleepTime, settings.wakeTime, settings.sound, settings.vibrate, playNotificationSound]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (settings.isReminderActive) {
      const lastDrinkTime = drinkLogs.length > 0 ? drinkLogs[drinkLogs.length - 1].timestamp : Date.now();
      const timeSinceLastDrink = Date.now() - lastDrinkTime;
      const initialDelay = Math.max(0, (settings.interval * 60 * 1000) - timeSinceLastDrink);
      
      // If there's an active reminder cycle, set a timeout for it
      if(nextReminder && nextReminder > Date.now()){
        const delay = nextReminder - Date.now();
        timeoutId = setTimeout(showReminder, delay);
      } else if (drinkLogs.length > 0) { // If there's no active cycle but we have logs, start based on the last log
        const reminderTime = lastDrinkTime + settings.interval * 60 * 1000;
        if(reminderTime > Date.now()){
            setNextReminder(reminderTime);
        } else {
            // If the last drink was too long ago, trigger reminder immediately
            showReminder();
        }
      }

      return () => {
        if(timeoutId) clearTimeout(timeoutId);
      };
    } else {
      setNextReminder(null);
      setTimeRemaining(null);
    }

  }, [settings.isReminderActive, settings.interval, drinkLogs, showReminder, nextReminder]);


   useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    if (nextReminder && settings.isReminderActive) {
      const update = () => {
        const remaining = Math.max(0, nextReminder - Date.now());
        setTimeRemaining(remaining);
        if (remaining === 0) {
           showReminder();
           if(timerId) clearInterval(timerId);
        }
      }
      update(); // run once immediately
      timerId = setInterval(update, 1000);
    } else {
      setTimeRemaining(null);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [nextReminder, settings.isReminderActive, showReminder]);
  
  const formatTimeRemaining = (ms: number | null) => {
    if (ms === null || ms < 0) {
      return "00:00";
    }
    const totalSeconds = Math.ceil(ms / 1000);
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
    if (timeRemaining && timeRemaining > 0) {
      return `Próximo lembrete em: ${formattedTime}`;
    }

    return "Hora de beber água! Clique em 'Já bebi água!' para reiniciar.";
  }
  
  if (!isMounted) {
    return <AppSkeleton />;
  }

  return (
    <div className="flex h-screen font-body bg-background">
      {/* Sidebar para desktop */}
       <aside className={cn(
        "hidden lg:block border-r border-border overflow-y-auto transition-all duration-300 ease-in-out",
        isSidebarVisible ? "w-80" : "w-24"
      )}>
        <SettingsPanel settings={settings} setSettings={setSettings} handleQuickSchedule={handleQuickSchedule} playSound={playSound} isSidebarVisible={isSidebarVisible}/>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col items-center p-4 md:p-8 overflow-y-auto relative">
         <div className="hidden lg:block">
            <Button
                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 h-10 w-10 rounded-full bg-primary/20 text-primary-foreground backdrop-blur-sm hover:bg-primary/30"
            >
                {isSidebarVisible ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
            </Button>
        </div>

        <div className="w-full max-w-4xl mx-auto space-y-6">
          
          <header className="flex items-center justify-between w-full mt-4">
            <div className="flex items-center gap-4">
              <WaterDropIcon className="w-12 h-12 text-primary" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold font-headline text-slate-800 dark:text-slate-100">Waterful</h1>
                <p className="text-muted-foreground text-sm sm:text-md">Seu companheiro de hidratação.</p>
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
                      <SheetHeader className="p-4 border-b">
                        <SheetTitle>Configurações</SheetTitle>
                      </SheetHeader>
                      <SettingsPanel settings={settings} setSettings={setSettings} handleQuickSchedule={handleQuickSchedule} playSound={playSound} isSidebarVisible={true}/>
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
                <div className="w-full h-[250px]">
                  <HydrationChart data={drinkLogs} settings={settings} />
                </div>
              </CardContent>
              <CardFooter className="flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="w-full sm:w-auto transform hover:scale-105 transition-transform" onClick={handleLogDrink}>
                  <WaterDropIcon className="mr-2 h-5 w-5" /> Já bebi água!
                </Button>
                <Button 
                  size="lg"
                  className="w-full sm:w-auto" 
                  onClick={handleToggleReminders}
                  variant={settings.isReminderActive ? "destructive" : "default"}
                >
                  <Bell className="mr-2 h-5 w-5"/>
                  {settings.isReminderActive ? "Parar Lembretes" : "Iniciar Lembretes"}
                </Button>
              </CardFooter>
          </Card>
        </div>
      </main>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
