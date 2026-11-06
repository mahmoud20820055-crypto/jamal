/* =========================================================
   הכל להכל – המוצרים
   كل منتج:
     id        معرّف فريد (إنجليزي، بدون مسافات)
     category  id الصنف من js/config.js (مثلاً "paper")
     sub       اسم الصنف الفرعي بالضبط كما في config.js
     name      اسم المنتج
     desc      وصف قصير (اختياري)
     features  نقاط مميزات (اختياري)
     img       مسار الصورة في img/products/ (اختياري – بدونها تظهر أيقونة)
     priceLabel نص قبل السعر (اختياري، افتراضي "מחיר")
     variants  الأحجام/الأنواع: { name, size, price }  (price رقم بالشيكل، أو null)
   ========================================================= */

window.PRODUCTS = [
  {
    id: "paper-bags-twisted-handle",
    category: "paper",
    sub: "שקיות נייר",
    name: "שקיות נייר Take Away מחוזקות – ידית חבל",
    features: ["נייר בעובי משמעותי", "ידית חבל מסולסלת", "נייר נקי – לא ממוחזר"],
    img: "img/products/paper-bags-twisted-handle.webp",
    variants: [
      { name: "בייבי דליה", size: "20×25 ס״מ · תחתית 12 ס״מ", price: 0.45 },
      { name: "דליה", size: "28×29 ס״מ · תחתית 17 ס״מ", price: 0.45 },
      { name: "גיילורד", size: "32×39 ס״מ · תחתית 17 ס״מ", price: 0.70 }
    ]
  },
  {
    id: "burger-box-double",
    category: "paper",
    sub: "קופסאות טייק אוויי",
    name: "קרטון להמבורגר כפול",
    features: ["קרטון עבה מאוד", "מתאים להמבורגר + צ׳יפס"],
    img: "img/products/burger-box-double.webp",
    priceLabel: "מחיר רגיל",
    variants: [
      { name: "", size: "14×22 ס״מ · גובה 7 ס״מ", price: 0.65 }
    ]
  },
  {
    id: "fries-box",
    category: "paper",
    sub: "קופסאות טייק אוויי",
    name: "קרטונית לצ׳יפס",
    features: ["קרטון קראפט", "פתח נוח להגשה"],
    img: "img/products/fries-box.webp",
    variants: [
      { name: "", size: "גובה 13 ס״מ · רוחב 8 ס״מ", price: 0.25 }
    ]
  },
  {
    id: "fries-cone-sauce",
    category: "paper",
    sub: "קופסאות טייק אוויי",
    name: "קונוס לצ׳יפס עם כיס לרטבים",
    features: ["כיס מובנה לרוטב", "קרטון קראפט"],
    img: "img/products/fries-cone-sauce.webp",
    variants: [
      { name: "", size: "גובה 22 ס״מ", price: 0.25 }
    ]
  }
];
