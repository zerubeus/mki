# Makefile for uploading datasets to Cloudflare R2
# Bucket: mki
# Base URL: https://r2.mustknowislam.com

R2_BUCKET = mki
WRANGLER = npx wrangler

.PHONY: all upload-geojson upload-hadith upload-seera upload-all help

help:
	@echo "Available targets:"
	@echo "  upload-geojson  - Upload GeoJSON files to R2"
	@echo "  upload-hadith   - Upload Hadith CSV files to R2"
	@echo "  upload-seera    - Upload Seera data to R2"
	@echo "  upload-all      - Upload all datasets to R2"
	@echo ""
	@echo "Usage: make upload-geojson"

# Upload GeoJSON files
upload-geojson:
	@echo "Uploading GeoJSON files to R2..."
	$(WRANGLER) r2 object put $(R2_BUCKET)/data/geojson/world_400.geojson --file geojson/world_400.geojson --content-type application/json --remote
	$(WRANGLER) r2 object put $(R2_BUCKET)/data/geojson/world_500.geojson --file geojson/world_500.geojson --content-type application/json --remote
	@echo "GeoJSON upload complete!"

# Upload Hadith CSV files
upload-hadith:
	@echo "Uploading Hadith CSV files to R2..."
	$(WRANGLER) r2 object put $(R2_BUCKET)/data/hadith-csv/all_rawis.csv --file hadith-csv/all_rawis.csv --content-type text/csv
	$(WRANGLER) r2 object put $(R2_BUCKET)/data/hadith-csv/all_hadiths_clean.csv --file hadith-csv/all_hadiths_clean.csv --content-type text/csv
	@echo "Hadith CSV upload complete!"

# Upload Seera data
upload-seera:
	@echo "Uploading Seera data to R2..."
	@for file in seera/*; do \
		if [ -f "$$file" ]; then \
			$(WRANGLER) r2 object put $(R2_BUCKET)/data/$$file --file $$file; \
		fi \
	done
	@echo "Seera upload complete!"

# Upload all datasets
upload-all: upload-geojson upload-hadith upload-seera
	@echo "All datasets uploaded!"

# List files in R2 bucket
list:
	$(WRANGLER) r2 object list $(R2_BUCKET) --prefix data/

# Delete a file from R2
# Usage: make delete FILE=data/geojson/world_500.geojson
delete:
	$(WRANGLER) r2 object delete $(R2_BUCKET)/$(FILE)
