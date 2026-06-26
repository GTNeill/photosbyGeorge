ALTER TABLE `photos` ADD `subcategory_id` integer REFERENCES `subcategories`(`id`) ON DELETE set null;
