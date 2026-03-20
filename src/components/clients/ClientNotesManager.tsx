import { useState } from 'react';
import { ClientList } from './ClientList';
import { ClientDetail } from './ClientDetail';

interface ClientNotesManagerProps {
  businessId: string;
}

export const ClientNotesManager = ({ businessId }: ClientNotesManagerProps) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  if (selectedClientId) {
    return (
      <ClientDetail
        businessId={businessId}
        clientId={selectedClientId}
        onBack={() => setSelectedClientId(null)}
      />
    );
  }

  return (
    <ClientList
      businessId={businessId}
      onSelectClient={setSelectedClientId}
    />
  );
};
