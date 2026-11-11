-- ==============================================================================
-- Flyway Migration: V22__add_message_attachments.sql
-- Description: Adds attachment support (images, documents) to mentorship_messages.
-- ==============================================================================

ALTER TABLE mentorship_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE mentorship_messages ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);
ALTER TABLE mentorship_messages ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50);

