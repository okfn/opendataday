from pathlib import Path
from lib import main


IN_URL = 'https://docs.google.com/spreadsheets/d/17MemnXoshf1cd6_S4l23uyOQxfEI6m-sXZNrDnNhFc8/export?format=csv&id=17MemnXoshf1cd6_S4l23uyOQxfEI6m-sXZNrDnNhFc8&gid=1679616011'
JSON_OUT_FILE = Path(__file__).absolute().parent.parent / 'databags' / 'events-2021.json'
CSV_OUT_FILE = Path(__file__).absolute().parent.parent / 'Datasets' / 'Events 2021.csv'
THIS_YEAR = 2021


if __name__ == '__main__':
    try:
        main(IN_URL, JSON_OUT_FILE, CSV_OUT_FILE, THIS_YEAR)
    except Exception as e:
        print('❌')
        print(str(e))
        raise e
