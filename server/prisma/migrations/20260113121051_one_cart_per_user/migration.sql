CREATE UNIQUE INDEX IF NOT EXISTS "orders_one_cart_per_user"
ON "orders" ("user_id")
WHERE "status" = 'CART';