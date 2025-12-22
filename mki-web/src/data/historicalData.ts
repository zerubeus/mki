export interface Territory {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  color: string;
  regions: string[]; // SVG path IDs
  description?: string;
}

export interface HistoricalPeriod {
  year: number;
  territories: Territory[];
}

export const territoryColors = {
  mecca: '#d4af37',       // Gold - Holy city of Mecca
  medina: '#32cd32',      // Lime green - Medina
  byzantium: '#9370db',   // Medium purple - Byzantine Empire
  sassanid: '#dc143c',    // Crimson - Sassanid Persia
  ghassanid: '#4682b4',   // Steel blue - Ghassanid kingdom
  lakhmid: '#ff8c00',     // Dark orange - Lakhmid kingdom
  himyar: '#8b4513',      // Saddle brown - Himyarite kingdom
  kindah: '#2e8b57',      // Sea green - Kindah tribe
  bedouin: '#daa520',     // Goldenrod - Bedouin tribes
  yemen: '#cd853f',       // Peru - Yemen region
  najd: '#deb887',        // Burlywood - Najd region
  hijaz: '#B22222',       // Firebrick red - Early Islamic State/Hijaz region
};

export const territories: Territory[] = [
  {
    id: 'mecca',
    name: 'Mecca',
    startYear: 570,
    endYear: 632,
    color: territoryColors.mecca,
    regions: ['mecca-city'],
    description: 'Holy city of Mecca, birthplace of Prophet Muhammad'
  },
  {
    id: 'medina',
    name: 'Medina',
    startYear: 622,
    endYear: 632,
    color: territoryColors.medina,
    regions: ['medina-city'],
    description: 'Medina, the city of the Prophet after Hijra'
  },
  {
    id: 'hijaz',
    name: 'Hijaz',
    startYear: 622,
    endYear: 632,
    color: territoryColors.hijaz,
    regions: ['hijaz-region'],
    description: 'Hijaz region under Prophet Muhammad\'s control (622-632 CE)'
  },
  {
    id: 'najd',
    name: 'Najd',
    startYear: 550,
    endYear: 650,
    color: territoryColors.najd,
    regions: ['najd-region'],
    description: 'Central Arabian plateau'
  },
  {
    id: 'yemen',
    name: 'Yemen',
    startYear: 550,
    endYear: 650,
    color: territoryColors.yemen,
    regions: ['yemen-region'],
    description: 'Southern Arabian Peninsula'
  },
  {
    id: 'himyar',
    name: 'Himyarite Kingdom',
    startYear: 500,
    endYear: 570,
    color: territoryColors.himyar,
    regions: ['yemen-region'],
    description: 'Last of the great South Arabian kingdoms'
  },
  {
    id: 'kindah',
    name: 'Kindah',
    startYear: 500,
    endYear: 600,
    color: territoryColors.kindah,
    regions: ['najd-region'],
    description: 'Arab tribal kingdom in central Arabia'
  },
  {
    id: 'ghassanid',
    name: 'Ghassanid Kingdom',
    startYear: 520,
    endYear: 638,
    color: territoryColors.ghassanid,
    regions: ['syria-region'],
    description: 'Arab client kingdom of the Byzantine Empire'
  },
  {
    id: 'lakhmid',
    name: 'Lakhmid Kingdom',
    startYear: 500,
    endYear: 602,
    color: territoryColors.lakhmid,
    regions: ['iraq-region'],
    description: 'Arab client kingdom of the Sassanid Empire'
  },
  {
    id: 'byzantium',
    name: 'Byzantine Empire',
    startYear: 500,
    endYear: 650,
    color: territoryColors.byzantium,
    regions: ['syria-region', 'palestine-region'],
    description: 'Eastern Roman Empire territories in the Levant'
  },
  {
    id: 'sassanid',
    name: 'Sassanid Persia',
    startYear: 500,
    endYear: 651,
    color: territoryColors.sassanid,
    regions: ['persia-region', 'iraq-region'],
    description: 'Persian Sassanid Empire'
  },
  {
    id: 'bedouin',
    name: 'Bedouin Tribes',
    startYear: 500,
    endYear: 650,
    color: territoryColors.bedouin,
    regions: ['desert-regions'],
    description: 'Nomadic Arab tribes of the Arabian Desert'
  }
];

export function getTerritoriesForYear(year: number): Territory[] {
  return territories.filter(territory => 
    year >= territory.startYear && year <= territory.endYear
  );
}

export function getYearRange(): { min: number; max: number } {
  const allYears = territories.flatMap(t => [t.startYear, t.endYear]);
  return {
    min: Math.min(...allYears),
    max: Math.max(...allYears)
  };
} 