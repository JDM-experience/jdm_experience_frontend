import type { Product } from '@/types/product';
import type { Order } from '@/types/order';
import type { ContactMessage } from '@/types/contactMessage';

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
  orders: Order[];
  messages: ContactMessage[];
  admins: MockAdminRecord[];
  nextIds: {
    product: number;
    user: number;
    order: number;
    message: number;
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
    orders: [
      {
        id: 1,
        userId: 1,
        customerName: 'Taro Yamada',
        email: 'taro@example.com',
        address: '1-1 Shibuya, Tokyo, Japan',
        paymentMethod: 'Cash on Delivery',
        totalAmount: 22500,
        orderDate: '2026-07-20 09:15:00',
        status: 'Delivered',
        items: [
          {
            productId: 1,
            productName: 'Nissan GT-R R35 Night Drive',
            productImage: 'hompage.JPG',
            date: '2026-07-25',
            time: '19:00',
            quantity: 1,
            price: 22500,
          },
        ],
      },
      {
        id: 2,
        userId: 1,
        customerName: 'Taro Yamada',
        email: 'taro@example.com',
        address: '1-1 Shibuya, Tokyo, Japan',
        paymentMethod: 'GCash',
        totalAmount: 12750,
        orderDate: '2026-08-01 16:40:00',
        status: 'Pending',
        paymentProofName: 'gcash_proof_sample.jpg',
        items: [
          {
            productId: 3,
            productName: 'Daikoku PA Meetup Tour',
            productImage: 'Parkinglot.JPG',
            date: '2026-08-10',
            time: '20:00',
            quantity: 1,
            price: 12750,
          },
        ],
      },
    ],
    messages: [
      {
        id: 1,
        name: 'Kenji Ito',
        email: 'kenji.ito@example.com',
        message: 'Do you offer tours for groups larger than 4 people?',
        createdAt: '2026-07-28 11:20:00',
      },
      {
        id: 2,
        name: 'Emily Chen',
        email: 'emily.chen@example.com',
        message: 'Is the Rainbow Bridge tour available on weekday evenings?',
        createdAt: '2026-08-02 08:05:00',
      },
    ],
    nextIds: { product: 9, user: 3, order: 3, message: 3 },
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
