'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { LuRefreshCw, LuCheck, LuX, LuClock } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { LoadingOverlay } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';

// Tipos para el feedback
interface Feedback {
  id: string;
  type: 'bug' | 'feature' | 'other';
  subject: string;
  message: string;
  userId: string;
  userEmail: string;
  createdAt: {
    toDate: () => Date;
  };
  status: 'pending' | 'reviewed' | 'resolved';
}

// Lista de admins (protegida mediante variables de entorno)
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAIL 
  ? [process.env.NEXT_PUBLIC_ADMIN_EMAIL] 
  : ['ordenadorsolo@gmail.com']; // Valor por defecto en caso de que no exista la variable

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('app');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Verificar si el usuario es administrador
    if (!ADMIN_EMAILS.includes(user.email as string)) {
      toast({
        title: t('admin.accessDenied'),
        description: t('admin.noPermission'),
        variant: 'destructive',
      });
      router.push('/dashboard');
      return;
    }

    fetchFeedbacks();
  }, [user, router, toast, t]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const feedbackData: Feedback[] = [];
      querySnapshot.forEach((doc) => {
        feedbackData.push({ id: doc.id, ...doc.data() } as Feedback);
      });
      
      setFeedbacks(feedbackData);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast({
        title: t('common.error'),
        description: t('admin.errorLoading'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, newStatus: 'pending' | 'reviewed' | 'resolved') => {
    try {
      const feedbackRef = doc(db, 'feedback', feedbackId);
      await updateDoc(feedbackRef, {
        status: newStatus
      });
      
      // Actualizar el estado local
      setFeedbacks(prevFeedbacks => 
        prevFeedbacks.map(feedback => 
          feedback.id === feedbackId ? {...feedback, status: newStatus} : feedback
        )
      );
      
      toast({
        title: t('admin.statusUpdated'),
        description: t('admin.statusUpdatedDesc', { status: t(`admin.${newStatus}`) }),
      });
    } catch (error) {
      console.error('Error updating feedback status:', error);
      toast({
        title: t('common.error'),
        description: t('admin.errorUpdating'),
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">{t('admin.pending')}</Badge>;
      case 'reviewed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">{t('admin.reviewed')}</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">{t('admin.resolved')}</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bug':
        return <Badge className="bg-red-100 text-red-800 border-red-300">{t('feedback.bugReport')}</Badge>;
      case 'feature':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">{t('feedback.featureRequest')}</Badge>;
      case 'other':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">{t('feedback.other')}</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const filteredFeedbacks = statusFilter === 'all' 
    ? feedbacks 
    : feedbacks.filter(feedback => feedback.status === statusFilter);

  if (loading) {
    return <LoadingOverlay text={t('common.loading')} />;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('admin.feedbackDashboard')}
          </h1>
          <div className="flex space-x-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] text-foreground">
                <SelectValue placeholder={t('admin.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-foreground" value="all">{t('admin.all')}</SelectItem>
                <SelectItem className="text-foreground" value="pending">{t('admin.pending')}</SelectItem>
                <SelectItem className="text-foreground" value="reviewed">{t('admin.reviewed')}</SelectItem>
                <SelectItem className="text-foreground" value="resolved">{t('admin.resolved')}</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={fetchFeedbacks}
              className="flex items-center space-x-1 text-foreground"
            >
              <LuRefreshCw className="h-4 w-4 mr-1" />
              <span className="text-foreground">{t('admin.refresh')}</span>
            </Button>
          </div>
        </div>

        {filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-500 dark:text-gray-400">
              {t('admin.noEntries')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map((feedback) => (
              <Card key={feedback.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-800 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium text-foreground">{feedback.subject}</CardTitle>
                    <div className="flex space-x-2">
                      {getTypeLabel(feedback.type)}
                      {getStatusBadge(feedback.status)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {t('admin.from')}: {feedback.userEmail} • {new Date(feedback.createdAt.toDate()).toLocaleString()}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 text-foreground">
                  <div className="whitespace-pre-line">{feedback.message}</div>
                </CardContent>
                <CardFooter className="bg-gray-50 dark:bg-gray-800 flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateFeedbackStatus(feedback.id, 'pending')}
                    disabled={feedback.status === 'pending'}
                    className="flex items-center"
                  >
                    <LuClock className="mr-1 h-4 w-4" />
                    {t('admin.pending')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateFeedbackStatus(feedback.id, 'reviewed')}
                    disabled={feedback.status === 'reviewed'}
                    className="flex items-center"
                  >
                    <LuCheck className="mr-1 h-4 w-4" />
                    {t('admin.reviewed')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateFeedbackStatus(feedback.id, 'resolved')}
                    disabled={feedback.status === 'resolved'}
                    className="flex items-center"
                  >
                    <LuX className="mr-1 h-4 w-4" />
                    {t('admin.resolved')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400 pb-4">
          <p>Created by <a href="https://x.com/draakiiii" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">@draakiiii</a></p>
        </footer>
      </div>
    </div>
  );
} 