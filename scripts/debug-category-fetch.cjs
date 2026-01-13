const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
    const CATEGORY_SLUG = 'vestidos';
    const PRODUCTS_PER_PAGE = 24;
    const PAGE = 0;

    console.log(`Checking category: ${CATEGORY_SLUG}`);

    // 1. Get Category ID
    const { data: catRows, error: catErr } = await supabase
        .from('categorias')
        .select('id')
        .eq('slug', CATEGORY_SLUG)
        .limit(1);

    if (catErr) {
        console.error('Error fetching category:', catErr);
        return;
    }

    const categoriaId = catRows?.[0]?.id;
    console.log(`Category ID for ${CATEGORY_SLUG}: ${categoriaId}`);

    if (!categoriaId) {
        console.error('Category not found!');
        return;
    }

    // 2. Fetch Products (Page 0)
    const from = PAGE * PRODUCTS_PER_PAGE;
    const to = from + PRODUCTS_PER_PAGE - 1;

    console.log(`Fetching range: ${from} to ${to}`);

    const { data, error, count } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: false }) // Getting rows + count
        .eq('ativo', true)
        .eq('nome_invisivel', false)
        .eq('categoria_id', categoriaId)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching products:', error);
    } else {
        console.log(`Fetched ${data.length} products.`);
        console.log(`First product ID: ${data[0]?.id}`);
        console.log(`Last product ID: ${data[data.length - 1]?.id}`);
        console.log(`Has More? ${data.length === PRODUCTS_PER_PAGE}`);

        // Check total count just to be sure
        console.log('Total count in DB for filter:', count);
    }
}

testFetch();
