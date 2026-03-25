#!/usr/bin/env node
/**
 * fix-product-images.mjs
 *
 * Corrige as imagens de produtos dos templates,
 * eliminando duplicatas e atribuindo fotos REAIS e condizentes via Pexels API.
 *
 * Uso:
 *   PEXELS_API_KEY=SuaChaveAqui node scripts/fix-product-images.mjs
 *
 * Pexels API key gratuita: https://www.pexels.com/api/
 * (crie conta → "Your API Key" → copie)
 *
 * Rate limit: 200 req/hora (free tier).
 * O script agrupa produtos por semântica para usar ~60-80 chamadas no total.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const API_KEY = process.env.PEXELS_API_KEY
if (!API_KEY) {
  console.error(`
╔══════════════════════════════════════════════════════════════╗
║  PEXELS_API_KEY não encontrada.                             ║
║                                                              ║
║  1. Acesse https://www.pexels.com/api/                      ║
║  2. Crie conta gratuita                                      ║
║  3. Copie sua API Key                                        ║
║  4. Execute:                                                 ║
║     PEXELS_API_KEY=SuaChave node scripts/fix-product-images.mjs ║
╚══════════════════════════════════════════════════════════════╝
`)
  process.exit(1)
}

// ─── Pexels API ─────────────────────────────────────────────

const PEXELS_BASE = 'https://api.pexels.com/v1/search'
const DELAY_MS = 1800 // ~200 req/hour = 1 req/1.8s
const IMG_PARAMS = '?auto=compress&cs=tinysrgb&w=800'

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Busca fotos no Pexels para um termo.
 * Retorna array de photo IDs (strings).
 */
