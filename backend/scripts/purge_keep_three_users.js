const { Op } = require('sequelize');
const models = require('../models');

const { sequelize, User } = models;

const KEEP_USERS = [
  {
    email: 'admin@fixly.com',
    password: 'admin123',
    role: 'admin',
    name: 'Fixly Admin',
  },
  {
    email: 'omendhamal@gmail.com',
    password: 'admin123',
    role: 'technician',
    name: 'Technician User',
  },
  {
    email: 'anuraj@gmail.com',
    password: 'admin123',
    role: 'customer',
    name: 'Customer User',
  },
];

const quoteTableName = (tableName) => {
  if (typeof tableName === 'string') {
    return `"${tableName.replace(/"/g, '""')}"`;
  }

  const schema = tableName.schema ? `"${String(tableName.schema).replace(/"/g, '""')}".` : '';
  const name = `"${String(tableName.tableName).replace(/"/g, '""')}"`;
  return `${schema}${name}`;
};

const getTruncatableTables = () => {
  const tableSet = new Set();

  Object.values(models).forEach((entry) => {
    if (!entry || typeof entry.getTableName !== 'function') {
      return;
    }

    if (entry === User) {
      return;
    }

    tableSet.add(quoteTableName(entry.getTableName()));
  });

  return Array.from(tableSet);
};

const main = async () => {
  await sequelize.authenticate();

  const tx = await sequelize.transaction();
  try {
    const keepEmails = KEEP_USERS.map((u) => u.email.toLowerCase());

    for (const spec of KEEP_USERS) {
      const existing = await User.findOne({
        where: sequelize.where(
          sequelize.fn('lower', sequelize.col('email')),
          spec.email.toLowerCase()
        ),
        transaction: tx,
      });

      if (!existing) {
        await User.create(
          {
            name: spec.name,
            email: spec.email,
            password: spec.password,
            role: spec.role,
            is_active: true,
            is_verified: true,
            first_login: false,
          },
          { transaction: tx }
        );
      } else {
        await existing.update(
          {
            name: existing.name || spec.name,
            password: spec.password,
            role: spec.role,
            is_active: true,
            first_login: false,
          },
          { transaction: tx }
        );
      }
    }

    const tablesToTruncate = getTruncatableTables();
    if (tablesToTruncate.length > 0) {
      await sequelize.query(
        `TRUNCATE TABLE ${tablesToTruncate.join(', ')} RESTART IDENTITY CASCADE;`,
        { transaction: tx }
      );
    }

    await User.destroy({
      where: sequelize.where(
        sequelize.fn('lower', sequelize.col('email')),
        {
          [Op.notIn]: keepEmails,
        }
      ),
      transaction: tx,
    });

    await tx.commit();

    const users = await User.findAll({
      order: [['id', 'ASC']],
      attributes: ['id', 'name', 'email', 'role', 'is_active'],
    });

    const bookingCount = await models.Booking.count();
    const paymentCount = await models.Payment.count();
    const serviceCount = await models.Service.count();
    const notificationCount = await models.Notification.count();

    console.log('Cleanup complete.');
    console.log('Kept users:');
    users.forEach((u) => {
      console.log(`- id=${u.id} email=${u.email} role=${u.role} active=${u.is_active}`);
    });
    console.log('Counts after cleanup:');
    console.log(`bookings=${bookingCount}`);
    console.log(`payments=${paymentCount}`);
    console.log(`services=${serviceCount}`);
    console.log(`notifications=${notificationCount}`);
  } catch (error) {
    await tx.rollback();
    console.error('Cleanup failed:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

main();
