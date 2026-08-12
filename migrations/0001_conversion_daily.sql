CREATE TABLE IF NOT EXISTS conversion_daily (
  event_date TEXT NOT NULL,
  property TEXT NOT NULL,
  event TEXT NOT NULL,
  source TEXT NOT NULL,
  page TEXT NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (event_date, property, event, source, page)
);

CREATE INDEX IF NOT EXISTS conversion_daily_property_date
  ON conversion_daily (property, event_date);

CREATE INDEX IF NOT EXISTS conversion_daily_event_date
  ON conversion_daily (event, event_date);
