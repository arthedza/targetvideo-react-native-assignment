import type { Catalogue, Locale } from '../../domain/api-schemas';

function createEpisodes(): Catalogue['series']['episodes'] {
  return [
    'The Accidental Message',
    'Coffee and Contracts',
    'A Glimpse Behind the Mask',
    'The Gala Encounter',
  ].map((name, index) => {
    const fallback = index === 3 ? 'flight' : 'demo';
    const asset = index === 1 ? 'garden' : fallback;
    const durations = { demo: 16, garden: 12, flight: 14 };
    return {
      id: `ceo-ep-${index + 1}`,
      seriesId: 'ceo-secret-life',
      number: index + 1,
      title: `Episode ${index + 1}`,
      name,
      isFree: index < 3,
      unlockPriceCoins: index < 3 ? null : 10,
      videoAsset: asset,
      durationSeconds: durations[asset],
    };
  });
}

export function createCatalogue(locale: Locale): Catalogue {
  const catalogues: Record<Locale, Catalogue> = {
    en: {
      series: {
        id: 'ceo-secret-life',
        title: "The CEO's Secret Life",
        synopsis:
          "When a struggling artist accidentally discovers that the ruthless CEO of the city's largest conglomerate is actually her anonymous online confidant, her life is turned upside down. Can their digital romance survive the harsh reality of corporate espionage and forbidden love?",
        tagline: 'A CEO’s dangerous secret contract.',
        genres: ['Billionaire', 'Secret Identity', 'Romance'],
        homeGenres: ['Romance', 'Drama', 'Billionaire'],
        rating: 4.8,
        ratingCount: 12000,
        year: 2024,
        highlights: [
          'Intense chemistry from the very first frame.',
          'Gripping double-life narrative with high stakes.',
        ],
        cast: [
          {
            name: 'Elena',
            role: 'Mia (Artist)',
            imageKey: 'mia',
          },
          {
            name: 'Julian Vance',
            role: 'Alexander (CEO)',
            imageKey: 'alexander',
          },
          {
            name: 'Sarah Lin',
            role: 'Chloe (Best Friend)',
            imageKey: 'chloe',
          },
          {
            name: 'Marcus',
            role: 'Rival CEO',
            imageKey: 'rival',
          },
        ],
        episodes: createEpisodes(),
      },
      categories: [
        { id: 'all', title: 'All', available: true },
        {
          id: 'romance',
          title: 'Romance',
          available: true,
        },
        { id: 'drama', title: 'Drama', available: true },
        {
          id: 'action',
          title: 'Action',
          available: false,
        },
        {
          id: 'mystery',
          title: 'Mystery',
          available: false,
        },
      ],
      rails: [
        {
          title: 'Trending Romance',
          category: 'Romance',
          numbers: [1, 2, 3],
          poster: 0,
        },
        {
          title: 'Forbidden Love',
          category: '',
          numbers: [2, 3, 4],
          poster: 3,
        },
        {
          title: 'Most Watched',
          category: 'Popular Micro Dramas',
          numbers: [4, 1, 2],
          poster: 6,
        },
      ],
      plans: [
        {
          id: 'season',
          title: 'Unlock Full Season',
          priceLabel: '150 Coins',
        },
        {
          id: 'premium',
          title: 'Premium Membership',
          priceLabel: '$9.99/mo',
        },
      ],
    },
  };
  return catalogues[locale];
}

// The simulated server owns this mutable fixture; wire responses are cloned.
export const serverCatalogue = createCatalogue('en');
