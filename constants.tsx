
import React from 'react';

export const COUNCIL_MIN_APPROVALS = 2;
export const MAX_TASK_PRICE = 100;

export const RESIDENCES = [
    "Résidence Watteau"
];

export const ROLES = [
  { id: "owner", label: "Copropriétaire" },
  { id: "council", label: "Conseil syndical" },
  { id: "admin", label: "Administrateur" },
];

export const LOCATIONS = ["Bâtiment A", "Bâtiment B", "Caves", "Parking", "Extérieurs"];

export const AVATARS = [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵",
    "👨", "👩", "👴", "👵", "👮", "👷", "💂", "🕵️", "🧑‍⚕️", "🧑‍🌾", "🧑‍🍳", "🧑‍🎓", "🧑‍🎤", "🧑‍🏫", "🧑‍🏭", 
    "🧑‍💻", "🧑‍💼", "🧑‍🔧", "🧑‍🔬", "🧑‍🎨", "🧑‍🚒", "🧑‍✈️", "🧑‍🚀", "🧑‍⚖️", "🧙", "🧛", "🧟", "🧞", "🧝"
];

export const RATING_LEGEND: { [key: number]: string } = {
    1: "Insatisfaisant",
    2: "Moyen",
    3: "Correct",
    4: "Très bon",
    5: "Excellent"
};

// VIBRANT COLORS FOR BADGES
export const CATEGORIES = [
  { id: "ampoule", label: "Ampoule", colorClass: "bg-yellow-400 text-black border border-yellow-500 font-bold" },
  { id: "porte", label: "Porte", colorClass: "bg-cyan-400 text-black border border-cyan-500 font-bold" },
  { id: "encombrants", label: "Encombrants", colorClass: "bg-red-600 text-white border border-red-700 font-bold" },
  { id: "divers", label: "Divers", colorClass: "bg-fuchsia-600 text-white border border-fuchsia-700 font-bold" },
];

export const SCOPES = [
  { id: "copro", label: "Parties communes", colorClass: "bg-indigo-600 text-white border border-indigo-500" },
  { id: "apartment", label: "Privatif", colorClass: "bg-pink-600 text-white border border-pink-500" },
];

export const WARRANTY_OPTIONS = [
    { val: "0", label: "Sans garantie", colorClass: "bg-slate-600 text-slate-200" },
    { val: "30", label: "1 mois", colorClass: "bg-emerald-600 text-white" },
    { val: "180", label: "6 mois", colorClass: "bg-teal-600 text-white" },
    { val: "365", label: "1 an", colorClass: "bg-blue-600 text-white" },
];

export const TASK_STATUS_CONFIG: { [key: string]: { label: string; color: string } } = {
  pending: { label: "En validation", color: "amber" },
  open: { label: "Offres ouvertes", color: "indigo" },
  awarded: { label: "Attribuée", color: "sky" },
  verification: { label: "Attente contrôle", color: "fuchsia" },
  completed: { label: "Terminée", color: "emerald" },
  rejected: { label: "Rejetée", color: "rose" },
};
