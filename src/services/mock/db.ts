import type { Product } from '@/types/product';

export interface MockUserRecord {
  id: number;
  fullName: string;
  email: string;
  /** Mock-only plaintext password for the demo login check. Never exposed via the User type. */
  password: string;
  createdAt: string;
}

export interface MockAdminRecord {
  username: string;
  password: string;
}

interface MockDatabase {
  products: Product[];
  users: MockUserRecord[];
  admins: MockAdminRecord[];
  nextIds: {
    product: number;
    user: number;
  };
}

const STORAGE_KEY = 'jdm_mock_db_v1';

function buildSeedDatabase(): MockDatabase {
  return {
    products: [
      {
        id: 1,
        name: 'Nissan GT-R R35 Night Drive',
        category: 'Sports Car',
        description:
          'Ride shotgun in an R35 GT-R through Tokyo\'s neon-lit expressways, with a stop at Daikoku PA for photos.',
        price: 25000,
        discount: 10,
        stock: 1,
        image1: 'hompage.JPG',
        image2: 'carouselfort.jpg',
        image3: 'street.jpg',
        latitude: 35.4645,
        longitude: 139.735,
        seatCapacity: 1,
        guideId: null,
      },
      {
        id: 2,
        name: 'Nissan Skyline ER34 Experience',
        category: 'Sports Car',
        description: 'A guided experience in the legendary ER34 Skyline, cruising Tokyo\'s waterfront roads.',
        price: 22000,
        discount: 0,
        stock: 1,
        image1: 'carouselsecond.jpg',
        image2: 'street.jpg',
        image3: 'team.jpg',
        latitude: 35.6267,
        longitude: 139.7746,
        seatCapacity: 1,
        guideId: null,
      },
      {
        id: 3,
        name: 'Daikoku PA Meetup Tour',
        category: 'Group Tour',
        description: 'Join the legendary Daikoku Parking Area car meet scene alongside Japan\'s JDM community.',
        price: 15000,
        discount: 15,
        stock: 1,
        image1: 'Parkinglot.JPG',
        image2: 'team.jpg',
        image3: 'palm.jpg',
        latitude: 35.4645,
        longitude: 139.735,
        seatCapacity: 4,
        guideId: null,
      },
      {
        id: 4,
        name: 'Rainbow Bridge Night Cruise',
        category: 'City Tour',
        description: 'Cross the Rainbow Bridge at night for skyline views of Odaiba and central Tokyo.',
        price: 18000,
        discount: 0,
        stock: 1,
        image1: 'dripmain.jpg',
        image2: 'street.jpg',
        image3: 'palm.jpg',
        latitude: 35.6367,
        longitude: 139.7631,
        seatCapacity: 4,
        guideId: null,
      },
      {
        id: 5,
        name: 'Tokyo Tower & Shibuya Crossing Tour',
        category: 'City Tour',
        description: 'Hit Tokyo\'s most iconic landmarks — Tokyo Tower and the Shibuya Scramble — in one evening.',
        price: 20000,
        discount: 20,
        stock: 2,
        image1: 'itinerary.png',
        image2: 'team.jpg',
        image3: 'dripmain.jpg',
        latitude: 35.6586,
        longitude: 139.7454,
        seatCapacity: 4,
        guideId: null,
      },
      {
        id: 6,
        name: 'A-PIT AUTOBACS Parts Run',
        category: 'Specialty',
        description: 'A specialty run to A-PIT AUTOBACS for enthusiasts wanting to browse JDM parts and accessories.',
        price: 12000,
        discount: 0,
        stock: 0,
        image1: 'Parkinglot.JPG',
        image2: 'carouselfort.jpg',
        image3: 'palm.jpg',
        latitude: 35.55,
        longitude: 139.7,
        seatCapacity: 4,
        guideId: null,
      },
      {
        id: 7,
        name: 'Weekend Business Errand Drive',
        category: 'Errand',
        description: 'A flexible chauffeur-style booking for city errands and business trips.',
        price: 10000,
        discount: 5,
        stock: 1,
        image1: 'street.jpg',
        image2: 'dripmain.jpg',
        image3: 'team.jpg',
        latitude: 35.6895,
        longitude: 139.6917,
        seatCapacity: 4,
        guideId: null,
      },
      {
        id: 8,
        name: 'Full Tokyo JDM Circuit',
        category: 'Premium',
        description: 'The complete experience: Daikoku PA, A-PIT AUTOBACS, Rainbow Bridge, Tokyo Tower, and Shibuya Crossing in one premium tour.',
        price: 35000,
        discount: 25,
        stock: 1,
        image1: 'hompage.JPG',
        image2: 'itinerary.png',
        image3: 'carouselsecond.jpg',
        latitude: 35.6812,
        longitude: 139.7671,
        seatCapacity: 4,
        guideId: null,
      },
    ],
    users: [
      {
        id: 1,
        fullName: 'Taro Yamada',
        email: 'taro@example.com',
        password: 'password123',
        createdAt: '2026-01-15 10:00:00',
      },
      {
        id: 2,
        fullName: 'Hana Sato',
        email: 'hana@example.com',
        password: 'password123',
        createdAt: '2026-02-20 14:30:00',
      },
    ],
    admins: [{ username: 'admin', password: 'admin123' }],
    nextIds: { product: 9, user: 3 },
  };
}

function loadDb(): MockDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockDatabase;
  } catch {
    // Fall through to a fresh seed if storage is corrupt or unavailable.
  }
  const seeded = buildSeedDatabase();
  persist(seeded);
  return seeded;
}

function persist(database: MockDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  } catch {
    // localStorage may be unavailable (e.g. private browsing) — mock state
    // simply won't survive a refresh in that case.
  }
}

let db: MockDatabase = loadDb();

export function getDb(): MockDatabase {
  return db;
}

export function saveDb(): void {
  persist(db);
}

export function resetDb(): void {
  db = buildSeedDatabase();
  persist(db);
}
