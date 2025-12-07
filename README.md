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

## AI Backend Integration
The application currently uses a mock AI service (`src/services/aiService.js`) for demonstration purposes. To connect it to a real Python AI backend:

1. **Set up the Python Backend**:
   Ensure your Python API is running (e.g., on `http://localhost:5000`) and accepts POST requests with an image file.

2. **Configure Environment Variables**:
   Add the API URL to your `.env` file:
   ```env
   VITE_AI_API_URL=http://localhost:5000/predict
   ```

3. **Update the Service**:
   Modify `src/services/aiService.js` to make actual API calls:

   ```javascript
   export const analyzeImage = async (imageFile) => {
       const formData = new FormData();
       formData.append('file', imageFile);

       try {
           const response = await fetch(import.meta.env.VITE_AI_API_URL, {
               method: 'POST',
               body: formData,
           });

           if (!response.ok) throw new Error('AI Analysis failed');

           const data = await response.json();
           return data; // Ensure backend returns { predictions: [], bestMatch: {} }
       } catch (error) {
           console.error("AI Service Error:", error);
           throw error;
       }
   };
   ```

## Recommendation System Logic

### Daily Recommendations
The "Daily Recommendations" feature (`src/pages/DailyRecommendations.jsx`) provides curated meal suggestions based on the user's health profile.

**Selection Rules:**
The logic is currently handled in `src/services/aiService.js` (`getDailyRecommendations` function):
- **Lose Weight**: Filters for foods with **< 400 calories**.
- **Gain Muscle**: Filters for foods with **> 20g protein**.
- **Maintain Weight / Other**: Selects random balanced meals from the database.

**Update Frequency:**
- **Current Implementation**: Recommendations are generated on-the-fly each time the user visits the page or refreshes.
- **Future Improvement**: To make this a true "Daily" recommendation:
  1. The backend should generate the list once every 24 hours (e.g., via a cron job or scheduled Cloud Function).
  2. Store the generated list in Firestore under a `daily_recommendations` collection linked to the user ID and the current date.
  3. The frontend should check Firestore first; if a recommendation for today exists, display it. If not, trigger the generation logic.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.