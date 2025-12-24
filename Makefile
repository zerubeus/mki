.PHONY: push-data

# Push all data from mki-datasets to R2 bucket (mki/data/)
push-data:
	@echo "Uploading mki-datasets to R2..."
	@find mki-datasets -type f ! -name ".DS_Store" ! -name "Makefile" ! -path "*/node_modules/*" ! -path "*/.wrangler/*" ! -name "*.log" ! -name ".gitignore" | while read file; do \
		dest="data/$${file#mki-datasets/}"; \
		echo "  $$file -> $$dest"; \
		npx wrangler r2 object put "mki/$$dest" --file="$$file" --remote; \
	done
	@echo "Upload complete!"
