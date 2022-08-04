-- Schema creation
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS users (
	userid varchar PRIMARY KEY,
	lastlogin timestamp with time zone NOT NULL DEFAULT now(),
    lastip inet NOT NULL
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
	upload timestamp with time zone NOT NULL DEFAULT now(),
	expiration timestamp with time zone,
	size BIGINT,
	downloaded integer NOT NULL DEFAULT 0,
	mime varchar NOT NULL
);