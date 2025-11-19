import React from 'react';

export const COUNCIL_MIN_APPROVALS = 2;

export const ROLES = [
  { id: "owner", label: "Copropriétaire" },
  { id: "council", label: "Conseil syndical" },
  { id: "admin", label: "Administrateur" },
];

export const LOCATIONS = ["Bâtiment A", "Bâtiment B", "Caves", "Parking", "Extérieurs"];

export const CATEGORIES = [
  { id: "ampoule", label: "Ampoule / Lumière", icon: <LightbulbIcon /> },
  { id: "porte", label: "Porte / Serrure", icon: <KeyIcon /> },
  { id: "encombrants", label: "Encombrants", icon: <ArchiveBoxIcon /> },
  { id: "divers", label: "Divers", icon: <SparklesIcon /> },
];

export const SCOPES = [
  { id: "copro", label: "Parties communes (crédit charges)" },
  { id: "apartment", label: "Partie privative (paiement de la main à la main)" },
];

export const TASK_STATUS_CONFIG: { [key: string]: { label: string; color: string; icon: React.ReactElement<{ className?: string }> } } = {
  pending: { label: "En validation", color: "amber", icon: <ClockIcon className="h-4 w-4" /> },
  open: { label: "Offres ouvertes", color: "indigo", icon: <ScaleIcon className="h-4 w-4" /> },
  awarded: { label: "Attribuée", color: "sky", icon: <CheckBadgeIcon className="h-4 w-4" /> },
  completed: { label: "Terminée", color: "emerald", icon: <CheckCircleIcon className="h-4 w-4" /> },
  rejected: { label: "Rejetée", color: "rose", icon: <XCircleIcon className="h-4 w-4" /> },
};


// ICONS
export function LightbulbIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311a7.5 7.5 0 0 1-7.5 0c.065.563.168 1.12.288 1.664a7.46 7.46 0 0 1 .58 1.564m1.83 2.163a7.5 7.5 0 0 1 3.597 0m1.83-2.163a7.46 7.46 0 0 0 .58-1.564 12.06 12.06 0 0 0 .288-1.664M8.25 12.75a3.75 3.75 0 0 1 7.5 0 .75.75 0 0 1-1.5 0 2.25 2.25 0 0 0-4.5 0 .75.75 0 0 1-1.5 0Z" />
    </svg>
  );
}

export function KeyIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  );
}

export function ArchiveBoxIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
    );
}

export function SparklesIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
    );
}

export function ClockIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    );
}

export function ScaleIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 20.25c-1.472 0-2.882.265-4.185.75M12 20.25v-1.5m0 1.5c-1.472 0-2.882.265-4.185.75M12 20.25c-1.472 0-2.882.265-4.185.75M6 13.5V12m6 1.5v-1.5m-6 0h12m-6 0v1.5m0-1.5V12m0 1.5v-1.5m6-1.5v1.5m-6-1.5V9m6 1.5V9m-6 3h12M9 9V6m6 3V6m-6 0h6m4.5 3.75l-1.5-1.5m0 0l-1.5 1.5m1.5-1.5V3m-3 0v3m-3-3v3m-3 0V3m-3 0v3" />
        </svg>
    );
}
export function CheckBadgeIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.745 3.745 0 0 1 3.296-1.043A3.745 3.745 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
        </svg>
    );
}

export function CheckCircleIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    );
}

export function XCircleIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    );
}

export function PlusIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}