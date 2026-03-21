import '@testing-library/jest-dom/extend-expect';

// Mock matchMedia for components that use it (e.g., responsive charts)
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({})
}));

// Mock js-cookie
jest.mock('js-cookie', () => ({
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
}));

// Mock jwt-decode
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn((token) => {
    if (token === 'valid_access_token') {
      return {
        user_id: 1,
        email: 'test@example.com',
        is_admin: false,
        exp: Math.floor(Date.now() / 1000) + 3600, // Valid for 1 hour
      };
    }
    if (token === 'expired_access_token') {
      return {
        user_id: 1,
        email: 'test@example.com',
        is_admin: false,
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };
    }
    throw new Error('Invalid token');
  }),
}));

// Mock Chart.js for component tests
jest.mock('react-chartjs-2', () => ({
  Line: () => null, // Just render nothing for chart components
}));

jest.mock('chart.js', () => ({
  Chart as ChartJS: {
    register: jest.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  TimeScale: {},
}));

jest.mock('chartjs-adapter-date-fns', () => ({}));