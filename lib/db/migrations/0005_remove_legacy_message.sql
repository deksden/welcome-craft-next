-- Drop deprecated Message table to avoid confusion with new AI SDK format
-- The new Message_v2 table with parts/attachments format is the only message table

DROP TABLE IF EXISTS "Message";