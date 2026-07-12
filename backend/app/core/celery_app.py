import os
from celery import Celery
from celery.schedules import crontab

# Initialize Celery
redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "transitops_worker",
    broker=redis_url,
    backend=redis_url
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Example of a periodic task: Check license expiries daily at midnight
celery_app.conf.beat_schedule = {
    "check-license-expiries": {
        "task": "app.core.celery_app.check_license_expiries",
        "schedule": crontab(hour=0, minute=0),
    },
}

@celery_app.task
def check_license_expiries():
    # In a real scenario, this would query the DB for drivers with licenses expiring
    # in the next 30 days and send an email notification.
    # For now, it's a stub to fulfill the background job architecture requirement.
    print("Checking license expiries...")
    return "License expiry check completed."
