-- ============================================================
-- BODYUP — base d'aliments génériques (valeurs pour 100 g)
-- À coller dans : Supabase → SQL Editor → New query → Run
-- Lecture publique (table de référence), pas d'écriture côté client.
-- Source des valeurs : tables de composition usuelles (CIQUAL / USDA).
-- ============================================================

create table if not exists public.foods (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  brand    text,
  category text,
  kcal     int  not null,
  protein  numeric(5,1) not null default 0,
  carbs    numeric(5,1) not null default 0,
  fat      numeric(5,1) not null default 0,
  per      text not null default '100 g',
  source   text default 'BODYUP'
);

alter table public.foods enable row level security;
drop policy if exists "read foods" on public.foods;
create policy "read foods" on public.foods for select using (true);

-- recherche insensible à la casse/accents performante
create extension if not exists pg_trgm;
create index if not exists foods_name_trgm on public.foods using gin (name gin_trgm_ops);

-- (ré)initialise les données de référence
truncate public.foods;

insert into public.foods (name, category, kcal, protein, carbs, fat) values
-- Fruits
('Pomme','Fruits',52,0.3,14,0.2),('Banane','Fruits',89,1.1,23,0.3),('Orange','Fruits',47,0.9,12,0.1),
('Fraise','Fruits',33,0.7,8,0.3),('Raisin','Fruits',69,0.7,18,0.2),('Poire','Fruits',57,0.4,15,0.1),
('Pêche','Fruits',39,0.9,10,0.3),('Ananas','Fruits',50,0.5,13,0.1),('Mangue','Fruits',60,0.8,15,0.4),
('Kiwi','Fruits',61,1.1,15,0.5),('Myrtille','Fruits',57,0.7,14,0.3),('Framboise','Fruits',52,1.2,12,0.7),
('Pastèque','Fruits',30,0.6,8,0.2),('Melon','Fruits',34,0.8,8,0.2),('Citron','Fruits',29,1.1,9,0.3),
('Avocat','Fruits',160,2,9,15),('Clémentine','Fruits',47,0.9,12,0.2),('Abricot','Fruits',48,1.4,11,0.4),
('Cerise','Fruits',63,1,16,0.2),('Prune','Fruits',46,0.7,11,0.3),('Datte','Fruits',282,2.5,75,0.4),
-- Légumes
('Tomate','Légumes',18,0.9,3.9,0.2),('Carotte','Légumes',41,0.9,10,0.2),('Brocoli','Légumes',34,2.8,7,0.4),
('Épinard','Légumes',23,2.9,3.6,0.4),('Courgette','Légumes',17,1.2,3.1,0.3),('Poivron','Légumes',31,1,6,0.3),
('Concombre','Légumes',15,0.7,3.6,0.1),('Laitue','Légumes',15,1.4,2.9,0.2),('Haricot vert','Légumes',31,1.8,7,0.2),
('Champignon de Paris','Légumes',22,3.1,3.3,0.3),('Oignon','Légumes',40,1.1,9,0.1),('Aubergine','Légumes',25,1,6,0.2),
('Chou-fleur','Légumes',25,1.9,5,0.3),('Petit pois','Légumes',81,5,14,0.4),('Pomme de terre cuite','Légumes',87,2,20,0.1),
('Patate douce cuite','Légumes',90,2,21,0.1),('Maïs','Légumes',86,3.2,19,1.2),('Betterave','Légumes',43,1.6,10,0.2),
('Poireau','Légumes',31,1.5,7,0.3),('Courge butternut','Légumes',45,1,12,0.1),
-- Viandes, poissons, œufs
('Poulet (blanc, cuit)','Viandes & poissons',165,31,0,3.6),('Dinde (escalope, cuite)','Viandes & poissons',135,29,0,1),
('Bœuf haché 5% (cuit)','Viandes & poissons',170,26,0,7),('Steak de bœuf (cuit)','Viandes & poissons',250,26,0,15),
('Porc (filet, cuit)','Viandes & poissons',143,26,0,4),('Jambon blanc','Viandes & poissons',110,18,1,4),
('Saumon (cuit)','Viandes & poissons',208,20,0,13),('Thon au naturel','Viandes & poissons',116,26,0,1),
('Cabillaud (cuit)','Viandes & poissons',105,23,0,1),('Crevette','Viandes & poissons',99,24,0.2,0.3),
('Sardine','Viandes & poissons',208,25,0,11),('Lardons','Viandes & poissons',280,15,1,24),
('Merguez','Viandes & poissons',290,14,2,25),('Œuf entier','Viandes & poissons',155,13,1.1,11),
('Blanc d''œuf','Viandes & poissons',52,11,0.7,0.2),('Steak haché de soja','Viandes & poissons',150,17,6,6),
-- Produits laitiers
('Yaourt nature','Produits laitiers',61,3.5,4.7,3.3),
('Yaourt grec','Produits laitiers',97,9,4,5),('Skyr nature','Produits laitiers',63,11,4,0.2),
('Fromage blanc 0%','Produits laitiers',47,8,4,0.2),('Comté','Produits laitiers',410,27,0,33),
('Mozzarella','Produits laitiers',280,22,2.2,17),('Emmental','Produits laitiers',380,28,0,29),
('Camembert','Produits laitiers',300,20,0.5,24),('Feta','Produits laitiers',264,14,4,21),
('Beurre','Produits laitiers',717,0.9,0.1,81),('Crème fraîche 30%','Produits laitiers',290,2.4,3,30),
-- Féculents & céréales
('Riz blanc (cuit)','Féculents & céréales',130,2.7,28,0.3),('Riz complet (cuit)','Féculents & céréales',111,2.6,23,0.9),
('Pâtes (cuites)','Féculents & céréales',131,5,25,1.1),('Pâtes complètes (cuites)','Féculents & céréales',124,5,26,0.9),
('Quinoa (cuit)','Féculents & céréales',120,4.4,21,1.9),('Semoule (cuite)','Féculents & céréales',112,3.8,23,0.2),
('Boulgour (cuit)','Féculents & céréales',83,3,19,0.2),('Baguette','Féculents & céréales',270,9,55,1.3),
('Pain complet','Féculents & céréales',247,9,41,3.5),('Pain de mie','Féculents & céréales',280,8,49,4),
('Flocons d''avoine','Féculents & céréales',379,13,67,7),('Corn flakes','Féculents & céréales',357,7,84,0.9),
('Muesli','Féculents & céréales',360,10,60,7),('Biscotte','Féculents & céréales',390,12,72,6),
-- Légumineuses
('Lentilles (cuites)','Légumineuses',116,9,20,0.4),('Pois chiches (cuits)','Légumineuses',164,9,27,2.6),
('Haricots rouges (cuits)','Légumineuses',127,9,22,0.5),('Haricots blancs (cuits)','Légumineuses',139,9,25,0.5),
('Tofu','Légumineuses',76,8,1.9,4.8),('Fèves (cuites)','Légumineuses',110,8,20,0.4),
-- Oléagineux & graines
('Amande','Oléagineux',579,21,22,50),('Noix','Oléagineux',654,15,14,65),('Noisette','Oléagineux',628,15,17,61),
('Cacahuète','Oléagineux',567,26,16,49),('Beurre de cacahuète','Oléagineux',588,25,20,50),
('Graines de chia','Oléagineux',486,17,42,31),('Pistache','Oléagineux',560,20,28,45),('Noix de cajou','Oléagineux',553,18,30,44),
-- Matières grasses
('Huile d''olive','Matières grasses',884,0,0,100),('Huile de tournesol','Matières grasses',884,0,0,100),
('Margarine','Matières grasses',717,0.2,0.7,80),
-- Petit-déjeuner & sucré
('Confiture','Sucré',250,0.4,63,0.1),('Miel','Sucré',304,0.3,82,0),('Pâte à tartiner chocolat','Sucré',539,6,57,31),
('Chocolat noir 70%','Sucré',598,8,46,43),('Chocolat au lait','Sucré',535,7.6,59,30),('Sucre','Sucré',400,0,100,0),
('Croissant','Sucré',406,8,46,21),('Pain au chocolat','Sucré',414,8,47,22),('Cookie','Sucré',480,5,64,22),
('Madeleine','Sucré',460,6,58,22),('Compote de pomme','Sucré',42,0.2,10,0.1),
-- Plats & divers
('Pizza margherita','Plats',266,11,33,10),('Frites','Plats',312,3.4,41,15),('Quiche lorraine','Plats',280,9,22,18),
('Sushi','Plats',140,4,30,0.5),('Houmous','Plats',166,8,14,10),('Ketchup','Plats',112,1.3,26,0.2),
('Mayonnaise','Plats',680,1,2,75),('Sauce tomate','Plats',35,1.6,7,0.4),('Chips','Plats',536,6,53,34),
('Yaourt aux fruits','Plats',90,3.5,15,2.5),('Crêpe','Plats',220,6,30,8),('Pâtes bolognaise','Plats',130,6,16,4),
('Salade César','Plats',180,9,6,13),('Burger maison','Plats',250,15,20,12),('Wrap poulet','Plats',200,12,22,7);

