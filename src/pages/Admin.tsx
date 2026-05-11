import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, where, limit, updateDoc, doc } from '../firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Users, 
  Newspaper, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Download,
  ShieldCheck,
  Briefcase,
  Heart,
  MessageSquare,
  PenTool,
  Construction,
  PieChart as PieChartIcon,
  Check,
  BadgeCheck,
  QrCode,
  GraduationCap,
  Mail
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'framer-motion';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { generateCertificatePDF } from '../lib/pdfUtils';
import { arrayUnion } from 'firebase/firestore';

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserForCard, setSelectedUserForCard] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // Course Form
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseInstructor, setCourseInstructor] = useState('');
  const [courseWorkload, setCourseWorkload] = useState('');
  const [courseStartDate, setCourseStartDate] = useState('');
  const [courseCategory, setCourseCategory] = useState('');

  // Form states
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');

  const { user, profile, isCoordinator, isAdmin: isUserAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !user || !isCoordinator) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Users listener failed:", error));
    const unsubPayments = onSnapshot(collection(db, 'payments'), (snap) => {
      setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Payments listener failed:", error));
    const unsubNews = onSnapshot(collection(db, 'news'), (snap) => {
      setNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("News listener failed:", error));
    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      setEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Events listener failed:", error));
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Expenses listener failed:", error));
    const unsubSuggestions = onSnapshot(collection(db, 'suggestions'), (snap) => {
      setSuggestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Suggestions listener failed:", error));
    const unsubForum = onSnapshot(query(collection(db, 'forum_posts'), orderBy('date', 'desc'), limit(10)), (snap) => {
      setForumPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Forum listener failed:", error));
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Courses listener failed:", error));
    const unsubEnrollments = onSnapshot(collection(db, 'enrollments'), (snap) => {
      setEnrollments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Enrollments listener failed:", error));

    setLoading(false);
    return () => {
      unsubUsers();
      unsubPayments();
      unsubNews();
      unsubEvents();
      unsubExpenses();
      unsubSuggestions();
      unsubForum();
      unsubCourses();
      unsubEnrollments();
    };
  }, [user, isCoordinator, authLoading]);

  const handleUpdateStatus = async (collectionName: string, id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, collectionName, id), { status: newStatus });
      toast.success('Status atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        ...editFormData,
        updatedAt: serverTimestamp()
      });
      toast.success('Dados do associado atualizados!');
      setEditingUser(null);
    } catch (error) {
      toast.error('Erro ao atualizar associado.');
    }
  };

  const handleCreateExpense = async () => {
    try {
      await addDoc(collection(db, 'expenses'), {
        description: expenseDesc,
        amount: parseFloat(expenseAmount),
        category: expenseCategory,
        date: serverTimestamp(),
        status: 'pagamento_confirmado'
      });
      setExpenseDesc('');
      setExpenseAmount('');
      setExpenseCategory('');
      toast.success('Despesa registrada com sucesso!');
    } catch (error) {
      toast.error('Erro ao registrar despesa.');
    }
  };

  const handleCreateNews = async () => {
    try {
      await addDoc(collection(db, 'news'), {
        title: newsTitle,
        content: newsContent,
        date: serverTimestamp(),
        authorId: 'admin'
      });
      setNewsTitle('');
      setNewsContent('');
      toast.success('Notícia publicada!');
    } catch (error) {
      toast.error('Erro ao publicar notícia.');
    }
  };

  const handleCreateEvent = async () => {
    try {
      await addDoc(collection(db, 'events'), {
        title: eventTitle,
        date: new Date(eventDate),
        location: eventLocation,
        description: 'Evento da associação',
        category: 'Geral'
      });
      setEventTitle('');
      setEventDate('');
      setEventLocation('');
      toast.success('Evento criado!');
    } catch (error) {
      toast.error('Erro ao criar evento.');
    }
  };

  const handleCreateCourse = async () => {
    try {
      await addDoc(collection(db, 'courses'), {
        title: courseTitle,
        description: courseDesc,
        instructor: courseInstructor,
        workload: parseInt(courseWorkload),
        startDate: new Date(courseStartDate),
        category: courseCategory,
        status: 'open',
        createdAt: serverTimestamp()
      });
      setCourseTitle('');
      setCourseDesc('');
      setCourseInstructor('');
      setCourseWorkload('');
      setCourseStartDate('');
      setCourseCategory('');
      toast.success('Curso publicado!');
    } catch (error) {
      toast.error('Erro ao publicar curso.');
    }
  };

  const handleIssueCertificate = async (enrollment: any) => {
    try {
      // 1. Generate PDF
      generateCertificatePDF({
        studentName: enrollment.userName,
        courseName: enrollment.courseName,
        workload: enrollment.workload,
        instructor: enrollment.instructor,
        completionDate: new Date()
      });

      // 2. Update Firestore (Simulate automatic issuance recording)
      await updateDoc(doc(db, 'enrollments', enrollment.id), {
        status: 'completed',
        certificates: arrayUnion({
          type: 'Conclusão',
          issuedAt: new Date(),
          url: '#' // In a real app, this would be a Firebase Storage URL
        })
      });

      toast.success('Certificado emitido e enviado ao aluno!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao emitir certificado.');
    }
  };

  const revenueData = [
    { month: 'Jan', value: 4500 },
    { month: 'Fev', value: 5200 },
    { month: 'Mar', value: 4800 },
    { month: 'Abr', value: 6100 },
    { month: 'Mai', value: 5900 },
    { month: 'Jun', value: 7200 },
  ];

  const statusData = [
    { name: 'Pagos', value: payments.filter(p => p.status === 'paid').length || 15 },
    { name: 'Pendentes', value: payments.filter(p => p.status === 'pending').length || 5 },
    { name: 'Atrasados', value: payments.filter(p => p.status === 'overdue').length || 2 },
  ];

  const COLORS = ['#10b981', '#f39c12', '#ef4444'];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Premium Dashboard Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest mb-3">
                <ShieldCheck className="w-3 h-3" /> Gestão Central AMORCA
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Painel de <span className="text-blue-600">Controle</span></h1>
              <p className="text-slate-500 mt-2 text-lg italic pr-12">Monitoramento completo de associados, financeiro e capacitação.</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-none border-slate-200 h-12 shadow-sm font-bold text-slate-600 gap-2 px-6">
                <Download className="w-4 h-4" /> EXPORTAR PDF
              </Button>
              <Dialog>
                <DialogTrigger render={
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-none h-12 px-8 font-black gap-2 shadow-lg shadow-blue-900/10">
                    <TrendingUp className="w-5 h-5" /> PERFORMANCE ANUAL
                  </Button>
                } />
                <DialogContent className="max-w-4xl rounded-none">
                  <DialogHeader><DialogTitle className="text-2xl font-black">Performance Financeira & Social 2026</DialogTitle></DialogHeader>
                  <div className="h-[400px] w-full py-6">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={revenueData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} />
                         <XAxis dataKey="month" />
                         <YAxis />
                         <Tooltip />
                         <Bar dataKey="value" fill="#2c5f9e" radius={[4,4,0,0]} />
                       </BarChart>
                     </ResponsiveContainer>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Real-time Stats Overlay */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 bg-slate-50 p-1 rounded-none border border-slate-200 shadow-inner">
            <div className="bg-white p-6 rounded-none group hover:bg-blue-600 transition-all duration-300">
               <p className="text-[10px] font-black text-slate-400 group-hover:text-blue-100 uppercase tracking-widest mb-1">Membros Ativos</p>
               <div className="flex items-end gap-2">
                 <h3 className="text-3xl font-black text-slate-900 group-hover:text-white mt-1 tabular-nums">{users.filter(u => u.status === 'active').length}</h3>
                 <span className="text-xs font-bold text-green-500 group-hover:text-green-300 mb-1">+12%</span>
               </div>
            </div>
            <div className="bg-white p-6 rounded-none group hover:bg-orange-500 transition-all duration-300">
               <p className="text-[10px] font-black text-slate-400 group-hover:text-orange-100 uppercase tracking-widest mb-1">Arrecadação Est.</p>
               <div className="flex items-end gap-2">
                 <h3 className="text-3xl font-black text-slate-900 group-hover:text-white mt-1 tabular-nums">R$ 10.4k</h3>
                 <span className="text-xs font-bold text-orange-400 group-hover:text-orange-200 mb-1">PREVISTO</span>
               </div>
            </div>
            <div className="bg-white p-6 rounded-none group hover:bg-green-600 transition-all duration-300">
               <p className="text-[10px] font-black text-slate-400 group-hover:text-green-100 uppercase tracking-widest mb-1">Pagtos / Mês</p>
               <div className="flex items-end gap-2">
                 <h3 className="text-3xl font-black text-slate-900 group-hover:text-white mt-1 tabular-nums">{payments.filter(p => p.status === 'paid').length}</h3>
                 <span className="text-xs font-bold text-slate-400 group-hover:text-green-300 mb-1">CONFIRMADOS</span>
               </div>
            </div>
            <div className="bg-white p-6 rounded-none group hover:bg-purple-600 transition-all duration-300">
               <p className="text-[10px] font-black text-slate-400 group-hover:text-purple-100 uppercase tracking-widest mb-1">Fila Social</p>
               <div className="flex items-end gap-2">
                 <h3 className="text-3xl font-black text-slate-900 group-hover:text-white mt-1 tabular-nums">{suggestions.filter(s => s.status === 'new').length}</h3>
                 <span className="text-xs font-bold text-red-500 group-hover:text-red-300 mb-1">PENDENTE</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="overview" className="space-y-12">
          <div className="border-b border-slate-200">
            <TabsList className="bg-transparent p-0 h-auto gap-10 flex overflow-x-auto no-scrollbar">
              {[
                { value: 'overview', label: 'Monitoramento', icon: PieChartIcon },
                { value: 'users', label: 'Membros', icon: Users },
                { value: 'courses', label: 'Cursos & Academico', icon: GraduationCap },
                { value: 'finance', label: 'Tesouraria', icon: DollarSign },
                { value: 'content', label: 'Imprensa & Eventos', icon: Newspaper },
              ].map(tab => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className="rounded-none border-b-2 border-transparent px-0 py-4 text-sm font-black uppercase tracking-widest data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 text-slate-400 bg-transparent shadow-none"
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-10">
            {/* Visual Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none shadow-sm rounded-none bg-white p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Fluxo de Caixa Operacional</h3>
                    <p className="text-slate-500">Comparativo mensal de arrecadação x despesas.</p>
                  </div>
                  <Badge className="bg-blue-50 text-blue-600 border-none px-4 py-2 font-black">2026</Badge>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 900 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 900 }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '0px', border: '1px solid #e2e8f0', fontWeight: 900 }} />
                      <Bar dataKey="value" fill="#2c5f9e" radius={[2, 2, 0, 0]} barSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="space-y-8">
                <Card className="border-none shadow-sm rounded-none bg-white p-8">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" /> Saúde Financeira
                  </h3>
                  <div className="space-y-6">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div><span className="text-[10px] font-black inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">Arrecadação Total</span></div>
                        <div className="text-right"><span className="text-xs font-black inline-block text-blue-600">82%</span></div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-50">
                        <div style={{ width: "82%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"></div>
                      </div>
                    </div>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div><span className="text-[10px] font-black inline-block py-1 px-2 uppercase rounded-full text-orange-600 bg-orange-200">Taxa de Inadimplência</span></div>
                        <div className="text-right"><span className="text-xs font-black inline-block text-orange-600">18%</span></div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-orange-50">
                        <div style={{ width: "18%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"></div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="border-none shadow-sm rounded-none bg-slate-900 text-white p-8">
                  <h3 className="text-lg font-black uppercase tracking-tight mb-6">Acessos Rápidos</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group">
                        <Mail className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Email Marketing</span>
                     </button>
                     <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group">
                        <DollarSign className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Liquidação Pix</span>
                     </button>
                     <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group">
                        <FileText className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Gerar Editais</span>
                     </button>
                     <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group">
                        <MoreVertical className="w-5 h-5 text-slate-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Configurações</span>
                     </button>
                  </div>
                </Card>
              </div>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-none overflow-hidden">
              <CardHeader className="bg-white border-b border-slate-100">
                <CardTitle className="text-lg">Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-bold text-slate-900">Novo associado cadastrado</p>
                        <p className="text-xs text-slate-500">Há 2 horas • Por Sistema</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-slate-400">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-none p-6 bg-slate-900 text-white">
              <h3 className="font-bold text-lg mb-6">Ações Rápidas</h3>
              <div className="space-y-3">
                <Dialog>
                  <DialogTrigger render={<Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-none gap-2 justify-start" />}>
                      <Plus className="w-4 h-4" /> Nova Notícia
                  </DialogTrigger>
                  <DialogContent className="rounded-none">
                    <DialogHeader>
                      <DialogTitle>Publicar Notícia</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Conteúdo</Label>
                        <textarea 
                          className="w-full p-3 rounded-none border border-slate-200 text-sm h-32"
                          value={newsContent}
                          onChange={e => setNewsContent(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateNews} className="bg-blue-600 text-white">Publicar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger render={<Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-none gap-2 justify-start" />}>
                      <Plus className="w-4 h-4" /> Novo Evento
                  </DialogTrigger>
                  <DialogContent className="rounded-none">
                    <DialogHeader>
                      <DialogTitle>Criar Evento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input value={eventTitle} onChange={e => setEventTitle(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Data</Label>
                        <Input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Local</Label>
                        <Input value={eventLocation} onChange={e => setEventLocation(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateEvent} className="bg-orange-500 text-white">Criar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-800 rounded-none gap-2 justify-start">
                  <Users className="w-4 h-4" /> Gerenciar Associados
                </Button>
                <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-800 rounded-none gap-2 justify-start">
                  <FileText className="w-4 h-4" /> Gerar Boletos
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
              <Card className="border-none shadow-sm rounded-none overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Associados</CardTitle>
                    <CardDescription>Aprovação de cadastros e edição de perfis</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Buscar por nome ou CPF..." className="w-64 rounded-none" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Membro / Profissão</th>
                          <th className="px-6 py-4">Endereço</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((u:any) => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={u.photoURL} />
                                <AvatarFallback>{u.displayName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{u.displayName}</p>
                                <p className="text-xs text-slate-500">{u.profession || 'Não informado'}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {u.address || 'Não informado'}
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                                {u.status === 'pending_approval' ? 'Pendente' : u.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 flex gap-2">
                              {/* Edit User Dialog */}
                              <Dialog open={editingUser?.id === u.id} onOpenChange={(open) => {
                                if (open) {
                                  setEditingUser(u);
                                  setEditFormData(u);
                                } else {
                                  setEditingUser(null);
                                }
                              }}>
                                <DialogTrigger render={
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-none text-xs h-8 gap-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                                  >
                                    <PenTool className="w-3 h-3" /> Editar
                                  </Button>
                                } />
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Editar Associado</DialogTitle>
                                    <DialogDescription>Atualize os dados cadastrais de {u.displayName}</DialogDescription>
                                  </DialogHeader>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                    <div className="space-y-2">
                                      <Label>Nome Completo</Label>
                                      <Input 
                                        value={editFormData.displayName || ''} 
                                        onChange={e => setEditFormData({...editFormData, displayName: e.target.value})}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>E-mail</Label>
                                      <Input 
                                        value={editFormData.email || ''} 
                                        onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>CPF</Label>
                                      <Input 
                                        value={editFormData.cpf || ''} 
                                        onChange={e => setEditFormData({...editFormData, cpf: e.target.value})}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Profissão</Label>
                                      <Input 
                                        value={editFormData.profession || ''} 
                                        onChange={e => setEditFormData({...editFormData, profession: e.target.value})}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Endereço</Label>
                                      <Input 
                                        value={editFormData.address || ''} 
                                        onChange={e => setEditFormData({...editFormData, address: e.target.value})}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-2">
                                        <Label>Cidade</Label>
                                        <Input 
                                          value={editFormData.city || ''} 
                                          onChange={e => setEditFormData({...editFormData, city: e.target.value})}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Estado</Label>
                                        <Input 
                                          value={editFormData.state || ''} 
                                          onChange={e => setEditFormData({...editFormData, state: e.target.value})}
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Necessidades Especiais</Label>
                                      <Input 
                                        value={editFormData.specialNeeds || ''} 
                                        onChange={e => setEditFormData({...editFormData, specialNeeds: e.target.value})}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Banco de Talentos</Label>
                                      <textarea 
                                        className="w-full text-xs p-2 border border-slate-200 rounded-none h-20"
                                        value={editFormData.talentBank || ''} 
                                        onChange={e => setEditFormData({...editFormData, talentBank: e.target.value})}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
                                    <Button onClick={handleEditUser} className="bg-blue-600 text-white">Salvar Alterações</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger render={
                                  <Button variant="outline" size="sm" className="rounded-none text-xs h-8 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50">
                                    <FileText className="w-3 h-3" /> Ver Ficha
                                  </Button>
                                } />
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Ficha de Cadastro do Associado</DialogTitle>
                                    <DialogDescription>Dados completos de {u.displayName}</DialogDescription>
                                  </DialogHeader>
                                  <div className="grid grid-cols-2 gap-6 py-4 text-sm">
                                    <div className="space-y-4">
                                      <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Informações Básicas</p>
                                        <p className="mt-1"><strong>Nascimento/Idade:</strong> {u.age} anos</p>
                                        <p><strong>CPF:</strong> {u.cpf}</p>
                                        <p><strong>Profissão:</strong> {u.profession || 'Não informado'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Localização</p>
                                        <p className="mt-1"><strong>Endereço:</strong> {u.address || 'Não informado'}</p>
                                        <p><strong>Cidade:</strong> {u.city} - {u.state}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Composição Familiar</p>
                                        <p className="mt-1"><strong>Crianças:</strong> {u.familyComposition?.children || 0}</p>
                                        <p><strong>Jovens:</strong> {u.familyComposition?.youth || 0}</p>
                                        <p><strong>Adultos:</strong> {u.familyComposition?.adults || 0}</p>
                                        <p><strong>Idosos:</strong> {u.familyComposition?.elderly || 0}</p>
                                      </div>
                                      {u.specialNeeds && (
                                        <div>
                                          <p className="text-xs font-bold text-red-400 uppercase">Necessidades Especiais</p>
                                          <p className="mt-1 text-red-600 font-bold">{u.specialNeeds}</p>
                                        </div>
                                      )}
                                      {u.talentBank && (
                                        <div>
                                          <p className="text-xs font-bold text-orange-400 uppercase">Talento/Profissão</p>
                                          <p className="mt-1 italic">"{u.talentBank}"</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <DialogFooter className="flex justify-between sm:justify-between items-center bg-slate-50 p-4 -m-6 mt-4">
                                    <Badge className={u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                                      STATUS: {u.status?.toUpperCase()}
                                    </Badge>
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('users', u.id, 'inactive')}>Inativar</Button>
                                      {u.status !== 'active' && <Button size="sm" className="bg-green-600 text-white" onClick={() => handleUpdateStatus('users', u.id, 'active')}>Aprovar Cadastro</Button>}
                                    </div>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              {/* Virtual ID Card Button */}
                              <Dialog>
                                <DialogTrigger render={
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-none text-xs h-8 gap-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                                  >
                                    <BadgeCheck className="w-3 h-3" /> Carteirinha
                                  </Button>
                                } />
                                <DialogContent className="max-w-xs p-0 border-none bg-transparent shadow-none overflow-hidden flex justify-center">
                                  <div className="relative w-[320px] h-[568px] bg-gradient-to-br from-blue-900 via-[#2c5f9e] to-blue-800 rounded-[32px] overflow-hidden shadow-2xl flex flex-col items-center p-6 text-white text-center print:fixed print:inset-0 print:m-0 print:rounded-none print:w-full print:h-full print:shadow-none print:z-50">
                                    <style>{`
                                      @media print {
                                        @page { size: 9/16; margin: 0; }
                                        body * { visibility: hidden; }
                                        .print-card, .print-card * { visibility: visible; }
                                        .print-card { position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; overflow: hidden; }
                                      }
                                    `}</style>
                                    <div className="print-card flex flex-col items-center h-full w-full justify-between py-8">
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                      <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full -ml-20 -mb-20 blur-3xl"></div>
                                      
                                      <div className="mt-4">
                                        <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-sm">
                                          <Avatar className="w-28 h-28 border-4 border-white shadow-xl">
                                            <AvatarImage src={u.photoURL} />
                                            <AvatarFallback className="bg-blue-100 text-blue-900 text-2xl font-black">{u.displayName?.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                        </div>
                                      </div>

                                      <div className="space-y-1 mb-2">
                                        <h2 className="text-xl font-black tracking-tight leading-tight uppercase px-4">{u.displayName}</h2>
                                        <Badge className="bg-green-400 text-green-900 hover:bg-green-400 font-bold border-none text-[9px] h-5 px-2">ASSOCIADO ATIVO</Badge>
                                      </div>

                                      <div className="w-full h-px bg-white/20 px-8"></div>

                                      <div className="w-full grid grid-cols-2 text-left px-6 py-2 gap-x-4 gap-y-4">
                                        <div>
                                          <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest leading-none">Associação</p>
                                          <p className="text-xs font-black truncate">AMORCA Residencial</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest leading-none">ID</p>
                                          <p className="text-xs font-black truncate">#{u.id.substring(0, 8).toUpperCase()}</p>
                                        </div>
                                        <div>
                                          <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest leading-none">Adesão</p>
                                          <p className="text-xs font-black">
                                            {u.createdAt ? new Date(u.createdAt.toDate()).toLocaleDateString() : '01/01/2026'}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest leading-none">Validade</p>
                                          <p className="text-xs font-black">MAI / 2027</p>
                                        </div>
                                      </div>

                                      <div className="flex flex-col items-center">
                                        <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center p-2 shadow-inner">
                                          <QrCode className="w-full h-full text-blue-900" />
                                        </div>
                                        <p className="mt-2 text-[8px] font-bold text-blue-200 uppercase tracking-[0.2em] opacity-80">Documento Virtual Oficial</p>
                                      </div>

                                      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/20 to-transparent">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center backdrop-blur-md">
                                            <Heart className="w-3 h-3 text-white" />
                                          </div>
                                          <span className="text-[8px] font-black tracking-tighter uppercase">Morador Registrado</span>
                                        </div>
                                        <ShieldCheck className="w-4 h-4 text-white/40" />
                                      </div>
                                      
                                      <div className="mt-2 print:hidden">
                                         <Button 
                                          variant="link" 
                                          className="text-white/40 text-[9px] h-auto p-0 hover:text-white"
                                          onClick={() => window.print()}
                                         >
                                           <Download className="w-3 h-3 mr-1" /> Imprimir Formato 9:16
                                         </Button>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

        <TabsContent value="courses" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Card className="lg:col-span-1 border-none shadow-sm rounded-none p-6 bg-white self-start">
               <h3 className="text-xl font-black mb-6">Novo Curso</h3>
               <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título do Curso</Label>
                    <Input value={courseTitle} onChange={e => setCourseTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <textarea 
                      className="w-full p-2 border rounded-none text-sm h-24"
                      value={courseDesc}
                      onChange={e => setCourseDesc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Professor / Instrutor</Label>
                    <Input value={courseInstructor} onChange={e => setCourseInstructor(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Carga Horária (h)</Label>
                      <Input type="number" value={courseWorkload} onChange={e => setCourseWorkload(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Início</Label>
                      <Input type="date" value={courseStartDate} onChange={e => setCourseStartDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input value={courseCategory} onChange={e => setCourseCategory(e.target.value)} placeholder="Ex: Informática, Artes..." />
                  </div>
                  <Button onClick={handleCreateCourse} className="w-full bg-blue-600 text-white font-bold h-12">
                    Publicar Curso
                  </Button>
               </div>
            </Card>

            <div className="lg:col-span-3 space-y-8">
              <Card className="border-none shadow-sm rounded-none overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100">
                  <CardTitle className="text-lg">Controle de Matrículas</CardTitle>
                  <CardDescription>Aprovação de alunos e emissão automática de certificados</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                           <th className="px-6 py-4">Aluno / Dados</th>
                           <th className="px-6 py-4">Curso</th>
                           <th className="px-6 py-4">Status</th>
                           <th className="px-6 py-4">Certificado</th>
                           <th className="px-6 py-4">Ações</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {enrollments.map(enr => (
                           <tr key={enr.id} className="hover:bg-slate-50 transition-colors">
                             <td className="px-6 py-4">
                               <p className="font-bold text-slate-900">{enr.userName}</p>
                               <div className="flex gap-2 mt-1">
                                 <Badge variant="outline" className="text-[10px]">{enr.age} anos</Badge>
                                 <Badge variant="outline" className="text-[10px]">{enr.gender}</Badge>
                                 <Badge variant="outline" className="text-[10px]">{enr.race}</Badge>
                               </div>
                               <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]">{enr.userAddress}</p>
                             </td>
                             <td className="px-6 py-4 text-sm font-medium text-slate-700">
                               {enr.courseName}
                             </td>
                             <td className="px-6 py-4">
                               <Badge className={
                                 enr.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                 enr.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                               }>
                                 {enr.status?.toUpperCase()}
                               </Badge>
                             </td>
                             <td className="px-6 py-4">
                               {enr.status === 'completed' ? (
                                  <Button variant="outline" size="sm" className="rounded-none gap-2 text-xs border-green-200 text-green-700 h-8" onClick={() => handleIssueCertificate(enr)}>
                                    <Download className="w-3 h-3" /> Reemitir PDF
                                  </Button>
                               ) : (
                                  <Button 
                                    size="sm" 
                                    className="rounded-none bg-green-600 text-white h-8 text-xs font-bold disabled:opacity-50"
                                    disabled={enr.status === 'pending'}
                                    onClick={() => handleIssueCertificate(enr)}
                                  >
                                    Emitir automático
                                  </Button>
                               )}
                             </td>
                             <td className="px-6 py-4">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-blue-600 font-bold"
                                  onClick={() => handleUpdateStatus('enrollments', enr.id, 'active')}
                                >
                                  Ativar
                                </Button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {courses.map(course => (
                   <Card key={course.id} className="border-none shadow-sm rounded-none p-6 bg-white flex justify-between items-center group">
                      <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{course.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{course.instructor} • {course.workload}h</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <Badge className={
                            course.status === 'open' ? 'bg-green-100 text-green-700' :
                            course.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            course.status === 'finished' ? 'bg-slate-100 text-slate-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {course.status === 'open' ? 'Aberto' : 
                             course.status === 'in_progress' ? 'Ativo' :
                             course.status === 'finished' ? 'Finalizado' : 'Cancelado'}
                          </Badge>
                          <Badge variant="outline">{enrollments.filter(e => e.courseId === course.id).length} inscritos</Badge>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-[10px] text-blue-600 font-bold hover:bg-blue-50"
                            onClick={() => handleUpdateStatus('courses', course.id, 'in_progress')}
                           >
                            Ativar
                           </Button>
                           <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-[10px] text-green-600 font-bold hover:bg-green-50"
                            onClick={() => handleUpdateStatus('courses', course.id, 'finished')}
                           >
                            Finalizar
                           </Button>
                           <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-[10px] text-red-600 font-bold hover:bg-red-50"
                            onClick={() => handleUpdateStatus('courses', course.id, 'cancelled')}
                           >
                            Cancelar
                           </Button>
                           <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-[10px] text-orange-600 font-bold hover:bg-orange-50"
                            onClick={() => handleUpdateStatus('courses', course.id, 'open')}
                           >
                            Abrir
                           </Button>
                        </div>
                      </div>
                   </Card>
                 ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="finance">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="border-none shadow-sm rounded-none overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Movimentação de Caixa</CardTitle>
                      <CardDescription>Registro de despesas e receitas extras</CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger render={<Button className="bg-[#2c5f9e] text-white rounded-xl gap-2" />}>
                          <Plus className="w-4 h-4" /> Registrar Gasto
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Nova Despesa</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div><Label>Descrição</Label><Input value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} /></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div><Label>Valor (R$)</Label><Input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} /></div>
                            <div>
                                <Label>Categoria</Label>
                                <select 
                                    className="w-full p-2 border rounded-md" 
                                    value={expenseCategory} 
                                    onChange={e => setExpenseCategory(e.target.value)}
                                >
                                    <option value="">Selecione</option>
                                    <option value="limpeza">Limpeza</option>
                                    <option value="seguranca">Segurança</option>
                                    <option value="eventos">Eventos</option>
                                    <option value="manutencao">Manutenção</option>
                                </select>
                            </div>
                          </div>
                        </div>
                        <DialogFooter><Button onClick={handleCreateExpense} className="bg-blue-600 text-white">Salvar</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">Descrição</th>
                        <th className="px-6 py-4">Categoria</th>
                        <th className="px-6 py-4">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenses.map(exp => (
                        <tr key={exp.id}>
                          <td className="px-6 py-4 text-xs">{new Date(exp.date?.toDate()).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm font-bold">{exp.description}</td>
                          <td className="px-6 py-4 uppercase text-[10px]"><Badge variant="outline">{exp.category}</Badge></td>
                          <td className="px-6 py-4 text-red-600 font-black">- R$ {exp.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-none overflow-hidden bg-white">
                <CardHeader className="bg-blue-50/50 border-b border-blue-100 flex flex-row items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Sugestões dos Moradores</CardTitle>
                </CardHeader>
                 <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {suggestions.map(sug => (
                        <div key={sug.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="flex justify-between mb-2">
                            <span className="font-bold text-slate-900">{sug.memberName}</span>
                            <Badge className="bg-blue-100 text-blue-700">{sug.status}</Badge>
                          </div>
                          <p className="font-bold text-xs text-slate-600 mb-1">{sug.subject}</p>
                          <p className="text-xs text-slate-500">{sug.message}</p>
                        </div>
                      ))}
                    </div>
                 </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="border-none shadow-2xl rounded-none p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-xl">IA de Alocação</h3>
                </div>
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                    <p className="text-xs font-bold text-blue-300 uppercase mb-2">Resumo de Inadimplência</p>
                    <p className="text-2xl font-black">12.5% <span className="text-xs text-red-400 font-normal ml-2">+2% vs mês anterior</span></p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-300">Sugestão Técnica:</p>
                    <div className="p-4 rounded-2xl bg-blue-500/20 border-l-4 border-blue-400">
                      <p className="text-sm leading-relaxed">
                        Devido ao aumento da inadimplência, sugerimos Priorizar a <strong>Manutenção Imediata</strong> e reduzir a alocação do <strong>Fundo de Reserva</strong> em 5% este mês.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-orange-500/20 border-l-4 border-orange-400">
                        <p className="text-sm leading-relaxed">
                          Note que 05 moradores possuem profissão de 'Eletricista'. Considere contratá-los via Banco de Talentos para reduzir custos externos de manutenção.
                        </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-8">
           <Card className="border-none shadow-sm rounded-none overflow-hidden bg-white">
             <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Mensagens do Fórum</CardTitle>
                  <CardDescription>Últimas discussões e interações dos moradores</CardDescription>
                </div>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {forumPosts.map(post => (
                    <div key={post.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={post.authorPhoto} />
                            <AvatarFallback>{post.authorName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{post.authorName}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                              {post.date ? new Date(post.date.toDate()).toLocaleString() : ''}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{post.category}</Badge>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 mb-2">{post.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-4">{post.content}</p>
                      <div className="flex gap-4">
                         <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                           <MessageSquare className="w-3 h-3" /> {post.commentsCount || 0} COMENTÁRIOS
                         </div>
                         <Button 
                          variant="link" 
                          className="p-0 h-auto text-[10px] text-red-600 font-bold"
                          onClick={() => handleUpdateStatus('forum_posts', post.id, 'blocked')}
                        >
                          Moderar / Bloquear
                        </Button>
                      </div>
                    </div>
                  ))}
                  {forumPosts.length === 0 && (
                    <div className="p-10 text-center text-slate-400">Nenhuma mensagem encontrada.</div>
                  )}
                </div>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
