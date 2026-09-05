from datetime import date, timedelta


def monday_of(value: date) -> date:
    return value - timedelta(days=value.weekday())

def week_bounds(value: date) -> tuple[date, date]:
    start = monday_of(value)
    return start, start + timedelta(days=6)

def current_week_bounds(today: date | None = None) -> tuple[date, date]:
    return week_bounds(today or date.today())
