export interface Storage<T> {
  key: string;
  value: T;
  timestamp: number;
}

export function createCacheItem<T>(key: string, value: T): Storage<T> {
  return {
    key,
    value,
    timestamp: Date.now(),
  };
}

export type Settings = {
  theme: string;
  language: string;
};

export const sampleCounterCache = createCacheItem<number>('counter', 10);
export const sampleSettingsCache = createCacheItem<Settings>('settings', {
  theme: 'dark',
  language: 'ru',
});

export interface FullProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  discount?: number;
  inStock: boolean;
}

export type ProductPreview = Pick<FullProduct, 'title' | 'price'>;
export type ProductCreate = Omit<FullProduct, 'id'>;
export type ProductUpdate = Partial<ProductCreate>;

export interface Customer {
  type: 'customer';
  email: string;
}

export interface Admin {
  type: 'admin';
  role: string;
  permissions: string[];
}

export function isAdmin(person: Customer | Admin): person is Admin {
  return person.type === 'admin';
}

export function checkAccess(person: Customer | Admin): void {
  if (isAdmin(person)) {
    console.log(person.permissions);
  } else {
    console.log(person.email);
  }
}
