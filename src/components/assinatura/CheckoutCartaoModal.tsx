import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckoutCartao } from "./CheckoutCartao";

interface CheckoutCartaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  planType: string;
  planLabel: string;
  userEmail: string;
  userId: string;
  onSuccess: () => void;
  installments?: number;
}

export function CheckoutCartaoModal({
  open,
  onOpenChange,
  amount,
  planType,
  planLabel,
  userEmail,
  userId,
  onSuccess,
  installments = 1
}: CheckoutCartaoModalProps) {
  // Calcular valor da parcela para exibição
  const installmentValue = amount / installments;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Pagamento com Cartão</h2>
          <p className="text-sm text-zinc-400">
            {planLabel} - {installments}x de R$ {installmentValue.toFixed(2).replace('.', ',')}
            {installments > 1 && ` (total: R$ ${amount.toFixed(2).replace('.', ',')})`}
          </p>
        </div>
        
        <CheckoutCartao
          amount={amount}
          planType={planType}
          planLabel={planLabel}
          userEmail={userEmail}
          userId={userId}
          defaultInstallments={installments}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess();
          }}
          onError={(error) => console.error(error)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
