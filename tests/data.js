const testUser = {
  name: 'Test User',
  email: 'user@test.com',
  password: 'P@ssw0rd',
  phone: '0811111111',
}

const testUser2 = {
  name: 'Test User 2',
  email: 'user2@test.com',
  password: 'P@ssw0rd',
  phone: '0811111112',
}

const testAdmin = {
  name: 'Admin User',
  email: 'admin@requirements.com',
  password: '123456',
  phone: '0833333333',
  role: 'admin',
}

const testSpace = {
  name: 'Test Space for Requirements',
  address: '123 Requirements Street',
  district: 'Test District',
  province: 'Bangkok',
  postalcode: '10110',
  tel: '02-111-1111',
  opentime: '0900',
  closetime: '2100',
  rooms: [
    {
      roomNumber: 'R101',
      capacity: 4,
      facilities: ['WiFi', 'Whiteboard'],
      price: 450,
    },
    {
      roomNumber: 'R102',
      capacity: 8,
      facilities: ['WiFi', 'Projector'],
      price: 200,
    },
  ],
}

module.exports = {
  testUser,
  testUser2,
  testAdmin,
  testSpace,
}
