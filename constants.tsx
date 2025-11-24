import React from 'react';

export const COUNCIL_MIN_APPROVALS = 2;
export const MAX_TASK_PRICE = 100;

export const ROLES = [
  { id: "owner", label: "Copropriétaire" },
  { id: "council", label: "Conseil syndical" },
  { id: "admin", label: "Administrateur" },
];

export const LOCATIONS = ["Bâtiment A", "Bâtiment B", "Caves", "Parking", "Extérieurs"];

export const AVATARS = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵"];

// RATING LEGEND
export const RATING_LEGEND: { [key: number]: string } = {
    1: "Insatisfaisant - Travail à reprendre",
    2: "Moyen - Des défauts visibles",
    3: "Correct - Conforme aux attentes",
    4: "Très bon - Soigné et rapide",
    5: "Excellent - Au-delà des attentes"
};

// COLORS: Neutral backgrounds (slate-800), Colored Text/Icons/Borders
export const CATEGORIES = [
  { id: "ampoule", label: "Ampoule / Lumière", icon: <LightbulbIcon />, colorClass: "text-amber-400 bg-slate-800 border-slate-700" },
  { id: "porte", label: "Porte / Serrure", icon: <KeyIcon />, colorClass: "text-sky-400 bg-slate-800 border-slate-700" },
  { id: "encombrants", label: "Encombrants", icon: <ArchiveBoxIcon />, colorClass: "text-rose-400 bg-slate-800 border-slate-700" },
  { id: "divers", label: "Divers", icon: <SparklesIcon />, colorClass: "text-fuchsia-400 bg-slate-800 border-slate-700" },
];

export const SCOPES = [
  { id: "copro", label: "Parties communes (crédit charges)", icon: <BuildingOfficeIcon />, colorClass: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
  { id: "apartment", label: "Partie privative (main à la main)", icon: <HomeIcon />, colorClass: "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20" },
];

export const WARRANTY_OPTIONS = [
    { val: "0", label: "Sans", icon: <NoShieldIcon />, colorClass: "text-slate-400 bg-slate-400/10 border-slate-400/20" },
    { val: "30", label: "1 mois", icon: <ShieldCheckIcon />, colorClass: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    { val: "180", label: "6 mois", icon: <ShieldCheckIcon />, colorClass: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
    { val: "365", label: "1 an", icon: <ShieldCheckIcon />, colorClass: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
];

export const TASK_STATUS_CONFIG: { [key: string]: { label: string; color: string; icon: React.ReactElement<{ className?: string }> } } = {
  pending: { label: "En validation", color: "amber", icon: <ClockIcon className="h-4 w-4" /> },
  open: { label: "Offres ouvertes", color: "indigo", icon: <MegaphoneIcon className="h-4 w-4" /> },
  awarded: { label: "Attribuée", color: "sky", icon: <CheckBadgeIcon className="h-4 w-4" /> },
  verification: { label: "Tâche terminée - Attente contrôle", color: "fuchsia", icon: <MagnifyingGlassIcon className="h-4 w-4" /> },
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

export function MegaphoneIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09 1.884-.163 3.868-.524 5.919-1.08 1.503-.408 2.857.776 2.857 2.225v9.642c0 1.449-1.354 2.633-2.857 2.225-2.051-.556-4.035-.917-5.919-1.08Zm-5.592 1.32a21.735 21.735 0 0 1 3.252-.244l1.919.16 5.427-1.357a.75.75 0 0 1 .936.726v.75a.75.75 0 0 1-.726.75h-7.5a.75.75 0 0 1-.726-.75v-.75a.75.75 0 0 1 .585-.735Z" />
        </svg>
    );
}

export function CheckBadgeIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
        </svg>
    );
}

export function MagnifyingGlassIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
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

export function BuildingOfficeIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
    );
}

export function HomeIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
    );
}

export function MapPinIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
    );
}

export function ShieldCheckIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
        </svg>
    );
}

export function NoShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.597-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
        </svg>
    );
}