import requests
import pandas as pd
from urllib.parse import unquote
import os

# Read environment variables
NOTION_API_KEY = "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"
NOTION_DATABASE_ID = "231a0765760b8033b6def9623249e6b9"

# Set up headers for Notion API
headers = {
    'Authorization': f'Bearer {NOTION_API_KEY}',
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28'
}

print('🔍 Fetching data from updated Notion database...')

# Function to get all pages from database
def get_all_pages(database_id):
    url = f'https://api.notion.com/v1/databases/{database_id}/query'
    all_pages = []
    has_more = True
    start_cursor = None
    
    while has_more:
        payload = {'page_size': 100}
        if start_cursor:
            payload['start_cursor'] = start_cursor
            
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            print(f'❌ Error: {response.status_code} - {response.text}')
            return []
            
        data = response.json()
        all_pages.extend(data['results'])
        has_more = data['has_more']
        start_cursor = data.get('next_cursor')
    
    return all_pages

# Get pages from Notion
pages = get_all_pages(NOTION_DATABASE_ID)
print(f'✅ Found {len(pages)} pages in Notion database')

# Extract data from pages
notion_data = []
for page in pages:
    props = page['properties']
    
    # Get slug - handle different property types
    slug = ''
    if 'slug' in props:
        if props['slug']['type'] == 'rich_text' and props['slug']['rich_text']:
            slug = props['slug']['rich_text'][0]['text']['content']
        elif props['slug']['type'] == 'title' and props['slug']['title']:
            slug = props['slug']['title'][0]['text']['content']
    
    # Get image URL
    image_url = ''
    if 'Image' in props and props['Image']['files']:
        if props['Image']['files'][0]['type'] == 'file':
            image_url = props['Image']['files'][0]['file']['url']
        else:
            image_url = props['Image']['files'][0]['external']['url']
    
    notion_data.append({
        'slug': slug,
        'notion_image': image_url
    })

# Create DataFrame from Notion data
notion_df = pd.DataFrame(notion_data)
print(f'✅ Processed {len(notion_df)} items from Notion')

# Load local CSV
csv_df = pd.read_csv('advice_database_improved_categories.csv')
print(f'✅ Loaded {len(csv_df)} items from CSV')

# Merge data on slug
merged = csv_df.merge(notion_df, on='slug', how='left')

print()
print('🔍 CHECKING FOR IMAGE MISMATCHES...')
print('=' * 60)

mismatches = []
missing_images = []
ipynb_problems = []

for idx, row in merged.iterrows():
    csv_image = row['Image']
    notion_image = row['notion_image'] if pd.notna(row['notion_image']) else ''
    slug = row['slug']
    
    # Decode the CSV image URL
    csv_image_decoded = unquote(csv_image)
    expected_filename = csv_image_decoded.split('/')[-1]
    
    if pd.isna(row['notion_image']) or row['notion_image'] == '':
        missing_images.append({
            'slug': slug,
            'expected_file': expected_filename,
            'issue': 'Missing image in Notion'
        })
    elif '.ipynb' in notion_image:
        ipynb_problems.append({
            'slug': slug,
            'expected_file': expected_filename,
            'notion_url': notion_image,
            'issue': 'Has .ipynb instead of .png'
        })
    elif expected_filename not in notion_image:
        mismatches.append({
            'slug': slug,
            'expected_file': expected_filename,
            'notion_url': notion_image,
            'issue': 'Filename mismatch'
        })

print(f'❌ Found {len(missing_images)} missing images')
print(f'❌ Found {len(mismatches)} filename mismatches')
print(f'📓 Found {len(ipynb_problems)} .ipynb file problems')
print()

if ipynb_problems:
    print('📓 JUPYTER NOTEBOOK FILE PROBLEMS:')
    print('-' * 40)
    for item in ipynb_problems[:10]:  # Show first 10
        print(f'  Slug: {item["slug"]}')
        print(f'  Expected: {item["expected_file"]}')
        print(f'  Got: {item["notion_url"].split("/")[-1].split("?")[0]}')
        print()
    if len(ipynb_problems) > 10:
        print(f'  ... and {len(ipynb_problems) - 10} more')
    print()

if missing_images:
    print('🚫 MISSING IMAGES:')
    print('-' * 40)
    for item in missing_images[:10]:  # Show first 10
        print(f'  Slug: {item["slug"]}')
        print(f'  Expected: {item["expected_file"]}')
        print()
    if len(missing_images) > 10:
        print(f'  ... and {len(missing_images) - 10} more')
    print()

if mismatches:
    print('⚠️  FILENAME MISMATCHES:')
    print('-' * 40)
    for item in mismatches[:10]:  # Show first 10
        print(f'  Slug: {item["slug"]}')
        print(f'  Expected: {item["expected_file"]}')
        print(f'  Got: {item["notion_url"].split("/")[-1].split("?")[0]}')
        print()
    if len(mismatches) > 10:
        print(f'  ... and {len(mismatches) - 10} more')

print(f'📊 SUMMARY:')
print(f'  Total items checked: {len(merged)}')
print(f'  Correct images: {len(merged) - len(missing_images) - len(mismatches) - len(ipynb_problems)}')
print(f'  Missing images: {len(missing_images)}')
print(f'  Mismatched filenames: {len(mismatches)}')
print(f'  Jupyter notebook problems: {len(ipynb_problems)}')
print(f'  Success rate: {((len(merged) - len(missing_images) - len(mismatches) - len(ipynb_problems)) / len(merged) * 100):.1f}%')

# Export problematic items to CSV for easy fixing
if missing_images or mismatches or ipynb_problems:
    problem_items = missing_images + mismatches + ipynb_problems
    problem_df = pd.DataFrame(problem_items)
    problem_df.to_csv('image_problems.csv', index=False)
    print(f'💾 Exported {len(problem_items)} problematic items to image_problems.csv')
