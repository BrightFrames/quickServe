import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SpinnerProps {
    className?: string;
    size?: number;
}

export const Spinner = ({ className, size = 24 }: SpinnerProps) => {
    return (
        <Loader2
            className={cn("animate-spin text-current", className)}
            size={size}
        />
    );
};
