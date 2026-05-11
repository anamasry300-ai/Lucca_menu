// بيانات المنيو - Lucca Café
const menuData = [
    {
        title: 'الفطور',
        icon: '🥪',
        id: 'breakfast',
        items: [
            { name: 'توست ميكس جبن (نصف)', price: 30, description: 'توست محمص بميكس الجبنة', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80' },
            { name: 'توست ميكس جبن (كامل)', price: 60, description: 'توست محمص بميكس الجبنة', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'توست روزبيف (نصف)', price: 35, description: 'توست محمص بالروزبيف', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80' },
            { name: 'توست روزبيف (كامل)', price: 70, description: 'توست محمص بالروزبيف', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'توست تركي مدخن (نصف)', price: 35, description: 'توست محمص بالتركي المدخن', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80' },
            { name: 'توست تركي مدخن (كامل)', price: 70, description: 'توست محمص بالتركي المدخن', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'توست بسطرمة (نصف)', price: 35, description: 'توست محمص بالبسطرمة', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80' },
            { name: 'توست بسطرمة (كامل)', price: 70, description: 'توست محمص بالبسطرمة', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80', badge: 'popular' }
        ]
    },
    {
        title: 'البيتزا',
        icon: '🍕',
        id: 'pizza',
        items: [
            { name: 'بيتزا سي فود', price: 250, description: 'بيتزا بالمأكولات البحرية الطازجة', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80', badge: 'specialty' },
            { name: 'بيتزا سلامي', price: 170, description: 'بيتزا بالسلامي الإيطالي', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'بيتزا رانش', price: 200, description: 'بيتزا بصوص الرانش', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80' },
            { name: 'بيتزا دجاج', price: 200, description: 'بيتزا بقطع الدجاج', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'بيتزا مارجريتا', price: 150, description: 'بيتزا كلاسيك بجبن الموزاريلا', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80' },
            { name: 'بيتزا روزبيف', price: 170, description: 'بيتزا بالروزبيف', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80' },
            { name: 'بيتزا رومي مدخن', price: 170, description: 'بيتزا بالرومي المدخن', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80' }
        ]
    },
    {
        title: 'القهوة المختصه',
        icon: '☕',
        id: 'specialty',
        items: [
            {
                name: 'V60',
                price: 80,
                description: 'قهوة مفلترة يدوياً بطريقة V60 للحصول على كوب نظيف وحمضي متوازن.',
                image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
                origins: ['إثيوبي', 'برازيلي', 'كولومبي'],
                badge: 'popular'
            },
            {
                name: 'آيس دريب',
                price: 80,
                description: 'قهوة باردة تُقطر ببطء على مدار 8-12 ساعة ليظهر المذاق بوضوح.',
                image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80',
                origins: ['إثيوبي', 'برازيلي', 'كولومبي'],
                badge: 'specialty'
            },
            {
                name: 'قهوة اليوم',
                price: 50,
                description: 'تصفية يومية من حبوب مختارة ومحمصة بعناية حسب الموسم.',
                image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
                badge: 'new'
            },
            {
                name: 'Aeropress',
                price: 75,
                description: 'قهوة مضغوطة بالهواء للحصول على مذاق قوي ونظيف.',
                image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80',
                badge: 'specialty'
            },
            {
                name: 'French Press',
                price: 70,
                description: 'قهوة فرنسي بريس بطيئة التحضير غنية بالنكهة.',
                image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80'
            }
        ]
    },
    {
        title: 'قسم القهوة',
        icon: '☕',
        id: 'coffee',
        items: [
            { name: 'إسبريسو', price: 45, description: 'جرعة إسبريسو مركزة بنكهة شوكولاتة وكراميل.', image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'إسبريسو دبل', price: 70, description: 'جرعة مزدوجة من الإسبريسو الغني والمكثف.', image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80' },
            { name: 'قهوة تركي', price: 35, description: 'قهوة تركية تقليدية مع رغوة خفيفة ونكهة قوية.', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80' },
            { name: 'ميكاتو', price: 50, description: 'قطرة حليب على جرعة إسبريسو.', image: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=400&q=80' },
            { name: 'ميكاتو دبل', price: 80, description: 'إسبريسو دبل مع لمسة حليب خفيفة.', image: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=400&q=80' },
            { name: 'موكا', price: 75, description: 'إسبريسو مع شوكولاتة داكنة وحليب ساخن.', image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc39?auto=format&fit=crop&w=400&q=80' },
            { name: 'وايت موكا', price: 75, description: 'موكا ناعمة مع حليب ومذاق شوكولاتة فاتح.', image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc39?auto=format&fit=crop&w=400&q=80' },
            { name: 'فلات وايت', price: 80, description: 'إسبريسو مع طبقة رقيقة من الحليب المبخر.', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80' },
            { name: 'كورتادو', price: 75, description: 'نسبة متوازنة بين الإسبريسو والحليب الساخن.', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80' },
            { name: 'كابتشينو', price: 85, description: 'إسبريسو مع رغوة كثيفة وحليب ساخن.', image: 'https://images.unsplash.com/photo-1459257831348-f0cdd359235f?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'لاتيه', price: 85, description: 'قهوة إسبريسو مع حليب مخملي ورغوة خفيفة.', image: 'https://images.unsplash.com/photo-1459257831348-f0cdd359235f?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'نسكافيه', price: 70, description: 'مشروب قهوة سريع التحضير.', image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80' },
            { name: 'هوت شوكليت', price: 70, description: 'مشروب شوكولاتة دافئ غني وكريمي.', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80' },
            { name: 'هوت شوكليت نوتيلا', price: 80, description: 'شوكولاتة ساخنة مع نكهة النوتيلا.', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80', badge: 'specialty' }
        ]
    },
    {
        title: 'مشروبات ساخنة',
        icon: '🫖',
        id: 'hot',
        items: [
            { name: 'شاي', price: 35, description: 'شاي أسود طازج', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b28505?auto=format&fit=crop&w=400&q=80' },
            { name: 'شاي كرك', price: 50, description: 'شاي هندي محمص', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b28505?auto=format&fit=crop&w=400&q=80', badge: 'specialty' },
            { name: 'شاي أخضر', price: 35, description: 'شاي أخضر طازج', image: 'https://images.unsplash.com/photo-1556881286-fc691516e071?auto=format&fit=crop&w=400&q=80' },
            { name: 'ميكس أعشاب', price: 50, description: 'خلطة أعشاب متنوعة', image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=400&q=80' },
            { name: 'شاي بالبن', price: 50, description: 'شاي مع لبن', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b28505?auto=format&fit=crop&w=400&q=80' }
        ]
    },
    {
        title: 'القهوة المثلجة',
        icon: '🧊',
        id: 'iced',
        items: [
            { name: 'آيس كوفي', price: 80, description: 'قهوة مثلجة', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'آيس لاتيه', price: 85, description: 'لاتيه مثلج', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'آيس موكا', price: 90, description: 'موكا مثلج', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=80' },
            { name: 'آيس وايت موكا', price: 90, description: 'وايت موكا مثلج', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=80' },
            { name: 'فرابتشينو', price: 95, description: 'فرابيه مثلج', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80', badge: 'specialty' }
        ]
    },
    {
        title: 'ميلك شيك',
        icon: '🥤',
        id: 'milkshake',
        items: [
            { name: 'شوكولاتة', price: 90, description: 'ميلك شيك شوكولاتة', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'فانيليا', price: 90, description: 'ميلك شيك فانيليا', image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&w=400&q=80' },
            { name: 'فراولة', price: 90, description: 'ميلك شيك فراولة', image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'مانجو', price: 90, description: 'ميلك شيك مانجو', image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&w=400&q=80' },
            { name: 'نوتيلا', price: 100, description: 'ميلك شيك نوتيلا', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80', badge: 'specialty' },
            { name: 'أوريو', price: 110, description: 'ميلك شيك أوريو', image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&w=400&q=80', badge: 'new' }
        ]
    },
    {
        title: 'عصائر فريش',
        icon: '🍹',
        id: 'juice',
        items: [
            { name: 'مانجو', price: 90, description: 'عصير مانجو طازج', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'فراولة', price: 80, description: 'عصير فراولة طازج', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=400&q=80' },
            { name: 'جوافة', price: 80, description: 'عصير جوافة طازج', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=400&q=80', badge: 'new' },
            { name: 'برتقال', price: 75, description: 'عصير برتقال طازج', image: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'ليمون', price: 65, description: 'ليمون طازج', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=400&q=80' },
            { name: 'ليمون بالنعناع', price: 75, description: 'ليمون طازج مع نعناع', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=400&q=80', badge: 'new' }
        ]
    },
    {
        title: 'الحلويات',
        icon: '🍰',
        id: 'desserts',
        items: [
            { name: 'وافل كلاسيك', price: 80, description: 'وافل مع صوص', image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'وافل شوكليت', price: 140, description: 'وافل مع شوكولاتة', image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=400&q=80', badge: 'specialty' },
            { name: 'سان سيباستيان', price: 70, description: 'تشيز كيك فطري', image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80', badge: 'new' },
            { name: 'مولتن', price: 80, description: 'كيك الشوكولاتة الذائبة', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'براونيز', price: 80, description: 'براونيز شوكولاتة', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80' },
            { name: 'كوكيز', price: 40, description: 'كوكيز طازج', image: 'https://images.unsplash.com/photo-1499636136210-6f4e915e7177?auto=format&fit=crop&w=400&q=80' }
        ]
    },
    {
        title: 'مشروبات صودا',
        icon: '🍋',
        id: 'soda',
        items: [
            { name: 'موهيتو', price: 75, description: 'موهيتو كلاسيك', image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'موهيتو فليفر', price: 100, description: 'موهيتو بالنكهة', image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80', badge: 'new' },
            { name: 'بينا كولادا', price: 75, description: 'كوكتيل أناناس', image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80', badge: 'specialty' },
            { name: 'ميكس لوكا', price: 80, description: 'مشروب لوكا الخاص', image: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=400&q=80', badge: 'specialty' }
        ]
    },
    {
        title: 'مشروبات شتوية',
        icon: '🍂',
        id: 'winter',
        items: [
            { name: 'سحلب', price: 70, description: 'سحلب ساخن كريمي مع قرفة وجوز هند', image: 'https://images.unsplash.com/photo-1556881286-fc691516e071?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'شاي كرك', price: 50, description: 'شاي هندي محمص بالتوابل', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b28505?auto=format&fit=crop&w=400&q=80' },
            { name: 'قرفة', price: 50, description: 'مشروب قرفة دافئ', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b28505?auto=format&fit=crop&w=400&q=80' },
            { name: 'ينسون', price: 40, description: 'مشروب ينسون دافئ', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b28505?auto=format&fit=crop&w=400&q=80' },
            { name: 'زنجبيل', price: 40, description: 'زنجبيل طازج ساخن', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b28505?auto=format&fit=crop&w=400&q=80' },
            { name: 'بابونج', price: 40, description: 'شاي بابونج مهدئ', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b28505?auto=format&fit=crop&w=400&q=80' }
        ]
    },
    {
        title: 'مشروبات غازية وطاقة',
        icon: '🥫',
        id: 'cans',
        items: [
            { name: 'بيبسي', price: 35, description: 'بيبسي بارد منعش', image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=400&q=80' },
            { name: 'سفن أب', price: 35, description: 'سفن أب ليمون لايم', image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=400&q=80' },
            { name: 'ميرندا', price: 35, description: 'ميرندا برتقال منعش', image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=400&q=80' },
            { name: 'ريد بول', price: 85, description: 'مشروب طاقة ريد بول', image: 'https://images.unsplash.com/photo-1613476437042-451c247e15d1?auto=format&fit=crop&w=400&q=80', badge: 'popular' },
            { name: 'تويست', price: 40, description: 'مشروب طاقة تويست', image: 'https://images.unsplash.com/photo-1613476437042-451c247e15d1?auto=format&fit=crop&w=400&q=80' },
            { name: 'مياه', price: 10, description: 'مياه معدنية باردة', image: 'https://images.unsplash.com/photo-1548839140-2f2a87f8b30f?auto=format&fit=crop&w=400&q=80' }
        ]
    },
    {
        title: 'الإضافات',
        icon: '➕',
        id: 'addons',
        items: [
            { name: 'جبن', price: 15, description: 'جبن مقدون', image: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=400&q=80' },
            { name: 'شيكولاتة', price: 15, description: 'شيكولاتة', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80' },
            { name: 'مكسرات', price: 20, description: 'مكسرات', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80' },
            { name: 'نوتيلا', price: 25, description: 'نوتيلا', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80' },
            { name: 'كارت', price: 5, description: 'كارد', image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=400&q=80' },
            { name: 'طاولة', price: 20, description: 'طاولة', image: 'https://images.unsplash.com/photo-1596293498602-a8a08e4b3b4f?auto=format&fit=crop&w=400&q=80' }
        ]
    }
];
