import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, where, updateDoc, doc, arrayUnion, increment } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  Search, 
  Heart, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  CheckCircle2, 
  PieChart as PieChartIcon,
  Vote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function Community() {
  const { user } = useAuth();
  const [talents, setTalents] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const usersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTalents(usersData.filter((u: any) => u.talentBank));
    });

    const qPolls = query(collection(db, 'polls'), where('status', '==', 'active'));
    const unsubPolls = onSnapshot(qPolls, (snap) => {
      setPolls(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubPolls();
    };
  }, []);

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!user) return;
    const poll = polls.find(p => p.id === pollId);
    if (poll.voters?.includes(user.uid)) {
      toast.error('Você já votou nesta enquete.');
      return;
    }

    try {
      const pollRef = doc(db, 'polls', pollId);
      await updateDoc(pollRef, {
        [`votes.${optionIndex}`]: increment(1),
        voters: arrayUnion(user.uid)
      });
      toast.success('Voto registrado com sucesso!');
    } catch (error) {
      toast.error('Erro ao registrar voto.');
    }
  };

  const filteredTalents = talents.filter(t => 
    t.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.talentBank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.profession?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-black text-slate-900">Nossa Comunidade</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">Conectando moradores, valorizando talentos e decidindo juntos o futuro da AMORCA.</p>
      </header>

      {/* Polls Section */}
      {polls.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-50 text-purple-600 rounded-none">
               <Vote className="w-6 h-6" />
             </div>
             <h2 className="text-2xl font-bold text-slate-900">Enquetes Ativas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {polls.map(poll => {
              const hasVoted = poll.voters?.includes(user?.uid);
              const totalVotes = Object.values(poll.votes || {}).reduce((a: any, b: any) => a + b, 0) as number;

              return (
                <Card key={poll.id} className="border-none shadow-sm rounded-none p-8 bg-white border border-purple-100 overflow-hidden relative">
                   {hasVoted && (
                     <div className="absolute top-0 right-0 p-4">
                        <Badge className="bg-green-100 text-green-700">VOTADO</Badge>
                     </div>
                   )}
                   <h3 className="text-xl font-bold text-slate-900 mb-6">{poll.question}</h3>
                   <div className="space-y-4">
                     {poll.options.map((option: string, idx: number) => {
                       const optVotes = poll.votes?.[idx] || 0;
                       const percentage = totalVotes > 0 ? (optVotes / totalVotes) * 100 : 0;

                       return (
                         <div key={idx} className="relative">
                           <Button
                             variant={hasVoted ? "secondary" : "outline"}
                             disabled={hasVoted}
                             onClick={() => handleVote(poll.id, idx)}
                             className={`w-full justify-between h-14 rounded-none relative overflow-hidden group ${
                               hasVoted ? 'cursor-default' : 'hover:border-purple-400 hover:bg-purple-50'
                             }`}
                           >
                             <span className="relative z-10 font-bold">{option}</span>
                             {hasVoted && (
                               <span className="relative z-10 text-xs font-black text-purple-600">{percentage.toFixed(0)}%</span>
                             )}
                             {hasVoted && (
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${percentage}%` }}
                                 className="absolute left-0 top-0 bottom-0 bg-purple-100/50 z-0"
                               />
                             )}
                           </Button>
                         </div>
                       );
                     })}
                   </div>
                   <p className="mt-6 text-xs text-slate-400 font-bold uppercase tracking-widest text-center">
                     {totalVotes} moradores já participaram
                   </p>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Talent Showcase */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-50 text-orange-600 rounded-none">
               <Heart className="w-6 h-6" />
             </div>
             <h2 className="text-2xl font-bold text-slate-900">Vitrine de Talentos</h2>
           </div>
           <div className="relative w-full md:w-96">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input 
              placeholder="Buscar por talento, nome ou profissão..." 
              className="pl-12 h-12 rounded-none border-slate-200"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-none" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredTalents.map(talent => (
                <motion.div
                  key={talent.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="border-none shadow-sm rounded-none overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <div className="h-32 bg-gradient-to-br from-orange-100 to-blue-50 group-hover:scale-105 transition-transform duration-500"></div>
                    <CardContent className="relative px-6 pb-6 -mt-12">
                      <div className="flex justify-center mb-4">
                         <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                           <AvatarImage src={talent.photoURL} />
                           <AvatarFallback className="text-xl font-black bg-slate-100">{talent.displayName?.charAt(0)}</AvatarFallback>
                         </Avatar>
                      </div>
                      <div className="text-center space-y-2 mb-6">
                        <h3 className="text-xl font-bold text-slate-900">{talent.displayName}</h3>
                        <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none uppercase text-[10px] font-black tracking-widest">
                          {talent.profession || 'Residente'}
                        </Badge>
                      </div>
                      <div className="p-4 rounded-none bg-slate-50 border border-slate-100 mb-6">
                        <p className="text-sm text-slate-600 italic text-center leading-relaxed">
                          "{talent.talentBank}"
                        </p>
                      </div>
                      <div className="space-y-3 pt-2">
                         <div className="flex items-center gap-3 text-sm text-slate-500">
                           <MapPin className="w-4 h-4 text-slate-400" />
                           <span>{talent.address || 'Quadra X, Lote Y'}</span>
                         </div>
                         <div className="flex items-center gap-3 text-sm text-slate-500">
                           <Phone className="w-4 h-4 text-slate-400" />
                           <span>{talent.phone || '(00) 00000-0000'}</span>
                         </div>
                      </div>
                      <Button className="w-full mt-6 bg-slate-900 text-white rounded-none h-12 font-bold group-hover:bg-blue-600 transition-colors">
                        Mandar Mensagem
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredTalents.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-none border-2 border-dashed border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">Nenhum talento encontrado</h3>
            <p className="text-slate-500">Tente buscar por termos diferentes ou explore outras categorias.</p>
          </div>
        )}
      </section>
    </div>
  );
}
