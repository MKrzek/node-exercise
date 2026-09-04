**MONOLITH**
express-learning-tracker/
├── src/
│ ├── background/
│ │ ├── queues/
│ │ │ └── emailQueue.ts # BullMQ queue definition
│ │ ├── jobs/
│ │ │ └── emailJob.ts # Email sending logic
│ ├── services/
│ │ └── emailService.ts # Email sending logic
│ ├── routes/
│ │ └── stats.ts # Uses emailQueue

**TARGET -MICROSERVICES**

express-learning-tracker/ # Monolith (main app)
└── services/
└── notification-service/ # New microservice
├── src/
│ ├── routes/
│ ├── services/
│ ├── lib/
│ └── server.ts
├── prisma/
│ └── schema.prisma # Own DB
└── package.json

Monolith (port 3000)
↓ POST /notifications/email
Notification Service (port 3001)
↓ Sends email via SMTP
