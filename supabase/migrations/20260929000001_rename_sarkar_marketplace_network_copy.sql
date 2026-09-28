-- Follow-up to 20260929000000: every brand's about_text said "part of the Sarkar Marketplace network".
update brands set about_text = replace(about_text, 'Sarkar Marketplace network', 'Dropby network') where about_text like '%Sarkar Marketplace network%';
update brands set about_text = replace(about_text, 'Sarkar Marketplace', 'Shehar Bazaar') where about_text like '%Sarkar Marketplace%';
