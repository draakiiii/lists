# ListTrack Web Application

A web application for managing personal lists organized by year and month. Built with Next.js, TypeScript, Tailwind CSS, and Firebase.

## Features

- User authentication with email/password and Google sign-in
- Create yearly lists with monthly columns
- Add, edit, and delete items in each month
- Drag and drop items between months
- Dark mode support
- Responsive design

## Prerequisites

- Node.js 16.x or later
- npm or yarn
- Firebase project

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd web-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a Firebase project:
- Go to the [Firebase Console](https://console.firebase.google.com/)
- Create a new project
- Enable Authentication (Email/Password and Google providers)
- Create a Firestore database
- Get your Firebase configuration

4. Set up environment variables:
```bash
cp .env.example .env.local
```
Then edit `.env.local` with your Firebase configuration values.

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  ├── app/                    # Next.js app directory
  │   ├── auth/              # Authentication pages
  │   ├── dashboard/         # Dashboard page
  │   ├── lists/            # List pages
  │   └── layout.tsx        # Root layout
  ├── providers/            # Context providers
  └── components/          # Reusable components
```

## Firebase Security Rules

Add these security rules to your Firebase project:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /lists/{listId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      
      match /items/{itemId} {
        allow read, write: if request.auth != null && get(/databases/$(database)/documents/lists/$(listId)).data.userId == request.auth.uid;
      }
    }
  }
}
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 