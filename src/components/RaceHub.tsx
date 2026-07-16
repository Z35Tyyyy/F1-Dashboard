import { useState } from 'react';
import { Flag, Timer, Disc3 } from 'lucide-react';
import { PageHeader, Tabs } from './ui';
import SessionBanner from './SessionBanner';
import Results from './Results';
import Qualifying from './Qualifying';
import Strategy from './Strategy';

type Tab = 'race' | 'qualifying' | 'strategy';

export default function RaceHub() {
  const [tab, setTab] = useState<Tab>('race');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Results"
        subtitle="The latest race weekend — classification, qualifying and tyre strategy."
      />
      <SessionBanner />
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'race', label: 'Race', icon: <Flag size={15} /> },
          { id: 'qualifying', label: 'Qualifying', icon: <Timer size={15} /> },
          { id: 'strategy', label: 'Strategy', icon: <Disc3 size={15} /> },
        ]}
      />
      <div className="pt-1">
        {tab === 'race' && <Results embedded />}
        {tab === 'qualifying' && <Qualifying embedded />}
        {tab === 'strategy' && <Strategy embedded />}
      </div>
    </div>
  );
}
