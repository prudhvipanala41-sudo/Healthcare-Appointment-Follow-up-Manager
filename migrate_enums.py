from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()


def migrate():
    with app.app_context():
        try:
            res = db.session.execute(text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'appointmentstatus';"))
            labels = [row[0] for row in res]
            print(f'Current labels: {labels}')

            new_values = [
                "PENDING", "CONFIRMED", "EJECTED", "CANCELLED", "COMPLETED", "RESCHEDULED",
                "pending", "confirmed", "rejected", "cancelled", "completed", "rescheduled"
            ]

            for val in new_values:
                if val not in labels:
                    print(f"Adding '{val}' to appointmentstatus...")
                    db.session.commit()
                    connection = db.engine.raw_connection()
                    connection.set_isolation_level(0)
                    cursor = connection.cursor()
                    try:
                        cursor.execute(f"ALTER TYPE appointmentstatus ADD VALUE '{val}';")
                        print(f"Success adding {val}")
                    except Exception as e:
                        print(f"Error adding {val}: {e}")
                    finally:
                        cursor.close()
                        connection.close()

            print("Migration complete!")
        cexcept Exception as e:
            print(f"Failed to migrate: {e}")

if __name__ == "__main__":
    migrate()