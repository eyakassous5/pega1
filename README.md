# LST Interpreter – Virtual Sign Language Translator

A web application that translates spoken words into **Tunisian Sign Language (LST)** using a 3D animated avatar. Built for the **Association Voix du Sourd de Tunisie (AVST)**.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   BROWSER (React)                    │
│                                                     │
│  ┌──────────┐   ┌──────────┐   ┌────────────────┐  │
│  │ Mic Input │──▶│ Web Speech│──▶│ Text Display   │  │
│  │ (or Text) │   │   API    │   │                │  │
│  └──────────┘   └──────────┘   └───────┬────────┘  │
│                                         │           │
│                                    POST /api/translate
│                                         │           │
│  ┌──────────────────────────────────────▼────────┐  │
│  │           3D Avatar (Three.js)                │  │
│  │   Plays sign animations from returned data    │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                          │
                     HTTP REST API
                          │
┌─────────────────────────▼───────────────────────────┐
│                 SERVER (Node.js/Express)              │
│                                                     │
│  ┌──────────────┐   ┌──────────────┐                │
│  │ /api/translate│──▶│ Sign Language │                │
│  │   endpoint   │   │   Service     │                │
│  └──────────────┘   └──────┬───────┘                │
│                            │                        │
│                   ┌────────▼────────┐               │
│                   │  LST Dictionary  │               │
│                   │  (JSON mapping)  │               │
│                   └─────────────────┘               │
└─────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend in development mode
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## Project Structure

```
lst-interpreter/
├── client/                 # React frontend (Vite)
│   ├── public/
│   │   └── models/         # 3D avatar GLB files
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Avatar3D.jsx        # Three.js 3D avatar
│   │   │   ├── SpeechInput.jsx     # Voice capture + text input
│   │   │   ├── TranslationDisplay.jsx
│   │   │   └── AnimationPlayer.jsx # Sign animation sequencer
│   │   ├── hooks/          # Custom React hooks
│   │   │   └── useSpeechRecognition.js
│   │   ├── services/       # API calls
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # Express routes
│   │   │   └── translate.js
│   │   ├── services/       # Business logic
│   │   │   └── signLanguageService.js
│   │   ├── data/           # LST dictionary
│   │   │   └── lst-dictionary.json
│   │   └── index.js        # Server entry point
│   └── package.json
├── package.json            # Root workspace scripts
└── README.md
```

## API

### POST /api/translate

**Request:**
```json
{
  "text": "bonjour comment ça va"
}
```

**Response:**
```json
{
  "original": "bonjour comment ça va",
  "tokens": ["bonjour", "comment", "ça va"],
  "signs": [
    { "word": "bonjour", "animation": "sign_bonjour", "duration": 1.5 },
    { "word": "comment", "animation": "sign_comment", "duration": 1.2 },
    { "word": "ça va", "animation": "sign_ca_va", "duration": 1.5 }
  ],
  "unknownWords": []
}
```

## Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Speech-to-Text | Web Speech API | Free, built into browser, zero setup |
| Frontend | React + Vite | Fast dev, modern tooling |
| 3D Avatar | Three.js + @react-three/fiber | Declarative 3D in React |
| Backend | Express.js | Simple REST API |
| Dictionary | JSON file | Easy to edit, no DB needed |

## Adding New Signs

Edit `server/src/data/lst-dictionary.json`:

```json
{
  "word": "new_word",
  "animation": "sign_new_word",
  "category": "greetings",
  "duration": 1.5,
  "description": "Description of the gesture"
}
```

Then add the corresponding animation to the avatar model or animation clips.

## License

Built with ❤️ for AVST – Association Voix du Sourd de Tunisie
