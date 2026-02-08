const fs = require('fs');
const path = require('path');

const VIDEOS_DIR = path.join(__dirname, '../client/public/videos');
const DICT_PATH = path.join(__dirname, 'src/data/lst-dictionary.json');

// Helper to map French to Tunisian/Arabic (Basic list)
const ARABIC_MAP = {
  'tete': 'رأس', 'téte': 'رأس',
  'cerveau': 'مخ',
  'yeux': 'عينين', 'oeils': 'عينين',
  'nez': 'خشم',
  'bouche': 'فم',
  'oreilles': 'وذن',
  'cou': 'رقبة',
  'epaule': 'كتف', 'épaule': 'كتف',
  'bras': 'ذراع',
  'main': 'يد',
  'doigts': 'صوابع',
  'ventre': 'كرش',
  'coeur': 'قلب',
  'jambe': 'ساق',
  'pied': 'ساق',
  'dos': 'ظهر',
  'hopital': 'سبيطار',
  'medecin': 'طبيب', 'médecin': 'طبيب',
  'pansement': 'فاصمة',
  'medicament': 'دواء', 'médicament': 'دواء',
  'fievre': 'سخانة', 'fièvre': 'سخانة',
  'douleur': 'وجيعة',
  'bebe': 'رضيع', 'bébé': 'رضيع',
  'enceinte': 'حبلة', 'grossesse': 'حبلة',
  'sang': 'دم',
  'dents': 'سنين',
  'langue': 'لسان',
  'cheveux': 'شعر',
  'visage': 'وجه',
  'poitrine': 'صدر',
  'gorge': 'قرجم',
  'estomac': 'معدة',
  'foie': 'كبدة',
  'intestins': 'مصارن',
  'genou': 'ركبة',
  'peau': 'جلدة',
  'os': 'عظم',
  'muscle': 'عضلة',
  'nerf': 'عصب',
  'poumons': 'رواوي',
  'rein': 'كلوة',
  'allergie': 'حساسية',
  'asthme': 'فدة',
  'diabete': 'سكر', 'diabète': 'سكر',
  'tension': 'ضغط',
  'grippe': 'قريب',
  'rhume': 'رواح',
  'toux': 'كحة',
  'cancer': 'اللطف',
  'operation': 'عملية',
  'analyses': 'تحاليل',
  'radio': 'راديو',
  'ordonnance': 'وصفة',
  'pharmacie': 'فرماسية',
  'infermier': 'فرملي', 'infirmier': 'فرملي',
  'sage-femme': 'قابلة',
  'ambulance': 'اسعاف',
  'urgence': 'استعجالي',
  'gratuit': 'بلاش',
  'rdv': 'موعد',
  'papiers': 'وراق',
  'carte': 'بطاقة',
  'argent': 'فلوس'
};

function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

try {
  // 1. Load existing dictionary
  const rawDict = fs.readFileSync(DICT_PATH, 'utf-8');
  const dictionary = JSON.parse(rawDict);
  const existingIds = new Set(dictionary.signs.map(s => s.id));

  // 2. Scan videos
  const files = fs.readdirSync(VIDEOS_DIR);
  
  let addedCount = 0;

  files.forEach(file => {
    if (!file.endsWith('.mp4')) return;

    const name = file.replace('.mp4', '');
    const cleanName = normalize(name).replace(/[^a-z0-9]/g, '_');
    const id = `sign_med_${cleanName}`;

    // Skip if already exists manual override (or update it? for now skip to avoid dupes)
    if (existingIds.has(id)) return;

    // Helper: generate words list
    const words = [name.toLowerCase()]; 
    
    // Add normalized version if different
    const norm = normalize(name);
    if (norm !== name.toLowerCase()) words.push(norm);

    // Add Arabic/Darija matches
    // Split filename into words to match partials (e.g. "medecin generaliste")
    const parts = norm.split(/[\s\-']+/);
    parts.forEach(p => {
      if (ARABIC_MAP[p]) {
        // Only add if not already present
        if (!words.includes(ARABIC_MAP[p])) words.push(ARABIC_MAP[p]);
      }
    });

    const newSign = {
      id: id,
      words: words,
      animation: `video:${file}`,
      category: 'medical',
      duration: 4.0, // Default duration for video mode
      description: `Vidéo: ${name}`,
      difficulty: 'medium'
    };

    dictionary.signs.push(newSign);
    existingIds.add(id);
    addedCount++;
    console.log(`+ Added: ${name} [${words.join(', ')}]`);
  });

  // 3. Save
  fs.writeFileSync(DICT_PATH, JSON.stringify(dictionary, null, 2), 'utf-8');
  console.log(`\n✅ Success! Added ${addedCount} new medical signs from videos.`);

} catch (e) {
  console.error('Error updating dictionary:', e);
}
