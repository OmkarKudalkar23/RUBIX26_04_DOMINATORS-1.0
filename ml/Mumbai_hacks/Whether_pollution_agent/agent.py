# agent.py
from datetime import datetime, time as dtime

PM25_COLLECT_THRESHOLD = 150
PM25_PREDICT_THRESHOLD = 200


def decision_agent(state):
    # If city is provided, always collect data
    # Preserve the city in the decision output so it's available downstream
    city = state.get("city")
    if city:
        return {"decision": {"collect": "yes", "predict": "no"}, "city": city}
    
    now_str = state.get("time")
    if now_str:
        try:
            now_dt = datetime.fromisoformat(now_str)
        except Exception:
            now_dt = datetime.now()
    else:
        now_dt = datetime.now()

    pollution = state.get("pollution") or {}
    pm25 = pollution.get("pm25") or pollution.get("value") or pollution.get("aqi")

    try:
        pm25 = float(pm25)
    except Exception:
        pm25 = None

    collect = "no"
    predict = "no"

    if dtime(0, 0) <= now_dt.time() <= dtime(1, 0):
        collect = "yes"

    if now_dt.hour == 6:
        predict = "yes"

    if pm25 is not None:
        if pm25 >= PM25_COLLECT_THRESHOLD:
            collect = "yes"
        if pm25 >= PM25_PREDICT_THRESHOLD:
            predict = "yes"

    if pm25 is not None and pm25 >= PM25_PREDICT_THRESHOLD:
        collect = "yes"
        predict = "yes"

    return {"decision": {"collect": collect, "predict": predict}}


if __name__ == "__main__":
    # Test the decision agent with sample data
    test_state = {
        "city": "Mumbai",
        "time": datetime.now().isoformat(),
        "pollution": {"pm25": 180}
    }
    
    result = decision_agent(test_state)
    print("Decision Agent Result:")
    print(result)
