data-viz-system/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── data-sources/
│   │   ├── dashboards/
│   │   ├── charts/
│   │   ├── common/ (middlewares, interceptors, decorators, filters)
│   │   ├── main.ts
│   │   └── app.module.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── test/
│   ├── .env.example
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── styles/
│   │   └── types/
│   ├── .env.example
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
├── docs/
│   ├── architecture.md
│   ├── api.md (OpenAPI Spec/Swagger)
│   ├── deployment.md
│   └── README.md
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── docker-compose.yml
└── nginx.conf