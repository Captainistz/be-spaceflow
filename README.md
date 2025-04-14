# SpaceFlow API

## Overview

SpaceFlow is a RESTful API for managing co-working space reservations. The
system allows users to browse co-working spaces, view available rooms, make and
manage reservations within opening hours.

## Tech Stack

- **Node.js** with **Express.js** framework
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **Node-cron** for scheduled tasks
- **Jest** for testing

## Getting Started

### Prerequisites

- Node.js (v22+)
- MongoDB instance

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/spaceflow.git
cd spaceflow
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   - Create config.env for development
   - Create config.test.env for testing

Example of `config.env`:

```env
PORT = 8000
NODE_ENV = development
MONGO_URI = mongodb://your-mongodb-uri/spaceflow
JWT_SECRET = your-jwt-secret
JWT_EXPIRE = 30d
JWT_COOKIE_EXPIRE = 30
CSRF_SECRET = your-csrf-secret
MAXIMUM_RESERVATIONS = 3
```

### Running the Application

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

