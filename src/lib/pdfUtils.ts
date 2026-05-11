import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CertificateData {
  studentName: string;
  courseName: string;
  workload: number;
  instructor: string;
  completionDate: Date;
}

export const generateCertificatePDF = (data: CertificateData) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Background/Border
  doc.setDrawColor(44, 95, 158); // Blue
  doc.setLineWidth(5);
  doc.rect(5, 5, 287, 200);
  
  doc.setDrawColor(243, 156, 18); // Orange
  doc.setLineWidth(1);
  doc.rect(8, 8, 281, 194);

  // Logo Placeholder / Text
  doc.setTextColor(44, 95, 158);
  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO', 148.5, 40, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setTextColor(100);
  doc.text('A Associação de Moradores do Residencial Caminho da Alvorada', 148.5, 60, { align: 'center' });
  doc.text('AMORCA', 148.5, 70, { align: 'center' });

  doc.setFontSize(22);
  doc.setTextColor(0);
  doc.text('Certificamos que', 148.5, 95, { align: 'center' });

  doc.setFontSize(32);
  doc.setTextColor(243, 156, 18); // Orange
  doc.text(data.studentName.toUpperCase(), 148.5, 115, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text(`concluiu com êxito o curso de`, 148.5, 130, { align: 'center' });
  
  doc.setFontSize(24);
  doc.setTextColor(44, 95, 158);
  doc.text(data.courseName, 148.5, 145, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text(`com carga horária total de ${data.workload} horas.`, 148.5, 155, { align: 'center' });

  // Signatures
  doc.setDrawColor(200);
  doc.line(60, 180, 120, 180);
  doc.line(177, 180, 237, 180);

  doc.setFontSize(10);
  doc.text(data.instructor, 90, 185, { align: 'center' });
  doc.text('Instrutor(a)', 90, 190, { align: 'center' });

  doc.text('Diretoria AMORCA', 207, 185, { align: 'center' });
  doc.text('Coordenação Pedagógica', 207, 190, { align: 'center' });

  // Date
  const dateStr = format(data.completionDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.text(`Emitido em ${dateStr}`, 148.5, 170, { align: 'center' });

  doc.save(`${data.studentName}_Certificado_${data.courseName}.pdf`);
};
