interface Config {
  // apiUrl: string;
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

const config: Config = {
  // apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  appName: process.env.REACT_APP_NAME || 'Event Manager',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;