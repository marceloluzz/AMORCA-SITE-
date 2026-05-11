import { useState, useEffect } from 'react';
import { db, collection, query, orderBy, onSnapshot } from '../firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar as CalendarIcon, MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from '../components/ui/calendar';
import { motion, AnimatePresence } from 'framer-motion';
import { ptBR } from 'date-fns/locale';
import { format, isSameDay } from 'date-fns';
import { Badge } from '../components/ui/badge';

interface Event {
  id: string;
  title: string;
  description: string;
  date: any;
  location: string;
  category: string;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const selectedDateEvents = events.filter(event => 
    selectedDate && isSameDay(new Date(event.date.toDate()), selectedDate)
  );

  const upcomingEvents = events.filter(event => 
    new Date(event.date.toDate()) >= new Date()
  ).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-16">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">Calendário de Eventos</h1>
        <p className="text-slate-600 text-xl">Fique por dentro das reuniões, festas e atividades da AMORCA.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Calendar Column */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="border-none shadow-xl rounded-none overflow-hidden bg-white p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className="w-full"
              modifiers={{
                event: (date) => events.some(e => isSameDay(new Date(e.date.toDate()), date))
              }}
              modifiersStyles={{
                event: { fontWeight: 'bold', color: '#3b82f6', textDecoration: 'underline' }
              }}
            />
          </Card>

          <Card className="border-none shadow-sm rounded-none p-6 bg-blue-600 text-white">
            <h3 className="font-bold text-xl mb-4">Próximos Eventos</h3>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                <div key={event.id} className="flex gap-3 items-start border-b border-blue-500/30 pb-4 last:border-0 last:pb-0">
                  <div className="bg-white/20 rounded-lg p-2 text-center min-w-[50px]">
                    <span className="block text-xs font-bold uppercase">{format(new Date(event.date.toDate()), 'MMM', { locale: ptBR })}</span>
                    <span className="block text-lg font-bold">{format(new Date(event.date.toDate()), 'dd')}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight">{event.title}</h4>
                    <p className="text-xs text-blue-100 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {format(new Date(event.date.toDate()), 'HH:mm')}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-blue-100 text-sm italic">Nenhum evento programado.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Events List Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}
            </h2>
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-base px-4 py-1">
              {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'evento' : 'eventos'}
            </Badge>
          </div>

          <AnimatePresence mode="wait">
            {selectedDateEvents.length > 0 ? (
              <motion.div 
                key={selectedDate?.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {selectedDateEvents.map((event) => (
                  <Card key={event.id} className="border-none shadow-sm rounded-none overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-8">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none text-sm px-3 py-1">
                              {event.category}
                            </Badge>
                            <span className="text-slate-400 text-lg">•</span>
                            <span className="text-slate-600 text-lg font-bold flex items-center gap-2">
                              <Clock className="w-5 h-5 text-blue-600" /> {format(new Date(event.date.toDate()), 'HH:mm')}
                            </span>
                          </div>
                          <h3 className="text-3xl font-bold text-slate-900 mb-6">{event.title}</h3>
                          <p className="text-slate-700 text-xl mb-8 leading-relaxed">
                            {event.description}
                          </p>
                          <div className="flex flex-wrap gap-6 text-lg text-slate-600">
                            <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-none border border-slate-100">
                              <MapPin className="w-6 h-6 text-blue-600" />
                              {event.location}
                            </div>
                          </div>
                        </div>
                        <div className="md:w-56 flex flex-col gap-4">
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-none py-8 text-lg font-bold shadow-lg shadow-blue-200">
                            Confirmar Presença
                          </Button>
                          <Button variant="outline" className="w-full rounded-none border-slate-300 py-8 text-lg font-bold text-slate-700">
                            Adicionar ao Google
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-slate-50 rounded-none border-2 border-dashed border-slate-200"
              >
                <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum evento nesta data</h3>
                <p className="text-slate-500">Selecione outra data no calendário ao lado.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
