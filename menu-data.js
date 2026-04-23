const menuData = [
    {
        title: 'القهوة المختصة',
        icon: '☕',
        items: [
            {
                name: 'V60',
                price: '80',
                unit: 'ج.م',
                origins: ['🇪🇹 إثيوبي', '🇧🇷 برازيلي', '🇮🇳 هندي', '🇨🇴 كولومبي']
            },
            {
                name: 'آيس دريب',
                price: '80',
                unit: 'ج.م',
                origins: ['🇪🇹 إثيوبي', '🇧🇷 برازيلي', '🇮🇳 هندي', '🇨🇴 كولومبي']
            },
            {
                name: 'قهوة اليوم',
                price: '50',
                unit: 'ج.م',
                origins: ['🇪🇹 إثيوبي', '🇧🇷 برازيلي', '🇮🇳 هندي', '🇨🇴 كولومبي']
            }
        ]
    },
    {
        title: 'قسم القهوة',
        icon: '☕',
        items: [
            { name: 'إسبريسو', price: '45', unit: 'ج.م' },
            { name: 'إسبريسو دبل', price: '70', unit: 'ج.م' },
            { name: 'قهوة تركي', price: '35', unit: 'ج.م' },
            { name: 'ميكاتو', price: '50', unit: 'ج.م' },
            { name: 'ميكاتو دبل', price: '80', unit: 'ج.م' },
            { name: 'موكا', price: '75', unit: 'ج.م' },
            { name: 'وايت موكا', price: '75', unit: 'ج.م' },
            { name: 'فلات وايت', price: '80', unit: 'ج.م' },
            { name: 'كورتادو', price: '75', unit: 'ج.م' },
            { name: 'كابتشينو', price: '85', unit: 'ج.م' },
            { name: 'لاتيه', price: '85', unit: 'ج.م' },
            { name: 'قهوة بندق', price: '75', unit: 'ج.م' },
            { name: 'قهوة فرنساوي', price: '65', unit: 'ج.م' },
            { name: 'نسكافيه', price: '70', unit: 'ج.م' },
            { name: 'هوت شوكليت', price: '70', unit: 'ج.م' },
            { name: 'هوت شوكليت نوتيلا', price: '80', unit: 'ج.م' }
        ]
    },
    {
        title: 'مشروبات ساخنة',
        icon: '🫖',
        items: [
            { name: 'شاي', price: '35', unit: 'ج.م' },
            { name: 'شاي كرك', price: '50', unit: 'ج.م' },
            { name: 'شاي أخضر', price: '35', unit: 'ج.م' },
            { name: 'ميكس أعشاب', price: '50', unit: 'ج.م' },
            { name: 'شاي بالبن', price: '50', unit: 'ج.م' },
            { name: 'هوت سيدر', price: '50', unit: 'ج.م' },
            { name: 'أعشاب', price: '40', unit: 'ج.م' }
        ]
    },
    {
        title: 'القهوة المثلجة',
        icon: '🧊',
        items: [
            { name: 'آيس كوفي', price: '80', unit: 'ج.م' },
            { name: 'آيس لاتيه', price: '85', unit: 'ج.م' },
            { name: 'آيس موكا', price: '90', unit: 'ج.م' },
            { name: 'آيس وايت موكا', price: '90', unit: 'ج.م' },
            { name: 'فرابتشينو', price: '95', unit: 'ج.م' },
            { name: 'فرابيه', description: 'كلاسيك أو فروت', prices: ['85', '95'], unit: 'ج.م' }
        ]
    },
    {
        title: 'ميلك شيك',
        icon: '🥤',
        items: [
            { name: 'شوكولاتة', price: '90', unit: 'ج.م' },
            { name: 'فانيليا', price: '90', unit: 'ج.م' },
            { name: 'فراولة', price: '90', unit: 'ج.م' },
            { name: 'مانجو', price: '90', unit: 'ج.م' },
            { name: 'نوتيلا', price: '100', unit: 'ج.م' },
            { name: 'كراميل', price: '90', unit: 'ج.م' },
            { name: 'أوريو', price: '110', unit: 'ج.م' },
            { name: 'ميكس شوكليت', price: '120', unit: 'ج.م' }
        ]
    },
    {
        title: 'عصائر فريش',
        icon: '🍹',
        items: [
            { name: 'مانجو', price: '90', unit: 'ج.م' },
            { name: 'فراولة', price: '80', unit: 'ج.م' },
            { name: 'جوافة', price: '75', unit: 'ج.م' },
            { name: 'كيوي', price: '90', unit: 'ج.م' },
            { name: 'برتقال', price: '75', unit: 'ج.م' },
            { name: 'ليمون', price: '70', unit: 'ج.م' },
            { name: 'ليمون نعناع', price: '75', unit: 'ج.م' }
        ]
    },
    {
        title: 'الحلويات',
        icon: '🍰',
        items: [
            { name: 'وافل كلاسيك', description: 'نص / كامل', prices: ['40', '80'], unit: 'ج.م' },
            { name: 'وافل ميكس شوكليت', price: '140', unit: 'ج.م' },
            { name: 'وافل فورسيزون', price: '120', unit: 'ج.م' },
            { name: 'وافل بابل', price: '85', unit: 'ج.م' },
            { name: 'وافل فواكه', price: '110', unit: 'ج.م' },
            { name: 'سان سيباستيان', price: '70', unit: 'ج.م' },
            { name: 'مولتن', price: '80', unit: 'ج.م' },
            { name: 'براونيز', price: '80', unit: 'ج.م' },
            { name: 'كوكيز', price: '40', unit: 'ج.م' },
            { name: 'أم علي مكسرات', price: '90', unit: 'ج.م' },
            { name: 'تشيز كيك', price: '90', unit: 'ج.م' },
            { name: 'موس جالاكسي', price: '100', unit: 'ج.م' }
        ]
    },
    {
        title: 'سموزي',
        icon: '🥤',
        items: [
            { name: 'من اختيارك', price: '75', unit: 'ج.م' }
        ]
    },
    {
        title: 'مشروبات صودا',
        icon: '🍋',
        items: [
            { name: 'جيلي كولا', price: '75', unit: 'ج.م' },
            { name: 'صن شاين', price: '75', unit: 'ج.م' },
            { name: 'صن رايز', price: '75', unit: 'ج.م' },
            { name: 'موهيتو', price: '75', unit: 'ج.م' },
            { name: 'موهيتو فليفر', price: '100', unit: 'ج.م' },
            { name: 'شيري كولا', price: '75', unit: 'ج.م' },
            { name: 'ميكس بيري', price: '80', unit: 'ج.م' },
            { name: 'بلو بيري فراولة', price: '75', unit: 'ج.م' },
            { name: 'بينا كولادا', price: '75', unit: 'ج.م' },
            { name: 'باشون أناناس', price: '75', unit: 'ج.م' },
            { name: 'ريدبول فليفر', price: '120', unit: 'ج.م' },
            { name: 'ميكس لوكا', price: '80', unit: 'ج.م' }
        ]
    },
    {
        title: 'الأصناف الشتوية',
        icon: '❄️',
        items: [
            { name: 'حمص الشام', price: '80', unit: 'ج.م' },
            { name: 'بليلة', price: '85', unit: 'ج.م' },
            { name: 'سحلب', price: '85', unit: 'ج.م' },
            { name: 'سحلب نوتيلا', price: '90', unit: 'ج.م' }
        ]
    },
    {
        title: 'الفطار',
        icon: '🍞',
        items: [
            { name: 'توست ميكس جبن', prices: ['30', '60'], unit: 'ج.م' },
            { name: 'توست بسطرمة', prices: ['35', '70'], unit: 'ج.م' },
            { name: 'توست روزبيف', prices: ['35', '70'], unit: 'ج.م' },
            { name: 'توست رومي مدخن', prices: ['35', '70'], unit: 'ج.م' },
            { name: 'ساندويتش ميكس جبن', price: '25', unit: 'ج.م' },
            { name: 'ساندويتش بسطرمة', price: '30', unit: 'ج.م' },
            { name: 'ساندويتش روزبيف', price: '30', unit: 'ج.م' },
            { name: 'ساندويتش رومي مدخن', price: '30', unit: 'ج.م' }
        ]
    },
    {
        title: 'المشروبات الغازية والمياه',
        icon: '🥤',
        items: [
            { name: 'بيبسي', price: '35', unit: 'ج.م' },
            { name: 'تويست', price: '35', unit: 'ج.م' },
            { name: 'فيروز', price: '40', unit: 'ج.م' },
            { name: 'ريدبول', price: '85', unit: 'ج.م' },
            { name: 'بيريل', price: '50', unit: 'ج.م' },
            { name: 'مياه', price: '10', unit: 'ج.م' }
        ]
    }
];
