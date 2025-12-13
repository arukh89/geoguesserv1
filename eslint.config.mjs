import coreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...coreWebVitals,
  {
    ignores: [
      'storybook-static/**',
      'test-results/**'
    ],
  },
];

export default config;
