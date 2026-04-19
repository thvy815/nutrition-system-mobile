# Nutrition System Mobile - Smart Nutrition Recommendation System

## 1. Introduction

This project is a mobile application for nutrition tracking, developed using React Native.

The application allows users to monitor their daily food intake, track nutritional values, and analyze eating habits over time. 

It is being extended with workout tracking features to provide a more comprehensive health and fitness management experience.

It integrates with a backend system to provide real-time data synchronization, user authentication, and persistent storage.

The goal of this project is to provide a simple and efficient tool for users to manage their diet and improve their health.

---

## 2. Features

- User Authentication
  - Login and registration
  - Secure authentication via backend API

- Nutrition Tracking
  - Log daily meals and food intake
  - Track calories and macronutrients (protein, carbs, fat)

- Meal Management
  - Add, edit, and delete meals
  - View meal history

- Analytics & Insights
  - Daily nutrition summary
  - Track eating habits over time
 
- Workout Tracking (In Progress)
  - Create and manage workout plans
  - Track daily exercises and progress
  - Support basic workout logging

- User Profile
  - Manage personal information
  - Set basic nutrition goals

- Mobile Experience
  - Responsive mobile UI
  - Smooth navigation between screens

---

## 3. Technology Stack

- Mobile: React Native (Expo)
- Language: TypeScript / JavaScript
- Navigation: React Navigation / Expo Router
- State Management: React state (hooks)
- API Communication: REST API (Axios / Fetch)
- Backend Integration: Node.js backend system

---

## 4. Project Status

This project is currently under active development.

Core features such as authentication, meal tracking, and basic analytics have been implemented. The system is being extended with a workout tracking module to provide a more comprehensive fitness solution.

---

## 5. Planned Features

- Advanced workout tracking and progress analytics
- Personalized workout recommendations
- Integration between nutrition and workout data
- Advanced analytics and charts
- Nutrition recommendations based on user data
- Image-based food input (AI integration)
- Improved UI/UX design and animations
- Offline support and data caching
- Push notifications for reminders
- Unit and integration testing

---

## 6. System Architecture

The application follows a modular and component-based architecture:

- Screens: Main UI views (Home, Meals, Profile)
- Components: Reusable UI components
- Services: API communication layer
- Navigation: Handles routing between screens

This structure ensures maintainability, scalability, and code reusability.

---

## 7. Backend Integration

This mobile application connects to the backend system:

Backend Repository:
https://github.com/TuUyen038/nutrition-system

The backend provides APIs for:
- Authentication
- User management
- Meal and nutrition data
- Data persistence

---

## 8. Installation and Setup (Local)

### 8.1 Requirements

- Node.js (v16 or later)
- npm or yarn
- Expo CLI

---

### 8.2 Clone the repository

```bash
git clone https://github.com/thvy815/nutrition-system-mobile.git
cd nutrition-system-mobile
```

8.3 Install dependencies

```bash
npm install
```

8.4 Configure environment variables

Create a .env file:

```bash
API_BASE_URL=http://localhost:8080
```

8.5 Run the application

```bash
npm start
```

9. Deployment

The application can be run using Expo on mobile devices or emulators.

Future deployment may include publishing to app stores.

10. Notes

This project was developed as part of a team-based academic project in a Software Engineering course.

It demonstrates practical experience in building a mobile application, integrating frontend and backend systems, and applying real-world development practices
