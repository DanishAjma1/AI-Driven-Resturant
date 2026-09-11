-- Allocate human-facing order numbers atomically across all application instances.
CREATE SEQUENCE "order_display_id_seq" AS BIGINT START WITH 1001;

-- Continue after existing numeric EG-* IDs when upgrading an existing database.
SELECT setval(
  '"order_display_id_seq"',
  GREATEST(
    COALESCE(
      (
        SELECT MAX((substring("displayId" FROM 4))::BIGINT)
        FROM "Order"
        WHERE "displayId" ~ '^EG-[0-9]+$'
      ),
      1000
    ),
    1000
  )
);
