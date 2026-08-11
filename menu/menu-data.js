// بيانات المنيو - Lucca Café
const menuData = [
    {
        title: 'الفطور',
        icon: '🥪',
        id: 'breakfast',
        items: [
            { name: 'توست ميكس جبن (نصف)', price: 30, description: 'توست محمص بميكس الجبنة' },
            { name: 'توست ميكس جبن (كامل)', price: 60, description: 'توست محمص بميكس الجبنة', badge: 'popular' },
            { name: 'توست بسطرمة (نصف)', price: 35, description: 'توست محمص بالبسطرمة' },
            { name: 'توست بسطرمة (كامل)', price: 70, description: 'توست محمص بالبسطرمة', badge: 'popular' },
            { name: 'توست روزبيف (نصف)', price: 35, description: 'توست محمص بالروزبيف' },
            { name: 'توست روزبيف (كامل)', price: 70, description: 'توست محمص بالروزبيف', badge: 'popular' },
            { name: 'توست رومي مدخن (نصف)', price: 35, description: 'توست محمص بالرومي المدخن' },
            { name: 'توست رومي مدخن (كامل)', price: 70, description: 'توست محمص بالرومي المدخن', badge: 'popular' },
            { name: 'توست كفيار (نصف)', price: 50, description: 'توست محمص بالكفيار', badge: 'specialty' },
            { name: 'توست كفيار (كامل)', price: 100, description: 'توست محمص بالكفيار', badge: 'specialty' },
            { name: 'ساندويتش ميكس جبن', price: 25, description: 'ساندويتش بميكس الجبنة' },
            { name: 'ساندويتش بسطرمة', price: 30, description: 'ساندويتش بالبسطرمة' },
            { name: 'كرواسون سادة', price: 65, description: 'كرواسون سادة طري وفريش', badge: 'new' },
            { name: 'كرواسون تركي', price: 85, description: 'كرواسون محشي رومي تركي', badge: 'popular' },
            { name: 'كرواسون روزبيف', price: 85, description: 'كرواسون محشي روزبيف' },
            { name: 'كرواسون حلومي بستو', price: 95, description: 'كرواسون محشي جبنة حلومي بصوص البيستو', badge: 'specialty' },
            { name: 'شباتا تركي', price: 85, description: 'شباتا محشي رومي تركي' },
            { name: 'شباتا روزبيف', price: 85, description: 'شباتا محشي روزبيف' },
            { name: 'شباتا حلومي بستو', price: 95, description: 'شباتا محشي جبنة حلومي بصوص البيستو', badge: 'specialty' },
            { name: 'باجيت تركي', price: 85, description: 'باجيت محشي رومي تركي' },
            { name: 'باجيت روزبيف', price: 85, description: 'باجيت محشي روزبيف' },
            { name: 'باجيت حلومي بستو', price: 95, description: 'باجيت محشي جبنة حلومي بصوص البيستو', badge: 'specialty' }
        ]
    },
    {
        title: 'البيتزا',
        icon: '🍕',
        id: 'pizza',
        items: [
            { name: 'بيتزا سي فود', price: 250, description: 'بيتزا بالمأكولات البحرية الطازجة', badge: 'specialty' },
            { name: 'بيتزا سلامي', price: 170, description: 'بيتزا بالسلامي الإيطالي', badge: 'popular' },
            { name: 'بيتزا رانش', price: 200, description: 'بيتزا بصوص الرانش' },
            { name: 'بيتزا دجاج', price: 200, description: 'بيتزا بقطع الدجاج', badge: 'popular' },
            { name: 'بيتزا مارجريتا', price: 150, description: 'بيتزا كلاسيك بجبن الموزاريلا' },
            { name: 'بيتزا تشيكن باربكيو', price: 180, description: 'بيتزا بقطع الدجاج وصوص الباربكيو' },
            { name: 'بيتزا اسبايسي رانش', price: 190, description: 'بيتزا حارة بصوص الرانش' },
            { name: 'بيتزا سوبر سوبريم', price: 220, description: 'بيتزا الخلطة الفاخرة باللحم والدجاج', badge: 'popular' }
        ]
    },
    {
        title: 'القهوة المختصه',
        icon: '☕',
        id: 'specialty',
        items: [
            { name: 'V60', price: 80, description: 'قهوة مفلترة يدوياً بطريقة V60 للحصول على كوب نظيف وحمضي متوازن.', origins: ['إثيوبي', 'برازيلي', 'كولومبي'], badge: 'popular' },
            { name: 'آيس دريب', price: 80, description: 'قهوة باردة تُقطر ببطء على مدار 8-12 ساعة ليظهر المذاق بوضوح.', origins: ['إثيوبي', 'برازيلي', 'كولومبي'], badge: 'specialty' },
            { name: 'قهوة اليوم', price: 50, description: 'تصفية يومية من حبوب مختارة ومحمصة بعناية حسب الموسم.', badge: 'new' },
            { name: 'Aeropress', price: 75, description: 'قهوة مضغوطة بالهواء للحصول على مذاق قوي ونظيف.', badge: 'specialty' },
            { name: 'French Press', price: 70, description: 'قهوة فرنسي بريس بطيئة التحضير غنية بالنكهة.' }
        ]
    },
    {
        title: 'قسم القهوة',
        icon: '☕',
        id: 'coffee',
        items: [
            { name: 'إسبريسو', price: 45, description: 'جرعة إسبريسو مركزة بنكهة شوكولاتة وكراميل.', badge: 'popular' },
            { name: 'إسبريسو دبل', price: 70, description: 'جرعة مزدوجة من الإسبريسو الغني والمكثف.' },
            { name: 'قهوة تركي', price: 35, description: 'قهوة تركية تقليدية مع رغوة خفيفة ونكهة قوية.' },
            { name: 'قهوة فرنساوي', price: 65, description: 'قهوة فرنسي برس بطيئة التحضير غنية بالنكهة.' },
            { name: 'قهوة بندق', price: 70, description: 'قهوة بنكهة البندق المحمص.', badge: 'popular' },
            { name: 'ميكاتو', price: 50, description: 'قطرة حليب على جرعة إسبريسو.' },
            { name: 'ميكاتو دبل', price: 80, description: 'إسبريسو دبل مع لمسة حليب خفيفة.' },
            { name: 'موكا', price: 75, description: 'إسبريسو مع شوكولاتة داكنة وحليب ساخن.' },
            { name: 'وايت موكا', price: 75, description: 'موكا ناعمة مع حليب ومذاق شوكولاتة فاتح.' },
            { name: 'فلات وايت', price: 80, description: 'إسبريسو مع طبقة رقيقة من الحليب المبخر.' },
            { name: 'كورتادو', price: 75, description: 'نسبة متوازنة بين الإسبريسو والحليب الساخن.' },
            { name: 'كابتشينو', price: 85, description: 'إسبريسو مع رغوة كثيفة وحليب ساخن.', badge: 'popular' },
            { name: 'لاتيه', price: 85, description: 'قهوة إسبريسو مع حليب مخملي ورغوة خفيفة.', badge: 'popular' },
            { name: 'نسكافيه', price: 70, description: 'مشروب قهوة سريع التحضير.' },
            { name: 'هوت شوكليت', price: 70, description: 'مشروب شوكولاتة دافئ غني وكريمي.' },
            { name: 'هوت شوكليت نوتيلا', price: 80, description: 'شوكولاتة ساخنة مع نكهة النوتيلا.', badge: 'specialty' }
        ]
    },
    {
        title: 'مشروبات ساخنة',
        icon: '🫖',
        id: 'hot',
        items: [
            { name: 'شاي', price: 35, description: 'شاي أسود طازج' },
            { name: 'شاي كرك', price: 50, description: 'شاي هندي محمص', badge: 'specialty' },
            { name: 'شاي أخضر', price: 35, description: 'شاي أخضر طازج' },
            { name: 'ميكس أعشاب', price: 50, description: 'خلطة أعشاب متنوعة' },
            { name: 'شاي بالبن', price: 50, description: 'شاي مع لبن' },
            { name: 'أعشاب', price: 35, description: 'مشروب أعشاب دافئ' },
            { name: 'هوت سيدر', price: 50, description: 'مشروب تفاح ساخن بالقرفة', badge: 'new' }
        ]
    },
    {
        title: 'القهوة المثلجة',
        icon: '🧊',
        id: 'iced',
        items: [
            { name: 'آيس كوفي', price: 80, description: 'قهوة مثلجة', badge: 'popular' },
            { name: 'آيس لاتيه', price: 85, description: 'لاتيه مثلج', badge: 'popular' },
            { name: 'آيس موكا', price: 90, description: 'موكا مثلج' },
            { name: 'آيس وايت موكا', price: 90, description: 'وايت موكا مثلج' },
            { name: 'فرابتشينو', price: 95, description: 'فرابيه مثلج', badge: 'specialty' },
            { name: 'فرابيه كلاسيك', price: 85, description: 'فرابيه كلاسيك' },
            { name: 'فرابيه فروت', price: 95, description: 'فرابيه بالفواكه' }
        ]
    },
    {
        title: 'ميلك شيك',
        icon: '🥤',
        id: 'milkshake',
        items: [
            { name: 'شوكولاتة', price: 90, description: 'ميلك شيك شوكولاتة', badge: 'popular' },
            { name: 'فانيليا', price: 90, description: 'ميلك شيك فانيليا' },
            { name: 'فراولة', price: 90, description: 'ميلك شيك فراولة', badge: 'popular' },
            { name: 'مانجو', price: 90, description: 'ميلك شيك مانجو' },
            { name: 'نوتيلا', price: 100, description: 'ميلك شيك نوتيلا', badge: 'specialty' },
            { name: 'أوريو', price: 110, description: 'ميلك شيك أوريو', badge: 'new' },
            { name: 'كراميل', price: 90, description: 'ميلك شيك كراميل' },
            { name: 'ميكس شوكليت', price: 120, description: 'ميلك شيك شوكليت ميكس', badge: 'specialty' }
        ]
    },
    {
        title: 'عصائر فريش',
        icon: '🍹',
        id: 'juice',
        items: [
            { name: 'مانجو', price: 90, description: 'عصير مانجو طازج', badge: 'popular' },
            { name: 'فراولة', price: 80, description: 'عصير فراولة طازج' },
            { name: 'جوافة', price: 75, description: 'عصير جوافة طازج', badge: 'new' },
            { name: 'برتقال', price: 75, description: 'عصير برتقال طازج', badge: 'popular' },
            { name: 'ليمون', price: 70, description: 'ليمون طازج' },
            { name: 'ليمون بالنعناع', price: 75, description: 'ليمون طازج مع نعناع', badge: 'new' },
            { name: 'كيوي', price: 90, description: 'عصير كيوي طازج', badge: 'new' }
        ]
    },
    {
        title: 'الحلويات',
        icon: '🍰',
        id: 'desserts',
        items: [
            { name: 'وافل كلاسيك', price: 80, description: 'وافل مع صوص', badge: 'popular' },
            { name: 'وافل شوكليت', price: 140, description: 'وافل مع شوكولاتة', badge: 'specialty' },
            { name: 'سان سيباستيان', price: 70, description: 'تشيز كيك فطري', badge: 'new' },
            { name: 'مولتن', price: 80, description: 'كيك الشوكولاتة الذائبة', badge: 'popular' },
            { name: 'براونيز', price: 80, description: 'براونيز شوكولاتة' },
            { name: 'كوكيز', price: 40, description: 'كوكيز طازج' },
            { name: 'وافل فورسيزون', price: 120, description: 'وافل بأربع نكهات', badge: 'specialty' },
            { name: 'وافل بابل', price: 85, description: 'وافل بابل' },
            { name: 'وافل فواكه', price: 110, description: 'وافل بالفواكه الطازجة' },
            { name: 'تشيز كيك', price: 90, description: 'تشيز كيك كلاسيك', badge: 'popular' },
            { name: 'موس جالاكسي', price: 100, description: 'موس جالاكسي بالشوكولاتة', badge: 'specialty' },
            { name: 'ريد فالفيت', price: 95, description: 'ريد فالفيت بكريمة الجبنة', badge: 'new' }
        ]
    },
    {
        title: 'سموزي',
        icon: '🥭',
        id: 'smoothie',
        items: [
            { name: 'من اختيارك', price: 75, description: 'سموزي طازج من اختيارك', badge: 'popular' }
        ]
    },
    {
        title: 'مشروبات صودا',
        icon: '🍋',
        id: 'soda',
        items: [
            { name: 'موهيتو', price: 75, description: 'موهيتو كلاسيك', badge: 'popular' },
            { name: 'موهيتو فليفر', price: 100, description: 'موهيتو بالنكهة', badge: 'new' },
            { name: 'بينا كولادا', price: 75, description: 'كوكتيل أناناس', badge: 'specialty' },
            { name: 'ميكس لوكا', price: 80, description: 'مشروب لوكا الخاص', badge: 'specialty' },
            { name: 'جيلي كولا', price: 75, description: 'جيلي كولا' },
            { name: 'صن شاين', price: 75, description: 'صن شاين' },
            { name: 'صن رايز', price: 75, description: 'صن رايز' },
            { name: 'شيري كولا', price: 75, description: 'شيري كولا' },
            { name: 'ميكس بيري', price: 80, description: 'ميكس بيري', badge: 'new' },
            { name: 'بلو بيري فراولة', price: 75, description: 'بلو بيري فراولة' },
            { name: 'باشون أناناس', price: 75, description: 'باشون أناناس' },
            { name: 'ريدبول فليفر', price: 120, description: 'ريدبول فليفر', badge: 'specialty' }
        ]
    },
    {
        title: 'مشروبات شتوية',
        icon: '🍂',
        id: 'winter',
        items: [
            { name: 'سحلب', price: 85, description: 'سحلب ساخن كريمي مع قرفة وجوز هند', badge: 'popular' },
            { name: 'سحلب نوتيلا', price: 90, description: 'سحلب بنوتيلا', badge: 'specialty' },
            { name: 'حمص الشام', price: 80, description: 'حمص الشام' },
            { name: 'بليلة', price: 85, description: 'بليلة' },
            { name: 'شاي كرك', price: 50, description: 'شاي هندي محمص بالتوابل' },
            { name: 'قرفة', price: 50, description: 'مشروب قرفة دافئ' },
            { name: 'ينسون', price: 40, description: 'مشروب ينسون دافئ' },
            { name: 'زنجبيل', price: 40, description: 'زنجبيل طازج ساخن' },
            { name: 'بابونج', price: 40, description: 'شاي بابونج مهدئ' }
        ]
    },
    {
        title: 'مشروبات غازية وطاقة',
        icon: '🥫',
        id: 'cans',
        items: [
            { name: 'بيبسي', price: 35, description: 'بيبسي بارد منعش' },
            { name: 'سفن أب', price: 35, description: 'سفن أب ليمون لايم' },
            { name: 'ميرندا', price: 35, description: 'ميرندا برتقال منعش' },
            { name: 'ريد بول', price: 85, description: 'مشروب طاقة ريد بول', badge: 'popular' },
            { name: 'تويست', price: 35, description: 'مشروب طاقة تويست' },
            { name: 'فيروز', price: 40, description: 'فيروز' },
            { name: 'بيريل', price: 50, description: 'بيريل' },
            { name: 'مياه', price: 10, description: 'مياه معدنية باردة' }
        ]
    },
    {
        title: 'الإضافات',
        icon: '➕',
        id: 'addons',
        items: [
            { name: 'جبن', price: 15, description: 'جبن مقدون' },
            { name: 'شيكولاتة', price: 15, description: 'شيكولاتة' },
            { name: 'مكسرات', price: 20, description: 'مكسرات' },
            { name: 'نوتيلا', price: 25, description: 'نوتيلا' },
            { name: 'كارت', price: 5, description: 'كارد' },
            { name: 'طاولة', price: 20, description: 'طاولة' }
        ]
    }
];
