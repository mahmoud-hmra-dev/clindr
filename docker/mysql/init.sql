CREATE DATABASE IF NOT EXISTS clindoctor
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS clindoctor_payment
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON clindoctor.* TO 'clindoctor'@'%';
GRANT ALL PRIVILEGES ON clindoctor_payment.* TO 'clindoctor'@'%';

FLUSH PRIVILEGES;
