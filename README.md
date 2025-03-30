# Interview.ai

A modern AI-powered interview preparation platform that helps users practice technical interviews with real-time feedback and guidance.

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

- Node.js 18.x or later
- MongoDB instance
- API keys for:
  - Google Gemini AI
  - ElevenLabs
  - MongoDB Atlas (or your MongoDB instance)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB
MONGODB_URI=your-mongodb-uri

# AI Services
GEMINI_API_KEY=your-gemini-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/harshau007/interview.ai.git
   cd interview.ai
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your API keys and configuration

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
interview.ai/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   ├── lib/                 # Utility functions and configurations
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
```

## API Routes

- `/api/sessions/*` - Interview session management
- `/api/gemini` - AI interview processing
- `/api/elevenlabs` - Text-to-speech conversion
- `/api/config` - Configuration management
- `/api/user` = User management

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
