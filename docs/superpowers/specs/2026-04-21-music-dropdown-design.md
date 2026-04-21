# Music Dropdown Feature Design

## Overview
Replace the single "Lofi Girl" button in the navbar with a music dropdown that allows switching between different music genres.

## Music Options
| Genre | YouTube URL |
|-------|-------------|
| Lo-fi | https://www.youtube.com/watch?v=jfKfPfyJRdk |
| Classical | https://www.youtube.com/watch?v=rR3Spmdj3LU |
| Jazz | https://www.youtube.com/watch?v=6aM31dzlXVM |

## Behavior
- Click music icon in navbar → dropdown appears with smooth animation
- Hover over options → highlight effect
- Click an option → opens YouTube in new tab, closes dropdown, shows "now playing" state
- Only one music type plays at a time
- Dropdown closes when clicking outside

## UI/UX
- Dropdown with backdrop blur and subtle shadow
- Each option shows genre name and music icon
- Currently playing genre shows animated bars indicator
- Dropdown closes on outside click

## States
- **Idle**: Music icon only
- **Open**: Dropdown visible
- **Playing**: Icon pulses, shows active genre indicator

## Implementation Notes
- Replace existing Lofi Girl button component in page.tsx
- Use existing framer-motion for animations
- Reuse current `isLofiPlaying` and `setIsLofiPlaying` state (rename to `currentMusicGenre` / `setCurrentMusicGenre`)