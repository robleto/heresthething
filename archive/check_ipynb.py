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

print('🔍 Checking for .ipynb files in Notion database...')

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

# Check specifically for .ipynb files
ipynb_items = []
all_image_urls = []

for page in pages:
    props = page['properties']
    
    # Get slug
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
    
    all_image_urls.append({
        'slug': slug,
        'image_url': image_url,
        'filename': image_url.split('/')[-1].split('?')[0] if image_url else ''
    })
    
    # Check for .ipynb files
    if '.ipynb' in image_url:
        ipynb_items.append({
            'slug': slug,
            'image_url': image_url,
            'filename': image_url.split('/')[-1].split('?')[0]
        })

print(f'📓 Found {len(ipynb_items)} items with .ipynb files')

if ipynb_items:
    print('\\n📓 JUPYTER NOTEBOOK FILE PROBLEMS:')
    print('-' * 50)
    for item in ipynb_items:
        print(f'  Slug: {item["slug"]}')
        print(f'  Filename: {item["filename"]}')
        print(f'  Full URL: {item["image_url"][:100]}...')
        print()

# Let's also check for any unusual file extensions
print('\\n🔍 ALL FILE EXTENSIONS FOUND:')
extensions = {}
for item in all_image_urls:
    if item['filename']:
        ext = item['filename'].split('.')[-1].lower()
        extensions[ext] = extensions.get(ext, 0) + 1

for ext, count in sorted(extensions.items()):
    print(f'  .{ext}: {count} files')

# Export ipynb problems if found
if ipynb_items:
    ipynb_df = pd.DataFrame(ipynb_items)
    ipynb_df.to_csv('ipynb_problems.csv', index=False)
    print(f'\\n💾 Exported {len(ipynb_items)} .ipynb problems to ipynb_problems.csv')
