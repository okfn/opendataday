from pathlib import Path
from lib import main

# Google Spreadsheet main ID
SPREADSHEET_ID = '1hPjosmCYkP5x3begzMLoElaBH-eCodSL-Bc4VuHH8b4'
# Intrernal sheet ID
SHEET_ID = '1806689245'
IN_URL = f'https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv&id={SPREADSHEET_ID}&gid={SHEET_ID}'

# If you have permission and want to see (not download) the spreadsheet
# EDIT_URL = f'https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit#gid={SHEET_ID}'

THIS_YEAR = 2024
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
