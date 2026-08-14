import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
hashed = pwd_context.hash("password123")

conn = sqlite3.connect("../tvt_dev.db")
cursor = conn.cursor()
cursor.execute("UPDATE users SET hashed_password = ? WHERE username = 'admin'", (hashed,))
cursor.execute("UPDATE users SET hashed_password = ? WHERE username = 'SSE2026'", (hashed,))
cursor.execute("UPDATE users SET hashed_password = ? WHERE username = '192324211'", (hashed,))
conn.commit()
conn.close()
print("Passwords updated to 'password123'")