-- ---------- BOISSONS (valeurs pour 100 ml) ----------
insert into public.foods (name, category, kcal, protein, carbs, fat, per) values
-- Eaux & basiques
('Eau','Boissons',0,0,0,0,'100 ml'),('Eau gazeuse','Boissons',0,0,0,0,'100 ml'),
('Eau aromatisée (sucrée)','Boissons',20,0,4.8,0,'100 ml'),('Eau de coco','Boissons',19,0.7,3.7,0.2,'100 ml'),
-- Cafés & thés
('Café noir','Boissons',2,0.1,0,0,'100 ml'),('Café au lait','Boissons',27,1.5,2.4,1,'100 ml'),
('Cappuccino','Boissons',35,1.7,3.5,1.5,'100 ml'),('Café latte','Boissons',42,2.2,3.8,1.9,'100 ml'),
('Thé nature','Boissons',1,0,0.2,0,'100 ml'),('Thé glacé (Ice Tea)','Boissons',29,0,7,0,'100 ml'),
('Chocolat chaud','Boissons',77,3.2,10,2.5,'100 ml'),('Kombucha','Boissons',19,0,4.5,0,'100 ml'),
-- Sodas & boissons sucrées
('Coca-Cola','Boissons',42,0,10.6,0,'100 ml'),('Coca-Cola zéro','Boissons',0,0,0,0,'100 ml'),
('Orangina','Boissons',42,0,10,0,'100 ml'),('Fanta orange','Boissons',43,0,10.4,0,'100 ml'),
('Sprite','Boissons',20,0,4.6,0,'100 ml'),('Limonade','Boissons',40,0,10,0,'100 ml'),
('Schweppes tonic','Boissons',37,0,8.9,0,'100 ml'),('Red Bull','Boissons',45,0,11,0,'100 ml'),
('Boisson énergisante (type Monster)','Boissons',47,0,11.5,0,'100 ml'),
('Sirop à l''eau (dilué)','Boissons',35,0,8.7,0,'100 ml'),('Boisson isotonique (sport)','Boissons',26,0,6.3,0,'100 ml'),
-- Jus & smoothies
('Jus d''orange','Boissons',45,0.7,10,0.2,'100 ml'),('Jus de pomme','Boissons',46,0.1,11,0.1,'100 ml'),
('Jus de raisin','Boissons',63,0.3,15,0.1,'100 ml'),('Jus multifruits','Boissons',50,0.4,11.5,0.1,'100 ml'),
('Jus d''ananas','Boissons',53,0.4,12.6,0.1,'100 ml'),('Jus de tomate','Boissons',20,0.8,3.5,0.1,'100 ml'),
('Smoothie aux fruits','Boissons',55,0.7,12,0.3,'100 ml'),('Citronnade','Boissons',40,0.1,10,0,'100 ml'),
-- Laits & boissons végétales
('Lait entier','Boissons',65,3.2,4.7,3.6,'100 ml'),('Lait demi-écrémé','Boissons',46,3.3,4.8,1.6,'100 ml'),
('Lait écrémé','Boissons',33,3.3,4.9,0.1,'100 ml'),('Lait d''amande','Boissons',24,0.5,3,1.1,'100 ml'),
('Lait de soja','Boissons',40,3.3,2.5,1.9,'100 ml'),('Lait d''avoine','Boissons',45,0.4,7.5,1.4,'100 ml'),
('Lait de coco (boisson)','Boissons',20,0.2,2.7,0.9,'100 ml'),('Milkshake vanille','Boissons',112,3.5,17,3.2,'100 ml'),
-- Alcools
('Bière','Boissons',43,0.5,3.6,0,'100 ml'),('Bière sans alcool','Boissons',24,0.4,5.3,0,'100 ml'),
('Vin rouge','Boissons',85,0.1,2.6,0,'100 ml'),('Vin blanc sec','Boissons',77,0.1,0.9,0,'100 ml'),
('Vin rosé','Boissons',75,0.1,1.5,0,'100 ml'),('Champagne','Boissons',76,0.2,1.4,0,'100 ml'),
('Cidre brut','Boissons',42,0,3,0,'100 ml'),('Whisky','Boissons',222,0,0,0,'100 ml'),
('Vodka','Boissons',222,0,0,0,'100 ml'),('Rhum','Boissons',222,0,0,0,'100 ml'),
('Gin','Boissons',222,0,0,0,'100 ml'),('Pastis','Boissons',250,0,3,0,'100 ml'),
('Mojito','Boissons',87,0,8,0,'100 ml'),('Spritz','Boissons',80,0,6,0,'100 ml'),
('Sangria','Boissons',80,0.1,7,0,'100 ml');
