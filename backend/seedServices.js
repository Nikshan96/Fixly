const { Service } = require('./models');

const seedServices = async () => {
  try {
    const services = [
      { name: 'Plumber', icon: '🔧', base_price: 500 },
      { name: 'Electrician', icon: '⚡', base_price: 600 },
      { name: 'Carpenter', icon: '🔨', base_price: 550 },
      { name: 'Painter', icon: '🎨', base_price: 450 },
      { name: 'AC Repair', icon: '❄️', base_price: 700 },
      { name: 'Cleaning', icon: '🧹', base_price: 400 },
    ];

    for (const service of services) {
      await Service.findOrCreate({
        where: { name: service.name },
        defaults: service
      });
    }

    console.log('✅ Services seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding services:', error);
    process.exit(1);
  }
};

seedServices();