import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from '../firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  CreditCard, 
  QrCode, 
  History, 
  User as UserIcon, 
  MapPin, 
  Phone, 
  Mail,
  Download,
  CheckCircle2,
  Clock,
  Heart,
  MessageSquare,
  BarChart3,
  Send,
  AlertCircle,
  FileText,
  DollarSign,
  Check,
  GraduationCap,
  PenTool,
  Construction,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Payment {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: any;
  date?: any;
  qrCodeData?: string;
}

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Suggestion form
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionSubject, setSuggestionSubject] = useState('');
  const [suggestionMessage, setSuggestionMessage] = useState('');
  const [generatingBoleto, setGeneratingBoleto] = useState<number | null>(null);

  // Maintenance form
  const [maintenanceTitle, setMaintenanceTitle] = useState('');
  const [maintenanceDesc, setMaintenanceDesc] = useState('');
  const [maintenanceLocation, setMaintenanceLocation] = useState('');
  const [submittingMaintenance, setSubmittingMaintenance] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    const q = query(collection(db, 'payments'), where('memberId', '==', user.uid));
    const unsubscribePayments = onSnapshot(q, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
      setPayments(paymentsData.sort((a, b) => b.dueDate?.seconds - a.dueDate?.seconds));
    }, (error) => console.error("Payments listener failed:", error));

    const qRequests = query(collection(db, 'service_requests'), where('requesterId', '==', user.uid));
    const unsubscribeRequests = onSnapshot(qRequests, (snap) => {
      setServiceRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Service requests listener failed:", error));

    const qEnrollments = query(collection(db, 'enrollments'), where('userId', '==', user.uid));
    const unsubscribeEnrollments = onSnapshot(qEnrollments, (snap) => {
      setEnrollments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Enrollments listener failed:", error));

    const unsubscribeExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
        setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    }, (error) => console.error("Expenses listener failed:", error));

    return () => {
        unsubscribePayments();
        unsubscribeRequests();
        unsubscribeEnrollments();
        unsubscribeExpenses();
    };
  }, [user, authLoading]);

  const handleSendMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !maintenanceTitle || !maintenanceDesc) return;
    setSubmittingMaintenance(true);
    try {
      await addDoc(collection(db, 'service_requests'), {
        title: maintenanceTitle,
        description: maintenanceDesc,
        location: maintenanceLocation,
        requesterId: user.uid,
        requesterName: profile?.fullName || user.displayName,
        status: 'aberto',
        priority: 'media',
        date: serverTimestamp()
      });
      toast.success('Solicitação de manutenção enviada!');
      setMaintenanceTitle('');
      setMaintenanceDesc('');
      setMaintenanceLocation('');
    } catch (error) {
      toast.error('Erro ao enviar solicitação.');
    } finally {
      setSubmittingMaintenance(false);
    }
  };

  const handleSendSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !suggestionMessage) return;
    setSuggesting(true);
    try {
      await addDoc(collection(db, 'suggestions'), {
        memberId: user.uid,
        memberName: profile?.fullName || user.displayName,
        subject: suggestionSubject,
        message: suggestionMessage,
        date: serverTimestamp(),
        status: 'new'
      });
      toast.success('Sugestão enviada com sucesso! Obrigado por participar.');
      setSuggestionSubject('');
      setSuggestionMessage('');
    } catch (error) {
      toast.error('Erro ao enviar sugestão.');
    } finally {
      setSuggesting(false);
    }
  };

  const handleUpdateTalent = async (talent: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        talentBank: talent,
        updatedAt: serverTimestamp()
      });
      toast.success('Banco de talentos atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar talento.');
    }
  };

  const handleSimulatePayment = async (paymentId: string) => {
    try {
      await updateDoc(doc(db, 'payments', paymentId), {
        status: 'paid',
        date: serverTimestamp()
      });
      toast.success('Pagamento simulado com sucesso!');
    } catch (error) {
      toast.error('Erro ao processar pagamento.');
    }
  };

  const handleGenerateBoleto = async (monthId: number) => {
    try {
      setGeneratingBoleto(monthId);
      const response = await fetch('/api/payments/generate-boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          month: monthId,
          year: 2026,
          amount: 150
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        window.open(result.data.bankSlipUrl, '_blank');
      } else {
        toast.error('Erro ao gerar boleto.');
      }
    } catch (error) {
      toast.error('Sistema de boletos em manutenção.');
    } finally {
      setGeneratingBoleto(null);
    }
  };

  const months2026 = [
    { id: 0, name: 'Janeiro' },
    { id: 1, name: 'Fevereiro' },
    { id: 2, name: 'Março' },
    { id: 3, name: 'Abril' },
    { id: 4, name: 'Maio' },
    { id: 5, name: 'Junho' },
    { id: 6, name: 'Julho' },
    { id: 7, name: 'Agosto' },
    { id: 8, name: 'Setembro' },
    { id: 9, name: 'Outubro' },
    { id: 10, name: 'Novembro' },
    { id: 11, name: 'Dezembro' },
  ];

  const getMonthPayment = (monthId: number) => {
    return payments.find(p => {
      if (!p.dueDate) return false;
      const date = p.dueDate.toDate();
      return date.getMonth() === monthId && date.getFullYear() === 2026;
    });
  };

  const pendingPayments = payments.filter(p => p.status !== 'paid');
  const paidPayments = payments.filter(p => p.status === 'paid');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dynamic Header */}
      <div className="bg-white border-b border-slate-200 py-8 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-600 text-[10px] font-black uppercase tracking-widest mb-3">
                <BarChart3 className="w-3 h-3" /> Dashboard do Associado
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Olá, <span className="text-blue-600">{user?.displayName?.split(' ')[0]}</span>.
              </h1>
              <p className="text-slate-500 mt-2 text-lg">Seja bem-vindo ao seu portal de serviços AMORCA.</p>
            </div>
            
            <div className="flex gap-3">
              <Dialog>
                <DialogTrigger render={
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-none h-12 px-6 font-black gap-2 shadow-lg shadow-orange-900/10 transition-transform hover:-translate-y-1">
                        <DollarSign className="w-5 h-5" /> PAGAR MENSALIDADE
                    </Button>
                } />
                <DialogContent className="max-w-md rounded-none">
                    <DialogHeader><DialogTitle className="text-2xl font-black uppercase">Quick Pay - PIX</DialogTitle></DialogHeader>
                    <div className="flex flex-col items-center py-6 gap-6">
                        <div className="bg-slate-50 p-4 rounded-none border-2 border-dashed border-slate-200">
                             <QRCodeSVG value="pix_amorca_res_alvorada" size={200} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-500 mb-1 font-mono uppercase tracking-widest text-[10px]">Chave CNPJ</p>
                            <p className="text-xl font-black text-blue-600 select-all">12.345.678/0001-90</p>
                            <p className="text-xs text-slate-400 mt-4 max-w-[250px]">AMORCA - Associação de Moradores do Residencial Caminho do Alvorada</p>
                        </div>
                    </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Dashboard Section */}
          <div className="flex-grow space-y-10">
            <Tabs defaultValue="payments" className="w-full">
              <div className="sticky top-20 z-40 bg-slate-50/80 backdrop-blur pb-4 pt-2">
                <TabsList className="bg-white border border-slate-200 p-1 rounded-none h-auto w-full flex justify-start overflow-x-auto no-scrollbar">
                  {[
                    { value: 'payments', label: 'Financeiro', icon: DollarSign },
                    { value: 'history', label: 'Histórico', icon: History },
                    { value: 'courses', label: 'Cursos', icon: GraduationCap },
                    { value: 'maintenance', label: 'Manutenção', icon: Construction },
                    { value: 'transparency', label: 'Transparência', icon: BarChart3 },
                    { value: 'suggestions', label: 'Sugestões', icon: MessageSquare },
                  ].map(tab => (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value} 
                      className="rounded-none px-6 py-4 text-xs font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all flex items-center gap-2 border-r border-slate-100 last:border-0"
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="mt-8">
                <TabsContent value="payments" className="space-y-6">
                  {/* Financial Stats Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-white border-none shadow-sm rounded-none p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quitados</p>
                            <p className="text-2xl font-black text-slate-900">{paidPayments.length}</p>
                        </div>
                    </Card>
                    <Card className="bg-white border-none shadow-sm rounded-none p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendentes</p>
                            <p className="text-2xl font-black text-slate-900">{pendingPayments.filter(p => p.status === 'pending').length}</p>
                        </div>
                    </Card>
                    <Card className="bg-white border-none shadow-sm rounded-none p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded flex items-center justify-center">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atrasados</p>
                            <p className="text-2xl font-black text-slate-900">{pendingPayments.filter(p => p.status === 'overdue').length}</p>
                        </div>
                    </Card>
                  </div>

                  <Card className="border-none shadow-sm rounded-none bg-white p-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <CreditCard className="w-32 h-32 text-slate-900" />
                    </div>
                    <div className="relative z-10 mb-10">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Compromissos Financeiros 2026</h3>
                        <p className="text-slate-500 font-medium">Acompanhe e regularize suas mensalidades da associação.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {months2026.map((m) => {
                        const payment = getMonthPayment(m.id);
                        const isPaid = payment?.status === 'paid';
                        const isOverdue = payment?.status === 'overdue' || (!payment && m.id < new Date().getMonth());
                        const isFuture = m.id > new Date().getMonth();

                        return (
                          <motion.div 
                            key={m.id}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: m.id * 0.05 }}
                          >
                            <Card className={`border border-slate-100 shadow-sm rounded-none group hover:shadow-md transition-all h-full ${isPaid ? 'bg-slate-50 border-green-100' : 'bg-white'}`}>
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                  <div className="p-2 bg-slate-100 rounded group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Calendar className="w-4 h-4" />
                                  </div>
                                  <div className={`w-3 h-3 rounded-full ${isPaid ? 'bg-green-500' : isOverdue ? 'bg-red-500 animate-pulse' : isFuture ? 'bg-slate-200' : 'bg-orange-400'}`}></div>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{m.name}</h4>
                                <p className="text-[10px] font-black text-slate-400 mb-6 font-mono uppercase">Vencto: 10/{String(m.id + 1).padStart(2, '0')}/2026</p>
                                
                                <div className="space-y-4">
                                  <p className="text-xl font-black text-slate-900">R$ 150,00</p>
                                  {isPaid ? (
                                    <Badge className="bg-green-100 text-green-700 border-none w-full justify-center py-2 font-black text-[10px] rounded-none">QUITADO</Badge>
                                  ) : isFuture ? (
                                    <Badge className="bg-slate-100 text-slate-400 border-none w-full justify-center py-2 font-black text-[10px] rounded-none">AGENDADO</Badge>
                                  ) : (
                                    <Dialog>
                                      <DialogTrigger render={
                                        <Button className={`w-full font-black text-[10px] h-10 rounded-none shadow-lg shadow-blue-900/10 ${isOverdue ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                          <QrCode className="w-3 h-3 mr-2" /> {isOverdue ? 'PAGAR AGORA' : 'PAGAR PIX'}
                                        </Button>
                                      } />
                                      <DialogContent className="rounded-none max-w-md">
                                        <DialogHeader>
                                          <DialogTitle className="text-xl font-black uppercase">Pagamento - {m.name}</DialogTitle>
                                        </DialogHeader>
                                        <div className="flex flex-col items-center py-8 gap-6">
                                          <div className="bg-slate-50 p-6 rounded-none border-4 border-double border-slate-200">
                                            <QRCodeSVG value={`pix_pay_amorca_month_${m.id}`} size={180} />
                                          </div>
                                          <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-500 mb-1 font-mono uppercase tracking-widest">Chave CNPJ AMORCA</p>
                                            <p className="text-xl font-black text-blue-600 select-all tracking-wider">12.345.678/0001-90</p>
                                          </div>
                                          <div className="grid grid-cols-2 gap-3 w-full">
                                            <Button variant="outline" className="rounded-none font-black text-[10px] h-12 uppercase tracking-widest" onClick={() => handleGenerateBoleto(m.id)}>
                                               {generatingBoleto === m.id ? 'Gerando...' : 'GERAR BOLETO'}
                                            </Button>
                                            <Button 
                                              className="bg-green-600 hover:bg-green-700 text-white rounded-none font-black text-[10px] h-12 uppercase tracking-widest"
                                              onClick={() => {
                                                if (payment) handleSimulatePayment(payment.id);
                                                else toast.info("Registro de pagamento não encontrado.");
                                              }}
                                            >
                                              CONFIRMAR
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
              <Card className="border-none shadow-sm rounded-none overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100">
                  <CardTitle className="text-lg">Histórico de Pagamentos</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Descrição</th>
                          <th className="px-6 py-4">Data</th>
                          <th className="px-6 py-4">Valor</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Recibo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paidPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">Mensalidade</p>
                              <p className="text-xs text-slate-500">Ref: {new Date(payment.dueDate.toDate()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {payment.date?.toDate?.() ? new Date(payment.date.toDate()).toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">
                              R$ {payment.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <Badge className="bg-green-100 text-green-700 border-none">Pago</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Button variant="ghost" size="icon" className="text-blue-600">
                                <Download className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {paidPayments.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                              Nenhum pagamento registrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="space-y-6">
              <Card className="border-none shadow-sm rounded-none overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-xl font-black">Minhas Matrículas</CardTitle>
                  <CardDescription>Acompanhe seu progresso e certificados nos cursos da AMORCA.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                           <th className="px-6 py-4">Curso / Professor</th>
                           <th className="px-6 py-4">Status</th>
                           <th className="px-6 py-4">Certificados</th>
                           <th className="px-6 py-4">Ações</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {enrollments.map(enr => (
                           <tr key={enr.id} className="hover:bg-slate-50 transition-colors">
                             <td className="px-6 py-4">
                               <p className="font-bold text-slate-900">{enr.courseName}</p>
                               <p className="text-xs text-slate-500">Prof: {enr.instructor} • {enr.workload}h</p>
                             </td>
                             <td className="px-6 py-4">
                               <Badge className={`
                                 ${enr.status === 'active' ? 'bg-blue-100 text-blue-700' : 
                                   enr.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                   enr.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}
                               `}>
                                 {enr.status === 'active' ? 'CURSANDO' : 
                                  enr.status === 'completed' ? 'CONCLUÍDO' : 
                                  enr.status === 'pending' ? 'AGUARDANDO' : 'INATIVO'}
                               </Badge>
                             </td>
                             <td className="px-6 py-4">
                               <div className="flex flex-col gap-2">
                                 {enr.certificates?.map((cert: any, i: number) => (
                                   <Button key={i} variant="outline" size="sm" className="rounded-none gap-2 text-xs h-8" onClick={() => window.open(cert.url, '_blank')}>
                                     <Download className="w-3 h-3" /> Certificado {cert.type || ''}
                                   </Button>
                                 )) || <span className="text-xs text-slate-400 italic">Nenhum emitido</span>}
                               </div>
                             </td>
                             <td className="px-6 py-4">
                               <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50">
                                 Ver Material
                               </Button>
                             </td>
                           </tr>
                         ))}
                         {enrollments.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center">
                                <GraduationCap className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-500 italic">Você ainda não se inscreveu em nenhum curso.</p>
                                <Button className="mt-4 bg-orange-500 text-white" onClick={() => window.location.href='/courses'}>Ver cursos agora</Button>
                              </td>
                            </tr>
                         )}
                       </tbody>
                     </table>
                   </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 border-none shadow-sm rounded-none p-6 bg-white">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Construction className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-xl">Novo Chamado</h3>
                  </div>
                  <form onSubmit={handleSendMaintenance} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Título / Problema</Label>
                      <Input 
                        placeholder="Ex: Lâmpada queimada" 
                        value={maintenanceTitle}
                        onChange={e => setMaintenanceTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                       <Label>Local</Label>
                       <Input 
                        placeholder="Ex: Em frente ao lote 10" 
                        value={maintenanceLocation}
                        onChange={e => setMaintenanceLocation(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <textarea 
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm min-h-[100px]"
                        placeholder="Detalhes do problema..."
                        value={maintenanceDesc}
                        onChange={e => setMaintenanceDesc(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      disabled={submittingMaintenance}
                      className="w-full bg-blue-600 text-white rounded-xl h-12 font-bold"
                    >
                      {submittingMaintenance ? 'Enviando...' : 'Abrir Chamado'}
                    </Button>
                  </form>
                </Card>

                <Card className="lg:col-span-2 border-none shadow-sm rounded-none overflow-hidden bg-white">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-lg">Meus Chamados</CardTitle>
                    <CardDescription>Acompanhe o status das suas solicitações</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {serviceRequests.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {serviceRequests.map(req => (
                          <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-lg ${
                                req.status === 'aberto' ? 'bg-blue-50 text-blue-600' :
                                req.status === 'em_execucao' ? 'bg-orange-50 text-orange-600' :
                                req.status === 'concluido' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'
                              }`}>
                                <PenTool className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{req.title}</p>
                                <p className="text-xs text-slate-500">{req.location} • {new Date(req.date?.toDate()).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Badge className={`
                              ${req.status === 'aberto' ? 'bg-blue-100 text-blue-700' :
                                req.status === 'em_execucao' ? 'bg-orange-100 text-orange-700' :
                                req.status === 'concluido' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}
                            `}>
                              {req.status === 'aberto' ? 'ABERTO' : 
                                req.status === 'em_execucao' ? 'EM EXECUÇÃO' : 
                                req.status === 'concluido' ? 'CONCLUÍDO' : 'CANCELADO'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 text-center text-slate-400 italic">
                        Nenhum chamado aberto ainda.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transparency" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-none shadow-sm rounded-none p-6 bg-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-none">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="font-black text-xl">Gastos do Mês</h3>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={[
                                            { name: 'Limpeza', value: 400 },
                                            { name: 'Segurança', value: 300 },
                                            { name: 'Eventos', value: 300 },
                                            { name: 'Manutenção', value: 200 },
                                        ]}
                                        innerRadius={40}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#2c5f9e" /><Cell fill="#f39c12" /><Cell fill="#10b981" /><Cell fill="#ef4444" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-center text-slate-500 mt-4">Visualização simplificada da prestação de contas mensal.</p>
                    </Card>

                    <div className="space-y-6">
                        <h3 className="text-2xl font-black text-slate-800">Canais de Transparência</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <Card className="border-none shadow-sm rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Estatuto AMORCA</h3>
                                        <p className="text-sm text-slate-500">Acesse as diretrizes da nossa associação.</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="border-none shadow-sm rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <History className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Última Ata de Reunião</h3>
                                        <p className="text-sm text-slate-500">Transparência em todas as decisões.</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="suggestions">
              <Card className="border-none shadow-sm rounded-none p-10 bg-white">
                <div className="max-w-xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="inline-flex p-4 bg-orange-50 text-orange-500 rounded-none mb-6">
                            <MessageSquare className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Canal Direto com a Diretoria</h2>
                        <p className="text-slate-500">Sua voz é fundamental para construirmos uma comunidade melhor.</p>
                    </div>

                    <form onSubmit={handleSendSuggestion} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-lg font-bold text-slate-700">Assunto</Label>
                            <Input 
                                placeholder="Ex: Manutenção da Praça, Segurança..."
                                required
                                value={suggestionSubject}
                                onChange={(e) => setSuggestionSubject(e.target.value)}
                                className="h-14 rounded-none border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-lg font-bold text-slate-700">Sua Mensagem / Sugestão</Label>
                            <textarea 
                                placeholder="Conte para nós em detalhes..."
                                required
                                value={suggestionMessage}
                                onChange={(e) => setSuggestionMessage(e.target.value)}
                                className="w-full p-4 rounded-none border border-slate-200 min-h-[150px] outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <Button 
                            type="submit" 
                            disabled={suggesting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-none text-xl font-black gap-3"
                        >
                            <Send className="w-5 h-5" />
                            {suggesting ? 'Enviando...' : 'Enviar Sugestão'}
                        </Button>
                    </form>
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  </div>
</div>
  );
}
