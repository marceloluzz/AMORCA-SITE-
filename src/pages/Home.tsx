import { useState, useEffect } from 'react';
import { db, collection, query, orderBy, limit, onSnapshot } from '../firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button, buttonVariants } from '../components/ui/button';
import { Newspaper, Calendar, ArrowRight, Info, CheckCircle2, Star, Users, ShieldCheck, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: any;
  imageUrl?: string;
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('date', 'desc'), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsItem[];
      setNews(newsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section - SaaS style with massive typography */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img 
            src="/amorca_hero_professional.png" 
            alt="AMORCA Residentail" 
            className="w-full h-full object-cover opacity-50 contrast-125"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent"></div>
        </div>
        
        <div className="relative z-10 w-full px-10 sm:px-16 lg:px-20 py-20">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-bold uppercase tracking-widest mb-8">
                <ShieldCheck className="w-4 h-4" />
                Associação de Moradores
              </div>
              
              <h1 className="text-6xl md:text-[140px] font-black text-white leading-[0.85] tracking-tighter mb-8 drop-shadow-2xl">
                AMORCA <br/>
                <span className="text-orange-500">2026.</span>
              </h1>
              
              <p className="text-xl md:text-3xl text-slate-300 font-medium mb-12 max-w-2xl leading-tight">
                Construindo o futuro hoje. Segurança, comunidade e transparência no <span className="text-white font-bold">Caminho do Alvorada</span>.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <Link 
                  to="/register" 
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "bg-orange-500 hover:bg-orange-600 text-white px-12 py-8 text-2xl font-black rounded-none shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0"
                  )}
                >
                  ASSOCIE-SE AGORA
                </Link>
                <Link 
                  to="/courses" 
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "border-white/20 text-black hover:bg-white/10 px-12 py-8 text-2xl font-black rounded-none transition-all"
                  )}
                >
                  VER CURSOS
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative Grid */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden lg:grid grid-cols-4 grid-rows-6 gap-2 p-4 opacity-20 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="border border-white/20"></div>
          ))}
        </div>
      </section>

      {/* Feature Grid - Technical/Grid style */}
      <section className="bg-slate-50 py-24 border-y border-slate-200">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 border-l border-t border-slate-200">
            {[
              { icon: ShieldCheck, title: "Segurança 24h", desc: "Monitoramento e controle de acesso rigoroso." },
              { icon: Info, title: "Transparência", desc: "Contas abertas e gestão democrática para todos." },
              { icon: GraduationCap, title: "Educação", desc: "Cursos e capacitações para toda a família." },
              { icon: Users, title: "Comunidade", desc: "Eventos e integrações que fortalecem laços." }
            ].map((feature, i) => (
              <div key={i} className="p-10 border-r border-b border-slate-200 hover:bg-white transition-colors group">
                <feature.icon className="w-10 h-10 text-orange-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-black text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Highlights - Magazine style */}
      <section className="py-24 bg-white">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-16 px-4">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-6">
                CANAL DE <br/>
                <span className="text-blue-600">NOTÍCIAS.</span>
              </h2>
              <p className="text-xl text-slate-500 italic font-serif">Mantenha-se informado sobre as decisões que impactam sua moradia.</p>
            </div>
            <Link 
              to="/forum" 
              className="hidden md:flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
            >
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {loading ? (
              <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="aspect-[3/4] bg-slate-100 animate-pulse"></div>
                ))}
              </div>
            ) : news.length > 0 ? (
              <>
                {/* Featured News */}
                <div className="lg:col-span-7">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-[16/9] overflow-hidden mb-8 relative">
                      <img 
                        src={news[0].imageUrl || "https://picsum.photos/seed/amorca1/1200/800"} 
                        alt={news[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-2 font-black text-sm">
                        DESTAQUE
                      </div>
                    </div>
                    <p className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-4">
                      {news[0].date?.toDate?.() ? new Date(news[0].date.toDate()).toLocaleDateString() : 'Hoje'}
                    </p>
                    <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 group-hover:text-blue-600 transition-colors leading-tight">
                      {news[0].title}
                    </h3>
                    <p className="text-xl text-slate-600 line-clamp-3 leading-relaxed mb-8">
                      {news[0].content}
                    </p>
                    <Button variant="link" className="p-0 h-auto text-lg font-black text-slate-900 group-hover:translate-x-2 transition-transform underline decoration-blue-500 underline-offset-4">
                      LER ARTIGO COMPLETO
                    </Button>
                  </motion.div>
                </div>

                {/* Secondary News List */}
                <div className="lg:col-span-5 flex flex-col gap-12">
                  {news.slice(1).map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      className="grid grid-cols-3 gap-6 group cursor-pointer"
                    >
                      <div className="col-span-1 aspect-square overflow-hidden bg-slate-100">
                        <img 
                          src={item.imageUrl || `https://picsum.photos/seed/amorca${idx+2}/400/400`} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="col-span-2 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          {item.date?.toDate?.() ? new Date(item.date.toDate()).toLocaleDateString() : 'Recente'}
                        </p>
                        <h4 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight mb-2">
                          {item.title}
                        </h4>
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <div className="col-span-12 py-20 text-center border-2 border-dashed border-slate-100 text-slate-300 font-bold uppercase tracking-widest">
                Nenhuma notícia encontrada
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section - Bold Minimal */}
      <section className="bg-orange-500 py-32 overflow-hidden relative">
        <div className="absolute top-0 right-0 text-[300px] font-black text-orange-600/20 leading-none select-none translate-x-1/4 -translate-y-1/4">
          AMORCA
        </div>
        <div className="container max-w-7xl mx-auto px-6 relative z-10 text-center md:text-left">
          <div className="max-w-3xl">
            <h2 className="text-6xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter mb-10">
              FAÇA PARTE <br/>
              DA REVOLUÇÃO.
            </h2>
            <p className="text-2xl text-orange-100 font-medium mb-14 leading-tight">
              Sua moradia, suas regras. Participe ativamente da vida comunitária e tenha acesso a benefícios exclusivos de lazer e educação.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link 
                to="/register" 
                className="bg-white text-orange-600 px-16 py-10 text-3xl font-black rounded-none shadow-2xl hover:scale-105 transition-transform text-center"
              >
                QUERO ME ASSOCIAR
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-12 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
             <div className="flex items-center gap-2 font-black text-2xl tracking-tighter"><Star className="fill-current"/> PARNAÍBA-PI</div>
             <div className="flex items-center gap-2 font-black text-2xl tracking-tighter"><CheckCircle2 className="fill-current"/> VERIFICADO</div>
             <div className="flex items-center gap-2 font-black text-2xl tracking-tighter"><ShieldCheck className="fill-current"/> SEGURO</div>
             <div className="flex items-center gap-2 font-black text-2xl tracking-tighter"><Users className="fill-current"/> UNIDO</div>
          </div>
        </div>
      </section>
    </div>
  );
}
