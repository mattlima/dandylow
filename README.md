# Dandylow - Sight Reading Practice Tool

An interactive web-based sight-reading practice application for learning to read music notation, inspired by the Georges Dandelot method. Perfect for young students learning to identify notes on the musical staff.

![Sight Reading Practice](https://github.com/user-attachments/assets/6bc1b17a-be4d-41a2-acd5-7b55df906462)

## Features

### Progressive Learning System (7 Levels)
- **Level 1**: C only
- **Level 2**: C, G
- **Level 3**: C, G, F
- **Level 4**: C, G, F, D
- **Level 5**: C, G, F, D, A
- **Level 6**: C, G, F, D, A, E
- **Level 7**: All notes (C, G, F, D, A, E, B)

### Dual Clef Support
- **Treble Clef**: Notes ranging from C4 to C6
- **Bass Clef**: Notes ranging from E2 to E4
- **Grand Staff**: Notes ranging from C2 to C6 (low C two ledger lines below bass to high C two ledger lines above treble)
- Easy toggle between clefs and grand staff

### Two Input Modes

#### 1. Microphone Mode (Real-time Pitch Detection)
- Uses your device's microphone to detect played notes
- Works with any instrument (piano, guitar, voice, etc.)
- Real-time pitch detection with visual feedback
- Volume meter to show microphone activity
- Octave-independent matching (any C matches a C on the staff)
- ±30 cents tolerance for tuning accuracy

#### 2. On-Screen Keyboard Mode
- Visual piano keyboard with 12 keys (C through B, including sharps)
- Perfect fallback when microphone isn't available
- Realistic piano key design with white and black keys
- Click or tap to play notes

### Interactive Learning Experience
- **Instant Feedback**: Green celebration messages for correct answers, red error messages with the correct note
- **Score Tracking**: Shows correct answers out of total attempts
- **Accuracy Percentage**: Real-time calculation of success rate
- **Streak Counter**: Track consecutive correct answers with fire emoji 🔥
- **Celebratory Animations**: Fun animations when you get it right!

### Child-Friendly Design
- Colorful, engaging interface with gradient backgrounds
- Large, clear musical notation rendered with VexFlow
- Easy-to-read buttons and controls
- Responsive design works on tablets and computers
- Simple, intuitive controls

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mattlima/dandylow.git
cd dandylow
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:1234`

### Production Build

Build the application for production:
```bash
npm run build
```

The built files will be in the `dist` folder.

### Clean Build Artifacts

```bash
npm run clean
```

## How to Use

1. **Select Your Level**: Choose from Level 1 (easiest - C only) to Level 7 (all notes)
2. **Choose Your Clef**: Select Treble or Bass clef based on what you're learning
3. **Pick Input Mode**:
   - Use **Microphone** to play notes on a real instrument
   - Use **Keyboard** to click the on-screen piano
4. **Read the Note**: Look at the musical staff and identify the note
5. **Play the Note**:
   - In microphone mode: Play the note on your instrument or sing it
   - In keyboard mode: Click the correct key
6. **Get Feedback**: See if you got it right!
7. **Track Progress**: Watch your score, accuracy, and streak improve

## Technologies Used

- **VexFlow**: Professional music notation rendering
- **Pitchy**: High-quality pitch detection library
- **Web Audio API**: Real-time audio processing
- **Parcel**: Fast, zero-config bundler
- **Modern JavaScript (ES6+)**: Clean, maintainable code
- **CSS3**: Beautiful, responsive styling

## Browser Compatibility

Works best on modern browsers that support:
- Web Audio API
- MediaDevices API (for microphone access)
- ES6+ JavaScript
- SVG rendering

Recommended browsers:
- Chrome/Edge 80+
- Firefox 75+
- Safari 13+

## Microphone Permissions

When using microphone mode for the first time, your browser will ask for permission to access your microphone. Click "Allow" to enable pitch detection. If you deny permission, you can still use the on-screen keyboard mode.

## Educational Benefits

This tool helps students:
- **Develop sight-reading skills** through progressive difficulty
- **Learn note positions** on both treble and bass clefs
- **Build muscle memory** by practicing with real instruments
- **Track improvement** with scoring and accuracy metrics
- **Stay motivated** with immediate feedback and streak tracking
- **Practice independently** with no teacher supervision required

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Inspired by the Georges Dandelot sight-reading method
- Built with love for young musicians learning to read music

---

Made with 🎵 for aspiring musicians everywhere!
