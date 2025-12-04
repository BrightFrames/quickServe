import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL);

async function testQuery() {
  try {
    const slug = 'sourabh-upadhyay';
    
    console.log(`\nSearching for restaurant with slug: "${slug}"\n`);
    
    const result = await sequelize.query(
      'SELECT id, name, slug, "isActive" FROM "Restaurants" WHERE LOWER(slug) = LOWER(:slug)',
      { 
        replacements: { slug },
        type: Sequelize.QueryTypes.SELECT 
      }
    );
    
    console.log('Query result:', result);
    
    if (result.length === 0) {
      console.log('\n❌ No restaurant found with that slug');
      
      // Show all slugs
      const allSlugs = await sequelize.query(
        'SELECT slug, "isActive" FROM "Restaurants"',
        { type: Sequelize.QueryTypes.SELECT }
      );
      console.log('\nAvailable slugs:');
      allSlugs.forEach(r => console.log(`- ${r.slug} (active: ${r.isActive})`));
    } else {
      console.log('\n✅ Restaurant found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testQuery();
