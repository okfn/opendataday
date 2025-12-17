from pathlib import Path
from lib import main

# URLs like f'https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv&id={SPREADSHEET_ID}&gid={SHEET_ID}'
# stopped working because google workspace changes their policies.
# Now we need to use the "publish to web" feature of google sheets.
# Go to File -> Share -> publish to web -> Link -> Form responses -> Comma-separated values (.csv)
# Google Spreadsheet main ID
# SPREADSHEET_ID = '1MsZ9-OBdJSxDSZBNZHTdJGecoGwnESPevWAiFh8lUwU'
SHEET_ID = '1520562486'
PUBLISH_ID = '2PACX-1vT_98DOFqWc28vkatVNqeb5s-UPWj9g6LvaqX3j8RP6ystwqTeC3P5eGFgnO_USVgYfKTUeuuD2t2VP'
IN_URL = f'https://docs.google.com/spreadsheets/d/e/{PUBLISH_ID}/pub?gid={SHEET_ID}&single=true&output=csv'
# If you have permission and want to see (not download) the spreadsheet
# EDIT_URL = f'https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit#gid={SHEET_ID}'

THIS_YEAR = 2026
JSON_OUT_FILE = Path(__file__).absolute().parent.parent / 'databags' / f'events-{str(THIS_YEAR)}.json'
CSV_OUT_FILE = Path(__file__).absolute().parent.parent / 'Datasets' / f'Events {str(THIS_YEAR)}.csv'
REPORTS_DIR = Path(__file__).absolute().parent.parent / 'content' / 'events' / str(THIS_YEAR) / 'reports'
IMAGES_DIR = Path(__file__).absolute().parent.parent / 'assets' / 'images' / str(THIS_YEAR)


if __name__ == '__main__':
    try:
        main(IN_URL, THIS_YEAR, JSON_OUT_FILE, CSV_OUT_FILE, REPORTS_DIR, IMAGES_DIR)
    except Exception as e:
        print('❌')
        print(str(e))
        raise e
