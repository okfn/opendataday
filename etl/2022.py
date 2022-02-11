from pathlib import Path
from lib import main

# Google Spreadsheet main ID
SPREADSHEET_ID = '1VZ96Jn-JBhZ0C6ew89t3MPjiSMi6mcivlkz25AhDIDY'
# Intrernal sheet ID
SHEET_ID = '634064076'
IN_URL = f'https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv&id={SPREADSHEET_ID}&gid={SHEET_ID}'
THIS_YEAR = 2022
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
