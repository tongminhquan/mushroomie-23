export const productFixture = {
  id: 42,
  name: 'Vòng tay nấm',
  slug: 'vong-tay-nam',
  price: 125_000,
  sale_price: null,
  featured_image: '/uploads/vong-tay-nam.webp',
  short_description: 'Vòng tay handmade cá nhân hóa.',
  stock_quantity: 10,
  status: 'active',
}

export const userSessionFixture = {
  user: {
    id: '7',
    email: 'tester@example.com',
    name: 'Test User',
    role: 'user',
  },
  expires: '2099-01-01T00:00:00.000Z',
}

export const adminSessionFixture = {
  user: {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin',
    role: 'admin',
  },
  expires: '2099-01-01T00:00:00.000Z',
}

export const superAdminSessionFixture = {
  user: {
    id: '2',
    email: 'super-admin@example.com',
    name: 'Super Admin',
    role: 'super_admin',
  },
  expires: '2099-01-01T00:00:00.000Z',
}
