import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Country {
  code: string;
  name: string;
  ddi: string;
  flag: string;
}

const countries: Country[] = [
  { code: 'BR', name: 'Brasil', ddi: '55', flag: '🇧🇷' },
  { code: 'PT', name: 'Portugal', ddi: '351', flag: '🇵🇹' },
  { code: 'US', name: 'Estados Unidos', ddi: '1', flag: '🇺🇸' },
  { code: 'AR', name: 'Argentina', ddi: '54', flag: '🇦🇷' },
  { code: 'PY', name: 'Paraguai', ddi: '595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguai', ddi: '598', flag: '🇺🇾' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string, fullNumber: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

// Parse phone number to extract country and local number
// Only used for initial value parsing, not during typing
function parsePhoneNumber(phone: string): { country: Country; localNumber: string } {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Only try to match country if phone has enough digits to include DDI + local
  // This prevents changing country when user types local DDD like "11"
  if (cleanPhone.length > 10) {
    for (const country of countries) {
      if (cleanPhone.startsWith(country.ddi)) {
        return {
          country,
          localNumber: cleanPhone.slice(country.ddi.length),
        };
      }
    }
  }
  
  // Default to Brazil
  return {
    country: countries[0],
    localNumber: cleanPhone,
  };
}

// Format phone number for display (Brazilian format)
function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "(11) 99999-9999",
  disabled = false,
  error = false,
  className,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  
  // Default to Brazil
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [displayValue, setDisplayValue] = useState('');
  
  // Initialize from external value only once on mount
  // Always strip DDI 55 from stored format to show only local number (DDD + número)
  useEffect(() => {
    if (!isInitialized.current && value) {
      const cleanValue = value.replace(/\D/g, '');
      // Always strip DDI 55 if present - stored format is 55 + DDD + número
      // Brazilian DDDs are 11-99, never 55, so this is safe
      if (cleanValue.startsWith('55') && cleanValue.length > 2) {
        setDisplayValue(formatPhoneDisplay(cleanValue.slice(2))); // Remove DDI 55
      } else if (cleanValue.startsWith('55') && cleanValue.length === 2) {
        // Just the country code saved, start fresh
        setDisplayValue('');
      } else if (cleanValue.length > 0) {
        setDisplayValue(formatPhoneDisplay(cleanValue));
      }
      isInitialized.current = true;
    }
  }, [value]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    
    const cleanNumber = displayValue.replace(/\D/g, '');
    const fullNumber = country.ddi + cleanNumber;
    onChange(cleanNumber, fullNumber);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formatted = formatPhoneDisplay(rawValue);
    setDisplayValue(formatted);
    
    const fullNumber = selectedCountry.ddi + rawValue;
    onChange(rawValue, fullNumber);
  };
  
  return (
    <div className={cn("relative flex", className)} ref={dropdownRef}>
      {/* Country Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1 px-3 h-10 border border-r-0 rounded-l-md bg-muted/50 hover:bg-muted transition-colors",
          "text-sm font-medium",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-destructive"
        )}
      >
        <span className="text-xl">{selectedCountry.flag}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      
      {/* Phone Input */}
      <Input
        type="tel"
        value={displayValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "rounded-l-none flex-1",
          error && "border-destructive"
        )}
      />
      
      {/* Country Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-popover border rounded-md shadow-lg z-50 py-1">
          {countries.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleCountrySelect(c)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left",
                c.code === selectedCountry.code && "bg-muted"
              )}
            >
              <span className="text-lg">{c.flag}</span>
              <span className="flex-1">{c.name}</span>
              <span className="text-muted-foreground">+{c.ddi}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
