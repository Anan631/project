"use client";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, Info } from "lucide-react";

interface MaintenanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MaintenanceDialog({ open, onOpenChange }: MaintenanceDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-white/95 backdrop-blur-md border-amber-200">
                <AlertDialogHeader className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                        <ShieldAlert className="h-10 w-10 text-amber-600" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-bold text-center text-amber-800">
                        الموقع تحت الصيانة
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-slate-600 text-lg leading-relaxed">
                        نعتذر، الموقع يخضع حالياً لأعمال صيانة وتحسينات مهمة.
                        <br />
                        يرجى المحاولة مرة أخرى في وقت لاحق.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 my-4 flex gap-3 text-right">
                    <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                        نعمل جاهدين لتوفير أفضل تجربة لكم. شكراً لتفهمكم وصبركم.
                    </p>
                </div>
                <AlertDialogFooter className="sm:justify-center">
                    <AlertDialogAction
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                    >
                        حسناً، فهمت
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
