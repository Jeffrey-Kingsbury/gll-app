alter table `account` add column `idToken` text;

alter table `account` add column `accessTokenExpiresAt` timestamp(3);

alter table `account` add column `refreshTokenExpiresAt` timestamp(3);

alter table `account` add column `scope` text;