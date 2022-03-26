-- Schema creation
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS users (
	userid bytea PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS auth.local (
	userid bytea PRIMARY KEY,
	FOREIGN KEY (userid)
		REFERENCES users (userid),
	username varchar UNIQUE,
	salt varchar,
	password varchar
);