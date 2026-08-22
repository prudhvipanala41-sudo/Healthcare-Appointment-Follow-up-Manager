from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Update 'booked' to 'confirmed' directly in the database
    db.session.execute(text("UPDATE appointments SET status = 'confirmed' WHERE status = 'booked'"))
    
    # We should also disable/re-enable pragmas if needed, but for simple text change, this works.
    db.session.commit()
    print("Migrated appointments from booked to confirmed.")
