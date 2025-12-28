import { removeAccents } from '../utils/helpers';

export const foodDatabase = [
    {
        name: 'Bun Bo Hue',
        calories: 600,
        protein: 25,
        carbs: 68,
        fat: 22,
        tags: ['Spicy', 'Vietnamese', 'Noodles', 'Beef'],
        description: 'A spicy Vietnamese beef noodle soup with lemongrass and shrimp paste.'
    },
    {
        name: 'Pho Ga',
        calories: 450,
        protein: 28,
        carbs: 55,
        fat: 12,
        tags: ['Vietnamese', 'Noodles', 'Chicken', 'Comfort Food'],
        description: 'Traditional Vietnamese chicken noodle soup with aromatic herbs.'
    },
    {
        name: 'Banh Mi',
        calories: 520,
        protein: 22,
        carbs: 48,
        fat: 26,
        tags: ['Vietnamese', 'Sandwich', 'Pork', 'Pickled Vegetables'],
        description: 'Vietnamese baguette sandwich filled with savory meats and fresh vegetables.'
    },
    {
        name: 'Com Tam',
        calories: 680,
        protein: 32,
        carbs: 72,
        fat: 28,
        tags: ['Vietnamese', 'Rice', 'Pork', 'Grilled'],
        description: 'Broken rice with grilled pork chop, egg, and pickled vegetables.'
    },
    {
        name: 'Goi Cuon',
        calories: 180,
        protein: 12,
        carbs: 28,
        fat: 4,
        tags: ['Vietnamese', 'Appetizer', 'Fresh', 'Healthy'],
        description: 'Fresh spring rolls with shrimp, pork, herbs, and vermicelli.'
    },
    {
        name: 'Ca Kho To',
        calories: 350,
        protein: 30,
        carbs: 15,
        fat: 18,
        tags: ['Vietnamese', 'Fish', 'Savory', 'Caramelized'],
        description: 'Caramelized fish in clay pot, typically served with white rice.'
    },
    {
        name: 'Banh Xeo',
        calories: 580,
        protein: 18,
        carbs: 62,
        fat: 32,
        tags: ['Vietnamese', 'Pancake', 'Crispy', 'Pork'],
        description: 'Crispy Vietnamese savory pancake filled with pork, shrimp, and bean sprouts.'
    },
    {
        name: 'Bun Cha',
        calories: 550,
        protein: 28,
        carbs: 65,
        fat: 20,
        tags: ['Vietnamese', 'Noodles', 'Pork', 'Grilled'],
        description: 'Grilled pork and noodles served with herbs and dipping sauce.'
    },
    {
        name: 'Mi Quang',
        calories: 540,
        protein: 26,
        carbs: 60,
        fat: 24,
        tags: ['Vietnamese', 'Noodles', 'Turmeric', 'Central Vietnam'],
        description: 'Turmeric-infused noodles with meat, shrimp, and fresh herbs.'
    },
    {
        name: 'Hu Tieu',
        calories: 480,
        protein: 24,
        carbs: 58,
        fat: 16,
        tags: ['Vietnamese', 'Noodles', 'Pork', 'Seafood'],
        description: 'Pork and seafood noodle soup, popular in Southern Vietnam.'
    },
    {
        name: 'Burger',
        calories: 550,
        protein: 25,
        carbs: 45,
        fat: 30,
        tags: ['American', 'Fast Food', 'Beef'],
        description: 'Classic beef burger with lettuce, tomato, and cheese.'
    },
    {
        name: 'Pizza Slice',
        calories: 285,
        protein: 12,
        carbs: 36,
        fat: 10,
        tags: ['Italian', 'Fast Food', 'Cheese'],
        description: 'Slice of pepperoni pizza with mozzarella cheese.'
    },
    {
        name: 'Caesar Salad',
        calories: 350,
        protein: 15,
        carbs: 12,
        fat: 28,
        tags: ['Salad', 'Healthy', 'Vegetables'],
        description: 'Romaine lettuce with croutons, parmesan cheese, and caesar dressing.'
    },
    {
        name: 'Sushi Roll',
        calories: 300,
        protein: 10,
        carbs: 50,
        fat: 6,
        tags: ['Japanese', 'Seafood', 'Rice'],
        description: 'California roll with crab, avocado, and cucumber.'
    },
    {
        name: 'Pad Thai',
        calories: 650,
        protein: 20,
        carbs: 85,
        fat: 25,
        tags: ['Thai', 'Noodles', 'Spicy'],
        description: 'Stir-fried rice noodle dish with eggs, peanuts, and shrimp.'
    }
];

export const getNutritionForFood = (aiFoodName) => {
    const cleanAiName = removeAccents(aiFoodName);

    const food = foodDatabase.find(f => {
        const cleanDbName = removeAccents(f.name);
        return cleanDbName === cleanAiName || cleanDbName.includes(cleanAiName) || cleanAiName.includes(cleanDbName);
    });

    if (food) return food;
    
    return {
        name: aiFoodName, 
        calories: 300,    
        protein: 15,
        carbs: 40,
        fat: 10,
        tags: ['AI Detected'],
        description: 'Thông tin dinh dưỡng chưa có trong cơ sở dữ liệu.'
    };
};


