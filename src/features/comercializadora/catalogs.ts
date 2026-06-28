export type CatalogCategory = {
  id: string;
  icon: string;
  name: string;
  description: string;
};

export type CatalogSubcategory = {
  id: string;
  categoryId: string;
  name: string;
};

export type CatalogManufacturer = {
  id: string;
  name: string;
};

export type CatalogBrand = {
  id: string;
  name: string;
  manufacturerId?: string;
};

export type InventoryCatalogs = {
  categories: CatalogCategory[];
  subcategories: CatalogSubcategory[];
  manufacturers: CatalogManufacturer[];
  brands: CatalogBrand[];
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const byName = <T extends { name: string }>(items: T[]) =>
  [...items].sort((left, right) => left.name.localeCompare(right.name, "es-MX", { sensitivity: "base" }));

const uniqueByName = <T extends { name: string }>(items: T[]) => {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.name.trim().toLocaleLowerCase("es-MX");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const inventoryCategories: CatalogCategory[] = [
  {
    id: "bebidas",
    icon: "🥤",
    name: "Bebidas",
    description: "Refrescos, jugos, agua, bebidas energéticas y bebidas listas para venta.",
  },
  {
    id: "pan-bolleria",
    icon: "🍞",
    name: "Pan y bollería",
    description: "Pan empacado, tortillas, pan dulce y productos de panificación.",
  },
  {
    id: "enlatados-conservas-salsas",
    icon: "🥫",
    name: "Enlatados, conservas y salsas",
    description: "Conservas, chiles, aderezos, salsas, purés y productos de anaquel.",
  },
  {
    id: "pastas-arroz-basicos",
    icon: "🍝",
    name: "Pastas, arroz y básicos",
    description: "Pastas, arroz, granos, semillas, básicos de despensa y abarrotes secos.",
  },
  {
    id: "lacteos",
    icon: "🧀",
    name: "Lácteos",
    description: "Leche, yogurt, crema, quesos, mantequilla y refrigerados lácteos.",
  },
  {
    id: "dulces-chocolates",
    icon: "🍫",
    name: "Dulces y chocolates",
    description: "Dulces, chocolates, confitería y productos impulso.",
  },
  {
    id: "botanas-galletas",
    icon: "🍪",
    name: "Botanas y galletas",
    description: "Galletas, papas, frituras, palomitas y cacahuates.",
  },
  {
    id: "cuidado-personal",
    icon: "🧴",
    name: "Cuidado personal",
    description: "Cuidado capilar, corporal, bucal, afeitado y productos de higiene personal.",
  },
  {
    id: "limpieza-hogar",
    icon: "🧹",
    name: "Limpieza del hogar",
    description: "Detergentes, cloro, suavizantes, limpiadores y jabón para ropa.",
  },
  {
    id: "papel-higiene",
    icon: "🧻",
    name: "Papel e higiene",
    description: "Papel higiénico, servilletas, pañuelos, toallas de papel e higiene femenina.",
  },
];

export const inventorySubcategories: CatalogSubcategory[] = [
  { id: "refrescos", categoryId: "bebidas", name: "Refrescos" },
  { id: "agua", categoryId: "bebidas", name: "Agua" },
  { id: "jugos", categoryId: "bebidas", name: "Jugos" },
  { id: "bebidas-isotonicas", categoryId: "bebidas", name: "Bebidas isotónicas" },
  { id: "energeticas", categoryId: "bebidas", name: "Energéticas" },
  { id: "te", categoryId: "bebidas", name: "Té" },
  { id: "cafe", categoryId: "bebidas", name: "Café" },
  { id: "pan-caja", categoryId: "pan-bolleria", name: "Pan de caja" },
  { id: "pan-dulce", categoryId: "pan-bolleria", name: "Pan dulce" },
  { id: "tortillas", categoryId: "pan-bolleria", name: "Tortillas" },
  { id: "bolleria", categoryId: "pan-bolleria", name: "Bollería" },
  { id: "pan-tostado", categoryId: "pan-bolleria", name: "Pan tostado" },
  { id: "enlatados", categoryId: "enlatados-conservas-salsas", name: "Enlatados" },
  { id: "conservas", categoryId: "enlatados-conservas-salsas", name: "Conservas" },
  { id: "salsas", categoryId: "enlatados-conservas-salsas", name: "Salsas" },
  { id: "pure-tomate", categoryId: "enlatados-conservas-salsas", name: "Puré de tomate" },
  { id: "mole", categoryId: "enlatados-conservas-salsas", name: "Mole" },
  { id: "especias", categoryId: "enlatados-conservas-salsas", name: "Especias" },
  { id: "pastas", categoryId: "pastas-arroz-basicos", name: "Pastas" },
  { id: "arroz", categoryId: "pastas-arroz-basicos", name: "Arroz" },
  { id: "frijol", categoryId: "pastas-arroz-basicos", name: "Frijol" },
  { id: "azucar", categoryId: "pastas-arroz-basicos", name: "Azúcar" },
  { id: "harina", categoryId: "pastas-arroz-basicos", name: "Harina" },
  { id: "sal", categoryId: "pastas-arroz-basicos", name: "Sal" },
  { id: "aceites", categoryId: "pastas-arroz-basicos", name: "Aceites" },
  { id: "leche", categoryId: "lacteos", name: "Leche" },
  { id: "yogurt", categoryId: "lacteos", name: "Yogurt" },
  { id: "queso", categoryId: "lacteos", name: "Queso" },
  { id: "crema", categoryId: "lacteos", name: "Crema" },
  { id: "mantequilla", categoryId: "lacteos", name: "Mantequilla" },
  { id: "chocolates", categoryId: "dulces-chocolates", name: "Chocolates" },
  { id: "dulces", categoryId: "dulces-chocolates", name: "Dulces" },
  { id: "mazapanes", categoryId: "dulces-chocolates", name: "Mazapanes" },
  { id: "chicles", categoryId: "dulces-chocolates", name: "Chicles" },
  { id: "paletas", categoryId: "dulces-chocolates", name: "Paletas" },
  { id: "galletas", categoryId: "botanas-galletas", name: "Galletas" },
  { id: "papas", categoryId: "botanas-galletas", name: "Papas" },
  { id: "frituras", categoryId: "botanas-galletas", name: "Frituras" },
  { id: "palomitas", categoryId: "botanas-galletas", name: "Palomitas" },
  { id: "cacahuates", categoryId: "botanas-galletas", name: "Cacahuates" },
  { id: "shampoo", categoryId: "cuidado-personal", name: "Shampoo" },
  { id: "jabon", categoryId: "cuidado-personal", name: "Jabón" },
  { id: "desodorante", categoryId: "cuidado-personal", name: "Desodorante" },
  { id: "pasta-dental", categoryId: "cuidado-personal", name: "Pasta dental" },
  { id: "rastrillos", categoryId: "cuidado-personal", name: "Rastrillos" },
  { id: "detergentes", categoryId: "limpieza-hogar", name: "Detergentes" },
  { id: "cloro", categoryId: "limpieza-hogar", name: "Cloro" },
  { id: "suavizantes", categoryId: "limpieza-hogar", name: "Suavizantes" },
  { id: "limpiadores", categoryId: "limpieza-hogar", name: "Limpiadores" },
  { id: "jabon-ropa", categoryId: "limpieza-hogar", name: "Jabón para ropa" },
  { id: "papel-higienico", categoryId: "papel-higiene", name: "Papel higiénico" },
  { id: "servilletas", categoryId: "papel-higiene", name: "Servilletas" },
  { id: "toallas-papel", categoryId: "papel-higiene", name: "Toallas de papel" },
  { id: "panuelos", categoryId: "papel-higiene", name: "Pañuelos" },
  { id: "higiene-femenina", categoryId: "papel-higiene", name: "Higiene femenina" },
];

export const inventoryManufacturers: CatalogManufacturer[] = byName([
  "Grupo Bimbo",
  "PepsiCo",
  "The Coca-Cola Company",
  "Grupo Herdez",
  "Procter & Gamble",
  "Unilever",
  "Colgate-Palmolive",
  "Kimberly-Clark",
  "SC Johnson",
  "Nestlé",
].map((name) => ({ id: slugify(name), name })));

const brandManufacturerByName: Record<string, string> = {
  "7UP": "PepsiCo",
  Ace: "Procter & Gamble",
  Ariel: "Procter & Gamble",
  Boing: "Grupo Bimbo",
  Bonafont: "Danone",
  Búfalo: "Grupo Herdez",
  Carnation: "Nestlé",
  Ciel: "The Coca-Cola Company",
  Cloralex: "Grupo AlEn",
  Colgate: "Colgate-Palmolive",
  "Coca-Cola": "The Coca-Cola Company",
  Crunch: "Nestlé",
  "De la Rosa": "De la Rosa",
  "Del Fuerte": "Grupo Herdez",
  "Del Valle": "The Coca-Cola Company",
  "Doña María": "Grupo Herdez",
  Dove: "Unilever",
  "e-pura": "PepsiCo",
  Fanta: "The Coca-Cola Company",
  Fabuloso: "Colgate-Palmolive",
  Gamesa: "PepsiCo",
  Gillette: "Procter & Gamble",
  "Grupo Herdez": "Grupo Herdez",
  "Head & Shoulders": "Procter & Gamble",
  Herdez: "Grupo Herdez",
  "Kellogg's": "Kellanova",
  Kleenex: "Kimberly-Clark",
  Kotex: "Kimberly-Clark",
  "La Costeña": "La Costeña",
  Lala: "Grupo Lala",
  "Mazapán de la Rosa": "De la Rosa",
  McCormick: "McCormick",
  Nestlé: "Nestlé",
  "Nestlé Cereals": "Nestlé",
  Pantene: "Procter & Gamble",
  Pepsi: "PepsiCo",
  Pétalo: "Kimberly-Clark",
  Pinol: "Grupo AlEn",
  Philadelphia: "Mondelēz International",
  Quaker: "PepsiCo",
  Regio: "Kimberly-Clark",
  Rexona: "Unilever",
  Ricolino: "Grupo Bimbo",
  Sedal: "Unilever",
  Sprite: "The Coca-Cola Company",
  Suavitel: "Colgate-Palmolive",
  "Tía Rosa": "Grupo Bimbo",
  Wonder: "Grupo Bimbo",
  Zote: "La Corona",
};

const brandNames = [
  "7UP",
  "Ace",
  "Alpura",
  "Ariel",
  "Barilla",
  "Bonafont",
  "Boing",
  "Búfalo",
  "Carnation",
  "Carlos V",
  "Ciel",
  "Cloralex",
  "Coca-Cola",
  "Colgate",
  "Crunch",
  "Danone",
  "De la Rosa",
  "Del Fuerte",
  "Del Valle",
  "Doña María",
  "Dove",
  "e-pura",
  "Fabuloso",
  "Fanta",
  "Foca",
  "Gamesa",
  "Gillette",
  "Head & Shoulders",
  "Herdez",
  "Hershey's",
  "Jumex",
  "Kellogg's",
  "Kleenex",
  "La Costeña",
  "La Moderna",
  "Lala",
  "Mazapán de la Rosa",
  "McCormick",
  "Nestlé",
  "Nestlé Cereals",
  "Pantene",
  "Pepsi",
  "Philadelphia",
  "Pinol",
  "Precissimo",
  "Quaker",
  "Regio",
  "Rexona",
  "Ricolino",
  "Roma",
  "Santa Clara",
  "Sedal",
  "Sidral Mundet",
  "Sprite",
  "Suavel",
  "Suavitel",
  "Tía Rosa",
  "Verde Valle",
  "Wonder",
  "Yemina",
  "Yoplait",
  "Zote",
];

export const inventoryBrands: CatalogBrand[] = byName(
  uniqueByName([
    ...brandNames.map((name) => ({
      id: slugify(name),
      name,
      manufacturerId: inventoryManufacturers.find(
        (manufacturer) => manufacturer.name === brandManufacturerByName[name],
      )?.id,
    })),
  ]),
);

export const defaultInventoryCatalogs: InventoryCatalogs = {
  categories: inventoryCategories,
  subcategories: inventorySubcategories,
  manufacturers: inventoryManufacturers,
  brands: inventoryBrands,
};

export const normalizeInventoryCatalogs = (catalogs?: Partial<InventoryCatalogs>): InventoryCatalogs => ({
  categories: catalogs?.categories?.length ? catalogs.categories : defaultInventoryCatalogs.categories,
  subcategories: catalogs?.subcategories?.length ? catalogs.subcategories : defaultInventoryCatalogs.subcategories,
  manufacturers: byName(uniqueByName(catalogs?.manufacturers?.length ? catalogs.manufacturers : defaultInventoryCatalogs.manufacturers)),
  brands: byName(uniqueByName(catalogs?.brands?.length ? catalogs.brands : defaultInventoryCatalogs.brands)),
});

export const getCategoryByName = (name: string, catalogs = defaultInventoryCatalogs) =>
  catalogs.categories.find((category) => category.name === name);

export const getCategoryById = (id: string, catalogs = defaultInventoryCatalogs) =>
  catalogs.categories.find((category) => category.id === id);

export const getSubcategoriesByCategoryName = (categoryName: string, catalogs = defaultInventoryCatalogs) => {
  const category = getCategoryByName(categoryName, catalogs);

  return category ? catalogs.subcategories.filter((subcategory) => subcategory.categoryId === category.id) : [];
};

export const getBrandByName = (name: string, catalogs = defaultInventoryCatalogs) =>
  catalogs.brands.find((brand) => brand.name === name);

export const getManufacturerById = (id?: string, catalogs = defaultInventoryCatalogs) =>
  id ? catalogs.manufacturers.find((manufacturer) => manufacturer.id === id) : undefined;

export const getManufacturerNameForBrand = (brandName: string, catalogs = defaultInventoryCatalogs) =>
  getManufacturerById(getBrandByName(brandName, catalogs)?.manufacturerId, catalogs)?.name ?? "";
