'use client';

import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";

type PhoneNumberDisplayProps = {
  phoneNumber: string;
  className?: string;
  size?: 'small' | 'medium';
};

const formatPhoneNumber = (number: string) => {
    const digitsOnly = number.replace(/\D/g, '');
    if (digitsOnly.length > 5) {
        return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 5)} ${digitsOnly.slice(5)}`;
    }
    if (digitsOnly.length > 2) {
        return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2)}`;
    }
    return digitsOnly;
};

export const PhoneNumberDisplay = ({ phoneNumber, className, size = 'medium' }: PhoneNumberDisplayProps) => {

  const formattedNumber = formatPhoneNumber(phoneNumber);

  return (
    <div className={cn("font-mono w-full", className)}>
        <div className="w-full rounded-md mx-auto flex flex-col bg-white" style={{ aspectRatio: '520 / 135' }}>
             <div className="flex items-center justify-center shrink-0 pt-2 pb-1 rounded-t-sm">
                <Phone className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-center flex-grow p-1">
              <svg viewBox="0 0 520 100" className="w-full h-full overflow-visible" preserveAspectRatio="xMidYMid meet">
                  <text
                      x="50%"
                      y="50%"
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fill="black"
                      className="font-extrabold"
                      style={{ fontSize: '80px' }}
                  >
                      {formattedNumber}
                  </text>
              </svg>
            </div>
        </div>
    </div>
  );
};
