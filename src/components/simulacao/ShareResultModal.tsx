import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Share2, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface ShareResultModalProps {
  open: boolean;
  onClose: () => void;
  partida: any;
  caso: any;
}

export const ShareResultModal = ({ open, onClose, partida, caso }: ShareResultModalProps) => {
  const [nome, setNome] = useState("");
  const [gerando, setGerando] = useState(false);

  const gerarImagemResultado = async () => {
    if (!nome.trim()) {
      toast.error("Por favor, digite seu nome");
      return;
    }

    setGerando(true);
    
    try {
      // Criar elemento temporário para captura
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.width = '600px';
      container.style.background = 'linear-gradient(135deg, #1f2937 0%, #111827 100%)';
      container.style.padding = '40px';
      container.style.borderRadius = '20px';
      container.style.fontFamily = 'Arial, sans-serif';
      
      const resultado = partida.deferido ? 'GANHOU' : 'PERDEU';
      const corResultado = partida.deferido ? '#10b981' : '#ef4444';
      const deferimentoParcial = partida.pontuacao_final >= 50 && partida.pontuacao_final < 70;
      
      container.innerHTML = `
        <div style="text-align: center;">
          <div style="margin-bottom: 30px;">
            <div style="display: inline-block; width: 80px; height: 80px; background: rgba(245, 158, 11, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
              <span style="font-size: 40px;">⚖️</span>
            </div>
          </div>
          
          <h1 style="color: #f59e0b; font-size: 28px; font-weight: bold; margin-bottom: 20px;">
            SIMULAÇÃO JURÍDICA
          </h1>
          
          <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 15px; margin-bottom: 30px;">
            <p style="color: #d1d5db; font-size: 20px; margin-bottom: 15px;">
              <strong style="color: #f59e0b;">Dr(a). ${nome}</strong>
            </p>
            <p style="color: #d1d5db; font-size: 18px; margin-bottom: 20px;">
              defendeu seu cliente e
            </p>
            <p style="color: ${corResultado}; font-size: 32px; font-weight: bold; margin-bottom: 10px;">
              ${deferimentoParcial ? 'OBTEVE DEFERIMENTO PARCIAL' : resultado + ' A CAUSA'}
            </p>
            <p style="color: #9ca3af; font-size: 16px; margin-top: 15px;">
              ${caso.titulo_caso}
            </p>
          </div>
          
          <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
            <div style="text-align: center;">
              <p style="color: #f59e0b; font-size: 32px; font-weight: bold;">${partida.pontuacao_final}</p>
              <p style="color: #9ca3af; font-size: 14px;">Pontos</p>
            </div>
            <div style="text-align: center;">
              <p style="color: #f59e0b; font-size: 32px; font-weight: bold;">${partida.combo_maximo || 0}</p>
              <p style="color: #9ca3af; font-size: 14px;">Combo Máximo</p>
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            App Direito Premium - Simulador Jurídico
          </p>
        </div>
      `;
      
      document.body.appendChild(container);
      
      // Capturar como imagem
      const canvas = await html2canvas(container, {
        backgroundColor: null,
        scale: 2,
      });
      
      document.body.removeChild(container);
      
      // Converter para blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Criar link para download
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `resultado-simulacao-${nome.replace(/\s+/g, '-')}.png`;
          link.click();
          URL.revokeObjectURL(url);
          
          toast.success("Imagem gerada com sucesso!");
          
          // Criar mensagem formatada para WhatsApp
          const textoWhatsApp = `⚖️ *SIMULAÇÃO JURÍDICA CONCLUÍDA* ⚖️

━━━━━━━━━━━━━━

🎓 *Dr(a). ${nome}*

${resultado === 'GANHOU' ? '🏆 *VENCI A CAUSA!*' : deferimentoParcial ? '⚖️ *OBTIVE DEFERIMENTO PARCIAL*' : '📚 *EXPERIÊNCIA CONCLUÍDA*'}

*Caso:* ${caso.titulo_caso}

📊 *Estatísticas:*
• Pontuação: *${partida.pontuacao_final}* pontos
• Combo Máximo: *${partida.combo_maximo || 0}*x
${partida.argumentos_apresentados ? `• Argumentos: *${partida.argumentos_apresentados}*` : ''}

━━━━━━━━━━━━━━

_Compartilhado do App Direito Premium_
🎯 Simulador Jurídico Interativo`;
          const urlWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoWhatsApp)}`;
          
          setTimeout(() => {
            if (confirm("Imagem salva! Deseja compartilhar no WhatsApp?")) {
              window.open(urlWhatsApp, '_blank');
            }
          }, 500);
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast.error("Erro ao gerar imagem");
    } finally {
      setGerando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-amber-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-500" />
            Compartilhar Resultado
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="nome" className="text-gray-300">
              Digite seu nome completo
            </Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Dr. João Silva"
              className="bg-gray-700 border-gray-600 text-white mt-2"
            />
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <p className="text-sm text-gray-300 text-center">
              Vamos gerar uma imagem linda com seu resultado para você compartilhar!
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={gerarImagemResultado}
              disabled={gerando || !nome.trim()}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              {gerando ? (
                <>Gerando...</>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Gerar e Compartilhar
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-gray-300"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
