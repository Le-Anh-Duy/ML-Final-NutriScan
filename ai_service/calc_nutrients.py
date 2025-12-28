from typing import Literal
import pandas as pd
import numpy as np

# --- 1. CLASS TÍNH TOÁN NHU CẦU DINH DƯỠNG ---
class HealthInfo:
    def __init__(self, age_months: int, gender: Literal['Male', 'Female'], weight: float, height: int, activity_level: Literal['Low', 'Medium', 'High']):
        self.age = age_months
        # Fix lỗi: Nếu giới tính lạ (Prefer not to say), mặc định về Male
        if gender not in ['Male', 'Female']:
            self.gender = 'Male'
        else:
            self.gender = gender
            
        self.weight = weight
        self.height = height
        self.activity_level = activity_level

        # Data derived from uploaded CSVs (Reference data)
        self.data = {
            'Protein': {'Male': [1.86, 2.22, 2.22, 1.63, 1.55, 1.43, 1.43, 1.43, 1.37, 1.25, 1.13, 1.13, 1.13, 1.13], 'Female': [1.86, 2.22, 2.22, 1.63, 1.55, 1.43, 1.43, 1.39, 1.3, 1.17, 1.13, 1.13, 1.13, 1.13]},
            'Lipid': {'Male': [(24.0, 37.0), (22.0, 29.0), (23.0, 31.0), (33.0, 44.0), (36.0, 51.0), (35.0, 52.0), (40.0, 61.0), (48.0, 72.0), (56.0, 83.0), (63.0, 94.0), (57.0, 71.0), (52.0, 65.0), (52.0, 65.0), (49.0, 61.0)], 'Female': [(22.0, 33.0), (20.0, 27.0), (22.0, 29.0), (31.0, 41.0), (34.0, 48.0), (32.0, 49.0), (38.0, 58.0), (44.0, 66.0), (51.0, 77.0), (53.0, 79.0), (46.0, 57.0), (45.0, 56.0), (44.0, 55.0), (40.0, 51.0)]},
            'MUFA_PUFA': {'Male': [0.0, 10.8, 11.7, 16.7, 15.9, 19.2, 22.2, 26.3, 30.6, 34.5, 31.4, 28.7, 28.54, 26.8], 'Female': [0.0, 10.0, 10.8, 15.34, 15.0, 17.8, 21.1, 24.2, 28.2, 29.1, 25.1, 24.6, 24.2, 22.2]},
            'Glucid': {'Male': [(80.0, 90.0), (90.0, 100.0), (100.0, 110.0), (140.0, 150.0), (190.0, 200.0), (210.0, 230.0), (250.0, 270.0), (290.0, 320.0), (300.0, 340.0), (400.0, 440.0), (370.0, 400.0), (330.0, 360.0), (320.0, 250.0), (300.0, 320.0)], 'Female': [(75.0, 80.0), (85.0, 95.0), (95.0, 105.0), (135.0, 145.0), (175.0, 190.0), (200.0, 220.0), (230.0, 250.0), (230.0, 260.0), (280.0, 300.0), (330.0, 370.0), (320.0, 360.0), (290.0, 320.0), (280.0, 310.0), (250.0, 280.0)]},
            'Fiber': {'Male': [0, 0, 0, 19.0, (20.0, 21.0), (22.0, 23.0), (24.0, 26.0), (27.0, 28.0), (29.0, 31.0), 38.0, 38.0, 38.0, 30.0, 30.0], 'Female': [0, 0, 0, 19.0, (20.0, 21.0), (22.0, 23.0), (24.0, 25.0), 26.0, 26.0, 25.0, 25.0, 21.0, 21.0, 21.0]},
            'Calcium': {'Male': [300.0, 400.0, 400.0, 500.0, 600.0, 650.0, 700.0, 1000.0, 1000.0, 1000.0, 800.0, 800.0, 800.0, 1000.0], 'Female': [300.0, 400.0, 400.0, 500.0, 600.0, 650.0, 700.0, 1000.0, 1000.0, 1000.0, 800.0, 800.0, 900.0, 1000.0]},
            'Iron': {'Male': [0.93, 8.5, 9.4, 5.4, 5.5, 7.2, 8.9, 11.3, 15.3, 17.5, 11.9, 11.9, 11.9, 11.0], 'Female': [0.93, 7.9, 8.7, 5.1, 5.4, 7.1, 8.9, 10.5, 14.0, 29.7, 26.1, 26.1, 10.0, 9.4]},
            'Zinc': {'Male': [2.8, 4.1, 4.1, 4.1, 4.8, 5.6, 6.0, 8.6, 9.0, 10.0, 10.0, 10.0, 10.0, 9.0], 'Female': [2.8, 4.1, 4.1, 4.1, 4.8, 5.6, 5.6, 7.2, 8.0, 8.0, 8.0, 8.0, 8.0, 7.0]},
            'VitaminA': {'Male': [0, 0, 400.0, 500.0, 450.0, 500.0, 600.0, 800.0, 900.0, 850.0, 850.0, 900.0, 850.0, 800.0], 'Female': [0, 0, 350.0, 400.0, 500.0, 450.0, 500.0, 600.0, 800.0, 900.0, 850.0, 900.0, 850.0, 800.0]},
            'VitaminC': {'Male': [0, 0, 0, 35.0, 40.0, 55.0, 60.0, 75.0, 95.0, 100.0, 100.0, 100.0, 100.0, 100.0], 'Female': [0, 0, 0, 35.0, 40.0, 55.0, 60.0, 75.0, 95.0, 100.0, 100.0, 100.0, 100.0, 100.0]},
            'Magnesium': {'Male': [40.0, 50.0, 60.0, 70.0, 100.0, 130.0, 170.0, 210.0, 290.0, 350.0, 340.0, 370.0, 350.0, 320.0], 'Female': [40.0, 50.0, 60.0, 70.0, 100.0, 130.0, 160.0, 210.0, 280.0, 300.0, 270.0, 290.0, 290.0, 260.0]},
            'Sodium': {'Male': [101.0, 601.0, 900.0, 1100.0, 1300.0, 1600.0, 1900.0, 2000.0, 2000.0, 2000.0, 2000.0, 2000.0, 2000.0, 2000.0], 'Female': [101.0, 601.0, 900.0, 1100.0, 1300.0, 1600.0, 1900.0, 2000.0, 2000.0, 2000.0, 2000.0, 2000.0, 2000.0, 2000.0]},
            'Potassium': {'Male': [400.0, 700.0, 700.0, 900.0, 1100.0, 1300.0, 1600.0, 1900.0, 2400.0, 2800.0, 2500.0, 2500.0, 2500.0, 2500.0], 'Female': [400.0, 700.0, 700.0, 900.0, 1100.0, 1200.0, 1500.0, 1800.0, 2200.0, 2100.0, 2000.0, 2000.0, 2000.0, 2000.0]},
            'Energy': {
                'Male': {'Low': [0, 0, 0, 0, 0, 1360.0, 1600.0, 1880.0, 2200.0, 2500.0, 2200.0, 2010.0, 2000.0, 1870.0], 'Medium': [550.0, 650.0, 700.0, 1000.0, 1320.0, 1570.0, 1820.0, 2150.0, 2500.0, 2820.0, 2570.0, 2350.0, 2330.0, 2190.0], 'High': [0, 0, 0, 0, 0, 1770.0, 2050.0, 2400.0, 2790.0, 3140.0, 2940.0, 2680.0, 2660.0, 2520.0]},
                'Female': {'Low': [0, 0, 0, 0, 0, 1270.0, 1510.0, 1740.0, 2040.0, 2110.0, 1760.0, 1730.0, 1700.0, 1500.0], 'Medium': [500.0, 600.0, 650.0, 930.0, 1230.0, 1460.0, 1730.0, 1980.0, 2310.0, 2380.0, 2050.0, 2010.0, 1980.0, 1820.0], 'High': [0, 0, 0, 0, 0, 1650.0, 1940.0, 2220.0, 2580.0, 2650.0, 2340.0, 2300.0, 2260.0, 2090.0]}
            }
        }

    def _get_age_index(self) -> int:
        if self.age <= 5: return 0
        elif 6 <= self.age <= 8: return 1
        elif 9 <= self.age < 12: return 2
        elif 12 <= self.age < 36: return 3
        elif 36 <= self.age < 72: return 4
        elif 72 <= self.age < 96: return 5
        elif 96 <= self.age < 120: return 6
        elif 120 <= self.age < 144: return 7
        elif 144 <= self.age < 180: return 8
        elif 180 <= self.age < 240: return 9
        elif 240 <= self.age < 360: return 10
        elif 360 <= self.age < 600: return 11
        elif 600 <= self.age < 840: return 12
        return 13
            
    def _get_val(self, nutrient: str):
        vals = self.data[nutrient][self.gender]
        idx = self._get_age_index()
        if idx >= len(vals): idx = len(vals) - 1
        return vals[idx]

    def _resolve_range(self, val):
        if isinstance(val, tuple):
            return (val[0] + val[1]) / 2
        return val

    def calc_nutrients(self):
        idx = self._get_age_index()
        energy_data = self.data['Energy'][self.gender]
        
        act = self.activity_level
        if act not in energy_data:
            act = 'Medium'
            
        energy_val = energy_data[act][idx]
        if energy_val == 0:
            energy_val = energy_data['Medium'][idx]
        
        protein_per_kg = self._get_val('Protein')
        protein_g = protein_per_kg * self.weight
        
        lipid_pct = self._resolve_range(self._get_val('Lipid'))
        lipid_g = (energy_val * lipid_pct / 100) / 9
        
        mufa_pct = self._get_val('MUFA_PUFA')
        mufa_g = (energy_val * mufa_pct / 100) / 9
        
        glucid_g = self._resolve_range(self._get_val('Glucid'))
        fiber_g = self._resolve_range(self._get_val('Fiber'))

        res = {
            'Beta-carotene': 0,
            'Calcium': self._get_val('Calcium'),
            'Carbohydrate': glucid_g,
            'Energy': energy_val,
            'Fat': lipid_g,
            'Fiber': fiber_g,
            'Glucid': glucid_g,
            'Iron': self._get_val('Iron'),
            'Lipid': lipid_g,
            'MUFA+PUFA': mufa_g,
            'Magnesium': self._get_val('Magnesium'),
            'Potassium': self._get_val('Potassium'),
            'Protein': protein_g,
            'Sodium': self._get_val('Sodium'),
            'Vitamin A': self._get_val('VitaminA'),
            'Vitamin C': self._get_val('VitaminC'),
            'Zinc': self._get_val('Zinc')
        }
        return res


