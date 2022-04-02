-- Schema creation
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS users (
	userid varchar PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS auth.local (
	userid varchar PRIMARY KEY,
	FOREIGN KEY (userid)
		REFERENCES users (userid) ON DELETE CASCADE,
	username varchar UNIQUE,
	salt varchar,
	password varchar
);

CREATE TABLE IF NOT EXISTS files (
	fileid varchar PRIMARY KEY,
	ownerid varchar,
	FOREIGN KEY (ownerid)
		REFERENCES users (userid),
	filename varchar,
	upload TIMESTAMP NOT NULL DEFAULT now(),
	expiration TIMESTAMP,
	size BIGINT
);