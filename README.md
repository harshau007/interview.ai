# Interview.AI

An AI-powered interview preparation platform that helps you practice interviews with an AI interviewer.

## Features

- 🤖 AI-powered interview simulations
- 🎥 Real-time video interaction
- 🎙️ Voice-based responses using ElevenLabs
- 📊 Interview performance tracking
- 🎯 Personalized feedback
- 🌙 Dark/Light mode support
- 🔒 Secure API key management
- 📱 Responsive design

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB
- **State Management**: Zustand
- **AI Services**:
  - Google Gemini AI
  - ElevenLabs (Text-to-Speech)
- **UI Components**: ShadCN & Radix UI

## Prerequisites

- Node.js 18+ or Docker
- MongoDB (if running locally)
- API keys for:
  - Google Gemini
  - ElevenLabs

## Getting Started

### Using Docker (Recommended)

1. Clone the repository:

   ```bash
   git clone https://github.com/harshau04/interview.ai.git
   cd interview.ai
   ```

2. Create a `.env` file:

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your API keys and configuration.

3. Run using Docker Compose:

   ```bash
   docker-compose up -d
   ```

4. Access the application at http://localhost:3000

### Using Docker Run (Alternative)

1. Create a `.env` file as described above.

2. Run the container:
   ```bash
   docker run -d \
     -p 3000:3000 \
     -v $(pwd)/.env:/app/.env \
     --name interview-ai \
     harshau04/interview.ai:latest
   ```

### Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file:

   ```bash
   cp .env.example .env.local
   ```

   Edit the `.env.local` file with your API keys and configuration.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Access the application at http://localhost:3000

## Environment Variables

| Variable           | Description               | Required |
| ------------------ | ------------------------- | -------- |
| GEMINI_API_KEY     | Google Gemini API key     | Yes      |
| ELEVENLABS_API_KEY | ElevenLabs API key        | Yes      |
| MONGODB_URI        | MongoDB connection string | Yes      |

## Docker Commands

### Start the application

```bash
docker-compose up -d
```

### Stop the application

```bash
docker-compose down
```

### View logs

```bash
docker-compose logs -f
```

### Rebuild the application

```bash
docker-compose up -d --build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Google Gemini AI](https://ai.google.dev/) for the AI capabilities
- [ElevenLabs](https://elevenlabs.io/) for the text-to-speech service

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

Made with ❤️ by Harsh
