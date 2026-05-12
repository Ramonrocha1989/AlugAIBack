-- Improve public machine search quality and index support.
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- PostgreSQL's unaccent function is STABLE, so wrap it for expression indexes.
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent($1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

CREATE INDEX IF NOT EXISTS machines_search_document_idx ON machines USING GIN ((
  setweight(to_tsvector('portuguese', immutable_unaccent(coalesce(name, ''))), 'A') ||
  setweight(to_tsvector('portuguese', immutable_unaccent(coalesce(manufacturer, ''))), 'A') ||
  setweight(to_tsvector('portuguese', immutable_unaccent(coalesce(model, ''))), 'A') ||
  setweight(to_tsvector('portuguese', immutable_unaccent(coalesce(city, ''))), 'B') ||
  setweight(to_tsvector('portuguese', immutable_unaccent(coalesce(state, ''))), 'B') ||
  setweight(to_tsvector('portuguese', immutable_unaccent(coalesce(description, ''))), 'C')
));

CREATE INDEX IF NOT EXISTS machines_name_unaccent_trgm_idx
  ON machines USING GIN (immutable_unaccent(coalesce(name, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS machines_manufacturer_unaccent_trgm_idx
  ON machines USING GIN (immutable_unaccent(coalesce(manufacturer, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS machines_model_unaccent_trgm_idx
  ON machines USING GIN (immutable_unaccent(coalesce(model, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS machines_city_unaccent_trgm_idx
  ON machines USING GIN (immutable_unaccent(coalesce(city, '')) gin_trgm_ops);
