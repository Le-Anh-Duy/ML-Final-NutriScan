# Food Recommendation App

## Overview
The Food Recommendation App is a web application built with React and Vite that helps users discover and save their favorite food items. The app integrates with Firebase for authentication and data storage, providing a seamless experience for users to manage their food preferences.

## Features
- User authentication using Firebase
- Food item recommendations based on user preferences
- Ability to save favorite food items
- Responsive design with Tailwind CSS
- Navigation between different pages (Home, Recommendations, Favorites, Profile)

## Technologies Used
- **React**: A JavaScript library for building user interfaces
- **Vite**: A fast build tool and development server
- **Firebase**: For authentication and Firestore database
- **Tailwind CSS**: A utility-first CSS framework for styling
- **React Router**: For handling navigation within the app

## Project Structure
```
food-recommendation-app
├── src
│   ├── main.jsx
│   ├── App.jsx
│   ├── components
│   │   ├── layout
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Layout.jsx
│   │   └── common
│   │       ├── Button.jsx
│   │       └── Card.jsx
│   ├── pages
│   │   ├── Home.jsx
│   │   ├── Recommendations.jsx
│   │   ├── Favorites.jsx
│   │   └── Profile.jsx
│   ├── config
│   │   └── firebase.js
│   ├── hooks
│   │   └── useAuth.js
│   ├── context
│   │   └── AuthContext.jsx
│   ├── utils
│   │   └── helpers.js
│   └── styles
│       └── index.css
├── public
│   └── vite.svg
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .gitignore
├── .env.example
└── README.md
```

## Setup Instructions
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd food-recommendation-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase**:
   - Create a Firebase project and set up Firestore and Authentication.
   - Update the `src/config/firebase.js` file with your Firebase configuration.

4. **Run the application**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3000` to view the application.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.