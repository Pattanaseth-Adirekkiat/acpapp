import os
import bcrypt
from databases import Database

POSTGRES_USER = os.getenv("POSTGRES_USER", "temp")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "temp")
POSTGRES_DB = os.getenv("POSTGRES_DB", "advcompro")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db")

DATABASE_URL = (
    f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
    f"@{POSTGRES_HOST}/{POSTGRES_DB}"
)

database = Database(DATABASE_URL)


async def connect_db():
    await database.connect()


async def disconnect_db():
    await database.disconnect()


async def setup_db():
    await database.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            email VARCHAR(255) PRIMARY KEY,
            password TEXT NOT NULL,
            token TEXT,
            create_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )

    await database.execute(
        """
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price NUMERIC(10, 2) NOT NULL,
            stock INT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )

    demo_password = bcrypt.hashpw(b"password", bcrypt.gensalt()).decode("utf-8")
    await database.execute(
        """
        INSERT INTO users (email, password)
        VALUES (:email, :password)
        ON CONFLICT (email) DO NOTHING
        """,
        {"email": "demo@example.com", "password": demo_password},
    )


async def get_user_by_email(email: str):
    return await database.fetch_one(
        "SELECT email, password, token, create_at FROM users WHERE email = :email",
        {"email": email},
    )


async def update_user_token(email: str, token: str):
    await database.execute(
        "UPDATE users SET token = :token WHERE email = :email",
        {"email": email, "token": token},
    )


async def create_user(email: str, password_hash: str):
    query = "INSERT INTO users (email, password) VALUES (:email, :password)"
    await database.execute(query, {"email": email, "password": password_hash})


async def get_all_products():
    query = "SELECT id, name, description, price, stock, created_at FROM products ORDER BY id ASC"
    return await database.fetch_all(query)


async def create_product(name: str, description: str, price: float, stock: int):
    query = """
        INSERT INTO products (name, description, price, stock)
        VALUES (:name, :description, :price, :stock)
        RETURNING id, name, description, price, stock, created_at
    """
    return await database.fetch_one(
        query,
        {"name": name, "description": description, "price": price, "stock": stock},
    )


async def update_product(product_id: int, name: str, description: str, price: float, stock: int):
    query = """
        UPDATE products
        SET name = :name, description = :description, price = :price, stock = :stock
        WHERE id = :id
        RETURNING id, name, description, price, stock, created_at
    """
    return await database.fetch_one(
        query,
        {"id": product_id, "name": name, "description": description, "price": price, "stock": stock},
    )


async def delete_product(product_id: int):
    query = "DELETE FROM products WHERE id = :id RETURNING id"
    return await database.fetch_one(query, {"id": product_id})


async def buy_product(product_id: int):
    query = """
        UPDATE products
        SET stock = stock - 1
        WHERE id = :id AND stock > 0
        RETURNING id, name, description, price, stock, created_at
    """
    return await database.fetch_one(query, {"id": product_id})