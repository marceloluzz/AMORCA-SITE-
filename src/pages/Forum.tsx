import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from '../firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  MessageCircle, 
  Clock, 
  User as UserIcon,
  Send,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  date: any;
  category: string;
  commentCount?: number;
}

interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  date: any;
}

export default function Forum() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Geral');
  const [newComment, setNewComment] = useState('');
  const [isNewPostDialogOpen, setIsNewPostDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'forum_posts'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedPost) {
      setComments([]);
      return;
    }

    const q = query(
      collection(db, `forum_posts/${selectedPost.id}/comments`), 
      orderBy('date', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [selectedPost]);

  const handleCreatePost = async () => {
    if (!user || !newPostTitle || !newPostContent) return;

    try {
      await addDoc(collection(db, 'forum_posts'), {
        title: newPostTitle,
        content: newPostContent,
        category: newPostCategory,
        authorId: user.uid,
        authorName: user.displayName || 'Anônimo',
        date: serverTimestamp(),
        commentCount: 0
      });
      setNewPostTitle('');
      setNewPostContent('');
      setIsNewPostDialogOpen(false);
      toast.success('Postagem criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar postagem.');
    }
  };

  const handleCreateComment = async () => {
    if (!user || !selectedPost || !newComment) return;

    try {
      await addDoc(collection(db, `forum_posts/${selectedPost.id}/comments`), {
        postId: selectedPost.id,
        content: newComment,
        authorId: user.uid,
        authorName: user.displayName || 'Anônimo',
        date: serverTimestamp()
      });
      setNewComment('');
      toast.success('Comentário enviado!');
    } catch (error) {
      toast.error('Erro ao enviar comentário.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">Fórum de Discussão</h1>
          <p className="text-xl text-slate-600">Espaço para troca de ideias e sugestões entre moradores.</p>
        </div>
        <Dialog open={isNewPostDialogOpen} onOpenChange={setIsNewPostDialogOpen}>
          <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-8 text-xl font-bold gap-3 shadow-xl shadow-blue-200" />}>
              <Plus className="w-6 h-6" />
              Nova Discussão
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-3xl">
            <DialogHeader>
              <DialogTitle>Iniciar Nova Discussão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title" 
                  placeholder="Sobre o que você quer falar?" 
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <select 
                  id="category"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value)}
                >
                  <option>Geral</option>
                  <option>Segurança</option>
                  <option>Manutenção</option>
                  <option>Eventos</option>
                  <option>Sugestões</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <textarea 
                  id="content" 
                  rows={4}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva sua ideia ou dúvida..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewPostDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreatePost} className="bg-blue-600 text-white rounded-xl">Publicar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Posts List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Buscar discussões..." className="pl-10 rounded-xl bg-white border-slate-200" />
            </div>
            <Button variant="outline" className="rounded-xl border-slate-200 gap-2">
              <Filter className="w-4 h-4" />
              Filtrar
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-2xl"></div>)}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card 
                    className={`border-none shadow-sm rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-all ${selectedPost?.id === post.id ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'bg-white'}`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none">
                          {post.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          <Clock className="w-3 h-3" />
                          {post.date?.toDate?.() ? formatDistanceToNow(post.date.toDate(), { addSuffix: true, locale: ptBR }) : 'Agora'}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">{post.title}</h3>
                      <p className="text-slate-700 text-lg line-clamp-2 mb-6 leading-relaxed">{post.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs font-bold">{post.authorName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold text-slate-600">{post.authorName}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500">
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <MessageCircle className="w-5 h-5 text-blue-500" />
                            {post.commentCount || 0}
                          </div>
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhuma discussão ainda</h3>
              <p className="text-slate-500">Seja o primeiro a iniciar uma conversa!</p>
            </div>
          )}
        </div>

        {/* Post Detail / Comments Column */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedPost ? (
              <motion.div
                key={selectedPost.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="sticky top-24 space-y-6"
              >
                <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
                  <CardHeader className="border-b border-slate-100 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedPost(null)} className="text-slate-400 p-0 h-auto hover:bg-transparent hover:text-slate-600">
                        Fechar
                      </Button>
                      <Badge className="bg-blue-100 text-blue-700 border-none">{selectedPost.category}</Badge>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">{selectedPost.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-4">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{selectedPost.authorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{selectedPost.authorName}</p>
                        <p className="text-[10px] text-slate-400">
                          {selectedPost.date?.toDate?.() ? format(selectedPost.date.toDate(), "dd 'de' MMM, HH:mm", { locale: ptBR }) : 'Agora'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <div className="p-6 overflow-y-auto flex-grow space-y-8 scrollbar-hide">
                    <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedPost.content}
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                        Comentários ({comments.length})
                      </h4>
                      
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback className="text-[10px]">{comment.authorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 flex-grow">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-slate-900">{comment.authorName}</span>
                                <span className="text-[10px] text-slate-400">
                                  {comment.date?.toDate?.() ? formatDistanceToNow(comment.date.toDate(), { addSuffix: true, locale: ptBR }) : 'Agora'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        {comments.length === 0 && (
                          <p className="text-center text-xs text-slate-400 italic py-4">Nenhum comentário ainda.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50">
                    {user ? (
                      <div className="relative">
                        <textarea 
                          className="w-full p-3 pr-12 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Escreva um comentário..."
                          rows={2}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <Button 
                          size="icon" 
                          className="absolute right-2 bottom-2 bg-blue-600 text-white rounded-xl w-8 h-8"
                          onClick={handleCreateComment}
                          disabled={!newComment}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-center text-xs text-slate-500">Faça login para comentar.</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            ) : (
              <div className="hidden lg:block sticky top-24">
                <Card className="border-none shadow-sm rounded-3xl bg-slate-50 border border-slate-100 p-8 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <MessageSquare className="w-8 h-8 text-blue-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-400">Selecione uma discussão</h3>
                  <p className="text-sm text-slate-400 mt-2">Clique em um post para ver os detalhes e participar da conversa.</p>
                </Card>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
