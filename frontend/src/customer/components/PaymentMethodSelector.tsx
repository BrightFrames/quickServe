import { Banknote, CreditCard, Smartphone } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { cn } from "@/lib/utils";

interface PaymentMethodSelectorProps {
  selectedMethod: "cash" | "card" | "upi" | null;
  onSelect: (method: "cash" | "card" | "upi") => void;
}

export const PaymentMethodSelector = ({
  selectedMethod,
  onSelect,
}: PaymentMethodSelectorProps) => {
  const paymentMethods = [
    {
      id: "cash" as const,
      name: "Cash at Counter",
      description: "Pay with cash when you collect",
      icon: Banknote,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      id: "card" as const,
      name: "Card Payment",
      description: "Pay with card at the counter",
      icon: CreditCard,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      id: "upi" as const,
      name: "UPI Payment",
      description: "Pay instantly via GPay, PhonePe, Paytm",
      icon: Smartphone,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Select Payment Method</h3>
      <div className="grid gap-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <Card
              key={method.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:shadow-md",
                isSelected
                  ? `${method.bgColor} ${method.borderColor} border-2 shadow-md`
                  : "border hover:border-gray-300"
              )}
              onClick={() => onSelect(method.id)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    isSelected ? method.bgColor : "bg-gray-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6",
                      isSelected ? method.color : "text-gray-600"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <h4
                    className={cn(
                      "font-semibold mb-1",
                      isSelected && method.color
                    )}
                  >
                    {method.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {method.description}
                  </p>
                </div>
                {isSelected && (
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      method.bgColor
                    )}
                  >
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        method.color.replace("text-", "bg-")
                      )}
                    />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
