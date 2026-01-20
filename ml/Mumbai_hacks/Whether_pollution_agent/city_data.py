# city_data.py
"""
City-specific data and behavior patterns for Indian cities
"""

CITY_DATA = {
    "delhi": {
        "state": "Delhi",
        "coordinates": [77.2090, 28.6139],
        "characteristics": {
            "winter_smog": True,
            "north_india": True,
            "typical_aqi_range": (150, 400),
            "peak_pollution_months": [11, 12, 1, 2],
            "surge_multiplier": 1.3
        }
    },
    "mumbai": {
        "state": "Maharashtra",
        "coordinates": [72.8777, 19.0760],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (80, 200),
            "peak_pollution_months": [10, 11, 12],
            "surge_multiplier": 1.1,
            "humidity_factor": True
        }
    },
    "pune": {
        "state": "Maharashtra",
        "coordinates": [73.8567, 18.5204],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (70, 180),
            "peak_pollution_months": [11, 12, 1],
            "surge_multiplier": 1.0
        }
    },
    "jaipur": {
        "state": "Rajasthan",
        "coordinates": [75.7873, 26.9124],
        "characteristics": {
            "winter_smog": True,
            "north_india": True,
            "typical_aqi_range": (120, 300),
            "peak_pollution_months": [11, 12, 1, 2],
            "surge_multiplier": 1.2
        }
    },
    "bengaluru": {
        "state": "Karnataka",
        "coordinates": [77.5946, 12.9716],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (60, 150),
            "peak_pollution_months": [11, 12],
            "surge_multiplier": 1.0,
            "traffic_spikes": True
        }
    },
    "chennai": {
        "state": "Tamil Nadu",
        "coordinates": [80.2707, 13.0827],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (70, 180),
            "peak_pollution_months": [11, 12, 1],
            "surge_multiplier": 1.1,
            "construction_dust": True
        }
    },
    "hyderabad": {
        "state": "Telangana",
        "coordinates": [78.4867, 17.3850],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (80, 200),
            "peak_pollution_months": [11, 12, 1],
            "surge_multiplier": 1.1,
            "construction_dust": True,
            "heat_triggers": True
        }
    },
    "kolkata": {
        "state": "West Bengal",
        "coordinates": [88.3639, 22.5726],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (100, 250),
            "peak_pollution_months": [11, 12, 1],
            "surge_multiplier": 1.2,
            "post_monsoon_issues": True
        }
    },
    "indore": {
        "state": "Madhya Pradesh",
        "coordinates": [75.8577, 22.7196],
        "characteristics": {
            "winter_smog": True,
            "north_india": True,
            "typical_aqi_range": (100, 250),
            "peak_pollution_months": [11, 12, 1, 2],
            "surge_multiplier": 1.15
        }
    },
    "lucknow": {
        "state": "Uttar Pradesh",
        "coordinates": [80.9462, 26.8467],
        "characteristics": {
            "winter_smog": True,
            "north_india": True,
            "typical_aqi_range": (150, 400),
            "peak_pollution_months": [11, 12, 1, 2],
            "surge_multiplier": 1.4,
            "extreme_pm25": True
        }
    },
    "kanpur": {
        "state": "Uttar Pradesh",
        "coordinates": [80.3319, 26.4499],
        "characteristics": {
            "winter_smog": True,
            "north_india": True,
            "typical_aqi_range": (150, 450),
            "peak_pollution_months": [11, 12, 1, 2],
            "surge_multiplier": 1.5,
            "extreme_pm25": True
        }
    },
    "guwahati": {
        "state": "Assam",
        "coordinates": [91.7430, 26.1445],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (60, 150),
            "peak_pollution_months": [11, 12],
            "surge_multiplier": 0.9
        }
    },
    "ahmedabad": {
        "state": "Gujarat",
        "coordinates": [72.5714, 23.0225],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (90, 220),
            "peak_pollution_months": [11, 12, 1],
            "surge_multiplier": 1.1
        }
    },
    "surat": {
        "state": "Gujarat",
        "coordinates": [72.8311, 21.1702],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (70, 180),
            "peak_pollution_months": [11, 12],
            "surge_multiplier": 1.0
        }
    },
    "nagpur": {
        "state": "Maharashtra",
        "coordinates": [79.0882, 21.1458],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (80, 200),
            "peak_pollution_months": [11, 12, 1],
            "surge_multiplier": 1.1
        }
    },
    "patna": {
        "state": "Bihar",
        "coordinates": [85.1376, 25.5941],
        "characteristics": {
            "winter_smog": True,
            "north_india": True,
            "typical_aqi_range": (120, 300),
            "peak_pollution_months": [11, 12, 1, 2],
            "surge_multiplier": 1.2
        }
    },
    "kochi": {
        "state": "Kerala",
        "coordinates": [76.2673, 9.9312],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (50, 120),
            "peak_pollution_months": [11, 12],
            "surge_multiplier": 0.8
        }
    },
    "coimbatore": {
        "state": "Tamil Nadu",
        "coordinates": [76.9558, 11.0168],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (60, 140),
            "peak_pollution_months": [11, 12],
            "surge_multiplier": 0.9
        }
    },
    "vadodara": {
        "state": "Gujarat",
        "coordinates": [73.1812, 22.3072],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (80, 190),
            "peak_pollution_months": [11, 12, 1],
            "surge_multiplier": 1.0
        }
    },
    "visakhapatnam": {
        "state": "Andhra Pradesh",
        "coordinates": [83.2185, 17.6868],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (60, 150),
            "peak_pollution_months": [11, 12],
            "surge_multiplier": 0.9
        }
    },
    "thane": {
        "state": "Maharashtra",
        "coordinates": [72.9667, 19.1941],
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (80, 200),
            "peak_pollution_months": [10, 11, 12],
            "surge_multiplier": 1.1
        }
    }
}

FESTIVAL_DATES = {
    "diwali": [(10, 11), (11, 12), (10, 12)],  # October-November (varies by year)
    "holi": [(3, 3), (3, 4)],  # March
    "new_year": [(12, 31), (1, 1)],  # December 31 - January 1
    "christmas": [(12, 25), (12, 26)]
}

def get_city_data(city_name: str) -> dict:
    """Get city data by name (case-insensitive)"""
    city_lower = city_name.lower().strip()
    return CITY_DATA.get(city_lower, {
        "state": "Unknown",
        "coordinates": [77.2090, 28.6139],  # Default to Delhi coordinates
        "characteristics": {
            "winter_smog": False,
            "north_india": False,
            "typical_aqi_range": (80, 200),
            "peak_pollution_months": [11, 12],
            "surge_multiplier": 1.0
        }
    })

def is_festival_week(month: int, day: int) -> bool:
    """Check if current date falls in a festival week"""
    for festival, dates in FESTIVAL_DATES.items():
        for m, d in dates:
            if month == m and abs(day - d) <= 3:  # 3 days before/after
                return True
    return False

def is_winter_north_india(month: int, city_data: dict) -> bool:
    """Check if it's winter and city is in north India"""
    return month in [11, 12, 1, 2] and city_data["characteristics"].get("north_india", False)

