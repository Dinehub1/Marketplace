# R2 Image Migration Script

This script migrates images from CSV files to Cloudflare R2 storage. It downloads images from URLs in CSV columns and uploads them to R2, replacing the original URLs with new R2 public URLs.

## Features

- **Automatic Image Column Detection**: Automatically detects image-related columns in CSV files
- **Concurrent Processing**: Downloads and uploads images concurrently for better performance
- **Caching**: Implements caching to avoid re-uploading the same images
- **Error Handling**: Comprehensive error handling with detailed failure logs
- **Progress Tracking**: Real-time progress bars using tqdm
- **Unicode Support**: Full UTF-8 support for international characters

## Prerequisites

1. **Python 3.8+**
2. **Cloudflare R2 Account** with:
   - Account ID
   - Bucket name
   - Access Key ID
   - Secret Access Key
   - Public base URL

## Installation

1. Install required dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file with your R2 credentials (copy from `env_template.txt`):
```bash
cp env_template.txt .env
```

3. Edit `.env` file with your actual R2 credentials:
```env
R2_ACCOUNT_ID=your_account_id_here
R2_BUCKET=your_bucket_name_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_PUBLIC_BASE_URL=https://your-bucket.your-domain.com
```

## Usage

### Basic Usage
```bash
python r2_migrate_images.py
```

### Advanced Usage
```bash
python r2_migrate_images.py --input custom_input.csv --output custom_output.csv --concurrency 20
```

### Command Line Options

- `--input, -i`: Input CSV file path (default: `DATA-SET/restaurant_data_2025-08-30_7dad2b63.csv`)
- `--output, -o`: Output CSV file path (default: `restaurant_data_migrated.csv`)
- `--concurrency, -c`: Concurrency limit for downloads/uploads (default: 10)

## How It Works

1. **Environment Loading**: Loads R2 credentials from `.env` file
2. **CSV Analysis**: Reads input CSV and detects image columns automatically
3. **URL Processing**: Splits semicolon/comma-separated URLs in image columns
4. **Image Download**: Downloads images with browser-like User-Agent headers
5. **R2 Upload**: Uploads images to Cloudflare R2 with organized naming
6. **URL Replacement**: Replaces original URLs with new R2 public URLs
7. **Caching**: Saves processed URLs to avoid re-processing
8. **Output Generation**: Creates updated CSV and failure logs

## Image Column Detection

The script automatically detects image columns using these patterns:
- `images?`
- `ambience_?images?`
- `food_?images?`
- `menu_?images?`
- `photo_?images?`
- `gallery_?images?`
- `picture_?images?`

## File Naming Convention

Images are uploaded to R2 with the following naming convention:
```
restaurants/{slugified_restaurant_name}/{column_name}_{counter}.jpg
```

Example:
```
restaurants/ishanya-restaurant-bar/Images_1.jpg
restaurants/ishanya-restaurant-bar/Ambience_Images_1.jpg
```

## Output Files

1. **Updated CSV**: Original CSV with new R2 URLs
2. **Cache File**: `image_migration_cache.json` - Prevents re-uploading same images
3. **Failure Log**: `migration_failures.csv` - Details of failed image processing
4. **Migration Log**: `r2_migration.log` - Detailed processing logs

## Error Handling

- **Invalid URLs**: Skipped and logged
- **Download Failures**: Recorded in failure log
- **Upload Failures**: Recorded in failure log
- **Network Issues**: Retried with timeout handling
- **Unicode Issues**: Full UTF-8 support

## Performance

- **Concurrent Processing**: Configurable concurrency limit
- **Caching**: Avoids re-processing same URLs
- **Progress Tracking**: Real-time progress bars
- **Memory Efficient**: Streams large images without loading into memory

## Example Output

```
============================================================
MIGRATION SUMMARY
============================================================
Columns processed: 4
Total images processed: 150
Unique files uploaded: 120
Cached links reused: 30
Failed images: 0
Output CSV: restaurant_data_migrated.csv
Cache file: image_migration_cache.json
============================================================
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure all required variables are set in `.env` file
   - Check variable names match exactly

2. **R2 Upload Failures**
   - Verify R2 credentials are correct
   - Check bucket permissions
   - Ensure bucket exists

3. **Download Failures**
   - Some URLs may be invalid or expired
   - Check network connectivity
   - Review failure log for details

4. **Unicode Errors**
   - Script uses UTF-8 encoding throughout
   - Ensure your terminal supports UTF-8

### Log Files

- `r2_migration.log`: Detailed processing logs
- `migration_failures.csv`: Failed image processing details
- `image_migration_cache.json`: Cache of processed URLs

## Security Notes

- Environment variables are masked in output
- Sensitive keys are not logged
- Use environment variables, not hardcoded credentials

## License

This script is provided as-is for educational and development purposes.