# --- 2. CLASS GỢI Ý MÓN ĂN ---
class NutritionRecommender:
    def __init__(self, food_data_list):
        self.df = pd.DataFrame(food_data_list)
        
        # --- FIX TRÙNG LẶP: Xóa các món có tên giống nhau ---
        if not self.df.empty and 'name' in self.df.columns:
            # Xóa khoảng trắng thừa ở tên
            self.df['name'] = self.df['name'].astype(str).str.strip()
            # Drop duplicates, giữ lại món đầu tiên
            self.df = self.df.drop_duplicates(subset=['name'], keep='first')
        
        # Ép kiểu số an toàn
        numeric_cols = ['Energy', 'Protein', 'Fat', 'Carbohydrate', 'Fiber']
        for col in numeric_cols:
            if col in self.df.columns:
                self.df[col] = pd.to_numeric(self.df[col], errors='coerce').fillna(0)

    def calculate_match_score(self, row, target, weights):
        score = 0
        features = ['Energy', 'Protein', 'Fat', 'Carbohydrate']
        for feature in features:
            t = target.get(feature, 0)
            val = row.get(feature, 0)
            if t <= 0: t = 1 
            error = abs(val - t) / t
            score += error * weights.get(feature, 1.0)
        return score

    def recommend(self, target_nutrition, top_n=5, weights=None):
        if self.df.empty: return []
        if weights is None:
            weights = {'Energy': 2.0, 'Protein': 1.0, 'Fat': 1.0, 'Carbohydrate': 1.0}
            
        work_df = self.df.copy()
        work_df['match_score'] = work_df.apply(
            lambda row: self.calculate_match_score(row, target_nutrition, weights), axis=1
        )
        
        if target_nutrition.get('Energy', 0) > 100:
            lower = target_nutrition['Energy'] * 0.3
            upper = target_nutrition['Energy'] * 1.7
            work_df = work_df[
                (work_df['Energy'] >= lower) & (work_df['Energy'] <= upper)
            ]
            
        results = work_df.sort_values('match_score').head(top_n)
        return results

    # Helper ép kiểu an toàn
    def safe_float(self, value, default=0.0):
        try:
            if value is None or str(value).strip() == "": return default
            return float(value)
        except ValueError: return default
            
    def safe_int(self, value, default=0):
        try:
            if value is None or str(value).strip() == "": return default
            return int(float(value)) 
        except ValueError: return default

    def get_recommendations(self, user_profile, eaten_today=None):
        try:
            # 1. Lấy thông tin & Validate
            weight = self.safe_float(user_profile.get('weight'), 60.0)
            height = self.safe_float(user_profile.get('height'), 170.0)
            age_years = self.safe_int(user_profile.get('age'), 25)
            age_months = age_years * 12 
            
            # Fix lỗi 'Prefer not to say' -> Default về Male
            raw_gender = user_profile.get('gender', 'Male')
            gender = raw_gender if raw_gender in ['Male', 'Female'] else 'Male'
            
            act_map = {
                'Sedentary': 'Low', 'Light': 'Low', 
                'Moderate': 'Medium', 'Active': 'High', 'Very Active': 'High',
                'Low': 'Low', 'Medium': 'Medium', 'High': 'High'
            }
            activity_input = user_profile.get('activityLevel', 'Medium')
            activity_level = act_map.get(activity_input, 'Medium')

            health_calc = HealthInfo(age_months, gender, weight, height, activity_level)
            daily_needs = health_calc.calc_nutrients()
            
            # 2. XÁC ĐỊNH MỤC TIÊU
            target = {}
            eaten_energy = 0
            if eaten_today:
                eaten_energy = self.safe_float(eaten_today.get('calories') or eaten_today.get('Energy'))
            
            if not eaten_today or eaten_energy == 0:
                print("🍽️ User chưa ăn -> Gợi ý bữa chuẩn.")
                meal_ratio = 0.35 
                target = {
                    'Energy': daily_needs['Energy'] * meal_ratio,
                    'Protein': daily_needs['Protein'] * meal_ratio,
                    'Fat': daily_needs['Lipid'] * meal_ratio,
                    'Carbohydrate': daily_needs['Glucid'] * meal_ratio
                }
            else:
                print("🍽️ User đã ăn -> Tính bù trừ.")
                eaten_protein = self.safe_float(eaten_today.get('protein') or eaten_today.get('Protein'))
                eaten_fat = self.safe_float(eaten_today.get('fat') or eaten_today.get('Fat'))
                eaten_carbs = self.safe_float(eaten_today.get('carbs') or eaten_today.get('Carbohydrate'))

                remaining_energy = daily_needs['Energy'] - eaten_energy

                if remaining_energy < 200:
                    return [{
                        'name': 'Đã đủ năng lượng',
                        'Energy': 0, 'Protein': 0, 'Fat': 0, 'Carbohydrate': 0,
                        'calories': 0, 'protein': 0, 'fat': 0, 'carbs': 0, # Map cho frontend
                        'image': 'https://cdn-icons-png.flaticon.com/512/2738/2738805.png',
                        'reason': 'Hôm nay bạn đã ăn đủ rồi!',
                        'match_score': 0
                    }]

                ratio = 0.4 if remaining_energy > 800 else 1.0
                
                target = {
                    'Energy': remaining_energy * ratio,
                    'Protein': max(0, (daily_needs['Protein'] - eaten_protein) * ratio),
                    'Fat': max(0, (daily_needs['Lipid'] - eaten_fat) * ratio),
                    'Carbohydrate': max(0, (daily_needs['Glucid'] - eaten_carbs) * ratio)
                }

            print(f"🎯 Target: {target['Energy']:.0f} kcal")
            
            weights = {'Energy': 3.0, 'Protein': 1.5, 'Fat': 0.5, 'Carbohydrate': 0.5}
            recommendations = self.recommend(target, top_n=5, weights=weights)
            
            def get_reason(row):
                diff = row['Energy'] - target['Energy']
                if abs(diff) < 150: return "Lượng calo phù hợp"
                if diff < 0: return "Món nhẹ bụng"
                return "Giàu năng lượng"

            if not recommendations.empty:
                recommendations['reason'] = recommendations.apply(get_reason, axis=1)
                
                # --- QUAN TRỌNG: MAP TÊN KEY CHO FRONTEND ---
                final_results = recommendations.to_dict('records')
                for item in final_results:
                    item['calories'] = item.get('Energy', 0)
                    item['carbs'] = item.get('Carbohydrate', 0)
                    item['protein'] = item.get('Protein', 0)
                    item['fat'] = item.get('Fat', 0)
                    item['fiber'] = item.get('Fiber', 0)
                
                return final_results
            else:
                return []

        except Exception as e:
            print(f"❌ Lỗi tính toán dinh dưỡng: {e}")
            import traceback
            traceback.print_exc()
            return []