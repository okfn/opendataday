import csv
import json
from collections import Counter
from io import StringIO
from pathlib import Path

import requests
from marshmallow import (
    EXCLUDE,
    fields,
    Schema,
    validate,
)
from slugify import slugify


IN_URL = 'https://docs.google.com/spreadsheets/d/17MemnXoshf1cd6_S4l23uyOQxfEI6m-sXZNrDnNhFc8/export?format=csv&id=17MemnXoshf1cd6_S4l23uyOQxfEI6m-sXZNrDnNhFc8&gid=1679616011'
JSON_OUT_FILE = Path(__file__).absolute().parent.parent / 'databags' / 'events-2021.json'
CSV_OUT_FILE = Path(__file__).absolute().parent.parent / 'Datasets' / 'Events 2021.csv'
THIS_YEAR = 2021


validate_not_empty = validate.Length(min=1)
URL_FIELDS = [
    'url',
    'online_event_url',
    'event_report_url',
    'event_photo_url',
    'event_video_url',
    'event_tweet_url',
]


class EventSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    place = fields.Str(required=True, data_key="Place")
    url = fields.Str(required=True, data_key="URL")
    latitude = fields.Float(required=True, data_key="Latitude")
    longitude = fields.Float(required=True, data_key="Longitude")
    event_name = fields.Str(required=True, data_key="Event name",
        validate=validate_not_empty
    )
    num_participants = fields.Str(required=True, data_key="Number of participants")
    organisers = fields.Str(required=True, data_key="Organisers")
    event_purpose = fields.Str(required=True, data_key="Event purpose")
    event_date = fields.DateTime(
        required=False, missing=None, data_key="Date of event",
        format="%m/%d/%Y"  # USA format
    )
    event_time = fields.Str(required=True, data_key="Time of event")  # just a string
    timezone = fields.Str(required=True, data_key="Timezone")
    country = fields.Str(required=True, data_key="Country")
    world_region_code = fields.Str(required=True, data_key="World region AMER/EMEA/APAC",
        validate=validate.OneOf(['AMER', 'EMEA', 'APAC'])
    )
    online = fields.Boolean(required=True, data_key="Online event?")
    online_event_url = fields.Str(required=True, data_key="Online event URL")
    event_report_url = fields.Str(required=True, data_key="Event report external URL")
    event_photo_url = fields.Str(required=True, data_key="Event photo")
    event_video_url = fields.Str(required=True, data_key="Event video URL")
    event_tweet_url = fields.Str(required=True, data_key="Event tweet URL")
    mini_grant_winner = fields.Boolean(required=True, data_key="Mini-grant winner?")
    has_event_report = fields.Boolean(required=True, data_key="Has event report?")
    report_question_1 = fields.Str(required=True, data_key="How did your event celebrate open data?")
    report_question_2 = fields.Str(required=True, data_key="Lessons learned from your event")
    report_question_3 = fields.Str(required=True, data_key="Why do you love Open Data Day?")


def get_data():
    r = requests.get(IN_URL)
    r.raise_for_status()
    r.encoding = 'utf-8'
    stream = StringIO(r.text)
    reader = csv.DictReader(stream)
    data = [row for row in reader]
    return data


def pre_process(data):
    for row in data:
        if row['Date of event'] == "":
            row['Date of event'] = None
    return data


def write_json(filename, data):
    with open(filename, 'w') as f:
        json.dump({'events': data}, f, indent=2, sort_keys=True)


def write_csv(filename, data):
    with open(filename, 'w') as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        for row in data:
            writer.writerow(row)


def filter_current_year(data):
    out = [
        row for row in data
        if row['event_date'] is None
        or row['event_date'].year == THIS_YEAR
    ]
    print(f'Discarding {len(data)-len(out)} events..')
    return out


def format_dates(data):
    for row in data:
        if row['event_date'] is None:
            continue
        row['event_date'] = row['event_date'].strftime('%Y-%m-%d')
    return data


def generate_slugs(data):
    for row in data:
        row['slug'] = slugify(row['event_name'][0:80])

    slugs = [row['slug'] for row in data]
    duplicate_slugs = [k for k,v in Counter(slugs).items() if v > 1]
    if len(duplicate_slugs) > 0:
        raise Exception(f'Duplicate Event ID: {duplicate_slugs[0]}')

    return data


def looks_like_url(value):
    if ' ' in value:
        return False
    if '.' not in value:
        return False
    return True


def cleanup_urls(data):
    for row in data:
        for field in URL_FIELDS:
            if not looks_like_url(row[field]):
                row[field] = ''
                continue
            if not row[field].startswith('http'):
                row[field] = f'https://{row[field]}'
    return data


def code_world_regions(data):
    map_ = {
        'AMER': 'The Americas',
        'EMEA': 'Europe, Middle East & Africa',
        'APAC': 'Asia & The Pacific',
    }
    for row in data:
        row['world_region_text'] = map_[row['world_region_code']]
    return data


def main():
    data = get_data()
    data = pre_process(data)
    schema = EventSchema()
    for i, row in enumerate(data):
        print(f'Processing line {i+2} ', end='')
        data[i] = schema.load(row)
        print('✔️')
    data = filter_current_year(data)
    data = format_dates(data)
    data = generate_slugs(data)
    data = cleanup_urls(data)
    data = code_world_regions(data)

    write_csv(CSV_OUT_FILE, data)
    write_json(JSON_OUT_FILE, data)


if __name__ == '__main__':
    main()
