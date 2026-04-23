
-- Tabla de Usuarios
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastLogin` DATETIME(3) NULL,
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla de Tanques 
CREATE TABLE `tanks` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla de Sensores
CREATE TABLE `sensors` (
    `id` VARCHAR(191) NOT NULL,
    `hardwareId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('TEMPERATURE', 'PH', 'OXYGEN') NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ERROR') NOT NULL DEFAULT 'ACTIVE',
    `calibrationDate` DATETIME(3) NOT NULL,
    `lastReading` DOUBLE NULL,
    `lastUpdate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tankId` VARCHAR(191) NOT NULL,
    UNIQUE INDEX `sensors_hardwareId_key`(`hardwareId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla de Datos de Sensores (
CREATE TABLE `sensor_data` (
    `id` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL,
    `type` ENUM('TEMPERATURE', 'PH', 'OXYGEN') NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sensorId` VARCHAR(191) NOT NULL,
    `tankId` VARCHAR(191) NOT NULL,
    INDEX `sensor_data_timestamp_idx`(`timestamp`),
    INDEX `sensor_data_sensorId_timestamp_idx`(`sensorId`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla de Alertas
CREATE TABLE `alerts` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('TEMPERATURE_HIGH', 'TEMPERATURE_LOW', 'PH_HIGH', 'PH_LOW', 'OXYGEN_HIGH', 'OXYGEN_LOW', 'SENSOR_OFFLINE', 'SYSTEM_ERROR') NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `message` TEXT NOT NULL,
    `value` DOUBLE NULL,
    `threshold` DOUBLE NULL,
    `resolved` BOOLEAN NOT NULL DEFAULT false,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `sensorId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    INDEX `alerts_createdAt_idx`(`createdAt`),
    INDEX `alerts_resolved_idx`(`resolved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla de Reportes
CREATE TABLE `reports` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `type` ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM') NOT NULL,
    `parameters` JSON NOT NULL,
    `filePath` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    INDEX `reports_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla de Configuración del Sistema
CREATE TABLE `system_config` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `system_config_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;



ALTER TABLE `tanks` ADD CONSTRAINT `tanks_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sensors` ADD CONSTRAINT `sensors_tankId_fkey` FOREIGN KEY (`tankId`) REFERENCES `tanks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sensor_data` ADD CONSTRAINT `sensor_data_sensorId_fkey` FOREIGN KEY (`sensorId`) REFERENCES `sensors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sensor_data` ADD CONSTRAINT `sensor_data_tankId_fkey` FOREIGN KEY (`tankId`) REFERENCES `tanks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_sensorId_fkey` FOREIGN KEY (`sensorId`) REFERENCES `sensors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `reports` ADD CONSTRAINT `reports_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
