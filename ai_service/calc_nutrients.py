import pandas as pd
import numpy as np

class NutritionRecommender:
    def __init__(self, food_data_list):
        # Chuyển list dictionary thành DataFrame
        self.df = pd.DataFrame(food_data_list)
    
    def calculate_bmr_tdee(self, age, gender, weight, height, activity_level):
        """
        Tính BMR & TDEE theo công thức Mifflin-St Jeor
        """
        try:
            w = float(weight)
            h = float(height)
            a = int(age)
        except (ValueError, TypeError):
            w, h, a = 60, 170, 25 

        # 1. Tính BMR
        if str(gender).lower() == 'male':
            bmr = (10 * w) + (6.25 * h) - (5 * a) + 5
        else:
            bmr = (10 * w) + (6.25 * h) - (5 * a) - 161
            
        # 2. Hệ số vận động (PAL)
        multipliers = {
            'Low': 1.2,      'Sedentary': 1.2,
            'Medium': 1.55,  'Moderate': 1.55,
            'High': 1.9,     'Active': 1.9
        }
        # Map input từ React sang chuẩn
        act_map = {
            'Sedentary': 'Low', 'Light': 'Low',
            'Moderate': 'Medium',
            'Heavy': 'High', 'Athlete': 'High'
        }
        # Xử lý trường hợp activity_level gửi lên không khớp key
        raw_level = act_map.get(activity_level, activity_level)
        pal = multipliers.get(raw_level, 1.55)
        
        return bmr * pal

    def get_recommendations(self, user_info, top_k=3):
        # 1. Tính TDEE
        tdee = self.calculate_bmr_tdee(
            user_info.get('age', 25), 
            user_info.get('gender', 'Male'), 
            user_info.get('weight', 60), 
            user_info.get('height', 170), 
            user_info.get('activityLevel', 'Medium')
        )
        
        # 2. Mục tiêu
        goal = user_info.get('goal', 'Maintain Weight')
        if goal == 'Lose Weight': target = tdee - 500
        elif goal == 'Gain Muscle': target = tdee + 300
        else: target = tdee
            
        # 3. Target bữa ăn (35%)
        meal_target = target * 0.35
        print(f"Target Meal Calories: {meal_target:.0f}")

        # 4. Tính điểm
        def score(row):
            energy = pd.to_numeric(row['Energy'], errors='coerce') or 0
            return abs(energy - meal_target)

        df_work = self.df.copy()
        df_work['diff'] = df_work.apply(score, axis=1)
        
        # Sắp xếp
        results = df_work.sort_values('diff').head(top_k)
        
        # Tạo lý do
        def get_reason(row):
            energy = pd.to_numeric(row['Energy'], errors='coerce') or 0
            diff_val = energy - meal_target
            if abs(diff_val) < 100: return "Lượng calo hoàn hảo cho bạn"
            if diff_val < 0: return "Nhẹ bụng, phù hợp mục tiêu"
            return "Giàu năng lượng, đủ chất"

        results['reason'] = results.apply(get_reason, axis=1)
        results['highlight'] = "Recommended"

        results = results.rename(columns={
            'Energy': 'calories',
            'Protein': 'protein',
            'Carbohydrate': 'carbs',
            'Fat': 'fat'
        })
        # ---------------------------------------------

        return results.to_dict('records')