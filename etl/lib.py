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

from reports import create_reports


validate_not_empty = validate.Length(min=1)

URL_FIELDS = [
    'url',
    'online_event_url',
    'event_report_url',
    'event_photo_url',
    'event_video_url',
    'event_tweet_url',
]

with open(Path(__file__).absolute().parent.parent / 'databags' / 'mini-grant-funders.json') as f:
    funders_json = json.load(f)
    VALID_FUNDERS = list(funders_json.keys()) + ['']


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
    num_participants = fields.Str(required=False, data_key="Number of participants")
    organisers = fields.Str(required=True, data_key="Event organiser")
    event_purpose = fields.Str(required=True, data_key="Event purpose")
    event_date = fields.DateTime(
        required=False, missing=None, data_key="Event date",
        format="%d/%m/%Y"  # Global format
    )
    event_time = fields.Str(required=False, data_key="Time of event")  # just a string
    timezone = fields.Str(required=False, data_key="Timezone")
    country = fields.Str(required=False, data_key="Country")
    world_region_code = fields.Str(required=False, data_key="World region AMER/EMEA/APAC",
        validate=validate.OneOf(['AMER', 'EMEA', 'APAC', ''])
    )
    online = fields.Boolean(required=False, data_key="Online event?", default=False)
    online_event_url = fields.Str(required=False, data_key="Online event URL")
    event_report_url = fields.Str(required=False, data_key="Event report external URL")
    event_photo_url = fields.Str(required=False, data_key="Event photo")
    event_video_url = fields.Str(required=False, data_key="Event video URL")
    event_tweet_url = fields.Str(required=False, data_key="Event tweet URL")
    mini_grant_winner = fields.Boolean(required=False, data_key="Mini-grant winner?", default=False)
    has_event_report = fields.Boolean(required=False, data_key="Has event report?", default=False)
    report_question_1 = fields.Str(required=False, data_key="How did your event celebrate open data?")
    report_question_2 = fields.Str(required=False, data_key="Lessons learned from your event")
    report_question_3 = fields.Str(required=False, data_key="Why do you love Open Data Day?")
    report_question_4 = fields.Str(required=False, data_key="Any resources produced during event which can be shared?")
    mini_grant_funder = fields.Str(
        required=False,
        data_key="Name of mini-grant funder",
        validate=validate.OneOf(VALID_FUNDERS)
    )


def get_data(in_url):
    r = requests.get(in_url)
    r.raise_for_status()
    r.encoding = 'utf-8'
    stream = StringIO(r.text)
    reader = csv.DictReader(stream)
    data = [row for row in reader]
    return data


def pre_process(data):
    """ Clean all data before started using it """

    new_data = []
    for row in data:
        new_row = {
            # default values no longer in use in google form
            'Online event URL': '',
            'Event report external URL': '',
            'Event photo': '',
            'Event video URL': '',
            'Event tweet URL': '',
            'World region AMER/EMEA/APAC': '',
            'Has event report?': False,
        }
        # remove the (required) sufix
        for k, v in row.items():
            if '(required)' in k:
                new_row[k.replace(' (required)', '')] = v
            else:
                new_row[k] = v
        new_data.append(new_row)

    return new_data


def write_json(filename, data):
    with open(filename, 'w') as f:
        json.dump({'events': data}, f, indent=2, sort_keys=True)


def write_csv(filename, data):
    f = open(filename, 'w')
    if len(data) == 0:
        # leave the file empty
        f.close()
    else:
        fieldnames = sorted(data[0].keys())
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in data:
            writer.writerow(row)


def filter_current_year(data, this_year):
    out = [
        row for row in data
        if row['event_date'] is None
        or row['event_date'].year == this_year
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
    valid_slugs = []
    for row in data:
        event_slug = slugify(row['event_name'][0:80])
        c = 2
        while event_slug in valid_slugs:
            base_slug = slugify(row['event_name'][0:80])
            event_slug = f'{base_slug}-{c}'
            c += 1
        row['slug'] = event_slug
        valid_slugs.append(event_slug)

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
        '': '',
    }
    for row in data:
        row['world_region_text'] = map_[row['world_region_code']]
    return data


def sort(data):
    return sorted(
        data,
        key=lambda row: (
            (0 if row['event_report_url'] or row['has_event_report'] else 1),
            row['event_name'].lower(),
        )
    )


def main(in_url, this_year, json_out_file, csv_out_file, reports_dir, images_dir):
    data = get_data(in_url)
    data = pre_process(data)
    schema = EventSchema()
    new_data = []
    # process each row and drop invalid ones
    for i, row in enumerate(data):
        print(f'Processing line {i+2} ', end='')
        try:
            data[i] = schema.load(row)
        except Exception as e:
            print('❌')
            print(f'Error in line {i+2}: {str(e)}')
            print(f'row = {row}')
            continue
        new_data.append(data[i])
        print('✔️')
    data = new_data
    data = filter_current_year(data, this_year)
    data = format_dates(data)
    data = generate_slugs(data)
    data = cleanup_urls(data)
    data = code_world_regions(data)
    data = sort(data)

    data = create_reports(data, this_year, json_out_file, reports_dir, images_dir)
    write_json(json_out_file, data)
    write_csv(csv_out_file, data)
