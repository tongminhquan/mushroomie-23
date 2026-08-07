export const PERFORMANCE_ROUTES = Object.freeze([
  { key: 'home', path: '/', expectedStatus: 200 },
  { key: 'san-pham', path: '/san-pham', expectedStatus: 200 },
  {
    key: 'cau-chuyen',
    path: '/cau-chuyen',
    expectedStatus: 308,
    expectedDestination: '/gioi-thieu',
  },
  { key: 'tin-tuc', path: '/tin-tuc', expectedStatus: 200 },
  { key: 'mini-game', path: '/mini-game', expectedStatus: 200 },
  { key: 'dang-nhap', path: '/tai-khoan/dang-nhap', expectedStatus: 200 },
  { key: 'gio-hang', path: '/gio-hang', expectedStatus: 200 },
  { key: 'thanh-toan', path: '/thanh-toan', expectedStatus: 200 },
  {
    key: 'admin-anonymous',
    path: '/admin',
    expectedStatus: 307,
    expectedDestination: '/tai-khoan/dang-nhap',
  },
])
