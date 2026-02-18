import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  console.log('Starting test suite...');
});

afterAll(async () => {
  console.log('Test suite completed.');
});

beforeEach(() => {
  jest.clearAllMocks();
});