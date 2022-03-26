-- Schema creation
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS users (
	userid bytea PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS auth.local (
	userid bytea PRIMARY KEY,
	FOREIGN KEY (userid)
		REFERENCES users (userid) ON DELETE CASCADE,
	username varchar UNIQUE,
	salt varchar,
	password varchar
);

CREATE TABLE IF NOT EXISTS files (
	fileid bytea PRIMARY KEY,
	ownerid bytea,
	FOREIGN KEY (ownerid)
		REFERENCES users (userid),
	filename varchar,
	upload DATE NOT NULL DEFAULT CURRENT_DATE,
	expiration DATE
);