const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProducts() {
    console.log('Checking product counts...');

    // Total Active Products
    const { count: totalActive, error: countError } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)
        .eq('nome_invisivel', false);

    if (countError) {
        console.error('Error counting active products:', countError);
    } else {
        console.log(`Total Active & Visible Products: ${totalActive}`);
    }

    // Products with recem_chegado = true
    const { count: recemChegado, error: recemError } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)
        .eq('nome_invisivel', false)
        .eq('recem_chegado', true);

    if (recemError) {
        console.error('Error counting recem_chegado products:', recemError);
        // Maybe the column doesn't exist?
        if (recemError.message.includes('column') && recemError.message.includes('does not exist')) {
            console.log('Column "recem_chegado" does not exist.');
        }
    } else {
        console.log(`Products marked as "recem_chegado": ${recemChegado}`);
    }

    // Products in a specific category (pick one if possible, or just skip)
    // We can list categories first
    const { data: categories } = await supabase.from('categorias').select('id, nome').limit(5);
    if (categories && categories.length > 0) {
        console.log('\nChecking first 5 categories:');
        for (const cat of categories) {
            const { count: catCount } = await supabase
                .from('produtos')
                .select('*', { count: 'exact', head: true })
                .eq('ativo', true)
                .eq('nome_invisivel', false)
                .eq('categoria_id', cat.id);
            console.log(`- Category "${cat.nome}": ${catCount} products`);
        }
    }
}

checkProducts();
