CREATE DATABASE IF NOT EXISTS campus_match
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campus_match;

CREATE TABLE IF NOT EXISTS app_meta (
  meta_key VARCHAR(100) PRIMARY KEY,
  meta_value JSON NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(80) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  student_id VARCHAR(120) NULL,
  nickname VARCHAR(255) NOT NULL,
  school VARCHAR(255) NULL,
  grade VARCHAR(120) NULL,
  major VARCHAR(255) NULL,
  college VARCHAR(255) NULL,
  campus_zone VARCHAR(255) NULL,
  dorm_area VARCHAR(255) NULL,
  bio TEXT NULL,
  schedule_text TEXT NULL,
  ideal_scene TEXT NULL,
  relationship_goal TEXT NULL,
  allow_anonymous_match TINYINT(1) NOT NULL DEFAULT 1,
  allow_offline_events TINYINT(1) NOT NULL DEFAULT 1,
  campus_card_image TEXT NULL,
  avatar TEXT NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified',
  verification_badge VARCHAR(255) NULL,
  verification_requested_at DATETIME(3) NULL,
  verification_reviewed_at DATETIME(3) NULL,
  verification_notes TEXT NULL,
  membership_json JSON NULL,
  stats_json JSON NULL,
  tags_json JSON NULL,
  scene_tags_json JSON NULL,
  match_modes_json JSON NULL,
  skipped_ids_json JSON NULL,
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  password_hash TEXT NULL,
  password_salt VARCHAR(255) NULL,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL,
  raw_json JSON NULL,
  INDEX users_school_idx (school),
  INDEX users_major_idx (major),
  INDEX users_grade_idx (grade),
  INDEX users_verification_idx (verification_status),
  INDEX users_is_admin_idx (is_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_verification_codes (
  email VARCHAR(255) PRIMARY KEY,
  code_hash VARCHAR(255) NOT NULL,
  requested_at DATETIME(3) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  attempts INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(80) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX sessions_user_idx (user_id),
  INDEX sessions_expiry_idx (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(80) PRIMARY KEY,
  pair_key VARCHAR(255) NOT NULL UNIQUE,
  participant_a VARCHAR(80) NOT NULL,
  participant_b VARCHAR(80) NOT NULL,
  participant_ids_json JSON NOT NULL,
  user_snapshots_json JSON NULL,
  reveal_requests_json JSON NULL,
  identity_revealed TINYINT(1) NOT NULL DEFAULT 0,
  matched_at DATETIME(3) NULL,
  last_message_at DATETIME(3) NULL,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL,
  raw_json JSON NULL,
  INDEX matches_last_message_idx (last_message_at),
  INDEX matches_participant_a_idx (participant_a),
  INDEX matches_participant_b_idx (participant_b)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(120) PRIMARY KEY,
  match_id VARCHAR(80) NOT NULL,
  sender_id VARCHAR(80) NULL,
  sender_nickname VARCHAR(255) NULL,
  message_type VARCHAR(32) NOT NULL DEFAULT 'text',
  content TEXT NULL,
  created_at DATETIME(3) NULL,
  raw_json JSON NULL,
  INDEX messages_match_idx (match_id),
  INDEX messages_sender_idx (sender_id),
  INDEX messages_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
