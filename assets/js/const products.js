const products = [
  {
    id: 1,
    name: "សាប៊ូកក់&ស្បាសក់ JELY",
    price: 15,
    category: "Hair",
    image: "../images/products/hair/jely-hair.png",
    detail: "សាប៊ូកក់សក់ និងស្បាសក់ JELY"
  },
  {
    id: 2,
    name: "សាប៊ូកក់&ម៉ាសសក់ CCR",
    price: 16,
    category: "Hair",
    image: "../images/products/hair/item-2.png",
    detail: "សាប៊ូកក់ និងម៉ាសសក់ CCR"
  },
  {
    id: 3,
    name: "ស្ព្រាយបាញ់សក់ CCR",
    price: 10,
    category: "Hair",
    image: "../images/products/hair/item-3.png",
    detail: "ស្ព្រាយបាញ់សក់ CCR Hair Spray"
  },
  {
    id: 4,
    name: "សាប៊ូកក់&ម៉ាសសក់ VIP 5in1 CCR",
    price: 16,
    category: "Hair",
    image: "../images/products/hair/item-4.png",
    detail: "សាប៊ូកក់ និងម៉ាសសក់ VIP 5in1 CCR"
  },
  {
    id: 5,
    name: "សាប៊ូកក់&ម៉ាសសក់ Premium CCR",
    price: 16,
    category: "Hair",
    image: "../images/products/hair/item-2.png",
    detail: "សាប៊ូកក់ និងម៉ាសសក់ Premium CCR"
  },
  {
    id: 6,
    name: "ប្រេងលាបសក់/សេរ៉ូមសក់ VIP CCR",
    price: 12,
    category: "Hair",
    image: "../images/products/hair/item-3.png",
    detail: "ប្រេងលាបសក់ CCR VIP"
  },
  {
    id: 7,
    name: "ឡេលាបខ្លួន Gluta SUDO",
    price: 16,
    category: "Body",
    image: "../images/products/placeholders/body.png",
    detail: "ឡេលាបខ្លួន Gluta SUDO"
  },
  {
    id: 8,
    name: "សេរ៉ូមលាបខ្លួន JELY",
    price: 15,
    category: "Body",
    image: "../images/products/placeholders/body.png",
    detail: "សេរ៉ូមលាបខ្លួន Body Serum JELY"
  },
  {
    id: 9,
    name: "ស្រ្ពៃក្លៀក/ឡេក្លៀក SUDO",
    price: 10,
    category: "Body",
    image: "../images/products/placeholders/body.png",
    detail: "ស្រ្ពៃក្លៀក/ឡេក្លៀក SUDO"
  },
  {
    id: 10,
    name: "សាប៊ូដុសខ្លួន CCR (ក្លិនទឹកអប់)",
    price: 12,
    category: "Body",
    image: "../images/products/placeholders/body.png",
    detail: "សាប៊ូដុសខ្លួន CCR (ក្លិនទឹកអប់)"
  },
  {
    id: 11,
    name: "សាប៊ូដុសខ្លួនកុលាប CCR",
    price: 12,
    category: "Body",
    image: "../images/products/placeholders/body.png",
    detail: "សាប៊ូដុសខ្លួនកុលាប BodyWash Rose CCR"
  },
  {
    id: 12,
    name: "ឡេលាបខ្លួន JELY",
    price: 15,
    category: "Body",
    image: "../images/products/placeholders/body.png",
    detail: "ឡេលាបខ្លួន BODY LOTION JELY"
  },
  {
    id: 13,
    name: "សាប៊ូកក់&ដុសខ្លួនក្មេង CCR",
    price: 12,
    category: "Body",
    image: "../images/products/placeholders/body.png",
    detail: "សាប៊ូកក់ និងដុសខ្លួនក្មេង CCR"
  },
  {
    id: 14,
    name: "ទឹកអនាម័យស្រ្ដី JELY",
    price: 12,
    category: "Body",
    image: "../images/products/placeholders/body.png",
    detail: "ទឹកអនាម័យស្រ្ដី Feminine Wash​ JELY"
  },
  {
    id: 15,
    name: "ក្រដាស់សើម CCR",
    price: 10,
    category: "Face",
    image: "../images/products/placeholders/face.png",
    detail: "ក្រដាស់សើម Remove MakeUp CCR"
  },
  {
    id: 16,
    name: "សំឡីវីតាមីន JELY Mask Pad",
    price: 15,
    category: "Face",
    image: "../images/products/placeholders/face.png",
    detail: "សំឡីវីតាមីន JELY Mask Pad"
  },
  {
    id: 17,
    name: "BB Cream CCR",
    price: 9.5,
    category: "Face",
    image: "../images/products/placeholders/face.png",
    detail: "BB Cream CCR"
  },
  {
    id: 18,
    name: "SUNSCREEN Cream CCR",
    price: 9.5,
    category: "Face",
    image: "../images/products/placeholders/face.png",
    detail: "SUNSCREEN Cream CCR"
  },
  {
    id: 19,
    name: "សាប៊ូមុខ JELY Gluta",
    price: 8.5,
    category: "Face",
    image: "../images/products/placeholders/face.png",
    detail: "សាប៊ូមុខ​​​ ​JELY Gluta"
  },
  {
    id: 20,
    name: "សាប៊ូមុខយិនសិន CCR",
    price: 8.5,
    category: "Face",
    image: "../images/products/placeholders/face.png",
    detail: "សាប៊ូមុខយិនសិន Ginseng CCR"
  },
  {
    id: 21,
    name: "CC SERUM JELY",
    price: 15,
    category: "Face",
    image: "../images/products/placeholders/face.png",
    detail: "CC Serum Pink Tone JELY"
  },
  {
    id: 22,
    name: "ឈុតមុខស្អាត JELY",
    price: 25,
    category: "Face",
    image: "../images/products/placeholders/face.png",
    detail: "ឈុតមុខស្អាត JELY Essence + Milk + Night Cream"
  },
  {
    id: 23,
    name: "ថ្នាំដុសធ្មេញ CCR",
    price: 10,
    category: "Face",
    image: "../images/products/placeholders/face.png",
    detail: "ថ្នាំដុសធ្មេញ CCR"
  },
  {
    id: 24,
    name: "ម៉ាស់បិទមុខ 6D CCR",
    price: 15,
    category: "Face",
    image: "../images/products/placeholders/face.png",
    detail: "ម៉ាស់បិទមុខ 6D CCR"
  },
  {
    id: 25,
    name: "ហ្វៃប័រផាសសិន CCR",
    price: 18,
    category: "Drink",
    image: "../images/products/placeholders/drink.png",
    detail: "ហ្វៃប័រផាសសិន Fiber CCR"
  },
  {
    id: 26,
    name: "កាហ្វេសម្រក CCR",
    price: 18,
    category: "Drink",
    image: "../images/products/placeholders/drink.png",
    detail: "កាហ្វេសម្រក Coffee CCR"
  }
];