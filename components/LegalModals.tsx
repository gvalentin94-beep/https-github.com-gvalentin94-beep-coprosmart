
import React from 'react';
import { Card, CardHeader, CardTitle, Button } from './ui';

interface LegalModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  // children is made optional to ensure TypeScript correctly associates JSX children with the props object
  children?: React.ReactNode;
}

export function LegalModal({ title, isOpen, onClose, children }: LegalModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-700 max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <CardHeader className="border-b border-slate-800 shrink-0">
          <div className="flex justify-between items-center">
            <CardTitle>{title}</CardTitle>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 text-xl">✕</button>
          </div>
        </CardHeader>
        <div className="p-6 overflow-y-auto text-sm text-slate-300 leading-relaxed space-y-4">
          {children}
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0 flex justify-end">
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </Card>
    </div>
  );
}

export function CGUContent() {
  return (
    <>
      <h3 className="font-bold text-white text-base">1. Présentation du service</h3>
      <p>CoproSmart est une plateforme collaborative destinée aux copropriétaires. Elle permet de recenser des petits travaux de maintenance et de permettre aux résidents de les effectuer en échange d'une réduction de leurs charges de copropriété.</p>
      
      <h3 className="font-bold text-white text-base">2. Conditions d'accès</h3>
      <p>L'accès est réservé aux résidents (propriétaires ou locataires selon accord) des copropriétés inscrites. Chaque compte doit être validé par le Conseil Syndical ou l'Administrateur de la résidence.</p>
      
      <h3 className="font-bold text-white text-base">3. Réalisation des travaux</h3>
      <p>Les intervenants agissent à titre bénévole pour le compte de la copropriété. Ils s'engagent à respecter les règles de sécurité élémentaires. La copropriété fournit le matériel nécessaire ou rembourse les fournitures sur justificatifs.</p>
      
      <h3 className="font-bold text-white text-base">4. Système de crédits</h3>
      <p>Le montant économisé est crédité sur le compte de charges du copropriétaire après validation de la bonne exécution par un membre du Conseil Syndical. Ce crédit est une remise sur les charges futures et ne constitue pas un salaire.</p>
      
      <h3 className="font-bold text-white text-base">5. Responsabilité</h3>
      <p>CoproSmart est un outil de mise en relation. La responsabilité des travaux incombe à l'intervenant et à la copropriété (assurance multirisque immeuble).</p>
    </>
  );
}

export function MentionsLegalesContent() {
  return (
    <>
      <p><strong>Éditeur du site :</strong> CoproSmart SAS, société imaginaire au capital de 1 000 €, dont le siège social est situé à la Résidence Watteau, 75018 Paris.</p>
      <p><strong>Directeur de la publication :</strong> Le Président du Conseil Syndical de la Résidence Watteau.</p>
      <p><strong>Hébergement :</strong> Ce site est hébergé par Vercel Inc., 340 S Lemon Ave #1150 Walnut, CA 91789, USA.</p>
      <p><strong>Propriété intellectuelle :</strong> L'ensemble des éléments de ce site est protégé par le droit d'auteur. Toute reproduction est interdite sans accord préalable.</p>
      <p><strong>Données personnelles :</strong> Les informations collectées (nom, prénom, email) sont nécessaires à la gestion de la copropriété. Vous disposez d'un droit d'accès et de rectification via votre profil.</p>
    </>
  );
}
