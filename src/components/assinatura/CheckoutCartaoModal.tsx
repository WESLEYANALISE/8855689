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
}

export function CheckoutCartaoModal({
  open,
  onOpenChange,
  amount,
  planType,
  planLabel,
  userEmail,
  userId,
  onSuccess
}: CheckoutCartaoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Pagamento com Cartão</h2>
          <p className="text-sm text-zinc-400">
            {planLabel} - R$ {amount.toFixed(2).replace('.', ',')}
          </p>
        </div>
        
        <CheckoutCartao
          amount={amount}
          planType={planType}
          planLabel={planLabel}
          userEmail={userEmail}
          userId={userId}
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
