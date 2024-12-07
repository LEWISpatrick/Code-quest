# CodeQuest: Debug the World 🚀

CodeQuest is an interactive coding challenge platform where users can improve their debugging skills through timed challenges. Test your coding abilities, compete with others, and climb the leaderboard!

## Features ✨

- 🎯 Real-time coding challenges
- ⏱️ Timed gameplay
- 💡 Hint system with strategic point deductions
- 🏆 Global leaderboard
- 🔐 Secure authentication with Google
- 🎨 Clean, modern UI with dark mode
- 🏅 Achievement system

## Tech Stack 🛠️

- **Frontend**: Next.js 13+, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma
- **Database**: PostgreSQL (Neon)
- **Authentication**: NextAuth.js with Google Provider
- **AI Integration**: OpenAI API for challenge generation
- **Styling**: Tailwind CSS, HeadlessUI

## Getting Started 🚀

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL database (or Neon account)
- Google OAuth credentials
- OpenAI API key

### Installation

1. Clone the repository:
bash
git clone https://github.com/yourusername/code-quest.git
cd code-quest
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your credentials:
```env
# Database
DATABASE_URL="your-neon-database-url"

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

5. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Setting Up OAuth 🔐

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins:
   ```
   http://localhost:3000 (development)
   your-production-url
   ```
6. Add authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google (development)
   your-production-url/api/auth/callback/google
   ```

## Game Rules 🎮

1. Each game consists of multiple debugging challenges
2. You have 3 minutes to complete each challenge
3. Use hints wisely - they deduct points from your score
4. Maintain your streak for bonus points
5. Three failed attempts end the game

## Contributing 🤝

1. Fork the repository
2. Create your feature branch:
```bash
git checkout -b feature/AmazingFeature
```
3. Commit your changes:
```bash
git commit -m 'Add some AmazingFeature'
```
4. Push to the branch:
```bash
git push origin feature/AmazingFeature
```
5. Open a Pull Request

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- OpenAI for the challenge generation
- Next.js team for the amazing framework
- All contributors and users of CodeQuest

## Support 💬

For support, email patricklewis2009@gmail.com 
---

Made with ❤️ by patrick
```
