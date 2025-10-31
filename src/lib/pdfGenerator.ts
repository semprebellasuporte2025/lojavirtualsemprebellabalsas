import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import { Venda } from '@/pages/admin/vendas/listar/page';

export const generateEtiqueta = (venda: Venda) => {
  try {
    if (!venda) {
      console.error("Dados da venda não fornecidos.");
      alert("Erro: Dados da venda não encontrados.");
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [100, 150]
    });

    const MARGIN = 8;
    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    const BOX_WIDTH = PAGE_WIDTH - (MARGIN * 2);

    // --- SEÇÃO DESTINATÁRIO ---
    const recipientBoxY = MARGIN;
    let currentY = recipientBoxY + 7;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATÁRIO', MARGIN + 2, currentY);
    currentY += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (venda.endereco_entrega && typeof venda.endereco_entrega === 'object') {
      const { endereco: logradouro, numero, complemento, bairro, cidade, estado, cep } = venda.endereco_entrega;
      doc.text(venda.cliente_nome, MARGIN + 2, currentY);
      currentY += 7;
      doc.text(`${logradouro || ''}, nº ${numero || ''}${complemento ? ' - ' + complemento : ''}`, MARGIN + 2, currentY);
      currentY += 7;
      doc.text(`${bairro || ''} - ${cidade || ''} - ${estado || ''}`, MARGIN + 2, currentY);
      currentY += 7;
      doc.text(`Cep: ${cep || ''}`, MARGIN + 2, currentY);
      currentY += 5;

      if (cep) {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, cep.replace(/-/g, ''), {
          format: 'CODE128',
          width: 2,
          height: 25,
          displayValue: true,
          margin: 0,
          fontSize: 12,
        });
        const barcodeData = canvas.toDataURL('image/jpeg');
        doc.addImage(barcodeData, 'JPEG', MARGIN + 2, currentY, 70, 20);
        currentY += 22; // height of barcode + padding
      }
    } else {
      doc.text("Endereço não fornecido", MARGIN + 2, currentY);
      currentY += 7;
    }
    
    const recipientBoxHeight = currentY - recipientBoxY;
    doc.rect(MARGIN, recipientBoxY, BOX_WIDTH, recipientBoxHeight);


    // --- SEÇÃO REMETENTE ---
    const senderBoxY = currentY + 5; // Add 5mm space
    currentY = senderBoxY + 7;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REMETENTE', MARGIN + 2, currentY);
    currentY += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('JOÃO FRANCISCO MENDES ROCHA AZEVEDO', MARGIN + 2, currentY);
    currentY += 7;
    doc.text('Rua Maria José, nº 470 - apto 19', MARGIN + 2, currentY);
    currentY += 7;
    doc.text('Bela Vista - São Paulo - SP', MARGIN + 2, currentY);
    currentY += 7;
    doc.text('Cep: 01324-010', MARGIN + 2, currentY);
    currentY += 2;

    const senderBoxHeight = currentY - senderBoxY;
    doc.rect(MARGIN, senderBoxY, BOX_WIDTH, senderBoxHeight);

    doc.save(`etiqueta-envio-${venda.numero_pedido}.pdf`);

  } catch (error) {
    console.error("Erro ao gerar etiqueta de envio:", error);
    alert("Ocorreu um erro ao gerar a etiqueta de envio. Verifique o console para mais detalhes.");
  }
};