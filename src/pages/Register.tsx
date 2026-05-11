import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, doc, setDoc, auth, serverTimestamp, collection, addDoc } from '../firebase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import { UserPlus, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    conjunto: '',
    quadra: '',
    numero: '',
    bairro: '',
    city: 'Parnaíba - PI',
    email: '',
    propertyStatus: '',
    gender: '',
    age: '',
    race: '',
    minIncome: '',
    residentsCount: '',
    childrenCount: '0',
    youthCount: '0',
    adultsCount: '0',
    elderlyCount: '0',
    profession: '',
    specialNeeds: '',
    talentBank: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      const memberEmail = user ? user.email : formData.email;
      
      if (!memberEmail) {
        toast.error('Por favor, informe seu e-mail para continuar.');
        setLoading(false);
        return;
      }

      const userData = {
        ...formData,
        email: memberEmail,
        displayName: user?.displayName || formData.fullName,
        photoURL: user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memberEmail}`,
        role: 'member',
        status: 'pending_approval',
        familyComposition: {
          children: parseInt(formData.childrenCount) || 0,
          youth: parseInt(formData.youthCount) || 0,
          adults: parseInt(formData.adultsCount) || 0,
          elderly: parseInt(formData.elderlyCount) || 0
        },
        registrationDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (user) {
        // User is logged in, use their UID
        await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
      } else {
        // Guest user, create with auto ID
        await addDoc(collection(db, 'users'), userData);
      }

      toast.success('Cadastro enviado com sucesso! Aguarde a aprovação da diretoria.');
      navigate(user ? '/dashboard' : '/');
    } catch (error) {
      console.error('Error registering:', error);
      toast.error('Erro ao enviar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 md:py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-8 text-lg font-bold text-slate-600 hover:text-blue-600 gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#2c5f9e] to-[#1a3a5f] p-10 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-4xl font-black">Ficha de Inscrição</CardTitle>
              </div>
              <CardDescription className="text-blue-100 text-xl font-medium">
                Censo Comunitário AMORCA - Gestão Transparente e Humana.
              </CardDescription>
            </div>

            <CardContent className="p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Nome Completo */}
                  <div className="space-y-3">
                    <Label htmlFor="fullName" className="text-xl font-bold text-slate-700">Nome Completo</Label>
                    <Input 
                      id="fullName"
                      name="fullName"
                      placeholder="Seu nome completo"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="h-14 text-lg rounded-xl border-slate-200 focus:ring-blue-500"
                    />
                  </div>

                  {/* E-mail */}
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-xl font-bold text-slate-700">E-mail</Label>
                    <Input 
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={auth.currentUser?.email || formData.email}
                      onChange={handleChange}
                      disabled={!!auth.currentUser}
                      className="h-14 text-lg rounded-xl border-slate-200 focus:ring-blue-500"
                    />
                  </div>

                  {/* CPF */}
                  <div className="space-y-3">
                    <Label htmlFor="cpf" className="text-xl font-bold text-slate-700">CPF</Label>
                    <Input 
                      id="cpf"
                      name="cpf"
                      placeholder="000.000.000-00"
                      required
                      value={formData.cpf}
                      onChange={handleChange}
                      className="h-14 text-lg rounded-xl border-slate-200 focus:ring-blue-500"
                    />
                  </div>

                  {/* Profissão */}
                  <div className="space-y-3">
                    <Label htmlFor="profession" className="text-xl font-bold text-slate-700">Profissão</Label>
                    <Input 
                      id="profession"
                      name="profession"
                      placeholder="Sua área de atuação"
                      value={formData.profession}
                      onChange={handleChange}
                      className="h-14 text-lg rounded-xl border-slate-200 focus:ring-blue-500"
                    />
                  </div>

                  {/* Idade */}
                  <div className="space-y-3">
                    <Label htmlFor="age" className="text-xl font-bold text-slate-700">Idade</Label>
                    <Input 
                      id="age"
                      name="age"
                      type="number"
                      placeholder="Sua idade"
                      required
                      value={formData.age}
                      onChange={handleChange}
                      className="h-14 text-lg rounded-xl border-slate-200 focus:ring-blue-500"
                    />
                  </div>

                  {/* Endereço Detalhado */}
                  <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="conjunto" className="text-xl font-bold text-slate-700">Conjunto</Label>
                      <Input 
                        id="conjunto"
                        name="conjunto"
                        placeholder="Ex: Alvorada"
                        required
                        value={formData.conjunto}
                        onChange={handleChange}
                        className="h-14 text-lg rounded-xl border-slate-200 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="quadra" className="text-xl font-bold text-slate-700">Quadra</Label>
                      <Input 
                        id="quadra"
                        name="quadra"
                        placeholder="Ex: Q-10"
                        required
                        value={formData.quadra}
                        onChange={handleChange}
                        className="h-14 text-lg rounded-xl border-slate-200 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="numero" className="text-xl font-bold text-slate-700">Número</Label>
                      <Input 
                        id="numero"
                        name="numero"
                        placeholder="Ex: 123"
                        required
                        value={formData.numero}
                        onChange={handleChange}
                        className="h-14 text-lg rounded-xl border-slate-200 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="bairro" className="text-xl font-bold text-slate-700">Bairro</Label>
                      <Input 
                        id="bairro"
                        name="bairro"
                        placeholder="Ex: Planalto"
                        required
                        value={formData.bairro}
                        onChange={handleChange}
                        className="h-14 text-lg rounded-xl border-slate-200 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Necessidades Especiais */}
                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="specialNeeds" className="text-xl font-bold text-slate-700">Necessidades Especiais ou Pessoas com Deficiência na Família?</Label>
                    <Input 
                      id="specialNeeds"
                      name="specialNeeds"
                      placeholder="Descreva se houver"
                      value={formData.specialNeeds}
                      onChange={handleChange}
                      className="h-14 text-lg rounded-xl border-slate-200 focus:ring-blue-500"
                    />
                  </div>

                  {/* Banco de Talentos */}
                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="talentBank" className="text-xl font-bold text-slate-700 underline decoration-blue-500">Banco de Talentos: Como você pode ajudar a associação?</Label>
                    <textarea 
                      id="talentBank"
                      name="talentBank"
                      placeholder="Ex: Sou eletricista, posso ajudar na organização de eventos, sou advogado(a)..."
                      value={formData.talentBank}
                      onChange={handleChange}
                      className="w-full p-4 text-lg rounded-xl border border-slate-200 min-h-[100px] focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Cidade (Fixa) */}
                  <div className="space-y-3">
                    <Label className="text-xl font-bold text-slate-700">Cidade / UF</Label>
                    <Input 
                      disabled
                      value="Parnaíba - PI"
                      className="h-14 text-lg rounded-xl border-slate-200 bg-slate-50 font-medium"
                    />
                  </div>

                  {/* Situação do Imóvel */}
                  <div className="space-y-3">
                    <Label htmlFor="propertyStatus" className="text-xl font-bold text-slate-700">Situação do Imóvel</Label>
                    <Select onValueChange={(v) => handleSelectChange('propertyStatus', v)} value={formData.propertyStatus} required>
                      <SelectTrigger className="h-14 text-lg rounded-xl border-slate-200">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proprio">Próprio</SelectItem>
                        <SelectItem value="alugado">Alugado</SelectItem>
                        <SelectItem value="cedido">Cedido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Gênero */}
                  <div className="space-y-3">
                    <Label htmlFor="gender" className="text-xl font-bold text-slate-700">Gênero</Label>
                    <Select onValueChange={(v) => handleSelectChange('gender', v)} value={formData.gender} required>
                      <SelectTrigger className="h-14 text-lg rounded-xl border-slate-200">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro / Prefiro não dizer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Raça/Cor */}
                  <div className="space-y-3">
                    <Label htmlFor="race" className="text-xl font-bold text-slate-700">Raça / Cor</Label>
                    <Select onValueChange={(v) => handleSelectChange('race', v)} value={formData.race} required>
                      <SelectTrigger className="h-14 text-lg rounded-xl border-slate-200">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="branca">Branca</SelectItem>
                        <SelectItem value="preta">Preta</SelectItem>
                        <SelectItem value="parda">Parda</SelectItem>
                        <SelectItem value="amarela">Amarela</SelectItem>
                        <SelectItem value="indigena">Indígena</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Renda Mínima */}
                  <div className="space-y-3">
                    <Label htmlFor="minIncome" className="text-xl font-bold text-slate-700">Renda Mensal Aproximada</Label>
                    <Select onValueChange={(v) => handleSelectChange('minIncome', v)} value={formData.minIncome} required>
                      <SelectTrigger className="h-14 text-lg rounded-xl border-slate-200">
                        <SelectValue placeholder="Selecione a faixa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ate_1">Até 1 salário mínimo</SelectItem>
                        <SelectItem value="1_a_3">1 a 3 salários mínimos</SelectItem>
                        <SelectItem value="3_a_5">3 a 5 salários mínimos</SelectItem>
                        <SelectItem value="mais_5">Mais de 5 salários mínimos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Composição Familiar */}
                  <div className="md:col-span-2 border-t border-slate-100 pt-8 mt-4">
                    <h3 className="text-2xl font-black text-slate-800 mb-6">Composição Familiar</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="childrenCount" className="text-lg font-bold text-slate-600">Crianças</Label>
                        <Input 
                          id="childrenCount"
                          name="childrenCount"
                          type="number"
                          min="0"
                          value={formData.childrenCount}
                          onChange={handleChange}
                          className="h-14 text-lg rounded-xl border-slate-200"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="youthCount" className="text-lg font-bold text-slate-600">Jovens</Label>
                        <Input 
                          id="youthCount"
                          name="youthCount"
                          type="number"
                          min="0"
                          value={formData.youthCount}
                          onChange={handleChange}
                          className="h-14 text-lg rounded-xl border-slate-200"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="adultsCount" className="text-lg font-bold text-slate-600">Adultos</Label>
                        <Input 
                          id="adultsCount"
                          name="adultsCount"
                          type="number"
                          min="0"
                          value={formData.adultsCount}
                          onChange={handleChange}
                          className="h-14 text-lg rounded-xl border-slate-200"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="elderlyCount" className="text-lg font-bold text-slate-600">Idosos</Label>
                        <Input 
                          id="elderlyCount"
                          name="elderlyCount"
                          type="number"
                          min="0"
                          value={formData.elderlyCount}
                          onChange={handleChange}
                          className="h-14 text-lg rounded-xl border-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-8 flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-blue-600 mt-1" />
                    <p className="text-blue-800 text-lg font-medium">
                      Seus dados serão tratados com total confidencialidade e utilizados apenas para fins de gestão da associação.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white h-20 text-2xl font-black rounded-2xl shadow-xl shadow-orange-200 transition-all active:scale-95"
                  >
                    {loading ? 'Enviando...' : 'Finalizar Inscrição'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
