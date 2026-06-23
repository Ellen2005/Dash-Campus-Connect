# **App Name**: Dash

## Core Features:

- Secure University Authentication: Users can register and log in securely with their university email address, including email verification, password reset, and session management using Firebase Authentication.
- Dynamic User Profiles: Members can create, personalize, and manage their profiles, including uploading avatars and cover photos via Cloudinary, and specifying academic affiliations, all stored within Firestore.
- Real-time Personalized Social Feed: A continuously updating feed displaying posts from followed users and official university announcements, with real-time new post indicators and infinite scrolling, powered by Firestore listeners.
- Interactive Posts & Reporting: Users can engage with posts through liking and commenting. An integrated system allows users to report inappropriate content, which triggers automated flagging for moderation, with all interactions managed in Firestore.
- AI-Powered Admin Broadcasting Tool: University administrators can compose and deliver targeted announcements with variable priority (Normal, Urgent, Emergency). An AI tool assists in crafting clear, impactful messages and suggesting optimal delivery parameters (e.g., FCM high-priority flags for emergency override), stored in Firestore.
- Core Admin Moderation Panel: A dedicated interface for university administrators to oversee the platform, including user management (suspension, role promotion), reviewing reported content from a flagged queue, and accessing an overview dashboard of key metrics using Firestore data.
- Instant Cross-Platform Notifications: Users receive real-time in-app and push notifications for social interactions and critical university alerts. These are configurable via personal preferences and delivered using Firebase Cloud Messaging (FCM) with notification data in Firestore.

## Style Guidelines:

- The primary UI color scheme is a sophisticated dark theme, 'Obsidian & Champagne', built around deep navy and black tones to convey authority and exclusivity.
- Primary accent color for interactive elements and highlights: Bright Gold (#D4B86A), for a touch of distinction against the dark background.
- Main background color: Deep Obsidian (#0F0F1A), forming the foundation of the dark theme.
- Secondary accent color for subtle details and actions: Light Platinum (#D0D2D8), providing contrast without overt vibrancy.
- Headlines and prominent titles utilize 'Sora' (sans-serif, Google Fonts), conveying a modern and authoritative presence with bold weights. Note: currently only Google Fonts are supported.
- Body text and descriptive content use 'DM Sans' (sans-serif, Google Fonts), chosen for its readability and versatility across various text lengths. Note: currently only Google Fonts are supported.
- For displaying technical or programmatic content such as API keys or QR data, 'JetBrains Mono' (monospace, Google Fonts) is specified. Note: currently only Google Fonts are supported.
- Cards feature rounded corners (12px radius) and a subtle 0.5px border, designed without shadows for a flat yet defined visual separation, enhancing clarity.
- Input fields maintain a touch-friendly height of 44px, with borders dynamically transitioning to the Bright Gold accent color upon focus for clear interactive feedback.
- The desktop navigation sidebar boasts a deep navy background. Active menu items are visually marked with a 3px champagne gold left border and a subtle gold-tinted background.
- Subtle 150ms transitions on card borders to Bright Gold are implemented for hover states, providing elegant and unobtrusive visual feedback.
- Minimalist animations are incorporated for real-time feed updates and notifications, such as a 'New posts' banner appearing gently, to signal fresh content without disrupting the user experience.