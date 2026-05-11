import React, { useState, useEffect } from 'react';
import { auth, db, collection, onSnapshot, query, where, addDoc, serverTimestamp, signInWithPopup, googleProvider } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  User as UserIcon, 
  Calendar,
  CheckCircle2,
  Newspaper,
  ArrowRight,
  ClipboardCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  workload: number;
  startDate: any;
  status: 'open' | 'closed' | 'in_progress' | 'cancelled' | 'finished';
  category: string;
}

interface CourseNews {
  id: string;
  title: string;
  content: string;
  date: any;
}

export default function Courses() {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseNews, setCourseNews] = useState<CourseNews[]>([]);
  const [userEnrollments, setUserEnrollments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Registration Form State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showRegDialog, setShowRegDialog] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [race, setRace] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile && showRegDialog) {
      setRegFullName(profile.fullName || profile.displayName || '');
      setRegAddress(profile.address || '');
      setRegEmail(profile.email || '');
    }
  }, [profile, showRegDialog]);

  useEffect(() => {
    // Fetch active courses
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[]);
    }, (error) => console.error("Courses listener failed:", error));

    // Fetch course opening news
    const newsQuery = query(collection(db, 'news'), where('category', '==', 'Cursos'));
    const unsubNews = onSnapshot(newsQuery, (snap) => {
       setCourseNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CourseNews[]);
       setLoading(false);
    }, (error) => console.error("News listener failed:", error));

    let unsubEnrolls: (() => void) | undefined;

    if (user) {
      const enrollQuery = query(collection(db, 'enrollments'), where('userId', '==', user.uid));
      unsubEnrolls = onSnapshot(enrollQuery, (snap) => {
        setUserEnrollments(snap.docs.map(doc => doc.data().courseId));
      }, (error) => console.error("Enrollments listener failed:", error));
    }

    return () => {
      unsubCourses();
      unsubNews();
      if (unsubEnrolls) unsubEnrolls();
    };
  }, [user]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    
    // Validate email
    const memberEmail = user ? user.email : regEmail;
    if (!memberEmail) {
      toast.error('Informe seu e-mail para inscrição.');
      return;
    }
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'enrollments'), {
        courseId: selectedCourse.id,
        courseName: selectedCourse.title,
        userId: user ? user.uid : null,
        userEmail: memberEmail,
        userName: regFullName || profile?.fullName || user?.displayName || 'Interessado Externo',
        userAddress: regAddress || profile?.address || 'Não informado',
        age: Number(age) || 0,
        gender,
        race,
        status: 'pending',
        enrollmentDate: serverTimestamp(),
        attendance: 0,
        workload: selectedCourse.workload,
        instructor: selectedCourse.instructor,
        certificates: []
      });
      
      toast.success('Inscrição enviada com sucesso! Aguarde a confirmação por e-mail.');
      setShowRegDialog(false);
      setRegFullName('');
      setRegAddress('');
      setRegEmail('');
      setAge('');
      setGender('');
      setRace('');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao realizar inscrição.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <header className="text-center space-y-6">
        <div className="inline-flex p-4 bg-blue-50/20 rounded-full border border-blue-400/30 backdrop-blur-sm mb-4">
          <GraduationCap className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-lg">Cursos & Capacitação</h1>
        <p className="text-xl text-blue-50 max-w-2xl mx-auto font-medium">Invista no seu futuro com os cursos gratuitos da AMORCA para nossa comunidade.</p>
      </header>

      {/* Course Opening News Section */}
      {courseNews.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-3">
             <Newspaper className="w-8 h-8 text-orange-400" />
             <h2 className="text-3xl font-black text-white">Anúncios de Abertura</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courseNews.map(news => (
               <Card key={news.id} className="bg-white/10 backdrop-blur-md border-white/20 text-white rounded-none p-6">
                  <div className="text-orange-400 text-xs font-black uppercase tracking-widest mb-2">Novas Vagas</div>
                  <h3 className="text-xl font-bold mb-3">{news.title}</h3>
                  <p className="text-blue-50/80 text-sm line-clamp-3 mb-4">{news.content}</p>
                  <Button variant="link" className="text-orange-400 p-0 h-auto font-bold items-center gap-2">
                    Ler detalhes <ArrowRight className="w-4 h-4" />
                  </Button>
               </Card>
            ))}
          </div>
        </section>
      )}

      {/* Main Courses Grid */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-3">
             <BookOpen className="w-8 h-8 text-blue-300" />
             <h2 className="text-3xl font-black text-white">Cursos Disponíveis</h2>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(course => {
            const isEnrolled = userEnrollments.includes(course.id);
            const isOpen = course.status === 'open';

            return (
              <motion.div
                key={course.id}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="h-full bg-white/95 border-none shadow-2xl rounded-none overflow-hidden flex flex-col">
                  <div className="h-4 bg-blue-600"></div>
                  <CardContent className="p-8 flex-grow">
                    <div className="flex justify-between items-start mb-6">
                      <Badge className={
                        course.status === 'open' ? "bg-green-100 text-green-700" : 
                        course.status === 'in_progress' ? "bg-blue-100 text-blue-700" :
                        course.status === 'cancelled' ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-500"
                      }>
                        {course.status === 'open' ? 'INSCRIÇÕES ABERTAS' : 
                         course.status === 'in_progress' ? 'EM ANDAMENTO' :
                         course.status === 'cancelled' ? 'CANCELADO' :
                         course.status === 'finished' ? 'FINALIZADO' : 'ENCERRADO'}
                      </Badge>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{course.category}</span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                      {course.title}
                    </h3>
                    
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed line-clamp-3">
                      {course.description}
                    </p>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <UserIcon className="w-4 h-4 text-blue-500" />
                        <span className="font-bold">Prof:</span> {course.instructor}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="font-bold">Carga Horária:</span> {course.workload} horas
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="font-bold">Início:</span> {course.startDate?.toDate ? new Date(course.startDate.toDate()).toLocaleDateString() : 'A definir'}
                      </div>
                    </div>
                  </CardContent>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 mt-auto">
                    {userEnrollments.includes(course.id) ? (
                      <div className="flex items-center justify-center gap-2 py-3 bg-green-100 text-green-700 font-bold text-sm w-full">
                        <CheckCircle2 className="w-5 h-5" />
                        MATRICULADO
                      </div>
                    ) : (
                      <Dialog open={showRegDialog && selectedCourse?.id === course.id} onOpenChange={(open) => {
                        setShowRegDialog(open);
                        if(open) setSelectedCourse(course);
                      }}>
                        <DialogTrigger render={
                          <Button 
                            disabled={!isOpen}
                            className={`w-full h-14 rounded-none font-black text-lg gap-2 transition-all ${
                              isOpen ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-900/10' : 'bg-slate-200 text-slate-400'
                            }`}
                            onClick={() => setSelectedCourse(course)}
                          >
                            <ClipboardCheck className="w-5 h-5" />
                            INSCREVA-SE
                          </Button>
                        } />
                        <DialogContent className="rounded-none sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Ficha de Inscrição</DialogTitle>
                            <CardDescription>
                              Você está se inscrevendo no curso: <span className="text-blue-600 font-bold">{course?.title}</span>
                            </CardDescription>
                          </DialogHeader>
                          <form onSubmit={handleRegister} className="space-y-6 py-4 max-h-[60vh] overflow-y-auto px-1">
                            <div className="space-y-2">
                              <Label className="font-bold">Nome Completo</Label>
                              <Input 
                                required 
                                className="rounded-none" 
                                value={regFullName}
                                onChange={e => setRegFullName(e.target.value)}
                                placeholder="Seu nome completo"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="font-bold">E-mail para Contato</Label>
                              <Input 
                                type="email"
                                required 
                                className="rounded-none" 
                                value={user?.email || regEmail}
                                onChange={e => setRegEmail(e.target.value)}
                                disabled={!!user}
                                placeholder="seu@email.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="font-bold">Endereço da Residência</Label>
                              <Input 
                                required 
                                className="rounded-none" 
                                value={regAddress}
                                onChange={e => setRegAddress(e.target.value)}
                                placeholder="Rua, Número, Bloco, Apto..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="font-bold">Idade</Label>
                              <Input 
                                type="number" 
                                required 
                                className="rounded-none" 
                                value={age}
                                onChange={e => setAge(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="font-bold">Gênero</Label>
                              <select 
                                required
                                className="w-full h-10 px-3 border rounded-none bg-white font-medium"
                                value={gender}
                                onChange={e => setGender(e.target.value)}
                              >
                                <option value="">Selecione...</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                                <option value="Outro">Outro / Prefiro não dizer</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label className="font-bold">Raça / Etnia</Label>
                              <select 
                                required
                                className="w-full h-10 px-3 border rounded-none bg-white font-medium"
                                value={race}
                                onChange={e => setRace(e.target.value)}
                              >
                                <option value="">Selecione...</option>
                                <option value="Branca">Branca</option>
                                <option value="Preta">Preta</option>
                                <option value="Parda">Parda</option>
                                <option value="Amarela">Amarela</option>
                                <option value="Indígena">Indígena</option>
                              </select>
                            </div>
                            <Button 
                              type="submit" 
                              className="w-full bg-blue-600 text-white h-14 rounded-none font-bold text-lg"
                              disabled={submitting}
                            >
                              {submitting ? 'Enviando...' : 'Confirmar Inscrição'}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {courses.length === 0 && !loading && (
          <div className="text-center py-20 bg-white/5 rounded-none border-2 border-dashed border-white/20">
            <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white font-medium text-xl">Novos cursos em breve!</p>
          </div>
        )}
      </section>
    </div>
  );
}