async function searchPexels(query, perPage = 80) {
  const url = `${PEXELS_BASE}?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
  const res = await fetch(url, {
    headers: { Authorization: API_KEY },
  })

  if (!res.ok) {
    const rateLimitRemaining = res.headers.get('x-ratelimit-remaining')
    if (res.status === 429 || rateLimitRemaining === '0') {
      console.warn(`  ⏳ Rate limited. Aguardando 60s...`)
      await sleep(60_000)
      return searchPexels(query, perPage)
    }
    console.error(`  ❌ Pexels API error ${res.status} for "${query}"`)
    return []
  }

  const data = await res.json()
  return (data.photos || []).map((p) => String(p.id))
}

// ─── Semantic Groups ────────────────────────────────────────

/**
 * Mapeamento de padrões no product key para termos de busca em inglês.
 * Ordem importa: primeiro match ganha.
 * per_page define quantas fotos buscar (mais = mais opções para distribuir).
 */
const SEMANTIC_GROUPS = [
  // ─── PIZZARIA ───
  { pattern: /pizza.*calabresa|calabresa/, search: 'pepperoni pizza', perPage: 15 },
  { pattern: /pizza.*marguerita|margherita|marguerita/, search: 'margherita pizza', perPage: 15 },
  { pattern: /pizza.*portuguesa/, search: 'pizza toppings cheese', perPage: 10 },
  { pattern: /pizza.*frango.*catupiry|frango-com-catupiry/, search: 'chicken pizza creamy', perPage: 10 },
  { pattern: /pizza.*quatro.*queijo|4-queijos/, search: 'four cheese pizza', perPage: 10 },
  { pattern: /pizza.*chocolate|pizza-doce|pizza.*nutella|pizza.*broto.*doce/, search: 'chocolate dessert pizza', perPage: 15 },
  { pattern: /pizza.*bacon|pizza.*canadense/, search: 'bacon pizza', perPage: 10 },
  { pattern: /pizza|pizzas-tradicionais|pizzas-especiais|pizzas-premium|pizzas-doces/, search: 'pizza', perPage: 80 },
  { pattern: /calzone/, search: 'calzone italian', perPage: 10 },

  // ─── HAMBURGUERIA ───
  { pattern: /smash-burger|smash/, search: 'smash burger', perPage: 15 },
  { pattern: /x-burger|x-tudo|x-salada|x-bacon|x-egg/, search: 'cheeseburger', perPage: 20 },
  { pattern: /hambur|burger|artesanal/, search: 'gourmet hamburger', perPage: 40 },
  { pattern: /hot-?dog|cachorro-?quente/, search: 'hot dog', perPage: 10 },

  // ─── SUSHI / JAPONESA ───
  { pattern: /sashimi/, search: 'sashimi fresh fish', perPage: 15 },
  { pattern: /temaki/, search: 'temaki hand roll', perPage: 10 },
  { pattern: /niguiri|nigiri/, search: 'nigiri sushi', perPage: 10 },
  { pattern: /uramaki|hot-philadelphia|philadelphia-roll|dragon-roll|rainbow-roll|joe-de/, search: 'sushi roll maki', perPage: 20 },
  { pattern: /combo.*peca|combinado/, search: 'sushi platter combo', perPage: 15 },
  { pattern: /harumaki|spring-roll/, search: 'spring roll fried', perPage: 10 },
  { pattern: /gyoza/, search: 'gyoza dumplings', perPage: 8 },
  { pattern: /edamame/, search: 'edamame beans', perPage: 5 },
  { pattern: /yakissoba/, search: 'yakisoba noodles', perPage: 8 },
  { pattern: /lamen|ramen/, search: 'ramen noodle soup', perPage: 10 },
  { pattern: /tempura/, search: 'tempura shrimp', perPage: 10 },
  { pattern: /yakimeshi|donburi/, search: 'japanese rice bowl', perPage: 10 },
  { pattern: /sunomono/, search: 'cucumber salad japanese', perPage: 5 },
  { pattern: /sake/, search: 'sake japanese drink', perPage: 5 },
  { pattern: /shimeji/, search: 'shimeji mushroom cooked', perPage: 5 },

  // ─── AÇAÍ ───
  { pattern: /acai.*especiai|acai-com-|acai-power|acai-napolitano|acai-ovomaltine|acai-oreo|acai-zero/, search: 'acai bowl toppings', perPage: 20 },
  { pattern: /tigela.*acai|tigela-classica|tigela-fitness|tigela-tropical|tigela-familia/, search: 'acai bowl berry', perPage: 15 },
  { pattern: /acai.*copo|acai-300|acai-500|acai-700|acai-1-litro/, search: 'acai cup purple', perPage: 15 },
  { pattern: /smoothie-de-acai|vitamina-de-acai|suco-de-acai/, search: 'acai smoothie drink', perPage: 10 },
  { pattern: /pitaya/, search: 'dragon fruit pitaya bowl', perPage: 10 },
  { pattern: /cupuacu/, search: 'tropical fruit bowl cream', perPage: 5 },

  // ─── CARNES / AÇOUGUE ───
  { pattern: /picanha/, search: 'picanha steak beef', perPage: 15 },
  { pattern: /contra-?file|contrafile/, search: 'sirloin steak', perPage: 10 },
  { pattern: /alcatra/, search: 'top sirloin beef steak', perPage: 10 },
  { pattern: /maminha/, search: 'tri tip beef steak', perPage: 10 },
  { pattern: /fraldinha/, search: 'flank steak beef', perPage: 8 },
  { pattern: /costela-bovina|costela-suina|costela.*bafo/, search: 'beef ribs bbq', perPage: 15 },
  { pattern: /cupim/, search: 'beef hump meat brazillian', perPage: 5 },
  { pattern: /file-mignon|medalhao/, search: 'filet mignon steak', perPage: 10 },
  { pattern: /carne-moida/, search: 'ground beef minced meat', perPage: 5 },
  { pattern: /t-bone/, search: 't-bone steak grilled', perPage: 5 },
  { pattern: /patinho|acem/, search: 'raw beef meat cut', perPage: 10 },
  { pattern: /bisteca-suina/, search: 'pork chop', perPage: 5 },
  { pattern: /pernil-suino/, search: 'pork leg ham', perPage: 5 },
  { pattern: /lombo-suino/, search: 'pork loin', perPage: 5 },
  { pattern: /panceta-suina|panceta/, search: 'pork belly', perPage: 5 },
  { pattern: /frango-inteiro|frango-resfriado/, search: 'whole chicken raw', perPage: 5 },
  { pattern: /peito-de-frango|file.*frango/, search: 'chicken breast fillet', perPage: 10 },
  { pattern: /coxa.*sobrecoxa|sobrecoxa/, search: 'chicken thigh drumstick', perPage: 10 },
  { pattern: /asa-de-frango/, search: 'chicken wings', perPage: 5 },
  { pattern: /coracao-de-frango/, search: 'chicken hearts skewer', perPage: 5 },
  { pattern: /tulipa-de-frango/, search: 'chicken lollipop drumette', perPage: 5 },
  { pattern: /kit.*churrasco/, search: 'brazilian bbq meat platter', perPage: 15 },
  { pattern: /espetinho|espeto/, search: 'meat skewers bbq', perPage: 10 },
  { pattern: /temperado.*|maminha-ao-alho|frango.*desossado.*temperado|sobrecoxa.*recheada/, search: 'marinated seasoned meat', perPage: 15 },
  { pattern: /linguica/, search: 'sausage brazilian linguica', perPage: 10 },
  { pattern: /strogonoff|estrogonof/, search: 'stroganoff', perPage: 8 },

  // ─── CERVEJAS ───
  { pattern: /cerveja.*lata|lata.*350|brahma.*350|budweiser.*350|amstel|spaten|corona.*lata/, search: 'beer can', perPage: 15 },
  { pattern: /cerveja.*long.*neck|long-neck|heineken.*330|budweiser.*330|stella.*330|corona.*330|eisenbahn.*355/, search: 'beer bottle long neck', perPage: 15 },
  { pattern: /cerveja.*600|litrao|brahma.*600|skol.*600|antarctica.*600|heineken.*600|duplo-malte/, search: 'beer bottle 600ml', perPage: 15 },
  { pattern: /cerveja.*artesanal|colorado|praya|baden|eisenbahn.*weizen/, search: 'craft beer bottle', perPage: 10 },
  { pattern: /chopp/, search: 'draft beer glass', perPage: 10 },
  { pattern: /cerveja|beer|sapporo/, search: 'beer glass bar', perPage: 30 },

  // ─── DRINKS / BAR ───
  { pattern: /caipirinha/, search: 'caipirinha cocktail lime', perPage: 10 },
  { pattern: /mojito/, search: 'mojito cocktail mint', perPage: 5 },
  { pattern: /gin.*tonica|gin-tonico|gin-tonic/, search: 'gin tonic cocktail', perPage: 8 },
  { pattern: /moscow.*mule/, search: 'moscow mule cocktail', perPage: 5 },
  { pattern: /whisky|whiskey|jack-daniels/, search: 'whiskey glass ice', perPage: 10 },
  { pattern: /vodka|absolut/, search: 'vodka bottle', perPage: 8 },
  { pattern: /vinho.*tinto|cabernet|malbec|carmenere/, search: 'red wine glass bottle', perPage: 15 },
  { pattern: /vinho.*branco|chardonnay|sauvignon/, search: 'white wine glass', perPage: 10 },
  { pattern: /vinho.*rose|rose/, search: 'rose wine glass', perPage: 5 },
  { pattern: /espumante|prosecco|chandon/, search: 'sparkling wine champagne', perPage: 10 },
  { pattern: /drink|coquetel|cocktail|aperol|negroni|margarita|daiquiri|pina-colada/, search: 'cocktail drink bar', perPage: 30 },

  // ─── BEBIDAS NÃO ALCOÓLICAS ───
  { pattern: /coca-cola|coca.*lata/, search: 'cola soda glass ice', perPage: 15 },
  { pattern: /guarana/, search: 'guarana soda drink brazil', perPage: 10 },
  { pattern: /refrigerante|fanta|sprite/, search: 'soda soft drink glass', perPage: 15 },
  { pattern: /red-bull|monster|tnt|fusion|energetico/, search: 'energy drink can', perPage: 15 },
  { pattern: /agua-mineral|agua-com-gas|agua-tonica/, search: 'mineral water bottle glass', perPage: 15 },
  { pattern: /agua-de-coco/, search: 'coconut water', perPage: 10 },
  { pattern: /suco-de-laranja|suco.*laranja/, search: 'fresh orange juice glass', perPage: 10 },
  { pattern: /suco-de-acai|suco-verde|suco.*detox/, search: 'green juice healthy drink', perPage: 10 },
  { pattern: /suco|del-valle|polpa/, search: 'fruit juice glass colorful', perPage: 15 },
  { pattern: /limonada|lemonade/, search: 'lemonade glass ice', perPage: 10 },
  { pattern: /cha-gelado|ice-tea/, search: 'iced tea glass', perPage: 8 },
  { pattern: /milkshake/, search: 'milkshake creamy glass', perPage: 10 },

  // ─── CAFÉ / CAFETERIA ───
  { pattern: /espresso|cafe-expresso|cafe.*express/, search: 'espresso coffee cup', perPage: 10 },
  { pattern: /cappuccino|capuccino/, search: 'cappuccino latte art', perPage: 10 },
  { pattern: /cafe-com-leite/, search: 'cafe latte milk', perPage: 8 },
  { pattern: /cafe-coado|cafe-filtrado/, search: 'drip coffee cup', perPage: 5 },
  { pattern: /chocolate-quente/, search: 'hot chocolate cup', perPage: 8 },
  { pattern: /frappuccino|frappe/, search: 'frappuccino blended coffee', perPage: 8 },
  { pattern: /mocha/, search: 'mocha coffee chocolate', perPage: 5 },
  { pattern: /cha.*camomila|cha.*erva|cha.*hortela/, search: 'herbal tea cup', perPage: 10 },
  { pattern: /croissant/, search: 'croissant pastry', perPage: 10 },
  { pattern: /waffle/, search: 'waffle breakfast plate', perPage: 8 },
  { pattern: /panqueca|pancake/, search: 'pancake stack syrup', perPage: 8 },
  { pattern: /torrada|toast|bruschetta/, search: 'toast avocado breakfast', perPage: 10 },
  { pattern: /granola.*bowl|bowl.*frutas/, search: 'granola bowl fruit yogurt', perPage: 8 },

  // ─── DOCES / CONFEITARIA ───
  { pattern: /brigadeiro/, search: 'brazilian brigadeiro chocolate truffle', perPage: 15 },
  { pattern: /trufa|bombom/, search: 'chocolate truffle bonbon', perPage: 15 },
  { pattern: /bolo-de-chocolate|bolo.*chocolate/, search: 'chocolate cake slice', perPage: 10 },
  { pattern: /bolo-red-velvet|red-velvet/, search: 'red velvet cake slice', perPage: 5 },
  { pattern: /bolo-de-cenoura|bolo.*cenoura/, search: 'carrot cake slice', perPage: 5 },
  { pattern: /bolo.*festa|bolo.*decorado|bolo.*aniversario/, search: 'birthday cake decorated', perPage: 15 },
  { pattern: /bolo.*casamento|bolo.*noiva/, search: 'wedding cake white', perPage: 5 },
  { pattern: /bolo/, search: 'cake slice plate', perPage: 20 },
  { pattern: /torta.*limao/, search: 'key lime pie slice', perPage: 5 },
  { pattern: /torta.*morango/, search: 'strawberry tart slice', perPage: 5 },
  { pattern: /torta/, search: 'pie tart slice dessert', perPage: 15 },
  { pattern: /brownie/, search: 'chocolate brownie', perPage: 8 },
  { pattern: /cheesecake/, search: 'cheesecake slice', perPage: 8 },
  { pattern: /mousse/, search: 'chocolate mousse dessert', perPage: 10 },
  { pattern: /pudim/, search: 'flan pudding caramel', perPage: 8 },
  { pattern: /petit.*gateau/, search: 'molten chocolate lava cake', perPage: 5 },
  { pattern: /macaron/, search: 'french macarons colorful', perPage: 8 },
  { pattern: /beijinho|cajuzinho|docinho/, search: 'brazilian sweets docinhos party', perPage: 10 },
  { pattern: /cupcake/, search: 'cupcake frosting', perPage: 10 },
  { pattern: /cookie/, search: 'cookies chocolate chip', perPage: 8 },
  { pattern: /palha-italiana/, search: 'chocolate fudge bar', perPage: 5 },
  { pattern: /cento-de-/, search: 'brazilian party sweets box', perPage: 10 },

  // ─── SORVETE ───
  { pattern: /sundae/, search: 'ice cream sundae', perPage: 10 },
  { pattern: /milkshake/, search: 'milkshake thick glass', perPage: 10 },
  { pattern: /picole/, search: 'popsicle ice cream stick', perPage: 10 },
  { pattern: /acai.*sorvete|sorvete.*acai/, search: 'acai ice cream', perPage: 5 },
  { pattern: /sorvete|gelato|sorbet/, search: 'ice cream scoop cone', perPage: 30 },

  // ─── PADARIA ───
  { pattern: /pao-frances|pao-de-forma/, search: 'french bread bakery', perPage: 10 },
  { pattern: /pao-de-queijo/, search: 'brazilian cheese bread pao de queijo', perPage: 8 },
  { pattern: /pao-de-batata/, search: 'potato bread roll stuffed', perPage: 5 },
  { pattern: /pao-de-alho/, search: 'garlic bread', perPage: 8 },
  { pattern: /pao.*integral|pao.*australiano|pao.*centeio/, search: 'whole grain bread loaf', perPage: 10 },
  { pattern: /coxinha/, search: 'brazilian coxinha fried', perPage: 8 },
  { pattern: /pastel.*forno|pastel/, search: 'pastel empanada fried', perPage: 10 },
  { pattern: /empada/, search: 'empada pot pie small', perPage: 8 },
  { pattern: /esfiha|esfirra/, search: 'esfiha open pie', perPage: 8 },
  { pattern: /enroladinho|salsich/, search: 'sausage roll pastry', perPage: 8 },
  { pattern: /bolinha.*queijo|bolinho.*queijo/, search: 'cheese croquette fried ball', perPage: 5 },
  { pattern: /misto-quente/, search: 'ham cheese toast grilled', perPage: 8 },
  { pattern: /salgado/, search: 'brazilian savory snacks', perPage: 15 },

  // ─── RESTAURANTE ───
  { pattern: /executivo.*dia|prato.*dia/, search: 'brazilian lunch plate rice beans', perPage: 10 },
  { pattern: /frango.*grelhado|frango.*grelhado/, search: 'grilled chicken plate', perPage: 10 },
  { pattern: /file.*peixe|peixe.*grelhado|tilapia|salmao.*grelhado/, search: 'grilled fish plate', perPage: 15 },
  { pattern: /moqueca/, search: 'moqueca brazilian fish stew', perPage: 5 },
  { pattern: /feijoada/, search: 'feijoada brazilian stew', perPage: 8 },
  { pattern: /marmita|marmitex/, search: 'meal prep lunch box rice', perPage: 10 },
  { pattern: /lasanha/, search: 'lasagna baked pasta', perPage: 8 },
  { pattern: /macarrao|espaguete|penne|fettuccine|carbonara/, search: 'pasta spaghetti plate', perPage: 15 },
  { pattern: /risoto|risotto/, search: 'risotto plate', perPage: 8 },
  { pattern: /salada.*caesar|salada.*tropical|salada/, search: 'fresh salad bowl', perPage: 15 },
  { pattern: /sopa|caldo|canja/, search: 'soup bowl warm', perPage: 10 },
  { pattern: /porcao.*batata|batata-frita|french-fries/, search: 'french fries portion', perPage: 15 },
  { pattern: /onion.*ring/, search: 'onion rings fried', perPage: 5 },
  { pattern: /mandioca-frita|aipim/, search: 'fried cassava', perPage: 5 },
  { pattern: /isca-de-frango|frango.*passarinha/, search: 'fried chicken pieces', perPage: 10 },
  { pattern: /bolinho.*bacalhau/, search: 'cod fritters fried balls', perPage: 5 },
  { pattern: /tabua.*frios|tabua.*petiscos/, search: 'charcuterie board cheese meat', perPage: 10 },
  { pattern: /caldinho.*feijao/, search: 'bean soup cup', perPage: 5 },
  { pattern: /dadinhos.*tapioca/, search: 'fried tapioca cubes', perPage: 5 },
  { pattern: /provolone/, search: 'provolone cheese melted', perPage: 5 },
  { pattern: /torresmo/, search: 'pork crackling fried', perPage: 5 },
  { pattern: /sobremesa/, search: 'dessert plate restaurant', perPage: 10 },

  // ─── MERCADINHO ───
  { pattern: /arroz.*5kg|arroz.*integral|arroz.*branco|arroz.*soltinho/, search: 'rice bag package', perPage: 8 },
  { pattern: /feijao.*1kg|feijao.*carioca|feijao.*preto/, search: 'beans package dried', perPage: 8 },
  { pattern: /oleo.*soja|azeite|oleo/, search: 'cooking oil bottle', perPage: 10 },
  { pattern: /acucar|sal-grosso/, search: 'sugar salt package', perPage: 8 },
  { pattern: /cafe.*pilao|cafe.*melitta|cafe.*torrado/, search: 'coffee bag package ground', perPage: 8 },
  { pattern: /leite.*integral|leite.*semi|leite-condensado|creme-de-leite/, search: 'milk carton dairy', perPage: 10 },
  { pattern: /macarrao.*espaguete|macarrao.*parafuso|miojo|nissin/, search: 'pasta package dry noodles', perPage: 10 },
  { pattern: /farinha|farofa|fuba/, search: 'flour package cooking', perPage: 8 },
  { pattern: /molho-de-tomate|extrato|catchup|ketchup|maionese|mostarda/, search: 'condiment sauce bottle', perPage: 15 },
  { pattern: /sabao|detergente|limpeza|desinfetante|agua-sanitaria|amaciante/, search: 'cleaning products household', perPage: 15 },
  { pattern: /papel-higienico|papel-toalha|guardanapo/, search: 'toilet paper tissue roll', perPage: 8 },
  { pattern: /biscoito|bolacha|oreo|cream-cracker/, search: 'cookies crackers package', perPage: 10 },
  { pattern: /batata.*lays|batata.*chips|ruffles|doritos|cheetos/, search: 'potato chips snack bag', perPage: 10 },
  { pattern: /chocolate.*barra|chocolate.*lacta|bombom.*garoto|bis/, search: 'chocolate bar candy', perPage: 10 },
  { pattern: /nuggets|empanado|salsicha.*hot.*dog/, search: 'frozen nuggets package', perPage: 8 },
  { pattern: /presunto|mortadela|peito-de-peru/, search: 'deli meat ham sliced', perPage: 10 },
  { pattern: /queijo.*mussarela|queijo.*prato|queijo.*coalho|queijo/, search: 'cheese slices block', perPage: 15 },
  { pattern: /iogurte|danone|activia/, search: 'yogurt cup dairy', perPage: 8 },
  { pattern: /manteiga|margarina/, search: 'butter margarine package', perPage: 5 },
  { pattern: /ovo.*dz|ovos/, search: 'eggs carton dozen', perPage: 5 },
  { pattern: /granola|cereal|aveia|chia/, search: 'granola cereal package healthy', perPage: 10 },

  // ─── HORTIFRUTI ───
  { pattern: /banana/, search: 'banana bunch fresh', perPage: 8 },
  { pattern: /maca|maca-fuji/, search: 'red apple fresh', perPage: 8 },
  { pattern: /laranja/, search: 'orange fruit fresh', perPage: 8 },
  { pattern: /morango/, search: 'strawberry fresh red', perPage: 8 },
  { pattern: /abacaxi/, search: 'pineapple fresh whole', perPage: 5 },
  { pattern: /manga/, search: 'mango fresh tropical', perPage: 5 },
  { pattern: /uva/, search: 'grapes bunch fresh', perPage: 5 },
  { pattern: /melancia/, search: 'watermelon fresh sliced', perPage: 5 },
  { pattern: /mamao|papaya/, search: 'papaya fresh tropical', perPage: 5 },
  { pattern: /limao/, search: 'lime lemon fresh green', perPage: 8 },
  { pattern: /tomate/, search: 'tomato fresh red vine', perPage: 8 },
  { pattern: /cebola/, search: 'onion fresh whole', perPage: 8 },
  { pattern: /alho/, search: 'garlic bulb fresh', perPage: 5 },
  { pattern: /batata-lavada|batata-doce|batata.*kg/, search: 'potato fresh raw', perPage: 8 },
  { pattern: /cenoura/, search: 'carrot fresh orange', perPage: 5 },
  { pattern: /alface|rucula|agri[aã]o/, search: 'lettuce greens fresh', perPage: 10 },
  { pattern: /brocolis|couve-flor|couve/, search: 'broccoli cauliflower vegetable', perPage: 10 },
  { pattern: /pimentao/, search: 'bell pepper colorful', perPage: 5 },
  { pattern: /pepino/, search: 'cucumber fresh green', perPage: 5 },
  { pattern: /abobrinha|abobora/, search: 'zucchini squash vegetable', perPage: 8 },
  { pattern: /mandioca|inhame/, search: 'cassava yam root', perPage: 5 },
  { pattern: /organico/, search: 'organic vegetables basket', perPage: 10 },
  { pattern: /hortalica|verdura|legume/, search: 'fresh vegetables market', perPage: 15 },

  // ─── PETSHOP ───
  { pattern: /racao.*cao|racao.*caes|racao.*adulto|racao.*filhote|golden.*formula|premier|pedigree/, search: 'dog food bag kibble', perPage: 15 },
  { pattern: /racao.*gato|racao.*felino|whiskas|golden.*gato/, search: 'cat food bag', perPage: 10 },
  { pattern: /petisco.*cao|osso.*natural|palito.*mastigavel|bifinhos/, search: 'dog treats snacks', perPage: 10 },
  { pattern: /petisco.*gato|sache.*gato|dreamies/, search: 'cat treats snacks', perPage: 8 },
  { pattern: /shampoo.*pet|condicionador.*pet|antipulgas|coleira.*anti/, search: 'pet grooming shampoo', perPage: 10 },
  { pattern: /cama-pet|caminha/, search: 'pet bed dog cat', perPage: 8 },
  { pattern: /comedouro|bebedouro/, search: 'pet bowl food water', perPage: 8 },
  { pattern: /brinquedo.*pet|bolinha.*pet|corda.*pet/, search: 'dog toy ball rope', perPage: 10 },
  { pattern: /caixa.*transporte|transporte.*pet/, search: 'pet carrier crate', perPage: 5 },
  { pattern: /coleira|guia|peitoral|focinheira/, search: 'dog collar leash harness', perPage: 10 },
  { pattern: /areia.*gato|granulado.*gato/, search: 'cat litter box sand', perPage: 8 },
  { pattern: /arranhador|arranhador.*gato/, search: 'cat scratching post', perPage: 5 },
  { pattern: /tapete.*higienico/, search: 'puppy training pad', perPage: 5 },
  { pattern: /peixe.*ornamental|aquario/, search: 'aquarium fish colorful', perPage: 5 },
  { pattern: /racao.*peixe|racao.*passaro|racao.*hamster/, search: 'fish bird hamster food', perPage: 5 },

  // ─── ADEGA ───
  { pattern: /kit.*cerveja|balde.*cerveja/, search: 'beer bucket ice party', perPage: 10 },
  { pattern: /gelo|saco-de-gelo/, search: 'ice cubes bag', perPage: 5 },
  { pattern: /amendoim|castanha|petisco.*adega|mix-de-nuts/, search: 'peanuts nuts snack bowl', perPage: 10 },
  { pattern: /destilado|cachaca|51|campari/, search: 'liquor spirits bottle bar', perPage: 10 },
  { pattern: /tequila/, search: 'tequila shot lime salt', perPage: 5 },

  // ─── GENÉRICOS / FALLBACKS ───
  { pattern: /combo|kit/, search: 'food combo meal deal', perPage: 20 },
  { pattern: /porco|porcao|porcoes/, search: 'food portion plate', perPage: 10 },
  { pattern: /vinagrete/, search: 'vinaigrette salsa fresh', perPage: 5 },
  { pattern: /farofa/, search: 'farofa cassava flour toasted', perPage: 5 },
  { pattern: /arroz/, search: 'rice white bowl', perPage: 5 },
  { pattern: /feijao/, search: 'beans bowl cooked', perPage: 5 },
]

// ─── Parse current file ─────────────────────────────────────

function parseCurrentMapping() {
  const filePath = resolve(ROOT, 'lib/generated-template-product-images.ts')
  const content = readFileSync(filePath, 'utf-8')
  const entries = []
  const regex = /"([^"]+)":\s*"(https:\/\/images\.pexels\.com\/photos\/(\d+)\/[^"]+)"/g
  let match
  while ((match = regex.exec(content)) !== null) {
    entries.push({
      key: match[1],
      url: match[2],
      photoId: match[3],
    })
  }
  return entries
}

// ─── Classify products ──────────────────────────────────────

function classifyEntries(entries) {
  const groups = new Map() // searchTerm → [entry]
  const unmatched = []

  for (const entry of entries) {
    let matched = false
    for (const group of SEMANTIC_GROUPS) {
      if (group.pattern.test(entry.key)) {
        const existing = groups.get(group.search) || { perPage: group.perPage, entries: [] }
        existing.entries.push(entry)
        // Increase perPage if we need more photos than current limit
        if (existing.entries.length > existing.perPage) {
          existing.perPage = Math.min(80, existing.entries.length + 5)
        }
        groups.set(group.search, existing)
        matched = true
        break
      }
    }
    if (!matched) {
      unmatched.push(entry)
    }
  }

  return { groups, unmatched }
}

/**
 * Derive an English search term from the Portuguese product key.
 * Used for unmatched products.
 */
function deriveSearchTerm(key) {
  // key format: template::category::order::product-name
  const parts = key.split('::')
  const productName = parts[3] || parts[1] || key
  const category = parts[1] || ''

  // Remove numbers, sizes, units
  let clean = productName
    .replace(/\d+(ml|l|g|kg|un|unid|pcs|pecas|fatias|dz)/gi, '')
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Simple PT → EN translations for common food words
  const translations = {
    agua: 'water', carne: 'meat', frango: 'chicken', peixe: 'fish',
    porco: 'pork', queijo: 'cheese', presunto: 'ham', ovo: 'egg',
    leite: 'milk', pao: 'bread', bolo: 'cake', torta: 'pie',
    doce: 'sweet dessert', salgado: 'savory snack', bebida: 'drink beverage',
    suco: 'juice', cafe: 'coffee', cha: 'tea', sorvete: 'ice cream',
    salada: 'salad', sopa: 'soup', arroz: 'rice', feijao: 'beans',
    batata: 'potato', tomate: 'tomato', cebola: 'onion', alho: 'garlic',
    laranja: 'orange', morango: 'strawberry', banana: 'banana', uva: 'grape',
    limao: 'lime lemon', manga: 'mango', abacaxi: 'pineapple', melancia: 'watermelon',
    cenoura: 'carrot', pepino: 'cucumber', alface: 'lettuce',
    cerveja: 'beer', vinho: 'wine', vodka: 'vodka', cachaca: 'rum spirit',
    hamburguer: 'hamburger', pizza: 'pizza', sushi: 'sushi',
    brigadeiro: 'chocolate truffle', pudim: 'flan pudding',
    picanha: 'steak beef', costela: 'ribs', linguica: 'sausage',
  }

  for (const [pt, en] of Object.entries(translations)) {
    if (clean.includes(pt)) {
      clean = clean.replace(new RegExp(pt, 'g'), en)
    }
  }

  // Add category context for better results
  const catContext = category.replace(/-/g, ' ')
  return `${clean} ${catContext} food`.substring(0, 80)
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  console.log('\n🔍 Parsing current mapping...')
  const entries = parseCurrentMapping()
  console.log(`   Found ${entries.length} entries`)

  const uniquePhotos = new Set(entries.map((e) => e.photoId))
  console.log(`   Unique photo IDs: ${uniquePhotos.size}`)
  console.log(`   Duplicated slots: ${entries.length - uniquePhotos.size}`)

  console.log('\n📂 Classifying products by semantic group...')
  const { groups, unmatched } = classifyEntries(entries)
  console.log(`   Semantic groups: ${groups.size}`)
  console.log(`   Products in groups: ${[...groups.values()].reduce((s, g) => s + g.entries.length, 0)}`)
  console.log(`   Unmatched (individual search): ${unmatched.length}`)

  // Track all assigned photo IDs globally
  const usedPhotoIds = new Set()
  const newMapping = new Map() // key → url

  // ── Process semantic groups ──
  console.log('\n🌐 Searching Pexels for semantic groups...\n')
  let searchCount = 0
  const totalSearches = groups.size + unmatched.length

  for (const [searchTerm, group] of groups) {
    searchCount++
    const needed = group.entries.length
    const perPage = Math.min(80, Math.max(needed + 10, group.perPage))

    process.stdout.write(
      `  [${searchCount}/${totalSearches}] "${searchTerm}" (${needed} products, requesting ${perPage})... `
    )

    const photoIds = await searchPexels(searchTerm, perPage)
    console.log(`got ${photoIds.length} results`)

    // Filter out already-used IDs
    const available = photoIds.filter((id) => !usedPhotoIds.has(id))

    // Assign photos to entries
    for (let i = 0; i < group.entries.length; i++) {
      const entry = group.entries[i]
      if (i < available.length) {
        const photoId = available[i]
        usedPhotoIds.add(photoId)
        newMapping.set(
          entry.key,
          `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg${IMG_PARAMS}`
        )
      } else {
        // Not enough unique results — do individual search
        unmatched.push(entry)
        console.log(`    ⚠ Not enough results for "${searchTerm}", queueing "${entry.key}" for individual search`)
      }
    }

    await sleep(DELAY_MS)
  }

  // ── Process unmatched / overflow ──
  if (unmatched.length > 0) {
    console.log(`\n🔎 Individual searches for ${unmatched.length} remaining products...\n`)

    for (const entry of unmatched) {
      if (newMapping.has(entry.key)) continue // already assigned in overflow retry

      searchCount++
      const searchTerm = deriveSearchTerm(entry.key)
      process.stdout.write(
        `  [${searchCount}/${totalSearches + unmatched.length}] "${searchTerm.substring(0, 50)}"... `
      )

      const photoIds = await searchPexels(searchTerm, 15)
      const available = photoIds.filter((id) => !usedPhotoIds.has(id))

      if (available.length > 0) {
        const photoId = available[0]
        usedPhotoIds.add(photoId)
        newMapping.set(
          entry.key,
          `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg${IMG_PARAMS}`
        )
        console.log(`✅ photo ${photoId}`)
      } else {
        // Last resort: try a broader search
        const broadPhotoIds = await searchPexels('food product', 80)
        const broadAvailable = broadPhotoIds.filter((id) => !usedPhotoIds.has(id))
        if (broadAvailable.length > 0) {
          const photoId = broadAvailable[0]
          usedPhotoIds.add(photoId)
          newMapping.set(
            entry.key,
            `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg${IMG_PARAMS}`
          )
          console.log(`✅ (broad) photo ${photoId}`)
        } else {
          // Keep original as absolute last resort
          newMapping.set(entry.key, entry.url)
          console.log(`⚠ kept original`)
        }
        await sleep(DELAY_MS)
      }

      await sleep(DELAY_MS)
    }
  }

  // ── Write output ──
  console.log('\n📝 Generating output file...')

  const sortedKeys = [...newMapping.keys()].sort()
  const lines = sortedKeys.map((key) => `  "${key}": "${newMapping.get(key)}"`)

  const output = `/**
 * Mapeamento gerado em lote para imagens individuais de produtos dos templates.
 *
 * Chave (string) criada com \`getTemplateProductImageKey\`
 * (ver \`lib/template-product-images.ts\`).
 *
 * Gerado automaticamente - ${new Date().toISOString().split('T')[0]}
 * Total: ${sortedKeys.length} imagens mapeadas
 * Fotos únicas: ${usedPhotoIds.size}
 */
export const TEMPLATE_PRODUCT_IMAGE_URLS: Record<string, string> = {
${lines.join(',\n')}
}
`

  const outPath = resolve(ROOT, 'lib/generated-template-product-images.ts')
  writeFileSync(outPath, output, 'utf-8')

  console.log(`\n✅ Concluído!`)
  console.log(`   Total entries: ${sortedKeys.length}`)
  console.log(`   Unique photos: ${usedPhotoIds.size}`)
  console.log(`   API calls: ${searchCount}`)
  console.log(`   Output: lib/generated-template-product-images.ts\n`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
