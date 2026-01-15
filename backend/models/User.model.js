const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Name is required'
      },
      len: {
        args: [2, 100],
        msg: 'Name must be between 2 and 100 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Email already exists'
    },
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      },
      notEmpty: {
        msg: 'Email is required'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Password is required'
      },
      len: {
        args: [6, 255],
        msg: 'Password must be at least 6 characters'
      }
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^[0-9+\-\s()]*$/,
        msg: 'Phone number must contain only numbers and valid characters'
      }
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'customer', 'technician'),
    allowNull: false,
    defaultValue: 'customer',
    validate: {
      isIn: {
        args: [['admin', 'customer', 'technician']],
        msg: 'Role must be admin, customer, or technician'
      }
    }
  },
  profile_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // For technicians only
  hourly_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  experience_years: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 5
    }
  },
  total_jobs: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  completed_jobs: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },

  // ────────────────────────────────────────────────
  // NEW FIELDS ADDED HERE (bank details for technicians)
  bank_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Name of the bank (e.g. Nabil Bank, Global IME)'
  },
  account_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Bank account number (stored as string for formatting)'
  },
  account_holder_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Full name on the bank account'
  },
  first_login: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Force password change on first login'
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    // Hash password before creating user
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Hash password before updating user (if password changed)
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile (without password)
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};


module.exports = User;