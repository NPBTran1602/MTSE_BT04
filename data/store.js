const memberDemo = {
  id: 1,
  name: "Nguyen Minh Anh",
  email: "thanhvien@milktea.vn",
  password: "123456",
  role: "member",
  level: "Silver",
  points: 245
};

const products = [
  {
    id: "ts-tran-chau-duong-den",
    name: "Tra sua tran chau duong den",
    category: "Tra sua truyen thong",
    price: 39000,
    oldPrice: 49000,
    stock: 42,
    sold: 1280,
    isNew: false,
    promotion: "Giam 20% cho thanh vien",
    toppings: ["Tran chau den", "Kem cheese"],
    description: "Vi tra sua beo diu, tran chau nau duong den mem dai va lop syrup thom sau.",
    images: [
      "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    id: "matcha-latte-dau-do",
    name: "Matcha latte dau do",
    category: "Tra sua nhat ban",
    price: 45000,
    oldPrice: 52000,
    stock: 18,
    sold: 820,
    isNew: true,
    promotion: "Mua 2 tang 1 topping",
    toppings: ["Dau do", "Thach matcha"],
    description: "Matcha thanh nhe ket hop sua tuoi va dau do ngot bui, hop voi nguoi thich vi tra ro.",
    images: [
      "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    id: "oolong-sua-kem-cheese",
    name: "Oolong sua kem cheese",
    category: "Tra sua kem cheese",
    price: 47000,
    oldPrice: 0,
    stock: 9,
    sold: 1014,
    isNew: false,
    promotion: "Free upsize hom nay",
    toppings: ["Kem cheese", "Thach tra"],
    description: "Nen oolong rang thom, vi sua vua phai va lop kem cheese man beo can bang.",
    images: [
      "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    id: "tra-sua-khoai-mon",
    name: "Tra sua khoai mon",
    category: "Tra sua dac biet",
    price: 42000,
    oldPrice: 0,
    stock: 26,
    sold: 640,
    isNew: true,
    promotion: "Tang thach pho mai",
    toppings: ["Tran chau trang", "Thach pho mai"],
    description: "Khoai mon beo thom, mau tim nhe va hau vi sua mem, de uong ca ngay.",
    images: [
      "https://images.unsplash.com/photo-1622766815178-641bef2b4630?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    id: "hong-tra-sua-tran-chau",
    name: "Hong tra sua tran chau",
    category: "Tra sua truyen thong",
    price: 35000,
    oldPrice: 41000,
    stock: 61,
    sold: 1540,
    isNew: false,
    promotion: "Dong gia 35.000d",
    toppings: ["Tran chau den", "Pudding trung"],
    description: "Hong tra dam vi, sua beo nhe va tran chau deo, mon nen tang cua moi menu tra sua.",
    images: [
      "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    id: "tra-sua-socola-cookie",
    name: "Tra sua socola cookie",
    category: "Tra sua dac biet",
    price: 49000,
    oldPrice: 59000,
    stock: 0,
    sold: 730,
    isNew: true,
    promotion: "Sap mo ban lai",
    toppings: ["Cookie crumb", "Kem cheese"],
    description: "Socola thom dam, cookie gion nhe va sua tuoi, hop khau vi thich ngot beo.",
    images: [
      "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    id: "tra-dao-sua-macchiato",
    name: "Tra dao sua macchiato",
    category: "Tra trai cay",
    price: 44000,
    oldPrice: 0,
    stock: 33,
    sold: 910,
    isNew: false,
    promotion: "Giam 10% combo banh",
    toppings: ["Dao mieng", "Kem macchiato"],
    description: "Tra dao tuoi mat phu macchiato beo nhe, vua giai khat vua co vi sua mem.",
    images: [
      "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    id: "sua-tuoi-tran-chau-duong-den",
    name: "Sua tuoi tran chau duong den",
    category: "Sua tuoi",
    price: 41000,
    oldPrice: 48000,
    stock: 14,
    sold: 1190,
    isNew: false,
    promotion: "Best seller tuan nay",
    toppings: ["Tran chau den", "Foam sua"],
    description: "Sua tuoi lanh ket hop tran chau duong den nong, tao vi caramel thom ro.",
    images: [
      "https://images.unsplash.com/photo-1622621746668-59fb299bc4d7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=1200&q=80"
    ]
  }
];

module.exports = { memberDemo, products };
