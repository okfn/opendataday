from pathlib import Path
from lib import main


IN_URL = 'https://docs.google.com/spreadsheets/d/17MemnXoshf1cd6_S4l23uyOQxfEI6m-sXZNrDnNhFc8/export?format=csv&id=17MemnXoshf1cd6_S4l23uyOQxfEI6m-sXZNrDnNhFc8&gid=1679616011'
THIS_YEAR = 2021
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
